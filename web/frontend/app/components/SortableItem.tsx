import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { FrontendTimeEntry } from '../types';
import { cn } from '../lib/utils';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { useState } from 'react';

interface SortableItemProps {
  id: number;
  entry: FrontendTimeEntry;
  onTimeEntryChange: (id: number, field: string, value: string) => void;
  onDeleteTimeEntry: (id: number) => void;
  onUpdateTime: (id: number, startTime: string, endTime: string) => void;
  onDuplicateTimeEntry: (id: number) => void;
  dbItems: {
    content: string[];
    client: string[];
    purpose: string[];
    action: string[];
    with: string[];
    pccc: string[];
    remark: string[];
  };
}

export function SortableItem({
  id,
  entry,
  onTimeEntryChange,
  onDeleteTimeEntry,
  onUpdateTime,
  onDuplicateTimeEntry,
  dbItems
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
  
  // ポップオーバーの開閉状態を管理
  const [openPopovers, setOpenPopovers] = useState<{
    content: boolean;
    client: boolean;
    purpose: boolean;
    action: boolean;
    with: boolean;
    pccc: boolean;
    remark: boolean;
  }>({
    content: false,
    client: false,
    purpose: false,
    action: false,
    with: false,
    pccc: false,
    remark: false
  });

  // ポップオーバーの開閉を切り替える
  const togglePopover = (field: keyof typeof openPopovers, isOpen: boolean) => {
    setOpenPopovers({
      ...openPopovers,
      [field]: isOpen
    });
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group hover:bg-muted/50 transition-colors",
        entry.hasError && "bg-destructive/10"
      )}
    >
      <td className="p-2 w-10" {...attributes} {...listeners}>
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>
      </td>
      <td className="p-2 w-48">
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium">{startTime}</span>
          <span className="text-muted-foreground">-</span>
          <span className="font-medium">{endTime}</span>
        </div>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.content} onOpenChange={(open) => togglePopover('content', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.content}
              onChange={(e) => onTimeEntryChange(id, 'content', e.target.value)}
              className={cn(
                "w-full transition-colors",
                entry.hasError && "border-destructive focus-visible:ring-destructive"
              )}
              placeholder="内容を入力"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.content.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.content.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'content', item);
                        togglePopover('content', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.client} onOpenChange={(open) => togglePopover('client', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.client}
              onChange={(e) => onTimeEntryChange(id, 'client', e.target.value)}
              className="w-full"
              placeholder="クライアント"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.client.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.client.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'client', item);
                        togglePopover('client', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.purpose} onOpenChange={(open) => togglePopover('purpose', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.purpose}
              onChange={(e) => onTimeEntryChange(id, 'purpose', e.target.value)}
              className="w-full"
              placeholder="目的"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.purpose.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.purpose.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'purpose', item);
                        togglePopover('purpose', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.action} onOpenChange={(open) => togglePopover('action', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.action}
              onChange={(e) => onTimeEntryChange(id, 'action', e.target.value)}
              className="w-full"
              placeholder="アクション"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.action.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.action.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'action', item);
                        togglePopover('action', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.with} onOpenChange={(open) => togglePopover('with', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.with}
              onChange={(e) => onTimeEntryChange(id, 'with', e.target.value)}
              className="w-full"
              placeholder="誰と"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.with.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.with.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'with', item);
                        togglePopover('with', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.pccc} onOpenChange={(open) => togglePopover('pccc', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.pccc}
              onChange={(e) => onTimeEntryChange(id, 'pccc', e.target.value)}
              className="w-full"
              placeholder="PC/CC"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.pccc.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.pccc.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'pccc', item);
                        togglePopover('pccc', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2">
        <Popover open={openPopovers.remark} onOpenChange={(open) => togglePopover('remark', open)}>
          <PopoverTrigger asChild>
            <Input
              type="text"
              value={entry.remark}
              onChange={(e) => onTimeEntryChange(id, 'remark', e.target.value)}
              className="w-full"
              placeholder="備考"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 rounded-md border shadow-md" align="start" side="bottom" sideOffset={4} alignOffset={0}>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 bg-background px-3 py-2 text-sm font-medium border-b">
                候補
              </div>
              {dbItems.remark.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  候補がありません
                </div>
              ) : (
                <div className="py-1">
                  {dbItems.remark.map((item) => (
                    <div
                      key={item}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        onTimeEntryChange(id, 'remark', item);
                        togglePopover('remark', false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="p-2 w-24">
        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateTimeEntry(id)}
            className="h-8 w-8"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteTimeEntry(id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
} 