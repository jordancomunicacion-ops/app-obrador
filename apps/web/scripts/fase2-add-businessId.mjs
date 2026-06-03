/**
 * Fase 2 paso A: añade `businessId` + relación a Business en los 28 modelos que
 * tienen `ownerId`. Idempotente (si ya está, no duplica).
 *
 * Procesa cada bloque `model X { ... }` por separado para extraer el nombre real
 * del modelo (no derivarlo del de la relación "XxxOwner", que a veces difiere).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');

let src = fs.readFileSync(SCHEMA, 'utf8');

// Partir el schema por bloques `model X { ... }` para procesar cada uno individualmente.
const modelBlockRe = /(model\s+(\w+)\s*\{)([\s\S]*?)(\n\})/g;
const inverseDefs = []; // { modelName, relName }
let changed = 0;

src = src.replace(modelBlockRe, (full, header, modelName, body, closer) => {
    // No tocamos los modelos meta: User, Business, BusinessAccess, ni los que no tengan owner.
    if (['User', 'Business', 'BusinessAccess'].includes(modelName)) return full;
    if (!body.includes('@relation("') || !/\n\s*owner\s+User/.test(body)) return full;

    // Si ya hay businessId, asumimos que ya pasó por aquí.
    if (/businessId\s+String/.test(body)) return full;

    // Extraer el nombre de la relación: "XxxOwner".
    const relMatch = /@relation\("(\w+)Owner"/.exec(body);
    if (!relMatch) return full;
    const baseName = relMatch[1];
    const relName = `${baseName}Business`;
    inverseDefs.push({ modelName, relName });

    // Inyectar businessId + business justo tras la relación owner.
    const ownerLineRe = /(\n[ \t]*owner\s+User\??\s+@relation\("\w+Owner"[^\n]*\))/;
    const newBody = body.replace(
        ownerLineRe,
        (m, ownerLine) =>
            m +
            `\n  businessId String?` +
            `\n  business   Business? @relation("${relName}", fields: [businessId], references: [id], onDelete: SetNull)`,
    );

    if (newBody !== body) changed++;
    return header + newBody + closer;
});

console.log(`Modificados ${changed} modelos con businessId.\n`);

// Localizar el bloque model Business { ... } y añadir las relaciones inversas
// justo antes del `}` final.
const businessRe = /(model Business \{[\s\S]*?accessEntries BusinessAccess\[\][^\n]*\n)([\s\S]*?\n\})/;
const bm = businessRe.exec(src);
if (!bm) {
    console.error('ERROR: no encuentro el bloque Business.');
    process.exit(1);
}

const existing = bm[2];
const newInverseLines = inverseDefs
    .filter((x) => !existing.includes(`@relation("${x.relName}")`))
    .map((x) => `  ${camel(x.modelName)}s ${x.modelName}[] @relation("${x.relName}")`);

if (newInverseLines.length > 0) {
    src = src.replace(
        businessRe,
        bm[1] +
            '\n  // Relaciones inversas a modelos legacy con `businessId` (Fase 2).\n' +
            newInverseLines.join('\n') +
            '\n' +
            existing,
    );
    console.log(`Añadidas ${newInverseLines.length} relaciones inversas en Business:`);
    for (const ln of newInverseLines) console.log('  ', ln.trim());
}

fs.writeFileSync(SCHEMA, src, 'utf8');
console.log(`\n✔ schema.prisma actualizado.`);

function camel(s) {
    return s[0].toLowerCase() + s.slice(1);
}
