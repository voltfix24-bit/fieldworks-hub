import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Paperclip, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useAttachments, useCreateAttachment, useDeleteAttachment, uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { useRef } from 'react';

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

  const sketches = attachments.filter((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');
  const otherAttachments = attachments.filter((a: any) => a.attachment_type === 'other');

  const handleUpload = async (file: File, type: string) => {
    setUploading(true);
    try {
      const url = await uploadMeasurementPhoto(file, tenantId, projectId);
      await createAttachment.mutateAsync({
        tenant_id: tenantId,
        project_id: projectId,
        measurement_session_id: sessionId || null,
        attachment_type: type,
        file_url: url,
        file_name: file.name,
        caption: caption || null,
      });
      setCaption('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Sketch & Attachments</CardTitle>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-4">
        {/* Upload area */}
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Caption (optional)</Label>
            <Input value={caption} onChange={e => setCaption(e.target.value)} className="h-8 text-sm" placeholder="Describe this attachment" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fileInputRef.current?.setAttribute('data-type', 'sketch_photo');
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="flex-1"
            >
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> {uploading ? 'Uploading…' : 'Upload Sketch'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fileInputRef.current?.setAttribute('data-type', 'other');
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="flex-1"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Other File
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const type = fileInputRef.current?.getAttribute('data-type') || 'other';
              await handleUpload(file, type);
              e.target.value = '';
            }}
          />
        </div>

        {/* Existing attachments */}
        {[...sketches, ...otherAttachments].length > 0 && (
          <div className="space-y-2">
            {[...sketches, ...otherAttachments].map((att: any) => (
              <div key={att.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-muted/20">
                {att.file_url && (
                  <img src={att.file_url} alt={att.file_name || 'Attachment'} className="w-12 h-12 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.file_name || 'Attachment'}</p>
                  {att.caption && <p className="text-xs text-muted-foreground truncate">{att.caption}</p>}
                  <span className="text-xs text-muted-foreground capitalize">{att.attachment_type.replace('_', ' ')}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteAttachment.mutate({ id: att.id, projectId })}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
