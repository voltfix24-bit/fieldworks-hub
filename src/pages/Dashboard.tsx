import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban, CheckCircle2, HardHat, FileText, Clock } from 'lucide-react';

export default function Dashboard() {
  const { tenant } = useTenant();
  const { profile } = useAuth();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description={`${tenant?.company_name || 'Your company'} — Field Operations Dashboard`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Projects" value={3} icon={FolderKanban} description="2 in progress" />
        <StatCard title="Completed" value={12} icon={CheckCircle2} description="This quarter" />
        <StatCard title="Technicians" value={5} icon={HardHat} description="3 in field" />
        <StatCard title="Reports" value={28} icon={FileText} description="8 pending review" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Rijksmuseum Energy Audit', status: 'In Progress', date: 'Mar 15, 2026' },
                { name: 'Schiphol Terminal B Survey', status: 'Planned', date: 'Mar 12, 2026' },
                { name: 'Utrecht Office Complex', status: 'Completed', date: 'Mar 8, 2026' },
              ].map((project) => (
                <div key={project.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                    project.status === 'In Progress' ? 'status-in-progress' :
                    project.status === 'Completed' ? 'status-completed' : 'status-planned'
                  }`}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Energy Assessment Report #28', project: 'Rijksmuseum', date: 'Mar 14, 2026' },
                { name: 'Air Quality Report #27', project: 'Schiphol', date: 'Mar 11, 2026' },
                { name: 'Structural Survey #26', project: 'Utrecht Office', date: 'Mar 7, 2026' },
              ].map((report) => (
                <div key={report.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.project} · {report.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
