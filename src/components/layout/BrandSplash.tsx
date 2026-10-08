"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

const SEEN_KEY = "ropero-splash-seen";
const MIN_DISPLAY_MS = 1500;

const TWINKLES = [
  { top: "18%", left: "12%", size: 18, color: "text-salvia-400", delay: 0 },
  { top: "26%", left: "86%", size: 14, color: "text-rosa-400", delay: 0.4 },
  { top: "72%", left: "18%", size: 14, color: "text-rosa-400", delay: 0.8 },
  { top: "64%", left: "84%", size: 20, color: "text-salvia-400", delay: 0.2 },
  { top: "12%", left: "68%", size: 12, color: "text-salvia-300", delay: 1 },
  { top: "82%", left: "66%", size: 12, color: "text-rosa-300", delay: 0.6 },
];

/** Pantalla de apertura mágica: isologo flotante, destellos y barra shimmer.
 *  Solo la primera vista por sesión; bloquea el scroll mientras está visible. */
export function BrandSplash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let alive = true;
    try {
      if (window.sessionStorage.getItem(SEEN_KEY)) {
        setShow(false);
        return;
      }
    } catch {
      // sin sessionStorage igual mostramos el splash una vez
    }

    const minTime = new Promise((resolve) => setTimeout(resolve, MIN_DISPLAY_MS));
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) =>
            window.addEventListener("load", () => resolve(null), { once: true }),
          );
    void Promise.all([minTime, loaded]).then(() => {
      if (!alive) return;
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // nada que persistir
      }
      setShow(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-label="Cargando El Ropero Mag&co"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="grain fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-hueso"
        >
          {TWINKLES.map((star, i) => (
            <motion.span
              key={i}
              aria-hidden
              className={cn("absolute", star.color)}
              style={{ top: star.top, left: star.left }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0.35, 1, 0], scale: [0.4, 1, 0.8, 1.1, 0.5], rotate: [0, 25, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
            >
              <Sparkle style={{ width: star.size, height: star.size }} fill="currentColor" />
            </motion.span>
          ))}

          <div className="relative flex flex-col items-center px-6 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <motion.span
                aria-hidden
                className="absolute -inset-5 rounded-[2rem] bg-salvia-200/50 blur-2xl"
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <Image
                src="/logo-mark.svg"
                alt=""
                width={132}
                height={144}
                priority
                className="relative h-28 w-auto rounded-[1.4rem] shadow-[0_30px_70px_-30px_rgba(21,20,18,0.45)] ring-1 ring-black/10"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="eyebrow mt-7 text-tinta-400"
            >
              El Ropero
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-1 font-display text-5xl tracking-tight text-tinta"
            >
              Mag<span className="italic text-rosa-500">&amp;</span>co
            </motion.p>

            <div
              aria-hidden
              className="mt-7 h-1 w-48 overflow-hidden rounded-full bg-beige-200"
            >
              <motion.div
                initial={{ x: "-110%" }}
                animate={{ x: "240%" }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-2/5 rounded-full bg-gradient-to-r from-salvia-400 via-rosa-400 to-salvia-300"
              />
            </div>
            <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-tinta-500">
              Abriendo el ropero…
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
