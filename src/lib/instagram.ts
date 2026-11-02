import { SITE } from "@/lib/constants";

export const INSTAGRAM_HANDLE = SITE.instagram;

const BEHOLD_FEED_HOST = "https://feeds.behold.so";
const CACHE_TTL_MS = 15 * 60 * 1000;

export type InstagramKind = "reel" | "video" | "photo" | "carousel";

export type InstagramItem = {
  id: string;
  kind: InstagramKind;
  title: string;
  caption: string;
  alt: string;
  image: string;
  /** Fuente de video cuando la publicación es reel o video; vacía en fotos y carruseles. */
  video: string;
  permalink: string;
  publishedAt: string;
  likes: number;
  comments: number;
};

export type InstagramProfile = {
  username: string;
  biography: string;
  avatar: string;
  followers: number;
};

export type InstagramFeed = { profile: InstagramProfile | null; items: InstagramItem[] };

type BeholdSize = { height?: number; width?: number; mediaUrl?: string };
type BeholdPost = {
  id: string;
  timestamp?: string;
  permalink?: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  isReel?: boolean;
  mediaUrl?: string;
  thumbnailUrl?: string;
  sizes?: Partial<Record<"small" | "medium" | "large" | "full", BeholdSize>>;
  caption?: string;
  prunedCaption?: string;
  altText?: string;
  likeCount?: number;
  commentsCount?: number;
};

type BeholdFeed = {
  username?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  posts?: BeholdPost[];
};

let cache: { at: number; feed: InstagramFeed } | null = null;

/**
 * Behold se conecta con la cuenta (exige Business o Media Creator) y expone el resultado en una URL
 * de feed JSON. La leemos del servidor para que el identificador del feed no quede en el navegador.
 */
export function beholdFeedUrl() {
  const raw = process.env.BEHOLD_FEED_URL ?? process.env.BEHOLD_FEED_ID ?? "";
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${BEHOLD_FEED_HOST}/${encodeURIComponent(value)}`;
}

export function isInstagramConfigured() {
  return beholdFeedUrl() !== null;
}

function toKind(post: BeholdPost): InstagramItem["kind"] {
  if (post.mediaType === "CAROUSEL_ALBUM") return "carousel";
  if (post.isReel) return "reel";
  if (post.mediaType === "VIDEO") return "video";
  return "photo";
}

export const KIND_LABEL: Record<InstagramKind, string> = {
  reel: "Reel",
  video: "Video",
  carousel: "Carrusel",
  photo: "Foto",
};

/** Orden estable de los filtros por tipo; solo se muestran los tipos con publicaciones presentes. */
export const INSTAGRAM_KIND_ORDER: InstagramKind[] = ["reel", "video", "carousel", "photo"];

function pickImage(post: BeholdPost, kind: InstagramItem["kind"]) {
  const sizes = post.sizes;
  // medium (700px) equilibra nitidez y peso en la rejilla de 4 columnas.
  const still = sizes?.medium?.mediaUrl ?? sizes?.small?.mediaUrl ?? post.thumbnailUrl ?? post.mediaUrl;
  if (kind === "reel" || kind === "video") {
    // Behold documenta thumbnail_url para video, pero no siempre llega: descartar la publicación es
    // mejor que poner un .mp4 en un <img>, porque la tarjeta saldría rota.
    const poster = post.thumbnailUrl && !isVideoFile(post.thumbnailUrl) ? post.thumbnailUrl : still;
    return poster && !isVideoFile(poster) ? poster : "";
  }
  return still && !isVideoFile(still) ? still : "";
}

function isVideoFile(url: string) {
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function normalize(post: BeholdPost): InstagramItem | null {
  const kind = toKind(post);
  const image = pickImage(post, kind);
  if (!image || !post.permalink) return null;
  const isMotion = kind === "reel" || kind === "video";
  return {
    id: post.id,
    kind,
    title: KIND_LABEL[kind],
    caption: (post.prunedCaption || post.caption || "").replace(/\s+/g, " ").trim(),
    alt: post.altText ?? "",
    image,
    video: isMotion ? (post.mediaUrl ?? "") : "",
    permalink: post.permalink,
    publishedAt: post.timestamp ?? "",
    likes: post.likeCount ?? 0,
    comments: post.commentsCount ?? 0,
  };
}

export async function getInstagramFeed(): Promise<InstagramFeed | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.feed;
  const url = beholdFeedUrl();
  if (!url) return null;

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as BeholdFeed;
    const feed: InstagramFeed = {
      profile: json.username
        ? {
            username: json.username,
            biography: json.biography ?? "",
            avatar: json.profilePictureUrl ?? "",
            followers: json.followersCount ?? 0,
          }
        : null,
      items: (json.posts ?? []).map(normalize).filter((p): p is InstagramItem => p !== null),
    };
    if (!feed.items.length) return null;
    cache = { at: Date.now(), feed };
    return feed;
  } catch {
    return null;
  }
}
