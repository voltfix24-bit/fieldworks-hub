import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';

export default function UserProfile() {
  const { user, profile } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => { if (profile?.full_name) setFullName(profile.full_name); }, [profile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    setSaving(false);
    if (error) { toast({ title: 'Fout', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Profiel bijgewerkt' }); }
  };

  if (isMobile) {
    return (
      <div className="ios-settings-page animate-fade-in">
        <div className="ios-settings-topnav">
          <button onClick={() => navigate('/meer')} className="ios-settings-nav-back">
            <ChevronLeft className="h-5 w-5" style={{ color: 'hsl(var(--tenant-primary))' }} />
            <span>Meer</span>
          </button>
          <span className="ios-settings-nav-title">Profiel</span>
          <button onClick={handleSave} disabled={saving} className="ios-settings-nav-save">
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

        <div className="ios-settings-scroll">
          <p className="ios-settings-section-label">Persoonlijke gegevens</p>
          <div className="ios-meer-card">
            <div className="ios-settings-field">
              <label className="ios-settings-field-label">Volledige naam</label>
              <input
                className="ios-settings-field-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Uw volledige naam"
              />
            </div>
          </div>

          <p className="ios-settings-section-label">Accountgegevens</p>
          <div className="ios-meer-card">
            {[
              { label: 'E-mail', value: email || user?.email || '—' },
              { label: 'Rol', value: profile?.role?.replace('_', ' ') || '—' },
              { label: 'Bedrijf', value: tenant?.company_name || '—' },
            ].map((row, i, arr) => (
              <div key={row.label}>
                <div className="ios-settings-info-row">
                  <span className="ios-settings-info-label">{row.label}</span>
                  <span className="ios-settings-info-value">{row.value}</span>
                </div>
                {i < arr.length - 1 && <div className="ios-meer-divider" />}
              </div>
            ))}
            <div className="ios-meer-divider" />
            <div className="ios-settings-info-row">
              <span className="ios-settings-info-label">Status</span>
              <span className="ios-settings-status-badge">
                <span className="ios-settings-status-dot" />
                {profile?.status === 'active' ? 'Actief' : profile?.status || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Gebruikersprofiel" description="Beheer uw persoonlijke gegevens" />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Persoonlijke gegevens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Volledige naam</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Uw volledige naam" />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Opslaan...' : 'Wijzigingen opslaan'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Accountgegevens</CardTitle></CardHeader>
        <CardContent>
          <InfoRow label="E-mail" value={email || user?.email} />
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
