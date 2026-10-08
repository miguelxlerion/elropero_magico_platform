import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/types/order";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "added_at">) => boolean;
  removeItem: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        if (get().items.some((i) => i.id === item.id)) return false;
        set({ items: [...get().items, { ...item, added_at: Date.now() }] });
        return true;
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      removeMany: (ids) => set({ items: get().items.filter((i) => !ids.includes(i.id)) }),
      clear: () => set({ items: [] }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "magco-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
