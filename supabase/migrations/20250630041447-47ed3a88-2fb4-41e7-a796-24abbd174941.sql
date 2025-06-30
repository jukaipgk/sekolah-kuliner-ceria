
-- Buat tabel profil pengguna (orang tua)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Buat tabel anak
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel kategori menu
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel menu makanan
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- harga dalam rupiah
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel pesanan
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel detail pesanan
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS pada semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies untuk profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies untuk children
CREATE POLICY "Parents can view their children" ON public.children
  FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert their children" ON public.children
  FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update their children" ON public.children
  FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY "Parents can delete their children" ON public.children
  FOR DELETE USING (parent_id = auth.uid());

-- RLS policies untuk menu (semua user bisa lihat)
CREATE POLICY "Anyone can view menu categories" ON public.menu_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view menu items" ON public.menu_items
  FOR SELECT TO authenticated USING (true);

-- RLS policies untuk orders
CREATE POLICY "Parents can view their orders" ON public.orders
  FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert their orders" ON public.orders
  FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update their orders" ON public.orders
  FOR UPDATE USING (parent_id = auth.uid());

-- RLS policies untuk order_items
CREATE POLICY "Parents can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.parent_id = auth.uid()
    )
  );
CREATE POLICY "Parents can insert their order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.parent_id = auth.uid()
    )
  );

-- Buat trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Buat trigger untuk auto-create profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Pengguna Baru'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data untuk menu categories
INSERT INTO public.menu_categories (name, description) VALUES
  ('Makanan Utama', 'Nasi, lauk pauk, dan makanan pokok lainnya'),
  ('Minuman', 'Minuman segar dan sehat untuk anak-anak'),
  ('Snack', 'Camilan sehat dan bergizi'),
  ('Buah', 'Buah-buahan segar dan vitamin');

-- Insert sample data untuk menu items
INSERT INTO public.menu_items (category_id, name, description, price, is_available) VALUES
  ((SELECT id FROM public.menu_categories WHERE name = 'Makanan Utama'), 'Nasi Ayam Goreng', 'Nasi putih dengan ayam goreng, sayur, dan sambal', 15000, true),
  ((SELECT id FROM public.menu_categories WHERE name = 'Makanan Utama'), 'Nasi Rendang', 'Nasi putih dengan rendang daging sapi dan sayur', 18000, true),
  ((SELECT id FROM public.menu_categories WHERE name = 'Makanan Utama'), 'Nasi Ikan Bakar', 'Nasi putih dengan ikan bakar, sayur asem, dan sambal', 16000, true),
  ((SELECT id FROM public.menu_categories WHERE name = 'Minuman'), 'Jus Jeruk', 'Jus jeruk segar tanpa gula tambahan', 8000, true),
  ((SELECT id FROM public.menu_categories WHERE name = 'Minuman'), 'Susu UHT', 'Susu UHT rasa coklat/strawberry', 5000, true),
  ((SELECT id FROM public.menu_categories WHERE name = 'Snack'), 'Roti Bakar', 'Roti bakar dengan selai kacang atau coklat', 7000, true),
  ((SELECT id FROM public.menu_categories WHERE name = 'Buah'), 'Apel Merah', 'Buah apel merah segar', 6000, true);
