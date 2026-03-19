import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Paperclip, Trash2, Upload, ImageIcon, ChevronDown } from 'lucide-react';
import { useAttachments, useCreateAttachment, useDeleteAttachment, uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { cn } from '@/lib/utils';

interface SketchAttachmentsSectionProps {
  projectId: string;
  tenantId: string;
  sessionId?: string;
}

export function SketchAttachmentsSection({ projectId, tenantId, sessionId }: SketchAttachmentsSectionProps) {
  const { data: attachments = [] } = useAttachments(projectId);
  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allAttachments = attachments.filter((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file' || a.attachment_type === 'other');

  const handleUpload = async (file: File, type: string) => {
    setUploading(true);
    try {
      const url = await uploadMeasurementPhoto(file, tenantId, projectId);
      await createAttachment.mutateAsync({
        tenant_id: tenantId, project_id: projectId, measurement_session_id: sessionId || null,
        attachment_type: type, file_url: url, file_name: file.name, caption: caption || null,
      });
      setCaption('');
    } finally { setUploading(false); }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card',
          'text-sm font-medium text-foreground hover:bg-muted/30 transition-colors'
        )}>
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span>Schets & Bijlagen</span>
            <span className="text-xs text-muted-foreground font-normal">(optioneel)</span>
            {allAttachments.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{allAttachments.length}</span>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <div><Label className="text-xs">Bijschrift (optioneel)</Label><Input value={caption} onChange={e => setCaption(e.target.value)} className="h-8 text-sm" placeholder="Omschrijf deze bijlage" /></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { fileInputRef.current?.setAttribute('data-type', 'sketch_photo'); fileInputRef.current?.click(); }} disabled={uploading} className="flex-1 h-9">
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> {uploading ? 'Uploaden…' : 'Schets uploaden'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { fileInputRef.current?.setAttribute('data-type', 'other'); fileInputRef.current?.click(); }} disabled={uploading} className="flex-1 h-9">
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Ander bestand
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const type = fileInputRef.current?.getAttribute('data-type') || 'other'; await handleUpload(file, type); e.target.value = ''; }} />
          </div>

          {allAttachments.length > 0 && (
            <div className="space-y-2">
              {allAttachments.map((att: any) => (
                <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/10">
                  {att.file_url && <img src={att.file_url} alt={att.file_name || 'Bijlage'} className="w-12 h-12 object-cover rounded-md" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{att.file_name || 'Bijlage'}</p>
                    {att.caption && <p className="text-xs text-muted-foreground truncate">{att.caption}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteAttachment.mutate({ id: att.id, projectId })} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
