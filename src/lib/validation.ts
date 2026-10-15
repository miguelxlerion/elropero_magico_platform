import { z } from "zod";

const phoneCO = /^3\d{9}$/;

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(5, "Escribe tu nombre completo"),
  email: z.string().trim().email("Correo electrónico inválido"),
  phone: z.string().trim().regex(phoneCO, "Celular de 10 dígitos que empiece por 3"),
  documentType: z.enum(["CC", "CE", "NIT", "PP"]),
  documentNumber: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z]{5,12}$/, "Número de documento inválido"),
  city: z.string().trim().min(2, "Selecciona tu ciudad"),
  department: z.string().trim().min(2, "Departamento requerido"),
  address: z.string().trim().min(6, "Dirección incompleta (ej. Cra 7 # 45-10)"),
  neighborhood: z.string().trim().max(80, "Máximo 80 caracteres"),
  notes: z.string().trim().max(240, "Máximo 240 caracteres"),
  paymentMethod: z.enum(["pse", "nequi", "daviplata", "card", "cod"]),
  acceptTerms: z.boolean().refine((v) => v, "Debes aceptar los términos y la política de datos"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const orderRequestSchema = checkoutSchema.extend({
  items: z.array(z.string().uuid()).min(1, "Tu carrito está vacío").max(20),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Escribe tu nombre"),
    email: z.string().trim().email("Correo electrónico inválido"),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || phoneCO.test(v), "Celular de 10 dígitos que empiece por 3"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[0-9]/, "Incluye al menos un número"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "Debes aceptar la política de datos"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const subscribeSchema = z
  .object({
    channel: z.enum(["email", "whatsapp"]),
    contact: z.string().trim().min(1, "Este campo es obligatorio"),
    dropId: z.string().optional(),
    source: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.contact)) {
      ctx.addIssue({ code: "custom", path: ["contact"], message: "Correo electrónico inválido" });
    }
    if (v.channel === "whatsapp" && !phoneCO.test(v.contact.replace(/\D/g, ""))) {
      ctx.addIssue({
        code: "custom",
        path: ["contact"],
        message: "Número de 10 dígitos (ej. 313 312 9691)",
      });
    }
  });

export type SubscribeValues = z.infer<typeof subscribeSchema>;

const measurement = z.number().positive().max(400).optional();

export const productInputSchema = z.object({
  name: z.string().trim().min(3, "Nombre muy corto"),
  brand: z.string().trim().min(2, "Marca requerida"),
  category: z.enum(["ropa_superior", "ropa_inferior", "vestidos", "calzado", "accesorios"]),
  subcategory: z.string().trim().min(2, "Subcategoría requerida"),
  size: z.string().trim().min(1, "Talla requerida"),
  color: z.string().trim().max(60),
  material: z.string().trim().max(120),
  measurements: z.object({
    chest: measurement,
    waist: measurement,
    length: measurement,
    shoulder: measurement,
    hip: measurement,
    sleeve: measurement,
    inseam: measurement,
    width: measurement,
    height: measurement,
    depth: measurement,
    strap_drop: measurement,
    circumference: measurement,
    insole: measurement,
  }),
  condition_score: z.number({ error: "Define el estado" }).int().min(1).max(10),
  condition_notes: z.string().trim().max(500),
  price: z.number({ error: "Ingresa el precio" }).int("Sin decimales").min(1000, "Precio mínimo $1.000"),
  original_price: z.number({ error: "Número inválido" }).int().min(0).optional(),
  images: z.array(z.string().url()).min(1, "Agrega al menos una imagen"),
  model_3d_url: z.string().optional(),
  drop_id: z.string().optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  tags: z.array(z.string().trim().min(1)).max(15),
  ai_generated_description: z.string().trim().min(20, "Genera o escribe una descripción"),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const dropInputSchema = z.object({
  name: z.string().trim().min(3, "Nombre muy corto"),
  theme: z.string().trim().min(3, "Describe el tema"),
  description: z.string().trim().max(600),
  cover_image: z.string().trim().url("URL inválida").or(z.literal("")),
  launch_date: z.string().min(1, "Fecha requerida"),
});

export type DropInput = z.infer<typeof dropInputSchema>;

export const describeInputSchema = z.object({
  name: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.enum(["ropa_superior", "ropa_inferior", "vestidos", "calzado", "accesorios"]),
  subcategory: z.string().trim().default(""),
  size: z.string().trim().default(""),
  color: z.string().trim().default(""),
  material: z.string().trim().default(""),
  condition_score: z.number().int().min(1).max(10),
  condition_notes: z.string().trim().default(""),
  original_price: z.number().int().optional(),
  measurements: z.record(z.string(), z.number()).default({}),
  image_url: z.string().url().optional(),
});

export type DescribeInput = z.infer<typeof describeInputSchema>;
