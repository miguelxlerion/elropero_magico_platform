"use client";

import { motion } from "framer-motion";
import { MessageCircle, Users } from "lucide-react";
import { NotifyForm } from "@/components/layout/NotifyForm";
import { SITE } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

export function NewsletterCTA() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden rounded-[2.5rem] bg-beige-100 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:p-16"
      >
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-salvia-200/60 blur-3xl" />
        <div className="relative">
          <p className="eyebrow text-salvia-700">Lista de espera</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
            Las mejores piezas se van en <em className="italic">minutos</em>.
          </h2>
          <p className="mt-4 max-w-md text-tinta-500">
            Recibe el avance del próximo drop 24 horas antes, acceso anticipado de 15 minutos y una nota de nuestra
            curadora sobre las piezas estrella. Sin spam, máximo dos mensajes por drop.
          </p>
          <NotifyForm
            source="newsletter"
            cta="Unirme"
            className="mt-8 max-w-lg"
            successText="¡Bienvenida al ropero! Te escribiremos antes del próximo drop."
          />
        </div>
        <div className="relative flex flex-col justify-between gap-6 rounded-[2rem] bg-tinta p-8 text-hueso">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#25d366] text-tinta">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Comunidad en WhatsApp</p>
              <p className="flex items-center gap-1.5 text-xs text-hueso/60">
                <Users className="size-3.5" /> +2.300 personas en Bogotá
              </p>
            </div>
          </div>
          <p className="font-display text-2xl leading-snug">
            “Avisos del drop, apartados por 30 minutos y asesoría de tallas con medidas reales.”
          </p>
          <a
            href={whatsappLink(SITE.whatsapp, "¡Hola! Quiero unirme a la comunidad de El Ropero Mag&co 💚")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-hueso px-6 py-3 text-sm font-semibold text-tinta transition hover:bg-white"
          >
            <MessageCircle className="size-4" /> Unirme por WhatsApp
          </a>
        </div>
      </motion.div>
    </section>
  );
}
