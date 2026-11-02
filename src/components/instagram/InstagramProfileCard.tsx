import { AtSign as Instagram } from "lucide-react";

export function InstagramProfileCard({
  handle,
  label = "Ver el perfil completo",
}: {
  handle: string;
  label?: string;
}) {
  return (
    <a
      href={`https://www.instagram.com/${handle}/`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-semibold text-tinta-600 transition-colors hover:border-tinta/40 hover:text-tinta"
    >
      <Instagram className="size-4" /> {label}
    </a>
  );
}
