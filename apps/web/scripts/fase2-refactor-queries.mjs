/**
 * Fase 2 paso B: reemplaza `ownerId` por `businessId` en todos los ficheros de
 * `app/` que filtran/crean datos. Idempotente.
 *
 * Excluye:
 *  - apps/web/app/lib/auth/account.ts (alias deprecated; mantiene refs a "ownerId"
 *    en comentarios para explicar la migración).
 *
 * El cambio es agresivo (cambia TODAS las ocurrencias en el archivo, incluidas
 * cadenas y comentarios). Después se valida con `tsc --noEmit`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SKIP_FILES = new Set([
    path.join('app', 'lib', 'auth', 'account.ts').replaceAll('\\', '/'),
]);

const files = execSync('git ls-files "app/*.ts" "app/*.tsx" "app/**/*.ts" "app/**/*.tsx"', {
    cwd: ROOT,
    encoding: 'utf8',
})
    .split('\n')
    .filter(Boolean)
    .map((p) => p.replaceAll('\\', '/'));

let touched = 0;
let totalReplacements = 0;
for (const rel of files) {
    if (SKIP_FILES.has(rel)) {
        console.log(`  · skip ${rel}`);
        continue;
    }
    const abs = path.join(ROOT, rel);
    let txt = fs.readFileSync(abs, 'utf8');
    if (!txt.includes('ownerId')) continue;

    const count = (txt.match(/\bownerId\b/g) || []).length;
    const next = txt.replace(/\bownerId\b/g, 'businessId');
    if (next !== txt) {
        fs.writeFileSync(abs, next, 'utf8');
        touched++;
        totalReplacements += count;
        console.log(`  ✓ ${rel} (${count} reemplazos)`);
    }
}

console.log(`\nTotal: ${touched} ficheros tocados, ${totalReplacements} reemplazos.`);
