import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Paperclip, Trash2, Camera, ImageIcon, FileUp, ChevronDown, Loader2 } from 'lucide-react';
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const schetsRef = useRef<HTMLInputElement>(null);
  const bestandRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const allAttachments = attachments.filter((a: any) =>
    a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file' || a.attachment_type === 'other'
  );

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file, type);
    e.target.value = '';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={cn(
          'w-full flex items-center justify-between px-4 py-3.5 rounded-xl',
          'border border-border/60 bg-card',
          'text-[13px] font-medium text-foreground',
          'hover:bg-muted/20 transition-colors duration-150'
        )}>
          <div className="flex items-center gap-2.5">
            <Paperclip className="h-4 w-4 text-muted-foreground/50" />
            <span>Schets & Bijlagen</span>
            <span className="text-[11px] text-muted-foreground/50 font-normal">(optioneel)</span>
            {allAttachments.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/8 text-primary font-semibold">{allAttachments.length}</span>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground/40 transition-transform duration-200', isOpen && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-xl border border-border/60 bg-card p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] text-muted-foreground font-medium">Bijschrift (optioneel)</Label>
              <Input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="h-10 text-[13px] mt-1"
                placeholder="Omschrijf deze bijlage…"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] text-[hsl(var(--tenant-primary,var(--primary)))] text-[12px] font-medium active:scale-[0.97] transition-all disabled:opacity-40"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                Camera
              </button>
              <button
                onClick={() => schetsRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/20 text-muted-foreground/60 text-[12px] font-medium active:scale-[0.97] transition-all disabled:opacity-40"
              >
                <ImageIcon className="h-5 w-5" />
                Galerij
              </button>
              <button
                onClick={() => bestandRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/20 text-muted-foreground/60 text-[12px] font-medium active:scale-[0.97] transition-all disabled:opacity-40"
              >
                <FileUp className="h-5 w-5" />
                Bestand
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 'sketch_photo')} className="hidden" />
            <input ref={schetsRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'sketch_photo')} className="hidden" />
            <input ref={bestandRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.doc,.docx,.xls,.xlsx" onChange={(e) => handleFileChange(e, 'other')} className="hidden" />
          </div>

          {allAttachments.length > 0 && (
            <div className="space-y-2">
              {allAttachments.map((att: any) => (
                <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                  {att.file_url && (
                    <img src={att.file_url} alt={att.file_name || 'Bijlage'} className="w-12 h-12 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{att.file_name || 'Bijlage'}</p>
                    {att.caption && <p className="text-[11px] text-muted-foreground truncate">{att.caption}</p>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteAttachment.mutate({ id: att.id, projectId })}
                    className="h-9 w-9 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/8 shrink-0"
                  >
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
