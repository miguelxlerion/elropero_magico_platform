"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useInView } from "framer-motion";
import { Camera, Leaf, Scissors, Search, Sparkles } from "lucide-react";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("es-CO")}
      {suffix}
    </span>
  );
}

const STEPS = [
  { icon: Search, title: "Curamos", text: "Recibimos prendas de roperos bogotanos y solo 1 de cada 5 pasa nuestra revisión de 23 puntos." },
  { icon: Scissors, title: "Restauramos", text: "Lavado ecológico, vaporizado y arreglos menores con costureras del barrio Restrepo." },
  { icon: Camera, title: "Medimos y fotografiamos", text: "Medidas reales en cm y fotos de cada detalle de uso. Sin filtros, sin sorpresas." },
  { icon: Sparkles, title: "Lanzamos en drops", text: "Colecciones pequeñas cada 15 días. Cada pieza existe una sola vez." },
];

export function StorySection() {
  return (
    <section id="historia" className="scroll-mt-28 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-beige-100">
              <Image src="/images/historia.jpg" alt="Curaduría de prendas en el taller de Mag&co" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-4 max-w-[15rem] rounded-3xl bg-salvia-600 p-6 text-white shadow-2xl sm:-right-8">
              <Leaf className="size-5 text-salvia-100" />
              <p className="mt-3 font-display text-4xl leading-none">
                <Counter to={36} suffix="M" />
              </p>
              <p className="mt-2 text-xs leading-relaxed text-salvia-50/90">litros de agua que nuestra comunidad ha evitado gastar en ropa nueva.</p>
            </div>
          </motion.div>

          <div>
            <p className="eyebrow eyebrow-line text-salvia-600">Una historia que se comparte</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              El ropero no se acaba <em className="italic">en ti.</em>
            </h2>
            <p className="mt-3 font-display text-xl italic text-tinta-500">
              Empezó en el ropero de la abuela Magdalena.
            </p>
            <div className="mt-6 space-y-4 text-tinta-500 sm:text-lg sm:leading-relaxed">
              <p>
                En 2021, al desocupar el apartamento de nuestra abuela en Chapinero, encontramos abrigos de paño
                impecables, mochilas wayuu tejidas a mano y gafas que habían viajado más que nosotras. No podíamos
                dejarlas en una bolsa.
              </p>
              <p>
                Así nació Mag&amp;co: Magdalena &amp; compañía. Una forma de demostrar que la moda en Colombia puede
                ser circular, honesta y bonita. Que comprar de segunda mano no es conformarse, sino elegir con
                criterio.
              </p>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <dt className="text-xs text-tinta-400">Prendas recirculadas</dt>
                <dd className="mt-1 font-display text-3xl sm:text-4xl">
                  <Counter to={4800} suffix="+" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-tinta-400">kg de CO₂ evitados</dt>
                <dd className="mt-1 font-display text-3xl sm:text-4xl">
                  <Counter to={61} suffix="t" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-tinta-400">Vendido por drop</dt>
                <dd className="mt-1 font-display text-3xl sm:text-4xl">
                  <Counter to={92} suffix="%" />
                </dd>
              </div>
            </dl>
            <div className="story-stats" aria-label="Nuestro ritmo">
              <div><strong className="font-display text-2xl">15 días</strong><br /><span className="text-[0.65rem] uppercase tracking-[0.12em] text-tinta-400">Entre cada Drop</span></div>
              <div><strong className="font-display text-2xl">1 de 1</strong><br /><span className="text-[0.65rem] uppercase tracking-[0.12em] text-tinta-400">Cada pieza, única</span></div>
              <div><strong className="font-display text-2xl">100%</strong><br /><span className="text-[0.65rem] uppercase tracking-[0.12em] text-tinta-400">Curado a mano</span></div>
            </div>
          </div>
        </div>

        <ol className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-[1.75rem] border border-border bg-white/60 p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_60px_-40px_rgba(21,20,18,0.4)]"
            >
              <span className="font-display text-5xl text-beige-300 transition group-hover:text-salvia-300">0{i + 1}</span>
              <Icon className="absolute right-6 top-7 size-5 text-salvia-600" />
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-tinta-500">{text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
