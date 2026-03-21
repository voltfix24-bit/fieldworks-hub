import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useToast } from '@/hooks/use-toast';

interface RapportDownloadButtonProps {
  projectId: string;
  handtekeningB64?: string | null;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function RapportDownloadButton({
  projectId,
  disabled = false,
  variant = 'default',
  size = 'sm',
  className,
}: RapportDownloadButtonProps) {
  const { genereerViaEdge, isLoading, error } = useRapportGenerator();
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      await genereerViaEdge(projectId);
      toast({
        title: 'Rapport gedownload',
        description: 'Het PDF rapport is succesvol gegenereerd.',
      });
    } catch (err) {
      toast({
        title: 'Rapport generatie mislukt',
        description: err instanceof Error ? err.message : 'Onbekende fout',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : error ? (
        <AlertCircle className="mr-2 h-4 w-4" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Genereren...' : 'PDF Downloaden'}
    </Button>
  );
}
