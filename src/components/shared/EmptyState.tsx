import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  message: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function EmptyState({ message, onAdd, addLabel = 'Erstellen' }: EmptyStateProps) {
  return (
    <div className="text-center py-12 border rounded-lg bg-muted/30">
      <p className="text-muted-foreground mb-4">{message}</p>
      {onAdd && (
        <Button variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> {addLabel}
        </Button>
      )}
    </div>
  );
}

