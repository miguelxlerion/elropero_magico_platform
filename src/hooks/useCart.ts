"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { formatCOP } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import type { CartItem } from "@/types/order";
import type { Product } from "@/types/product";
import { useHydrated } from "./useHydrated";

const EMPTY: CartItem[] = [];

export function productToCartItem(product: Product): Omit<CartItem, "added_at"> {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    size: product.size,
    price: product.price,
    original_price: product.original_price,
    image: product.images[0] ?? "",
    condition: product.condition,
    condition_score: product.condition_score,
    drop_id: product.drop_id,
  };
}

export function useCart() {
  const hydrated = useHydrated();
  const storeItems = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const removeMany = useCartStore((s) => s.removeMany);
  const clear = useCartStore((s) => s.clear);
  const setOpen = useCartStore((s) => s.setOpen);

  const items = hydrated ? storeItems : EMPTY;

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items]);
  const savings = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.original_price && i.original_price > i.price ? i.original_price - i.price : 0),
        0,
      ),
    [items],
  );

  const add = useCallback(
    (item: Omit<CartItem, "added_at">, options?: { openDrawer?: boolean }) => {
      const added = addItem(item);
      if (!added) {
        toast("Ya está en tu carrito", { description: "Cada prenda es única: solo existe una unidad." });
        setOpen(true);
        return false;
      }
      track("add_to_cart", { product_id: item.id, price: item.price, brand: item.brand });
      toast.success("Agregado a tu carrito", { description: `${item.name} · ${formatCOP(item.price)}` });
      if (options?.openDrawer !== false) setOpen(true);
      return true;
    },
    [addItem, setOpen],
  );

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  return {
    items,
    count: items.length,
    subtotal,
    savings,
    isOpen,
    hydrated,
    add,
    remove: removeItem,
    removeMany,
    clear,
    setOpen,
    has,
  };
}
