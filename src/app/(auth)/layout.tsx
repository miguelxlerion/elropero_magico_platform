import type { ReactNode } from "react";
import Image from "next/image";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-tinta lg:block">
        <Image src="/images/historia.jpg" alt="Ropero curado de Mag&co" fill priority sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-tinta/90 via-tinta/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-hueso">
          <p className="font-display text-4xl leading-tight">
            “Cada prenda ya vivió una historia. <em className="italic text-salvia-200">La siguiente</em> es contigo.”
          </p>
          <p className="mt-4 text-sm text-hueso/60">— Equipo Mag&amp;co, Chapinero</p>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo className="self-center lg:self-start" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</div>
      </div>
    </div>
  );
}
