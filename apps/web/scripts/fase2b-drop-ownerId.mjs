/**
 * Fase 2B: elimina `ownerId` + relación `owner User?` de los 28 modelos legacy
 * y las 28 relaciones inversas `ownedXxx` del modelo `User`.
 *
 * Pre-requisito: backfill de `businessId` ejecutado (Fase 2A) y verificación de
 * que no quedan filas con `ownerId IS NOT NULL AND businessId IS NULL`. Sin
 * eso, `prisma db push` perderá esos datos al eliminar la columna.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');

let src = fs.readFileSync(SCHEMA, 'utf8');

// 1) En cada modelo, borrar `ownerId String?` y la línea `owner User? @relation("XxxOwner", ...)`.
const ownerIdRe = /\n[ \t]*ownerId\s+String\??[^\n]*/g;
const ownerRelRe = /\n[ \t]*owner\s+User\?+\s+@relation\("[^"]+Owner"[^\n]*\)/g;
const ownerIdIndexRe = /\n[ \t]*@@index\(\["?ownerId"?\]\)/g;

const before = src.length;
src = src.replace(ownerIdRe, '').replace(ownerRelRe, '').replace(ownerIdIndexRe, '');
console.log(`Schema reducido en ${before - src.length} chars (ownerId/owner/@@index eliminados).`);

// 2) En el modelo `User`, eliminar las relaciones inversas nombradas con
//    el sufijo "Owner": cualquier línea con `@relation("XxxOwner")`.
const userBlockRe = /(model User \{)([\s\S]*?)(\n\})/;
const um = userBlockRe.exec(src);
if (!um) {
    console.error('ERROR: no encuentro model User.');
    process.exit(1);
}
const userOpen = um[1];
const userBody = um[2];
const userClose = um[3];

// Borrar líneas con `@relation("...Owner")` dentro de User.
const inverseOwnerRe = /\n[ \t]*\w+\s+\w+(\[\])?\s+@relation\("\w+Owner"\)/g;
const beforeUser = userBody.length;
const newUserBody = userBody.replace(inverseOwnerRe, '');
console.log(`User reducido en ${beforeUser - newUserBody.length} chars (relaciones inversas Owner eliminadas).`);

src = src.replace(userBlockRe, userOpen + newUserBody + userClose);

fs.writeFileSync(SCHEMA, src, 'utf8');
console.log('\n✔ schema.prisma actualizado.');
