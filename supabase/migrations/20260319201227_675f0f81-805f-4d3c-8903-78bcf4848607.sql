
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('tenant_admin', 'office_user', 'technician');

-- Create enum for tenant status
CREATE TYPE public.tenant_status AS ENUM ('active', 'inactive', 'suspended');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'invited');

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status public.tenant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenant_branding table
CREATE TABLE public.tenant_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1e40af',
  secondary_color TEXT NOT NULL DEFAULT '#64748b',
  accent_color TEXT NOT NULL DEFAULT '#0ea5e9',
  support_email TEXT,
  support_phone TEXT,
  website TEXT,
  footer_company_name TEXT,
  footer_address TEXT,
  footer_city TEXT,
  footer_country TEXT,
  footer_email TEXT,
  footer_phone TEXT,
  footer_website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'office_user',
  status public.user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for security definer function
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can update their tenant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'));

-- RLS Policies for tenant_branding
CREATE POLICY "Users can view their tenant branding"
  ON public.tenant_branding FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can update branding"
  ON public.tenant_branding FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'));

CREATE POLICY "Tenant admins can insert branding"
  ON public.tenant_branding FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_branding_updated_at
  BEFORE UPDATE ON public.tenant_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::UUID, (SELECT id FROM public.tenants LIMIT 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'office_user')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'office_user')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-assets', 'tenant-assets', true);

CREATE POLICY "Anyone can view tenant assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tenant-assets');

CREATE POLICY "Authenticated users can upload tenant assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tenant-assets');

CREATE POLICY "Authenticated users can update tenant assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tenant-assets');
