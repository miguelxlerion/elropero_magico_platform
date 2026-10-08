-- El Ropero Mag&co — Prompt 2: esquema Supabase (PostgreSQL + RLS)
-- Fusión: tablas products, drops, orders, order_items, drop_subscribers, ai_processing_logs

CREATE TABLE IF NOT EXISTS drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme TEXT,
  launch_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL CHECK (category IN ('ropa_superior', 'ropa_inferior', 'vestidos', 'calzado', 'accesorios')),
  subcategory TEXT,
  size TEXT,
  measurements JSONB,
  condition TEXT NOT NULL CHECK (condition IN ('nuevo_con_etiqueta', 'como_nuevo', 'muy_bueno', 'bueno', 'aceptable')),
  condition_score INT CHECK (condition_score BETWEEN 1 AND 10),
  condition_notes TEXT,
  price_cents INT NOT NULL,
  original_price_cents INT,
  images TEXT[] NOT NULL,
  model_3d_url TEXT,
  ar_supported BOOLEAN DEFAULT FALSE,
  drop_id UUID REFERENCES drops(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'reserved', 'sold')),
  tags TEXT[],
  ai_generated_description TEXT,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal_cents INT NOT NULL,
  shipping_cents INT NOT NULL,
  total_cents INT NOT NULL,
  payment_method TEXT NOT NULL,
  wompi_transaction_id TEXT,
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  price_cents INT NOT NULL,
  quantity INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS drop_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  channel TEXT CHECK (channel IN ('email', 'whatsapp')),
  drop_id UUID REFERENCES drops(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, drop_id)
);

CREATE TABLE IF NOT EXISTS ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  vision_model TEXT,
  vision_tokens INT,
  llm_model TEXT,
  llm_tokens_in INT,
  llm_tokens_out INT,
  processing_time_ms INT,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_drop ON products(drop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Productos publicados son públicos" ON products;
CREATE POLICY "Productos publicados son públicos" ON products
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Solo admins pueden modificar productos" ON products;
CREATE POLICY "Solo admins pueden modificar productos" ON products
  FOR ALL USING (auth.jwt()->>'role' = 'admin');
