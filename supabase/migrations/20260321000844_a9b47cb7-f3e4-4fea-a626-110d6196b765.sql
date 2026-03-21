
-- Extend tenant_branding with new branding, report, and export fields

-- Merk tab: additional logos and official name
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS official_company_name text,
  ADD COLUMN IF NOT EXISTS compact_logo_url text,
  ADD COLUMN IF NOT EXISTS dark_logo_url text,
  ADD COLUMN IF NOT EXISTS light_logo_url text;

-- App-interface tab: UI customization
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS border_radius text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS interface_density text NOT NULL DEFAULT 'standard';

-- Rapport tab: report identity
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS report_title text NOT NULL DEFAULT 'Aardingsmeting Rapport',
  ADD COLUMN IF NOT EXISTS report_subtitle text,
  ADD COLUMN IF NOT EXISTS report_header_color text,
  ADD COLUMN IF NOT EXISTS report_footer_color text,
  ADD COLUMN IF NOT EXISTS report_show_logo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_logo_size text NOT NULL DEFAULT 'medium';

-- Rapport tab: layout
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS report_density text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS report_page_numbers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_header_every_page boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_footer_every_page boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_table_style text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS report_photo_grouping text NOT NULL DEFAULT 'electrode';

-- Rapport tab: section visibility (JSONB for flexibility)
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS report_sections jsonb NOT NULL DEFAULT '{
    "projectgegevens": true,
    "opdrachtgever": true,
    "monteur": true,
    "meetapparatuur": true,
    "meetresultaten": true,
    "fotos": true,
    "schets": true,
    "notities": true,
    "ondertekening": false,
    "bijlagen": true
  }'::jsonb;

-- Rapport tab: field visibility (JSONB)
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS report_fields jsonb NOT NULL DEFAULT '{
    "projectnummer": true,
    "projectnaam": true,
    "adres": true,
    "meetdatum": true,
    "werkordernummer": false,
    "opdrachtgever_bedrijf": true,
    "opdrachtgever_contact": true,
    "opdrachtgever_email": false,
    "opdrachtgever_telefoon": false,
    "monteur_naam": true,
    "monteur_code": false,
    "apparaat_naam": true,
    "apparaat_merk": true,
    "apparaat_model": true,
    "apparaat_serienummer": true,
    "apparaat_kalibratie": true,
    "apparaat_volgende_kalibratie": true
  }'::jsonb;

-- Rapport tab: measurement table settings
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS report_pens_side_by_side boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_empty_cell text NOT NULL DEFAULT '—',
  ADD COLUMN IF NOT EXISTS report_decimals text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS report_captions boolean NOT NULL DEFAULT true;

-- Rapport tab: signing block
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS report_sign_block boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_sign_executor boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_sign_reviewer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_sign_date boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_disclaimer text;

-- Bedrijfsgegevens tab: additional fields
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS footer_postal_code text,
  ADD COLUMN IF NOT EXISTS kvk_number text,
  ADD COLUMN IF NOT EXISTS btw_number text;

-- Export tab
ALTER TABLE public.tenant_branding
  ADD COLUMN IF NOT EXISTS export_filename_pattern text NOT NULL DEFAULT 'Aardingsrapport_[projectnummer]_[datum]',
  ADD COLUMN IF NOT EXISTS export_date_format text NOT NULL DEFAULT 'dd-MM-yyyy',
  ADD COLUMN IF NOT EXISTS export_print_profile text NOT NULL DEFAULT 'a4_standard';
