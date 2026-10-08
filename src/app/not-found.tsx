import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-16 font-display text-[8rem] leading-none text-beige-300">404</p>
      <h1 className="mt-2 font-display text-4xl">Esta pieza ya encontró dueña</h1>
      <p className="mt-3 max-w-md text-tinta-500">
        O quizás nunca existió. Las prendas de los próximos drops se revelan solo cuando termina la cuenta regresiva.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/catalogo">Ver catálogo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
