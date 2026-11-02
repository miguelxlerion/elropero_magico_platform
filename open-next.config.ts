import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sin R2 por ahora (caché incremental en memoria del Worker).
// Para caché persistente: agregar binding NEXT_INC_CACHE_R2_BUCKET + r2IncrementalCache.
export default defineCloudflareConfig();
