import fs from "node:fs";
import path from "node:path";
import { ManualInlineClient } from "./ManualInlineClient";

const MANUAL_PATH = path.join(process.cwd(), "public", "manual", "manual-de-marca.html");

export function ManualInline() {
  const raw = fs.readFileSync(MANUAL_PATH, "utf8");

  // CSS personalizado del manual
  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styleBlock = styleMatch ? styleMatch[1] : "";

  // Body sin scripts (los scripts se ejecutan por separado en cliente)
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : "";
  bodyHtml = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Scripts CDN (con src)
  const cdnScripts: string[] = [];
  for (const m of raw.matchAll(/<script\s+src=["']([^"']+)["'][^>]*><\/script>/gi)) {
    cdnScripts.push(m[1]);
  }

  // Scripts inline (sin src) — se ejecutan una sola vez tras renderizar el body
  const inlineScripts: string[] = [];
  for (const m of raw.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const code = m[1].trim();
    if (code) inlineScripts.push(code);
  }

  // Fonts (link rel=stylesheet)
  const fontLinks: string[] = [];
  for (const m of raw.matchAll(/<link\s+rel=["']stylesheet["'][^>]*>/gi)) {
    fontLinks.push(m[0]);
  }

  return (
    <ManualInlineClient
      styleBlock={styleBlock}
      bodyHtml={bodyHtml}
      cdnScripts={cdnScripts}
      inlineScripts={inlineScripts}
      fontLinks={fontLinks}
    />
  );
}
