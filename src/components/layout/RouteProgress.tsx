"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/** Barra superior mágica (aqua → rosa) durante la navegación entre páginas. */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setActive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 top-0 z-[90] h-[3px] overflow-hidden"
        >
          <motion.div
            initial={{ x: "-60%" }}
            animate={{ x: "260%" }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/3 rounded-full bg-[linear-gradient(90deg,transparent,var(--color-salvia-400),var(--color-rosa-400),transparent)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
