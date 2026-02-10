import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  onAdd, 
  addLabel = 'Neu',
  onRefresh,
  refreshing = false
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

