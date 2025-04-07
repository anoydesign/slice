import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FrontendTimeEntry } from '../types';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: number;
  entry: FrontendTimeEntry;
  onTimeEntryChange: (id: number, field: keyof FrontendTimeEntry, value: string) => void;
  onDeleteTimeEntry: (id: number) => void;
  onUpdateTime: (id: number, startTime: string, endTime: string) => void;
  onDuplicateTimeEntry: (id: number) => void;
}

export function SortableItem({ id, entry, onTimeEntryChange, onDeleteTimeEntry, onUpdateTime, onDuplicateTimeEntry }: SortableItemProps) {
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
    const [currentStartTime, currentEndTime] = entry.time.split(' - ');
    const newStartTime = e.target.value;
    const newEndTime = getNextTimeSlot(newStartTime);
    onUpdateTime(id, newStartTime, newEndTime);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group relative transition-colors hover:bg-gray-50",
        isDragging && "bg-gray-50 opacity-50",
        "border-b last:border-b-0"
      )}
    >
      <td className="p-2 w-8">
        <div
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
          {...listeners}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="5" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
          </svg>
        </div>
      </td>
      <td className="p-2 min-w-[120px]">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={entry.time.split(' - ')[0]}
            onChange={handleTimeChange}
            className={cn(
              "w-[100px] font-mono text-sm",
              "focus-visible:ring-1 focus-visible:ring-offset-0"
            )}
          />
          <span className="text-gray-400">-</span>
          <Input
            type="text"
            value={entry.time.split(' - ')[1]}
            className={cn(
              "w-[100px] font-mono text-sm",
              "focus-visible:ring-1 focus-visible:ring-offset-0"
            )}
            readOnly
          />
        </div>
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.task}
          onChange={(e) => onTimeEntryChange(id, 'task', e.target.value)}
          className={cn(
            "w-full",
            entry.hasError && "border-red-500 bg-red-50 focus-visible:ring-red-500",
            "focus-visible:ring-1 focus-visible:ring-offset-0"
          )}
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.function}
          onChange={(e) => onTimeEntryChange(id, 'function', e.target.value)}
          className="w-full focus-visible:ring-1 focus-visible:ring-offset-0"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.mall}
          onChange={(e) => onTimeEntryChange(id, 'mall', e.target.value)}
          className="w-full focus-visible:ring-1 focus-visible:ring-offset-0"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.remark}
          onChange={(e) => onTimeEntryChange(id, 'remark', e.target.value)}
          className="w-full focus-visible:ring-1 focus-visible:ring-offset-0"
        />
      </td>
      <td className="p-2 w-24">
        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateTimeEntry(id)}
            className="h-8 w-8 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteTimeEntry(id)}
            className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </Button>
        </div>
      </td>
    </tr>
  );
} 