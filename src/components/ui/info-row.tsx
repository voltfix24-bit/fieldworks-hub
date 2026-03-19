interface InfoRowProps {
  label: string;
  value: string | null | undefined;
  fallback?: string;
}

export function InfoRow({ label, value, fallback = '—' }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border last:border-0">
      <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-foreground mt-1 sm:mt-0">{value || fallback}</span>
    </div>
  );
}
