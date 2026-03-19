import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { user, profile } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile?.full_name) setFullName(profile.full_name); }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    setSaving(false);
    if (error) { toast({ title: 'Fout', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Profiel bijgewerkt' }); }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Gebruikersprofiel" description="Beheer uw persoonlijke gegevens" />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Persoonlijke Gegevens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Volledige Naam</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Uw volledige naam" />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Accountgegevens</CardTitle></CardHeader>
        <CardContent>
          <InfoRow label="E-mail" value={user?.email} />
          <InfoRow label="Rol" value={profile?.role?.replace('_', ' ')} />
          <InfoRow label="Bedrijf" value={tenant?.company_name} />
          <div className="flex flex-col sm:flex-row sm:items-center py-3">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">Status</span>
            <StatusBadge status={profile?.status || 'active'} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
