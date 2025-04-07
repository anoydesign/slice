import React from 'react';
import { FrontendTimeEntry } from '../types';
import { MobileTimeEntryCard } from './MobileTimeEntryCard';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Button } from './ui/button';
import { PlusCircle, Clock, Layers, ArrowDownUp } from 'lucide-react';

interface MobileTimeEntryListProps {
  timeEntries: FrontendTimeEntry[];
  dbItems: {
    content: string[];
    client: string[];
    purpose: string[];
    action: string[];
    with: string[];
    pccc: string[];
    remark: string[];
  };
  onAddTimeEntry: () => void;
  onTimeEntryChange: (id: string, field: string, value: string) => void;
  onDeleteTimeEntry: (id: string) => void;
  onUpdateTime: (id: string, startTime: string, endTime: string) => void;
  onDuplicateTimeEntry: (id: string) => void;
  onReorderTimeEntries: (activeId: string, overId: string) => void;
}

export function MobileTimeEntryList({
  timeEntries,
  dbItems,
  onAddTimeEntry,
  onTimeEntryChange,
  onDeleteTimeEntry,
  onUpdateTime,
  onDuplicateTimeEntry,
  onReorderTimeEntries
}: MobileTimeEntryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      onReorderTimeEntries(active.id.toString(), over.id.toString());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Layers className="h-4 w-4 text-primary/70" /> 
          <span>タイムスライス</span>
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-xs font-semibold text-primary ml-1">{timeEntries.length}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
          <span>ドラッグで並べ替え</span>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onAddTimeEntry}
        className="w-full flex items-center justify-center gap-1.5 h-9 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <PlusCircle className="h-4 w-4 text-primary/70" />
        <span>新しいスライスを追加</span>
      </Button>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={timeEntries.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {timeEntries.map((entry) => (
              <MobileTimeEntryCard
                key={entry.id}
                id={entry.id}
                entry={entry}
                onTimeEntryChange={onTimeEntryChange}
                onDeleteTimeEntry={onDeleteTimeEntry}
                onUpdateTime={onUpdateTime}
                onDuplicateTimeEntry={onDuplicateTimeEntry}
                dbItems={dbItems}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {timeEntries.length === 0 && (
        <div className="text-center py-10 px-4 rounded-lg border border-dashed border-primary/20 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 text-primary/30" />
          <p className="mb-2">データがありません</p>
          <p className="text-sm">「新しいスライス」ボタンをクリックして追加してください</p>
        </div>
      )}
      
      {timeEntries.length > 0 && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTimeEntry}
            className="w-full flex items-center justify-center gap-1.5 h-9 hover:bg-primary/5 transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-primary/70" />
            <span>新しいスライスを追加</span>
          </Button>
        </div>
      )}
    </div>
  );
} 