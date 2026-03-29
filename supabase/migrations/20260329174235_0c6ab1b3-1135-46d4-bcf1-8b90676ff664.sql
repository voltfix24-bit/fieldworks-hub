UPDATE tenant_branding 
SET 
  footer_company_name = 'Aardpen-slaan.nl',
  footer_address = 'Anthony Fokkerweg 66',
  footer_postal_code = NULL,
  footer_city = 'Rotterdam',
  footer_email = 'info@aardpen-slaan.nl',
  footer_phone = '+31 10 229 8473',
  footer_website = 'aardpen-slaan.nl',
  official_company_name = 'Aardpen-slaan.nl',
  primary_color = '#A43700',
  updated_at = now()
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';