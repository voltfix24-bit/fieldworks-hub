import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, User, Building2 } from 'lucide-react';

const sections = [
  { title: 'Huisstijl', description: 'Pas logo, kleuren en rapportvoettekst aan', icon: Palette, path: '/settings/branding' },
  { title: 'Gebruikersprofiel', description: 'Beheer uw persoonlijke gegevens', icon: User, path: '/settings/profile' },
  { title: 'Bedrijfsoverzicht', description: 'Bekijk bedrijfsgegevens en status', icon: Building2, path: '/settings/tenant' },
];

export default function SettingsIndex() {
  const navigate = useNavigate();
  return (
    <div className="animate-fade-in">
      <PageHeader title="Instellingen" description="Beheer uw account- en bedrijfsinstellingen" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card key={section.path} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(section.path)}>
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-2"><section.icon className="h-5 w-5 text-muted-foreground" /></div>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription className="text-sm">{section.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
