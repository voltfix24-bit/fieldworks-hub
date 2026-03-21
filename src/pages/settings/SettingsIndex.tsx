import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useIsMobile } from '@/hooks/use-mobile';
import { Palette, User, Building2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  { title: 'Huisstijl', description: 'Logo, kleuren en rapport-opmaak', icon: Palette, path: '/settings/branding', color: 'var(--tenant-primary,var(--primary))' },
  { title: 'Gebruikersprofiel', description: 'Persoonlijke gegevens beheren', icon: User, path: '/settings/profile', color: 'var(--tenant-accent,var(--accent))' },
  { title: 'Bedrijfsoverzicht', description: 'Bedrijfsgegevens en status', icon: Building2, path: '/settings/tenant', color: 'var(--tenant-secondary,var(--secondary))' },
];

export default function SettingsIndex() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Instellingen" description="Account en bedrijfsinstellingen" />
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
          {sections.map(s => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/15 transition-colors text-left active:bg-muted/25"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `hsl(${s.color} / 0.08)` }}
              >
                <s.icon className="h-[18px] w-[18px]" style={{ color: `hsl(${s.color} / 0.6)` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">{s.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/25 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Instellingen" description="Beheer uw account- en bedrijfsinstellingen" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className="text-left rounded-xl border border-border/40 bg-card hover:border-[hsl(var(--tenant-primary,var(--primary))/0.2)] hover:shadow-sm transition-all p-5 group"
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `hsl(${s.color} / 0.08)` }}
            >
              <s.icon className="h-5 w-5" style={{ color: `hsl(${s.color} / 0.6)` }} />
            </div>
            <p className="text-[14px] font-semibold text-foreground">{s.title}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
