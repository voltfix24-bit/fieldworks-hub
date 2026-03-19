import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) setReady(true);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast({ title: 'Fout', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Wachtwoord bijgewerkt', description: 'U kunt nu inloggen met uw nieuwe wachtwoord.' }); navigate('/login'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center"><Building2 className="h-6 w-6 text-primary-foreground" /></div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Nieuw Wachtwoord Instellen</CardTitle>
            <CardDescription>Voer hieronder uw nieuwe wachtwoord in</CardDescription>
          </CardHeader>
          <CardContent>
            {ready ? (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="new-password">Nieuw Wachtwoord</Label><Input id="new-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Bijwerken...' : 'Wachtwoord Bijwerken'}</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Ongeldige of verlopen resetlink. Vraag een nieuwe aan.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
