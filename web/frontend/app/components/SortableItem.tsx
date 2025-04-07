import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FrontendTimeEntry } from '../types';
import { cn } from '@/lib/utils';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.content.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'content', item);
                        togglePopover('content', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.client.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'client', item);
                        togglePopover('client', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.purpose.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'purpose', item);
                        togglePopover('purpose', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.action.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'action', item);
                        togglePopover('action', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.with.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'with', item);
                        togglePopover('with', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.pccc.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'pccc', item);
                        togglePopover('pccc', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} alignOffset={0} avoidCollisions>
            <Command>
              <CommandInput placeholder="検索..." />
              <CommandList>
                <CommandEmpty>候補がありません</CommandEmpty>
                <CommandGroup>
                  {dbItems.remark.map((item) => (
                    <CommandItem 
                      key={item}
                      onSelect={() => {
                        onTimeEntryChange(id, 'remark', item);
                        togglePopover('remark', false);
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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