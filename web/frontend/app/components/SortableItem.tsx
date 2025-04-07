import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FrontendTimeEntry } from '../types';

interface SortableItemProps {
  id: number;
  entry: FrontendTimeEntry;
  onTimeEntryChange: (id: number, field: keyof FrontendTimeEntry, value: string) => void;
  onDeleteTimeEntry: (id: number) => void;
  onUpdateTime: (id: number, startTime: string, endTime: string) => void;
}

export function SortableItem({ id, entry, onTimeEntryChange, onDeleteTimeEntry, onUpdateTime }: SortableItemProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const getNextTimeSlot = (timeStr: string): string => {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
      return "00:00";
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    let nextMinutes = minutes + 30;
    let nextHours = hours;
    
    if (nextMinutes >= 60) {
      nextMinutes -= 60;
      nextHours += 1;
    }
    
    if (nextHours >= 24) {
      nextHours -= 24;
    }
    
    return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = e.target.value;
    const endTime = getNextTimeSlot(startTime);
    onUpdateTime(id, startTime, endTime);
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td className="font-medium">
        <div className="flex items-center">
          <div
            className="cursor-grab mr-2 text-gray-400 hover:text-gray-600"
            {...listeners}
          >
            ⋮⋮
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={entry.time.split(' - ')[0]}
              onChange={handleTimeChange}
              className="w-[100px]"
            />
            <span>-</span>
            <Input
              value={entry.time.split(' - ')[1]}
              className="w-[100px]"
              readOnly
            />
          </div>
        </div>
      </td>
      <td>
        <Input
          value={entry.task}
          onChange={(e) => onTimeEntryChange(id, 'task', e.target.value)}
        />
      </td>
      <td>
        <Input
          value={entry.function}
          onChange={(e) => onTimeEntryChange(id, 'function', e.target.value)}
        />
      </td>
      <td>
        <Input
          value={entry.mall}
          onChange={(e) => onTimeEntryChange(id, 'mall', e.target.value)}
        />
      </td>
      <td>
        <Input
          value={entry.remark}
          onChange={(e) => onTimeEntryChange(id, 'remark', e.target.value)}
        />
      </td>
      <td className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteTimeEntry(id)}
        >
          削除
        </Button>
      </td>
    </tr>
  );
} 