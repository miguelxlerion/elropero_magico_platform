/**
 * Tras `opennextjs-cloudflare build`, completa en `.open-next/.../node_modules`
 * los archivos runtime de la familia pg que el copiado trazado deja parciales
 * (pg-cloudflare/dist/index.js, pg-protocol/dist/b.js, etc.).
 * Sin esto, el Worker falla al conectar vía Hyperdrive.
 * Uso: node scripts/cf-sync-pg.mjs  (ya cableado en preview/deploy/upload)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dstBase = path.join(root, ".open-next", "server-functions", "default", "node_modules");
const srcBase = path.join(root, "node_modules");

const PACKAGES = [
  "pg",
  "pg-cloudflare",
  "pg-pool",
  "pg-protocol",
  "pg-connection-string",
  "pg-types",
  "pg-int8",
  "pgpass",
  "postgres-array",
  "postgres-bytea",
  "postgres-date",
  "postgres-interval",
];

function walk(dir, base = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    // Solo runtime JS + package.json (sin mapas, tipos, tests ni docs).
    else if (rel === "package.json" || (rel.endsWith(".js") && !rel.endsWith(".js.map") && !rel.includes(".test."))) {
      out.push(rel);
    }
  }
  return out;
}

if (!fs.existsSync(dstBase)) {
  console.error("[cf-sync-pg] no hay .open-next; corre `opennextjs-cloudflare build` primero");
  process.exit(1);
}

let copied = 0;
for (const pkg of PACKAGES) {
  const src = path.join(srcBase, pkg);
  const dst = path.join(dstBase, pkg);
  if (!fs.existsSync(src)) continue;
  for (const rel of walk(src)) {
    const from = path.join(src, ...rel.split("/"));
    const to = path.join(dst, ...rel.split("/"));
    let same = false;
    try {
      same = fs.existsSync(to) && fs.readFileSync(to).equals(fs.readFileSync(from));
    } catch {
      same = false;
    }
    if (!same) {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      copied++;
    }
  }
}
console.log(`[cf-sync-pg] ${copied} archivos sincronizados`);
