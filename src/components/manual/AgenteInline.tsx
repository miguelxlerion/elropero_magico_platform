import { ManualInlineClient } from "./ManualInlineClient";
import { readManualHtml } from "./manualSource";

export async function AgenteInline() {
  const raw = await readManualHtml();

  // CSS completo del manual — sin filtrar, para que todo funcione
  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styleBlock = styleMatch ? styleMatch[1] : "";

  // Body completo del manual, sin los <script>: el cliente los inyecta por separado
  // (evita duplicar ~120 KB de scripts en el payload y encender el límite de CPU).
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : "";
  bodyHtml = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Quitar solo el sidebar de navegación (no necesario en esta página)
  bodyHtml = bodyHtml.replace(/<nav class="fixed[\s\S]*?<\/nav>/i, "");

  // CSS adicional: ocultar todo excepto la sección 13 y su contenido
  const hideCss = `
    /* Ocultar todas las secciones del manual excepto #agente */
    section.section:not(#agente) { display: none !important; }
    /* Ocultar el hero/cover #inicio (no tiene clase section) */
    #inicio { display: none !important; }
    /* Ocultar sidebar y utilidades del manual */
    nav.fixed, .scroll-progress, .no-print { display: none !important; }
    /* Asegurar que #agente sea visible */
    #agente { display: block !important; }
    /* Quitar el background cream y padding del manual (dejar respiro moderado) */
    #agente.section { background: transparent !important; padding: 0 1.5rem !important; }
    /* El contenido interno usa max-w-6xl mx-auto — expandirlo */
    #agente .max-w-6xl { max-width: 100% !important; margin: 0 !important; }
    /* Quitar el padding horizontal del manual */
    [class*="lg:px-16"] { padding-left: 0 !important; padding-right: 0 !important; }
    /* Quitar el margin-left del sidebar (lg:ml-64) */
    [class*="lg:ml-64"] { margin-left: 0 !important; }
    /* Proteger el header del sitio de los estilos del manual */
    body > header { position: sticky !important; top: 0 !important; z-index: 40 !important; }
    body > header nav > div { display: grid !important; height: 4.5rem !important; max-width: 80rem !important; grid-template-columns: 1fr auto 1fr !important; align-items: center !important; }
    body > header nav a:not(.group) { display: inline !important; font-size: 0.8rem !important; white-space: nowrap !important; }
    body > header nav > div > div:first-child { gap: 1.25rem !important; align-items: center !important; }
    /* Logo: mantener su display original y proporciones equilibradas */
    body > header nav a.group { display: inline-flex !important; width: auto !important; height: auto !important; gap: 0.625rem !important; align-items: center !important; }
    body > header nav a.group img { width: auto !important; height: 2.5rem !important; }
    body > header nav a.group > span { gap: 0.15rem !important; }
    body > header nav a.group > span > span:first-child { font-size: 0.58rem !important; letter-spacing: 0.38em !important; line-height: 1 !important; }
    body > header nav a.group > span > span:last-child { font-size: 1.45rem !important; line-height: 1 !important; }
  `;

  // Scripts CDN
  const cdnScripts: string[] = [];
  for (const m of raw.matchAll(/<script\s+src=["']([^"']+)["'][^>]*><\/script>/gi)) {
    cdnScripts.push(m[1]);
  }

  // Fonts
  const fontLinks: string[] = [];
  for (const m of raw.matchAll(/<link\s+rel=["']stylesheet["'][^>]*>/gi)) {
    fontLinks.push(m[0]);
  }

  // Todos los scripts inline
  const inlineScripts: string[] = [];
  for (const m of raw.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const code = m[1].trim();
    if (code) inlineScripts.push(code);
  }

  return (
    <ManualInlineClient
      styleBlock={styleBlock + "\n" + hideCss}
      bodyHtml={bodyHtml}
      cdnScripts={cdnScripts}
      inlineScripts={inlineScripts}
      fontLinks={fontLinks}
    />
  );
}
