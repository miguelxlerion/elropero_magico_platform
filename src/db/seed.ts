import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { drops, orderItems, orders, products, subscribers, users } from "@/db/schema";
import { generateLocalCopy } from "@/lib/ai/describe";
import { conditionFromScore } from "@/lib/conditions";
import { hashPassword } from "@/lib/password";
import type { ProductCategory, ProductMeasurements, ProductStatus } from "@/types/product";

export const DEMO_ADMIN = { email: "admin@elroperomagco.co", password: "MagcoAdmin2025" };

const DAY = 86_400_000;
const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=900`;

const DROP_07 = "drop-07-tierra-fria";
const DROP_08 = "drop-08-herencia";
const DROP_09 = "drop-09-caribe-slow";

type SeedProduct = {
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  size: string;
  measurements: ProductMeasurements;
  score: number;
  notes: string;
  color: string;
  material: string;
  price: number;
  original?: number;
  images: number[];
  model?: string;
  drop: string;
  status?: ProductStatus;
  featured?: boolean;
};

const SEED_PRODUCTS: SeedProduct[] = [
  // ---------------- Drop 07 · Tierra Fría (finalizado) ----------------
  {
    slug: "saco-merino-cuello-alto-cos", name: "Saco de merino cuello alto", brand: "COS",
    category: "ropa_superior", subcategory: "Sacos y suéteres", size: "M",
    measurements: { chest: 54, length: 66, shoulder: 46, sleeve: 60 }, score: 8,
    notes: "Leve motita en los costados por roce, ya retirada con peine textil.",
    color: "Camel", material: "100% lana merino", price: 145_000, original: 420_000,
    images: [28259752, 35210034], drop: DROP_07, status: "sold",
  },
  {
    slug: "cardigan-lana-virgen-nobsa", name: "Cárdigan tejido a mano", brand: "Taller Nobsa (artesanal)",
    category: "ropa_superior", subcategory: "Sacos y suéteres", size: "L",
    measurements: { chest: 58, length: 70, shoulder: 50, sleeve: 58 }, score: 9,
    notes: "Sin señales de uso; tejido firme y botones de tagua completos.",
    color: "Crudo", material: "Lana virgen de oveja", price: 120_000, original: 260_000,
    images: [11541395, 13889763], drop: DROP_07,
  },
  {
    slug: "botas-chelsea-gamuza-bosi", name: "Botas Chelsea de gamuza", brand: "Bosi",
    category: "calzado", subcategory: "Botas", size: "38",
    measurements: { insole: 24.5, height: 15 }, score: 7,
    notes: "Suela con desgaste uniforme en el talón; gamuza cepillada e impermeabilizada.",
    color: "Café tabaco", material: "Gamuza y suela de caucho", price: 210_000, original: 520_000,
    images: [30272899, 30272901], drop: DROP_07,
  },
  {
    slug: "botines-cuero-engrasado-timberland", name: "Botines de cuero engrasado", brand: "Timberland",
    category: "calzado", subcategory: "Botines", size: "40",
    measurements: { insole: 26, height: 16 }, score: 6,
    notes: "Arrugas naturales en la puntera y cordones reemplazados por unos nuevos.",
    color: "Miel", material: "Cuero engrasado", price: 230_000, original: 690_000,
    images: [30229961, 18724196], drop: DROP_07, status: "sold",
  },
  {
    slug: "abrigo-lana-espiga-arturo-calle", name: "Abrigo de lana en espiga", brand: "Arturo Calle",
    category: "ropa_superior", subcategory: "Abrigos", size: "L",
    measurements: { chest: 58, length: 92, shoulder: 48, sleeve: 64 }, score: 7,
    notes: "Forro con una pequeña costura reforzada en la sisa izquierda.",
    color: "Gris carbón", material: "70% lana, 30% poliéster", price: 240_000, original: 750_000,
    images: [19454629, 1643025], drop: DROP_07,
  },
  // ---------------- Drop 08 · Herencia (en vivo) ----------------
  {
    slug: "gabardina-clasica-burberry", name: "Gabardina clásica", brand: "Burberry",
    category: "ropa_superior", subcategory: "Gabardinas", size: "S",
    measurements: { chest: 56, length: 104, shoulder: 44, sleeve: 61 }, score: 8,
    notes: "Leve desgaste en el borde de los puños; forro de cuadros impecable. Falta el botón de repuesto.",
    color: "Miel", material: "Gabardina de algodón", price: 890_000, original: 8_200_000,
    images: [19169233, 31529647], drop: DROP_08, featured: true,
  },
  {
    slug: "abrigo-pano-gris-massimo-dutti", name: "Abrigo de paño cruzado", brand: "Massimo Dutti",
    category: "ropa_superior", subcategory: "Abrigos", size: "M",
    measurements: { chest: 55, length: 98, shoulder: 45, sleeve: 62 }, score: 9,
    notes: "Usado una temporada; sin motas ni brillos en el paño.",
    color: "Gris perla", material: "Paño de lana", price: 280_000, original: 899_000,
    images: [35114789, 31529647], drop: DROP_08, status: "reserved",
  },
  {
    slug: "chaqueta-jean-oversize-levis", name: "Chaqueta de jean oversize 90s", brand: "Levi's",
    category: "ropa_superior", subcategory: "Chaquetas", size: "M",
    measurements: { chest: 60, length: 64, shoulder: 52, sleeve: 58 }, score: 8,
    notes: "Desteñido natural de fábrica; un punto de óxido en el botón inferior que no mancha la tela.",
    color: "Azul medio", material: "Denim 100% algodón 12 oz", price: 165_000, original: 389_000,
    images: [13662420, 16390585], drop: DROP_08, featured: true,
  },
  {
    slug: "chaqueta-jean-negra-diesel", name: "Chaqueta de jean negra", brand: "Diesel",
    category: "ropa_superior", subcategory: "Chaquetas", size: "S",
    measurements: { chest: 50, length: 58, shoulder: 42, sleeve: 59 }, score: 6,
    notes: "Decoloración leve en hombros por uso; costuras firmes.",
    color: "Negro lavado", material: "Denim stretch", price: 130_000, original: 520_000,
    images: [16906744], drop: DROP_08, status: "sold",
  },
  {
    slug: "chaqueta-jean-intervenida-upcycled", name: "Chaqueta de jean intervenida", brand: "Upcycled Bogotá (pieza única)",
    category: "ropa_superior", subcategory: "Chaquetas", size: "L",
    measurements: { chest: 62, length: 66, shoulder: 54, sleeve: 60 }, score: 9,
    notes: "Pintada a mano con acrílico textil sellado; resiste lavado delicado.",
    color: "Azul con arte a mano", material: "Denim intervenido", price: 260_000,
    images: [8463179], drop: DROP_08,
  },
  {
    slug: "jean-501-tiro-alto-levis", name: "Jean 501 tiro alto", brand: "Levi's",
    category: "ropa_inferior", subcategory: "Jeans", size: "28",
    measurements: { waist: 36, hip: 48, length: 102, inseam: 76, rise: 29 }, score: 8,
    notes: "Bota con ruedo original levemente desgastado, típico del modelo.",
    color: "Azul claro", material: "100% algodón", price: 150_000, original: 349_000,
    images: [6924338], drop: DROP_08,
  },
  {
    slug: "pantalon-sastre-pierna-ancha-massimo-dutti", name: "Pantalón sastre de pierna ancha", brand: "Massimo Dutti",
    category: "ropa_inferior", subcategory: "Pantalones", size: "S",
    measurements: { waist: 35, hip: 50, length: 106, inseam: 78, rise: 31 }, score: 9,
    notes: "Usado dos veces; raya del planchado intacta.",
    color: "Beige arena", material: "Lana fría y elastano", price: 135_000, original: 359_000,
    images: [31400265], drop: DROP_08,
  },
  {
    slug: "falda-midi-lunares-vintage", name: "Falda midi de lunares", brand: "Vintage 90s (sin marca)",
    category: "ropa_inferior", subcategory: "Faldas", size: "M",
    measurements: { waist: 36, hip: 52, length: 78 }, score: 8,
    notes: "Elástico de cintura renovado; estampado sin decoloración.",
    color: "Negro con lunares blancos", material: "Viscosa", price: 95_000,
    images: [17805851, 17805914], drop: DROP_08,
  },
  {
    slug: "bolso-cuero-estructurado-velez", name: "Bolso estructurado de cuero", brand: "Vélez",
    category: "accesorios", subcategory: "Bolsos", size: "Única",
    measurements: { width: 28, height: 20, depth: 11, strap_drop: 12 }, score: 9,
    notes: "Herrajes sin rayones y forro interior limpio.",
    color: "Coñac", material: "Cuero vacuno", price: 320_000, original: 890_000,
    images: [33074923, 31529647], model: "/models/bolso-cuero.glb", drop: DROP_08, featured: true,
  },
  {
    slug: "gafas-aviador-ray-ban", name: "Gafas aviador clásicas", brand: "Ray-Ban",
    category: "accesorios", subcategory: "Gafas", size: "Única",
    measurements: { width: 14, lens_width: 5.8, temple_length: 14 }, score: 8,
    notes: "Micro rayones en el lente derecho, visibles solo a contraluz. Incluye estuche.",
    color: "Dorado con lente verde G-15", material: "Metal y cristal", price: 260_000, original: 780_000,
    images: [7819284, 27353350], model: "/models/gafas-aviador.glb", drop: DROP_08, featured: true,
  },
  {
    slug: "gafas-carey-persol", name: "Gafas de acetato carey", brand: "Persol",
    category: "accesorios", subcategory: "Gafas", size: "Única",
    measurements: { width: 14, lens_width: 5.2, temple_length: 14.5 }, score: 9,
    notes: "Bisagras firmes y acetato sin opacidades.",
    color: "Carey con lente café", material: "Acetato y cristal", price: 340_000, original: 1_100_000,
    images: [27353350, 40058458], model: "/models/gafas-carey.glb", drop: DROP_08,
  },
  {
    slug: "bolso-bandolera-mario-hernandez", name: "Bolso bandolera media luna", brand: "Mario Hernández",
    category: "accesorios", subcategory: "Bolsos", size: "Única",
    measurements: { width: 24, height: 14, depth: 6, strap_drop: 55 }, score: 7,
    notes: "Esquinas con desgaste leve; cremallera y argollas funcionan perfecto.",
    color: "Terracota", material: "Cuero", price: 280_000, original: 720_000,
    images: [28739369], model: "/models/bolso-bandolera.glb", drop: DROP_08,
  },
  {
    slug: "mochila-wayuu-artesanal", name: "Mochila wayuu tejida a mano", brand: "Artesanas Wayuu · La Guajira",
    category: "accesorios", subcategory: "Mochilas", size: "Única",
    measurements: { width: 24, height: 28, strap_drop: 60 }, score: 10,
    notes: "Nueva, con etiqueta de la comunidad artesana.",
    color: "Multicolor", material: "Hilo acrílico tejido en crochet", price: 240_000,
    images: [30114547, 33074925], model: "/models/mochila-wayuu.glb", drop: DROP_08, featured: true,
  },
  {
    slug: "sombrero-vueltiao-tuchin", name: "Sombrero vueltiao 19 vueltas", brand: "Artesanos Zenú · Tuchín",
    category: "accesorios", subcategory: "Sombreros", size: "57",
    measurements: { circumference: 57, brim: 9, height: 11 }, score: 9,
    notes: "Trenzado firme, sin fibras sueltas; conserva su forma original.",
    color: "Negro y crudo", material: "Caña flecha", price: 180_000, original: 350_000,
    images: [31547714, 13200857], model: "/models/sombrero-vueltiao.glb", drop: DROP_08, featured: true,
  },
  {
    slug: "sombrero-aguadeno-panama", name: "Sombrero aguadeño", brand: "Aguadeño · Caldas",
    category: "accesorios", subcategory: "Sombreros", size: "58",
    measurements: { circumference: 58, brim: 7, height: 12 }, score: 8,
    notes: "Cinta original con leve brillo por uso; copa sin quiebres.",
    color: "Paja natural", material: "Palma de iraca", price: 150_000, original: 320_000,
    images: [28991719, 21336434], model: "/models/sombrero-panama.glb", drop: DROP_08,
  },
  // ---------------- Drop 09 · Caribe Slow (próximo) ----------------
  {
    slug: "vestido-lino-blanco-johanna-ortiz", name: "Vestido midi de lino", brand: "Johanna Ortiz",
    category: "vestidos", subcategory: "Vestidos midi", size: "S",
    measurements: { chest: 44, waist: 34, length: 118 }, score: 9,
    notes: "Usado una vez en evento; sin manchas ni arreglos.",
    color: "Blanco hueso", material: "Lino y algodón", price: 1_250_000, original: 4_800_000,
    images: [36701541], drop: DROP_09,
  },
  {
    slug: "vestido-camisero-lino-mango", name: "Vestido camisero de lino", brand: "Mango",
    category: "vestidos", subcategory: "Vestidos camiseros", size: "M",
    measurements: { chest: 50, waist: 42, length: 110 }, score: 8,
    notes: "Lino con arrugas naturales del material; botones completos.",
    color: "Crudo", material: "100% lino", price: 130_000, original: 329_000,
    images: [7789139, 7789143], drop: DROP_09,
  },
  {
    slug: "vestido-manga-larga-silvia-tcherassi", name: "Vestido largo de manga abullonada", brand: "Silvia Tcherassi",
    category: "vestidos", subcategory: "Vestidos largos", size: "S",
    measurements: { chest: 46, waist: 36, length: 124 }, score: 8,
    notes: "Leve hilo halado en la falda, apenas perceptible.",
    color: "Marfil", material: "Algodón y seda", price: 780_000, original: 2_900_000,
    images: [7789140], drop: DROP_09,
  },
  {
    slug: "camisa-lino-oversize-other-stories", name: "Camisa de lino oversize", brand: "& Other Stories",
    category: "ropa_superior", subcategory: "Camisas", size: "M",
    measurements: { chest: 58, length: 74, shoulder: 50, sleeve: 56 }, score: 9,
    notes: "Como nueva; lavada y vaporizada.",
    color: "Blanco", material: "100% lino", price: 120_000, original: 290_000,
    images: [3021600], drop: DROP_09,
  },
  {
    slug: "falda-midi-plisada-other-stories", name: "Falda midi plisada", brand: "& Other Stories",
    category: "ropa_inferior", subcategory: "Faldas", size: "S",
    measurements: { waist: 34, hip: 50, length: 80 }, score: 7,
    notes: "Plisado firme; pequeño punto de hilo en el ruedo.",
    color: "Verde salvia", material: "Poliéster reciclado", price: 110_000, original: 280_000,
    images: [20891131], drop: DROP_09,
  },
  {
    slug: "gafas-retro-acetato-70s", name: "Gafas retro de acetato", brand: "Vintage 70s",
    category: "accesorios", subcategory: "Gafas", size: "Única",
    measurements: { width: 14, lens_width: 5.4, temple_length: 14 }, score: 8,
    notes: "Lentes sin rayones; varillas ajustadas por óptica aliada.",
    color: "Ámbar", material: "Acetato", price: 140_000,
    images: [8363074], drop: DROP_09,
  },
];

function nextLaunch(now: number) {
  const date = new Date(now + 9 * DAY);
  // 7:00 p. m. hora de Bogotá (UTC-5) = 00:00 UTC del día siguiente
  date.setUTCHours(24, 0, 0, 0);
  return date;
}

const SUBSCRIBER_SAMPLES = [
  "laura.mejia@gmail.com", "camilo.r@hotmail.com", "3133129692", "valen.ospina@gmail.com",
  "3133129693", "dani.herrera@outlook.com", "3133129694", "mafe.castro@gmail.com",
  "juanpa.lozano@gmail.com", "3133129695", "sara.vintage@gmail.com", "3133129696",
];

let seedPromise: Promise<void> | null = null;

/** Siembra idempotente: se ejecuta una sola vez por proceso y está protegida con advisory lock. */
export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function seed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(724519)`);
    const [{ value }] = await tx.select({ value: count() }).from(drops);
    if (value > 0) return;

    const now = Date.now();
    await tx.insert(drops).values([
      {
        id: DROP_07, number: 7, name: "Tierra Fría", theme: "Lanas, cueros y botas para la sabana",
        description: "Tejidos de Boyacá, abrigos de paño y botas con horma amoldada para las tardes frías de la sabana de Bogotá.",
        coverImage: px(28259752), launchDate: new Date(now - 21 * DAY), status: "ended",
      },
      {
        id: DROP_08, number: 8, name: "Herencia", theme: "Clásicos que se heredan + artesanía colombiana",
        description: "Gabardinas, denim de los 90 y accesorios hechos a mano en La Guajira, Córdoba y Caldas. Piezas que ya tienen historia y están listas para la tuya.",
        coverImage: px(19169233), launchDate: new Date(now - 6 * DAY), status: "live",
      },
      {
        id: DROP_09, number: 9, name: "Caribe Slow", theme: "Lino, vestidos y accesorios para tierra caliente",
        description: "Vestidos de diseñadoras colombianas, lino que respira y gafas para el sol de la costa. Se revela al cierre de la cuenta regresiva.",
        coverImage: px(3021600), launchDate: nextLaunch(now), status: "upcoming",
      },
    ]);

    const rows = SEED_PRODUCTS.map((p, index) => {
      const copy = generateLocalCopy({
        name: p.name, brand: p.brand, category: p.category, subcategory: p.subcategory, size: p.size,
        color: p.color, material: p.material, condition_score: p.score, condition_notes: p.notes,
        original_price: p.original, measurements: p.measurements, has3d: Boolean(p.model),
      });
      return {
        slug: p.slug, name: p.name, brand: p.brand, category: p.category, subcategory: p.subcategory,
        size: p.size, measurements: p.measurements, condition: conditionFromScore(p.score),
        conditionScore: p.score, conditionNotes: p.notes, color: p.color, material: p.material,
        price: p.price, originalPrice: p.original ?? null, images: p.images.map(px),
        model3dUrl: p.model ?? null, arSupported: Boolean(p.model), dropId: p.drop,
        status: p.status ?? ("published" as const), featured: p.featured ?? false, tags: copy.tags,
        aiGeneratedDescription: copy.description,
        createdAt: new Date(now - (SEED_PRODUCTS.length - index) * 3_600_000),
      };
    });
    const inserted = await tx.insert(products).values(rows).returning();
    const bySlug = new Map(inserted.map((p) => [p.slug, p]));

    await tx
      .insert(users)
      .values({
        email: DEMO_ADMIN.email,
        name: "Equipo Mag&co",
        passwordHash: await hashPassword(DEMO_ADMIN.password),
        role: "admin",
      })
      .onConflictDoNothing();

    const demoOrders = [
      { ref: "MAG-DEMO-0001", slug: "saco-merino-cuello-alto-cos", method: "nequi" as const, status: "delivered" as const, city: "Bogotá D.C.", department: "Bogotá D.C.", days: 19, name: "Laura Mejía" },
      { ref: "MAG-DEMO-0002", slug: "botines-cuero-engrasado-timberland", method: "pse" as const, status: "paid" as const, city: "Medellín", department: "Antioquia", days: 17, name: "Camilo Restrepo" },
      { ref: "MAG-DEMO-0003", slug: "chaqueta-jean-negra-diesel", method: "cod" as const, status: "cod_confirmed" as const, city: "Bogotá D.C.", department: "Bogotá D.C.", days: 2, name: "Valentina Ospina" },
    ];
    for (const o of demoOrders) {
      const product = bySlug.get(o.slug);
      if (!product) continue;
      const isBogota = o.city.startsWith("Bogotá");
      const shippingCost = isBogota ? 9_900 : 16_900;
      const codFee = o.method === "cod" ? 7_900 : 0;
      const created = new Date(now - o.days * DAY);
      const [order] = await tx
        .insert(orders)
        .values({
          reference: o.ref, status: o.status, paymentMethod: o.method,
          customer: { fullName: o.name, email: `${o.name.split(" ")[0].toLowerCase()}@example.com`, phone: "3133129691", documentType: "CC", documentNumber: "1020304050" },
          shipping: { city: o.city, department: o.department, address: "Calle 70 # 10-25", neighborhood: "Quinta Camacho", notes: "", zone: isBogota ? "bogota" : "nacional", eta: isBogota ? "Mismo día" : "2 a 4 días hábiles" },
          subtotal: product.price, shippingCost, codFee, total: product.price + shippingCost + codFee,
          createdAt: created, updatedAt: created,
        })
        .returning();
      await tx.insert(orderItems).values({
        orderId: order.id, productId: product.id, slug: product.slug, name: product.name,
        brand: product.brand, size: product.size, price: product.price, image: product.images[0] ?? "",
      });
    }

    await tx
      .insert(subscribers)
      .values(
        SUBSCRIBER_SAMPLES.map((contact, i) => ({
          channel: contact.includes("@") ? ("email" as const) : ("whatsapp" as const),
          contact,
          dropId: i % 4 === 0 ? "general" : DROP_09,
          source: i % 4 === 0 ? "newsletter" : "drop_countdown",
        })),
      )
      .onConflictDoNothing();
  });
}
