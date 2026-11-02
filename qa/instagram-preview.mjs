/**
 * Servidor de QA para la sección /instagram.
 *
 * El feed de ejemplo de Behold (https://feeds.behold.so/zFgp2Jbbk23Ovf1ZUOhq) solo trae fotos, así que
 * no permite comprobar los filtros por tipo, los reels ni el `<video>` nativo. Este script toma ese feed
 * real, re-etiqueta las publicaciones como reel / video / carrusel / foto y les asigna un mp4 de prueba,
 * y lo sirve por HTTP con la forma exacta de un feed de Behold.
 *
 * Uso:
 *   node qa/instagram-preview.mjs
 *   # y en .env.local:  BEHOLD_FEED_URL=http://127.0.0.1:8788/feed.json
 */
import { createServer } from "node:http";

const SOURCE_FEED = "https://feeds.behold.so/zFgp2Jbbk23Ovf1ZUOhq";
const PORT = 8788;

const VIDEOS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
];

// Ciclo elegido para que los cuatro tipos queden representados y ningún filtro salga vacío.
const KINDS = ["reel", "photo", "video", "carousel", "reel", "photo", "carousel", "video"];

function toMotion(post, kind, index) {
  const image = post.sizes?.medium?.mediaUrl ?? post.sizes?.small?.mediaUrl ?? post.thumbnailUrl;
  return {
    ...post,
    mediaType: "VIDEO",
    isReel: kind === "reel",
    mediaUrl: VIDEOS[index % VIDEOS.length],
    thumbnailUrl: image,
  };
}

async function buildFeed() {
  const res = await fetch(SOURCE_FEED, { cache: "no-store" });
  if (!res.ok) throw new Error(`El feed de ejemplo respondió ${res.status}`);
  const source = await res.json();

  const posts = (source.posts ?? []).map((post, i) => {
    const kind = KINDS[i % KINDS.length];
    if (kind === "reel" || kind === "video") return toMotion(post, kind, i);
    if (kind === "carousel") return { ...post, mediaType: "CAROUSEL_ALBUM" };
    return { ...post, mediaType: "IMAGE", isReel: false };
  });

  return { ...source, posts };
}

const feed = await buildFeed();

const byKind = feed.posts.reduce((acc, post) => {
  const key = `${post.mediaType}:${post.isReel ? "reel" : "x"}`;
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});

createServer((_req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(feed));
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Feed de prueba con ${feed.posts.length} publicaciones (${JSON.stringify(byKind)})`);
  console.log(`http://127.0.0.1:${PORT}/feed.json`);
  console.log("Agrega a .env.local:  BEHOLD_FEED_URL=http://127.0.0.1:8788/feed.json");
});
