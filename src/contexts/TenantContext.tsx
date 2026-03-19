import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { applyTenantBranding, DEFAULT_BRANDING } from '@/lib/tenant-utils';
import type { Database } from '@/integrations/supabase/types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantBranding = Database['public']['Tables']['tenant_branding']['Row'];

interface TenantContextType {
  tenant: Tenant | null;
  branding: TenantBranding | null;
  loading: boolean;
  refetchBranding: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  branding: null,
  loading: true,
  refetchBranding: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantData = async (tenantId: string) => {
    const [tenantRes, brandingRes] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase.from('tenant_branding').select('*').eq('tenant_id', tenantId).single(),
    ]);

    if (tenantRes.data) setTenant(tenantRes.data);
    if (brandingRes.data) {
      setBranding(brandingRes.data);
      applyTenantBranding(
        brandingRes.data.primary_color,
        brandingRes.data.secondary_color,
        brandingRes.data.accent_color
      );
    } else {
      applyTenantBranding(
        DEFAULT_BRANDING.primary_color,
        DEFAULT_BRANDING.secondary_color,
        DEFAULT_BRANDING.accent_color
      );
    }
    setLoading(false);
  };

  const refetchBranding = async () => {
    if (profile?.tenant_id) {
      const { data } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single();
      if (data) {
        setBranding(data);
        applyTenantBranding(data.primary_color, data.secondary_color, data.accent_color);
      }
    }
  };

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchTenantData(profile.tenant_id);
    } else {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  return (
    <TenantContext.Provider value={{ tenant, branding, loading, refetchBranding }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
