import Image from "next/image";
import Link from "next/link";
import { AtSign as Instagram, Leaf, Mail, MapPin, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

const PAYMENT_MARKS = [
  { label: "PSE", className: "bg-[#0a4a8c] text-white" },
  { label: "Nequi", className: "bg-[#200020] text-[#ff4f9a]" },
  { label: "Daviplata", className: "bg-[#e1251b] text-white" },
  { label: "Visa", className: "bg-white text-[#1a1f71]" },
  { label: "Mastercard", className: "bg-white text-[#eb001b]" },
  { label: "Contra entrega", className: "bg-salvia-600 text-white" },
];

export function Footer() {
  return (
    <footer className="grain mt-24 bg-tinta text-hueso">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Link href="/" aria-label="El Ropero Mag&co — inicio">
              <Image
                src="/logo-ropero-mag.svg"
                alt="El Ropero Mag&co — ropero con prendas"
                width={408}
                height={230}
                className="w-56 rounded-2xl ring-1 ring-white/15"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-hueso/65">
              Ropa y accesorios de segunda mano, curados pieza por pieza en Bogotá. Moda circular, honesta y con
              historia: cada prenda es única.
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-salvia-200">
              <Leaf className="size-3.5" /> +36 millones de litros de agua ahorrados por nuestra comunidad
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4 text-hueso/45">Tienda</p>
            <ul className="space-y-2.5 text-sm text-hueso/75">
              <li><Link href="/catalogo" className="hover:text-hueso">Catálogo completo</Link></li>
              <li><Link href="/drops" className="hover:text-hueso">Calendario de drops</Link></li>
              <li><Link href="/catalogo?categoria=accesorios&3d=1" className="hover:text-hueso">Probador virtual 3D</Link></li>
              <li><Link href="/carrito" className="hover:text-hueso">Mi carrito</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 text-hueso/45">Ayuda</p>
            <ul className="space-y-2.5 text-sm text-hueso/75">
              <li>Envíos: mismo día en Bogotá</li>
              <li>Nacional: 2 a 4 días hábiles</li>
              <li>Cambios por talla en 5 días</li>
              <li><Link href="/#historia" className="hover:text-hueso">Cómo curamos</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 text-hueso/45">Contacto</p>
            <ul className="space-y-2.5 text-sm text-hueso/75">
              <li>
                <a href={whatsappLink(SITE.whatsapp, "Hola Mag&co 👋")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-hueso">
                  <MessageCircle className="size-4" /> {SITE.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:text-hueso">
                  <Mail className="size-4" /> {SITE.email}
                </a>
              </li>
              <li>
                <a href={`https://instagram.com/${SITE.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-hueso">
                  <Instagram className="size-4" /> @{SITE.instagram}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="size-4" /> Chapinero, {SITE.city}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {PAYMENT_MARKS.map((m) => (
              <span key={m.label} className={`rounded-md px-2.5 py-1 text-[0.65rem] font-bold tracking-wide ${m.className}`}>
                {m.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-hueso/45">
            © {new Date().getFullYear()} {SITE.name}. Pagos procesados por Wompi (Bancolombia). Hecho con 🌿 en Bogotá.
          </p>
        </div>
      </div>
    </footer>
  );
}
