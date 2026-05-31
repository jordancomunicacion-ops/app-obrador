# Setup único del despliegue de cocina (modelo git-pull, igual que contabilidad)

> El nuevo `DESPLEGAR.bat` funciona como el de contabilidad: **el servidor tiene el repo
> clonado y hace `git pull` él mismo**, en vez de subir un `.tar` desde tu PC.
> Para que eso funcione hay que hacer **una sola vez** este setup en el VPS.
> Después, tú solo abres `DESPLEGAR.bat` → opción **1**.

## Qué cambia respecto al deploy viejo
- **Antes:** tu PC empaquetaba la carpeta (`tar`) y la subía por `scp`; el servidor borraba todo y descomprimía. Si tu PC no tenía `git pull`, desplegabas código viejo (justo lo que pasó).
- **Ahora:** el código vive en GitHub. El servidor clona el repo una vez y en cada deploy hace `git pull origin main`. Lo que está en `main` es lo que se despliega, sin depender de tu carpeta local.

---

## Paso único — forma fácil: `SETUP-VPS-COCINA.bat`

> ⚠️ No se puede hacer desde Claude (el entorno en la nube no tiene acceso SSH a tu VPS).
> Lo ejecutas tú desde tu PC, **una sola vez**.

1. Doble clic en **`SETUP-VPS-COCINA.bat`** (está en la raíz del repo, junto a `DESPLEGAR.bat`).
2. Te pedirá tu **usuario de GitHub** y un **Personal Access Token** (classic, con permiso `repo`).
   Créalo en https://github.com/settings/tokens si no tienes uno.
3. El script hace todo solo: respalda el `.env`, renombra la carpeta vieja (sin tocar la BD),
   clona el repo, restaura el `.env`, arranca con `docker compose` y verifica `/api/health`.
4. Si al final ves `HTTP 200`, listo. A partir de ahí usas `DESPLEGAR.bat` → opción **1**.

Si el script falla a mitad, no borra nada: tu carpeta anterior queda como
`/root/SOTOdelPRIOR/apps/cocina_old_*` y la base de datos está intacta.

---

## Paso único — forma manual (alternativa, si prefieres comando a comando)

La carpeta actual del servidor `/root/SOTOdelPRIOR/apps/cocina` **no es un repo git** (recibía el tar).
Hay que convertirla en un clon del repo, **conservando** los volúmenes de base de datos (que son externos a la carpeta, así que no se tocan).

1. **Entra al VPS** (desde `DESPLEGAR.bat` opción **10**, o `ssh root@164.92.167.42`).

2. **Respaldo de seguridad de la carpeta actual** (por si acaso):
   ```bash
   cd /root/SOTOdelPRIOR/apps
   cp cocina/.env /root/cocina.env.bak    # guarda el .env de producción
   mv cocina cocina_old_$(date +%Y%m%d)
   ```
   > La base de datos NO está en esta carpeta (usa el volumen Docker externo `cocina_cocina_db_data`),
   > así que renombrar la carpeta no afecta a los datos.

3. **Clona el repo** en la ruta esperada:
   ```bash
   cd /root/SOTOdelPRIOR/apps
   git clone https://github.com/jordancomunicacion-ops/app-cocina.git cocina
   cd cocina
   ```
   > Si el repo es privado y pide credenciales, usa un **Personal Access Token** de GitHub como
   > contraseña, o configura una deploy key SSH (ver más abajo).

4. **Restaura el `.env` de producción** (no está en git):
   ```bash
   cp /root/cocina.env.bak /root/SOTOdelPRIOR/apps/cocina/.env
   ```
   > Si antes usabas `.env.production`, renómbralo a `.env` (el compose lee `.env`).

5. **Primer arranque** para verificar:
   ```bash
   cd /root/SOTOdelPRIOR/apps/cocina
   export AUTH_URL=https://cocina.sotodelprior.com
   docker compose -f docker-compose.yml up -d --build --remove-orphans
   docker compose -f docker-compose.yml exec -T sotococina-web npx prisma@5.22.0 db push --accept-data-loss --skip-generate
   ```

6. Comprueba que responde:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://cocina.sotodelprior.com/api/health
   ```
   Debe devolver `200`. Si todo va bien, ya puedes borrar el respaldo:
   `rm -rf /root/SOTOdelPRIOR/apps/cocina_old_*`

A partir de aquí, **cada despliegue es solo:** `DESPLEGAR.bat` → opción **1**.

---

### (Opcional) Deploy key SSH para repo privado sin tokens
Si prefieres no meter el token en el servidor:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/cocina_deploy -N "" -C "cocina-deploy"
cat ~/.ssh/cocina_deploy.pub
```
Añade esa clave pública en GitHub → repo `app-cocina` → Settings → Deploy keys (solo lectura).
Luego clona con: `GIT_SSH_COMMAND='ssh -i ~/.ssh/cocina_deploy -o IdentitiesOnly=yes' git clone git@github.com:jordancomunicacion-ops/app-cocina.git cocina`
(y el `DESPLEGAR.bat` ya hace `git pull` normal porque el remoto quedará configurado por SSH).

---

## El menú de `DESPLEGAR.bat`

| Opción | Qué hace |
|---|---|
| **1. Deploy completo** | `git pull` + `docker compose up --build` + `prisma db push` + logs. **El uso normal.** |
| 2. Update rápido | `git pull` + `restart` (sin rebuild). Para cambios que no tocan dependencias. |
| 3. Logs en vivo | Sigue los logs del contenedor web. |
| 4. Reiniciar | Reinicia solo el contenedor web. |
| 5. db push | Sincroniza el schema Prisma (⚠️ `--accept-data-loss`). |
| 6. Seed | Re-siembra datos (⚠️ peligroso; pide escribir SEED). |
| 7. Estado | `docker compose ps` + redes. |
| 8. Health check | Comprueba `/api/health` interno y el HTTPS público. |
| 9. Backup BD | `pg_dump` comprimido en `/backups/cocina/`. |
| 10. SSH al VPS | Abre una sesión SSH al servidor. |

> ⚠️ **Deuda pendiente (igual que en contabilidad):** cocina usa `prisma db push --accept-data-loss`
> en vez de migraciones versionadas (`migrate deploy`). Funciona, pero conviene rebaselinar las
> migraciones en una tarea dedicada para producción. No lo cambio aquí para no alterar el deploy actual.
