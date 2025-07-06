
-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('parent', 'admin', 'cashier');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
    ON public.user_roles
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- Add payment_method and payment_status to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_method TEXT DEFAULT 'cash',
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN midtrans_transaction_id TEXT,
ADD COLUMN midtrans_payment_url TEXT;

-- Create payments table for Midtrans transactions
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    midtrans_transaction_id TEXT NOT NULL UNIQUE,
    midtrans_order_id TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    gross_amount INTEGER NOT NULL,
    payment_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Parents can view their payments"
    ON public.payments
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = payments.order_id 
        AND orders.parent_id = auth.uid()
    ));

CREATE POLICY "Admins and cashiers can view all payments"
    ON public.payments
    FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'cashier')
    );

CREATE POLICY "System can insert payments"
    ON public.payments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update payments"
    ON public.payments
    FOR UPDATE
    USING (true);

-- Update orders policies for admin and cashier access
CREATE POLICY "Admins and cashiers can view all orders"
    ON public.orders
    FOR SELECT
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'cashier')
    );

CREATE POLICY "Admins and cashiers can update orders"
    ON public.orders
    FOR UPDATE
    USING (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'cashier')
    );

-- Update trigger for payments
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-assign parent role when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'parent');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();
