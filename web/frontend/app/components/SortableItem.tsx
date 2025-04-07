import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FrontendTimeEntry } from '../types';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: number;
  entry: FrontendTimeEntry;
  onTimeEntryChange: (id: number, field: string, value: string) => void;
  onDeleteTimeEntry: (id: number) => void;
  onUpdateTime: (id: number, startTime: string, endTime: string) => void;
  onDuplicateTimeEntry: (id: number) => void;
}

export function SortableItem({
  id,
  entry,
  onTimeEntryChange,
  onDeleteTimeEntry,
  onUpdateTime,
  onDuplicateTimeEntry
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [startTime, endTime] = entry.time.split(' - ');

  return (
    <tr ref={setNodeRef} style={style} className={entry.hasError ? 'bg-red-50' : ''}>
      <td className="p-2" {...attributes} {...listeners}>
        <div className="cursor-grab active:cursor-grabbing">
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
            className="text-gray-400"
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
      <td className="p-2">
        <div className="flex items-center space-x-2">
          <span className="w-24">{startTime}</span>
          <span>-</span>
          <span className="w-24">{endTime}</span>
        </div>
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.content}
          onChange={(e) => onTimeEntryChange(id, 'content', e.target.value)}
          className={cn("w-full", entry.hasError ? "bg-red-50" : "")}
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.client}
          onChange={(e) => onTimeEntryChange(id, 'client', e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.purpose}
          onChange={(e) => onTimeEntryChange(id, 'purpose', e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.action}
          onChange={(e) => onTimeEntryChange(id, 'action', e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.with}
          onChange={(e) => onTimeEntryChange(id, 'with', e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.pccc}
          onChange={(e) => onTimeEntryChange(id, 'pccc', e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          type="text"
          value={entry.remark}
          onChange={(e) => onTimeEntryChange(id, 'remark', e.target.value)}
          className="w-full"
        />
      </td>
      <td className="p-2 text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateTimeEntry(id)}
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
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteTimeEntry(id)}
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