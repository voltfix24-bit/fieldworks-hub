import { useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowLeft, HardHat, UserCog } from 'lucide-react';

type QuickLoginOption = {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  email: string;
  password: string;
};

const quickLoginOptions = [
  import.meta.env.VITE_DEV_ADMIN_EMAIL && import.meta.env.VITE_DEV_ADMIN_PASSWORD
    ? {
        label: 'Admin',
        description: 'Beheerder',
        icon: UserCog,
        email: String(import.meta.env.VITE_DEV_ADMIN_EMAIL),
        password: String(import.meta.env.VITE_DEV_ADMIN_PASSWORD),
      }
    : null,
  import.meta.env.VITE_DEV_MONTEUR_EMAIL && import.meta.env.VITE_DEV_MONTEUR_PASSWORD
    ? {
        label: 'Monteur',
        description: 'Veldwerk',
        icon: HardHat,
        email: String(import.meta.env.VITE_DEV_MONTEUR_EMAIL),
        password: String(import.meta.env.VITE_DEV_MONTEUR_PASSWORD),
      }
    : null,
].filter(Boolean) as QuickLoginOption[];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { toast({ title: 'Registratie mislukt', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Account aangemaakt', description: 'U kunt nu inloggen.' }); setIsSignUp(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast({ title: 'Inloggen mislukt', description: error.message, variant: 'destructive' }); }
    else { navigate('/dashboard'); }
  };

  const handleQuickLogin = async (option: QuickLoginOption) => {
    setLoading(true);
    setEmail(option.email);
    setPassword(option.password);
    const { error } = await supabase.auth.signInWithPassword({ email: option.email, password: option.password });
    setLoading(false);
    if (error) { toast({ title: `${option.label} login mislukt`, description: error.message, variant: 'destructive' }); }
    else { navigate('/dashboard'); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: 'Voer uw e-mail in', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) { toast({ title: 'Fout', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Controleer uw e-mail', description: 'Er is een wachtwoord-resetlink verzonden.' }); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center"><Building2 className="h-6 w-6 text-primary-foreground" /></div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {showForgot ? 'Wachtwoord Herstellen' : isSignUp ? 'Account Aanmaken' : 'Inloggen'}
            </CardTitle>
            <CardDescription>
              {showForgot ? 'Voer uw e-mail in om een resetlink te ontvangen' : isSignUp ? 'Maak een account aan om te beginnen' : 'Voer uw gegevens in om toegang te krijgen'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgot ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="reset-email">E-mail</Label><Input id="reset-email" type="email" placeholder="u@bedrijf.nl" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verzenden...' : 'Resetlink Versturen'}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgot(false)}><ArrowLeft className="mr-2 h-4 w-4" /> Terug naar inloggen</Button>
              </form>
            ) : isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="signup-name">Volledige Naam</Label><Input id="signup-name" placeholder="Uw volledige naam" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="signup-email">E-mail</Label><Input id="signup-email" type="email" placeholder="u@bedrijf.nl" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="signup-password">Wachtwoord</Label><Input id="signup-password" type="password" placeholder="Min. 6 tekens" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Account aanmaken...' : 'Account Aanmaken'}</Button>
                <p className="text-xs text-center text-muted-foreground">Heeft u al een account? <button type="button" className="text-primary hover:underline" onClick={() => setIsSignUp(false)}>Inloggen</button></p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {quickLoginOptions.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Snel testen</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickLoginOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <Button
                            key={option.label}
                            type="button"
                            variant="secondary"
                            className="h-auto flex-col gap-1 py-3"
                            disabled={loading}
                            onClick={() => handleQuickLogin(option)}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">{option.description}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" placeholder="u@bedrijf.nl" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label htmlFor="password">Wachtwoord</Label><button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowForgot(true)}>Wachtwoord vergeten?</button></div>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Inloggen...' : 'Inloggen'}</Button>
                <p className="text-xs text-center text-muted-foreground">Nog geen account? <button type="button" className="text-primary hover:underline" onClick={() => setIsSignUp(true)}>Maak er een aan</button></p>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-6">Veldmeting & Rapportage Platform</p>
      </div>
    </div>
  );
}
