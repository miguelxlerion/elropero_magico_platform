import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Lockup de marca: isologo real del ropero + wordmark. El isologo no cambia con la paleta. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label="El Ropero Mag&co — inicio"
      className={cn("group inline-flex items-center gap-2.5 leading-none", className)}
    >
      <Image
        src="/logo-mark.svg"
        alt=""
        width={66}
        height={72}
        priority
        className="h-10 w-auto rounded-[0.6rem] ring-1 ring-black/10"
      />
      <span className="flex flex-col items-start">
        <span
          className={cn(
            "text-[0.55rem] font-semibold uppercase tracking-[0.42em]",
            tone === "dark" ? "text-tinta-500" : "text-hueso/70",
          )}
        >
          El Ropero
        </span>
        <span
          className={cn(
            "font-display text-[1.7rem] font-medium tracking-tight",
            tone === "dark" ? "text-tinta" : "text-hueso",
          )}
        >
          Mag<span className="italic text-salvia-500 transition-colors group-hover:text-salvia-600">&amp;</span>co
        </span>
      </span>
    </Link>
  );
}
