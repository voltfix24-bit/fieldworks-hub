import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, User, Building2 } from 'lucide-react';

const sections = [
  {
    title: 'Branding',
    description: 'Customize logo, colors, and report footer details',
    icon: Palette,
    path: '/settings/branding',
  },
  {
    title: 'User Profile',
    description: 'Manage your personal information and preferences',
    icon: User,
    path: '/settings/profile',
  },
  {
    title: 'Tenant Overview',
    description: 'View company details and subscription status',
    icon: Building2,
    path: '/settings/tenant',
  },
];

export default function SettingsIndex() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" description="Manage your account and company settings" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card
            key={section.path}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate(section.path)}
          >
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                <section.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription className="text-sm">{section.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
