import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useGeneratedReports, downloadReport } from '@/hooks/use-generated-reports';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate } from '@/lib/nl-date';
import { Loader } from '@/components/ui/loader';
import { FileText, Download, ChevronRight, Loader2, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { data: reports = [], isLoading } = useGeneratedReports();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (fileUrl: string, id: string) => {
    setDownloading(id);
    try {
      await downloadReport(fileUrl);
    } catch (err) {
      toast({ title: 'Download mislukt', description: err instanceof Error ? err.message : 'Probeer opnieuw', variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  if (isMobile) {
    return (
      <div className="ios-dash animate-fade-in">
        <div className="ios-dash-greeting">
          <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">Rapporten</h1>
          <p className="ios-dash-greeting-sub">Gegenereerde meetrapporten</p>
        </div>

        {isLoading ? (
          <Loader />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nog geen rapporten"
            description="Genereer je eerste rapport via een project om het hier te zien."
            action={
              <Button variant="outline" onClick={() => navigate('/projects')} className="rounded-xl">
                <FolderKanban className="mr-2 h-4 w-4" /> Naar projecten
              </Button>
            }
          />
        ) : (
          <div className="ios-dash-card mx-4">
            {reports.map((r: any, i: number) => (
              <div key={r.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-[hsl(var(--tenant-primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {r.projects?.project_name || 'Onbekend project'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground/40 font-mono">{r.projects?.project_number}</span>
                      <span className="text-[11px] text-muted-foreground/30">·</span>
                      <span className="text-[11px] text-muted-foreground/40">{formatNlDate(r.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(r.file_url, r.id)}
                    disabled={downloading === r.id}
                    className="w-9 h-9 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center text-[hsl(var(--tenant-primary))]"
                  >
                    {downloading === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </button>
                </div>
                {i < reports.length - 1 && <div className="ios-dash-row-divider" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rapporten"
        description="Bekijk en download gegenereerde meetrapporten"
      />

      {isLoading ? (
        <Loader />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nog geen rapporten"
          description="Rapporten verschijnen hier zodra ze gegenereerd zijn vanuit een project."
          action={
            <Button variant="outline" onClick={() => navigate('/projects')} className="rounded-xl">
              <FolderKanban className="mr-2 h-4 w-4" /> Naar projecten
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl bg-card overflow-hidden divide-y divide-border/20">
          {reports.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.015]"
            >
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-[hsl(var(--tenant-primary))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground truncate">
                  {r.projects?.project_name || 'Onbekend project'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground/40 font-mono">
                    {r.projects?.project_number}
                  </span>
                  <span className="text-[11px] text-muted-foreground/30">·</span>
                  <span className="text-[11px] text-muted-foreground/40">
                    {formatNlDate(r.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(r.file_url, r.id)}
                  disabled={downloading === r.id}
                  className="w-9 h-9 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center text-[hsl(var(--tenant-primary))] hover:bg-[hsl(var(--tenant-primary)/0.15)] transition-colors"
                >
                  {downloading === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => navigate(`/projects/${r.project_id}`)}
                  className="text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
