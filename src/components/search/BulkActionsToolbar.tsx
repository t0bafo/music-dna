import { Check, Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsToolbarProps {
  totalResults: number;
  crateCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  totalResults,
  crateCount,
  selectedCount,
  isAllSelected,
  onSelectAll,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const handleToggleSelectAll = () => {
    if (isAllSelected || selectedCount > 0) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 flex-wrap gap-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{totalResults}</span>
        {' '}track{totalResults !== 1 ? 's' : ''} across{' '}
        <span className="font-semibold text-foreground">{crateCount}</span>
        {' '}crate{crateCount !== 1 ? 's' : ''}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleToggleSelectAll}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : selectedCount > 0 ? (
            <div className="w-4 h-4 border-2 border-primary rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-sm" />
            </div>
          ) : (
            <Square className="w-4 h-4" />
          )}
          {isAllSelected ? 'Deselect All' : selectedCount > 0 ? `${selectedCount} Selected` : 'Select All'}
        </Button>
      </div>
    </div>
  );
}
