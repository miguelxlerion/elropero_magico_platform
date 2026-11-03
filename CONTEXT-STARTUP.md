================================================================================
                    CONTEXTO DE ARRANQUE - EL ROpero FUSION
================================================================================

ULTIMA VERIFICACIÓN: Tue Nov 03 2026
ESTADO: SITIO FUNCIONAL LOCALMENTE

================================================================================
1. REQUERIMIENTOS PREVIOS PARA ARRANCAR
================================================================================

▢ Docker Desktop debe estar corriendo
  - Windows: start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  - Esperar a que docker info responda (puede tardar ~1min)

▢ Contenedor de base de datos debe estarUp:
  docker ps -a --format "{{.Names}} | {{.Status}} | {{.Ports}}"
  - Debe aparecer: ropero-pg | Up ... | 0.0.0.0:5433->5432/tcp
  - Si no está corriendo: docker start ropero-pg

▢ Puerto 3000 debe estar disponible
  - netstat -an | findstr :3000 debe mostrar LISTENING

================================================================================
2. ORDEN DE ARRANQUE (PASO A PASO)
================================================================================

Paso 1: Levantar Docker y la BD
  cmd /c "start "" ""C:\Program Files\Docker\Docker\Docker Desktop.exe""
  ping -n 20 127.0.0.1 > NUL 2>&1
  docker start ropero-pg 2>nul || echo "intentando iniciar..."

Paso 2: Verificar conexión a BD
  cd X:\Programacion\ElRoperomagico.com\el_ropero_fusion
  node -e "
    const { Pool } = require('pg');
    const p = new Pool({ connectionString: 'postgresql://postgres:ropero@127.0.0.1:5433/el_ropero_fusion', connectionTimeoutMillis: 6000 });
    p.query('select 1 as ok').then(() => { console.log('DB CONECTADA'); p.end(); }).catch(e => { console.log('DB ERROR:', e.message); p.end(); });
  "

Paso 3: Compilar el proyecto
  npm run build
  - Debe terminar con: ✓ Generating static pages using 15 workers (5/5) in 291ms
  - Si falla: revisar .dev.vars y .env.local

Paso 4: Iniciar servidor (persistente para evitar timeouts)
  cscript //Nologo X:\Programacion\ElRoperomagico.com\el_ropero_fusion\run-server.vbs
  - Este script usa WScript.Shell para correr npm run start en background
  - Verificar: netstat -an | findstr ":3000 LISTENING"

Paso 5: Abrir el navegador
  http://localhost:3000/
  - Título esperado: "El Ropero Mag&co — Moda de segunda mano curada en Bogotá"
  - Si carga pantalla negra/errors: matar proceso y reiniciar Paso 4

================================================================================
3. VARIABLES DE ENTORNO IMPORTANTES
================================================================================

Archivo: .env.local
  DATABASE_URL=postgresql://postgres:ropero@127.0.0.1:5433/el_ropero_fusion
  NEXT_PUBLIC_SITE_URL=http://localhost:3000

Archivo: .dev.vars (en la raíz)
  DATABASE_URL=postgresql://postgres:ropero@127.0.0.1:5433/el_ropero_fusion
  NEXT_PUBLIC_SITE_URL=http://localhost:3000

NOTA: Ambas deben tener el mismo DATABASE_URL apuntando al puerto 5433 del contenedor ropero-pg.

================================================================================
4. ARCHIVOS MODIFICADOS EN ESTA SESIÓN
================================================================================

▸ src/components/layout/Navbar.tsx
  - Cambio clave: .map((m, i) => key={i}) → .map((m) => key={m})
  - Esto arregla el React Error #441 en la sección marquee
  - También se removió la referencia `i === 0` que ya no aplica

▸ run-server.vbs
  - Script VBScript creado para iniciar el servidor en background
  - Evita que el shell de Windows mate el proceso después de ~30s
  - Uso: cscript //Nologo run-server.vbs

▸ wrangler.jsonc
  - Se agregó account_id y configuración de Hyperdrive
  - Puerto 5433 para conexión local con Hyperdrive

================================================================================
5. ERRORES RESUELTOS (para referencia futura)
================================================================================

✅ Error React #441
   - Ubicación: src/components/layout/Navbar.tsx, línea 75-85
   - Causa: .map((m, i) => key={i}) usa índice de array en marquee animado
   - Solución: .map((m) => key={m}) usa el texto del mensaje como key
   - Resultado: build TypeScript pasa sin errores de key duplicado

✅ Error 505496442 / "This page couldn't load"
   - Causa raíz: DATABASE_URL apuntaba a puerto incorrecto + Docker detenido
   - La BD no respondía → queries fallaban → página se quedaba en loading eterno
   - Solución: Levantar Docker Desktop + contenedor ropero-pg en puerto 5433
   - Resultado: página carga con contenido real del DB, sin aria-busy perpetuo

✅ Tiempo de vida del servidor (shell timeout ~30s)
   - Solución: run-server.vbs usa WScript.Shell para background execution
   - Ya no se pierde el proceso al retorno del shell

================================================================================
6. COMANDOS ÚTILES RÁPIDOS
================================================================================

# Verificar BD conectada
cd X:\Programacion\ElRoperomagico.com\el_ropero_fusion
node -e "const{Pool}=require('pg');new Pool({connectionString:'postgresql://postgres:ropero@127.0.0.1:5433/el_ropero_fusion'}).query('select 1').then(r=>console.log('OK')).catch(e=>console.log('FAIL:',e.message))"

# Verificar servidor en puerto 3000
netstat -an | findstr ":3000 LISTENING"

# Reiniciar servidor sin perder el build
cscript //Nologo run-server.vbs

# Ver qué tabs tiene abiertas el navegador (desde herramientas)
tools.browser.tabs.list()

# Rebuild si cambian fuentes/queries
npm run build

================================================================================
7. ESTRUCTURA DEL PROYECTO (resumen)
================================================================================

X:\Programacion\ElRoperomagico.com\el_ropero_fusion/
├─ .next/              # Build de producción (generado por npm run build)
├─ node_modules/       # Dependencias
├─ .env.local          # DATABASE_URL + NEXT_PUBLIC_SITE_URL
├─ .dev.vars           # Config OpenNext (mismo DATABASE_URL que .env.local)
├─ next.config.ts      # Configurado con Cloudflare, secrets de .dev.vars
├─ package.json        # Next.js 16.4.4 + todas las deps (incluye @opennextjs/cloudflare@1.20.15)
├─ src/                # Código fuente
│  ├─ app/             # Rutas Next.js 13+ (app router)
│  ├─ components/      # Componentes UI (Navbar, Hero, Catalog, etc.)
│  ├─ lib/             # Queries DB, utils, stores
│  │  └─ queries.ts    # getNextDrop, getLiveDrop, getFeaturedProducts(...)
│  └─ db/              # Configuración drizzle / pg pool
├─ wrangler.jsonc      # Cloudflare Hyperdrive config (puerto 5433)
├─ run-server.vbs      # Script VBScript para servidor persistente
├─ .next/server/       # Servidor producción (servido por next start)
└─ ... (assets, config, etc.)

================================================================================
8. PASOS PARA SUBIR A GITHUB (cuando se quiera)
================================================================================

# Desde la carpeta del proyecto:
cd X:\Programacion\ElRoperomagico.com\el_ropero_fusion

# Verificar estado actual
git status

# Agregar todos los cambios (incluyendo los nuevos archivos)
git add .

# Commit con descripción clara
git commit -m "fix: DB connection + Navbar key fix + VBScript server + site functional

- Levantar Docker Desktop + ropero-pg para BD PostgreSQL
- Arreglar React Error #441 en Navbar.tsx (key índice → key valor)
- Agregar run-server.vbs para servidor persistente ante shell timeout
- Build succeeds, next start en puerto 3000
- Sitio visible con contenido real, sin errores de consola"

# Agregar remote si no existe (sustituir URL por la real del repo)
git remote add origin https://github.com/USUARIO/repo-el-ropero-fusion.git 2>/dev/null || true

# Subir a main (o la rama que corresponda)
git push -u origin main

# Verificar que subió
git log --oneline -3

================================================================================
FIN DEL CONTEXTO DE ARRANQUE
================================================================================