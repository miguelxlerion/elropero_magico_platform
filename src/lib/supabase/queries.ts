"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function listenToDropUpdates(onUpdate: (drop: Record<string, unknown>) => void) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel("public:drops")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "drops" }, (payload) => {
      onUpdate(payload.new as Record<string, unknown>);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function uploadProductImage(file: File, productId: string) {
  const supabase: SupabaseClient | null = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Configura Supabase Storage para cargar imágenes.");
  const filePath = `${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
  const { error } = await supabase.storage.from("products").upload(filePath, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from("products").getPublicUrl(filePath).data.publicUrl;
}
