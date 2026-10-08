"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Box, Ruler, Sparkles } from "lucide-react";
import { DropCountdown } from "@/components/layout/DropCountdown";
import { Button } from "@/components/ui/button";
import type { DropSnapshot } from "@/types/drop";

const ease = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

export function HeroSection({ drop, liveDrop }: { drop: DropSnapshot | null; liveDrop: DropSnapshot | null }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section ref={ref} className="grain relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-24 size-[36rem] rounded-full bg-salvia-100/70 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-40 size-[32rem] rounded-full bg-beige-200/70 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-14">
        <div>
          {drop && (
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-tinta/10 bg-white/60 px-3.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.2em] backdrop-blur"
            >
              <Sparkles className="size-3.5 text-salvia-500" />
              {drop.status === "upcoming" ? "Próximo drop" : "Drop en vivo"} · {pad(drop.number)} {drop.name}
            </motion.span>
          )}

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="eyebrow eyebrow-line text-salvia-600"
          >
            Segunda mano, primera elección
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.08, ease }}
            className="mt-6 text-balance font-display text-[clamp(2.9rem,7vw,5.7rem)] font-medium leading-[0.94] tracking-tight text-tinta"
          >
            Historias que <em className="font-normal italic text-salvia-600">siguen.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease }}
            className="mt-6 max-w-xl text-base leading-relaxed text-tinta-500 sm:text-lg"
          >
            Ropa y accesorios de segunda mano seleccionados pieza por pieza. Lanzamos colecciones limitadas cada 15
            días: cuando una prenda se va, no vuelve.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.24 }}
            className="mt-3 max-w-xl text-sm leading-relaxed text-tinta-400"
          >
            Un ropero de piezas especiales, elegidas para volver a salir. Moda con otra historia, ahora en Bogotá.
          </motion.p>

          {drop && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.28, ease }}
              className="mt-10 rounded-[2rem] border border-tinta/5 bg-white/60 p-6 shadow-[0_30px_80px_-40px_rgba(21,20,18,0.35)] backdrop-blur-md sm:p-8"
            >
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-2xl">
                  Drop {pad(drop.number)} · <span className="italic">{drop.name}</span>
                </p>
                <p className="text-xs text-tinta-500">{drop.theme}</p>
              </div>
              <DropCountdown initialDrop={drop} variant="hero" />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg">
              <Link href="/catalogo">
                Explorar catálogo <ArrowRight />
              </Link>
            </Button>
            {liveDrop && liveDrop.id !== drop?.id && (
              <Button asChild size="lg" variant="outline">
                <Link href={`/drops/${liveDrop.id}`}>En vivo: Drop {pad(liveDrop.number)} {liveDrop.name}</Link>
              </Button>
            )}
          </motion.div>
        </div>

        <div className="relative">
          <motion.div
            style={{ y: imageY }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease }}
            className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-b-[2rem] rounded-t-[14rem] bg-beige-100 shadow-[0_60px_120px_-50px_rgba(21,20,18,0.5)] lg:max-w-none"
          >
            <Image
              src="/images/hero.jpg"
              alt="Una pieza atemporal en una historia nueva — curaduría circular en Bogotá"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
            <span className="absolute bottom-5 right-5 text-[0.5625rem] uppercase tracking-[0.16em] text-white/90">
              Bogotá · Curaduría circular
            </span>
          </motion.div>

          <div className="hero-stamp absolute -left-2 top-6 sm:-left-4 lg:-left-8" aria-hidden="true">
            <span>
              Una vida más para lo que ya existe <strong>✳</strong>
            </span>
          </div>

          <motion.div
            style={{ y: cardY }}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease }}
            className="absolute -left-2 bottom-20 hidden rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:block lg:-left-10"
          >
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Box className="size-4 text-salvia-600" /> Probador 3D + AR
            </p>
            <p className="mt-1 text-xs text-tinta-500">Gira, acerca y pruébalo en tu espacio.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="absolute -right-2 top-24 hidden animate-float rounded-2xl bg-tinta p-4 text-hueso shadow-xl sm:block lg:-right-6"
          >
            <p className="font-display text-3xl leading-none">1 de 1</p>
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-hueso/70">Pieza única</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="absolute -bottom-5 right-8 hidden items-center gap-2 rounded-full bg-salvia-600 px-4 py-2 text-xs font-semibold text-white shadow-lg sm:flex"
          >
            <Ruler className="size-3.5" /> Medidas reales en cm
          </motion.div>
        </div>
      </div>

      <div className="editorial-marquee" aria-hidden="true">
        <div className="editorial-marquee-track">
          {[0, 1].map((dup) => (
            <span key={dup}>
              Piezas con pasado, estilo con futuro <b>✳</b> Curado en Bogotá <b>✳</b> Comprar menos, elegir mejor{" "}
              <b>✳</b> Una historia nueva empieza contigo <b>✳</b>&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
