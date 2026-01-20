import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';

interface CollapsiblePanelProps {
  id: string;
  title: string;
  icon: ReactNode;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsiblePanel({
  id,
  title,
  icon,
  badge,
  isOpen,
  onToggle,
  children,
}: CollapsiblePanelProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`group relative bg-card rounded-xl border border-border overflow-hidden ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      }`}
    >
      {/* Drag Handle - Upper Right Corner */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-3 top-3 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 rounded-lg p-1 hover:bg-secondary/50 z-10"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-foreground">{title}</h3>
          {badge && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Content */}
      {isOpen && <div className="border-t border-border">{children}</div>}
    </section>
  );
}
