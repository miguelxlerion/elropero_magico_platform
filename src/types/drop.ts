export type DropStatus = "upcoming" | "live" | "ended";

export type Drop = {
  id: string;
  name: string;
  theme: string;
  launch_date: string;
  status: DropStatus;
  product_ids: string[];
  number: number;
  description: string;
  cover_image: string;
};

/** Snapshot mínimo que se transmite por el canal en tiempo real del countdown. */
export type DropSnapshot = Pick<
  Drop,
  "id" | "name" | "theme" | "launch_date" | "status" | "number" | "cover_image"
> & { product_count: number };
