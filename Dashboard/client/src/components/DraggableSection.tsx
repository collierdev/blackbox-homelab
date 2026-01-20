import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface DraggableSectionProps {
  id: string;
  children: ReactNode;
}

export function DraggableSection({ id, children }: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-4 top-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Section Content */}
      <div className="group">
        {children}
      </div>
    </section>
  );
}
