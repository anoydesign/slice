import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FrontendTimeEntry } from '../types';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { GripVertical, Copy, Trash2, ChevronDown, ChevronUp, Clock, Edit, X, Check, Briefcase, Target, Waypoints, Users, Tag, StickyNote } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface MobileTimeEntryCardProps {
  id: string;
  entry: FrontendTimeEntry;
  onTimeEntryChange: (id: string, field: string, value: string) => void;
  onDeleteTimeEntry: (id: string) => void;
  onUpdateTime: (id: string, startTime: string, endTime: string) => void;
  onDuplicateTimeEntry: (id: string) => void;
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

export function MobileTimeEntryCard({
  id,
  entry,
  onTimeEntryChange,
  onDeleteTimeEntry,
  onUpdateTime,
  onDuplicateTimeEntry,
  dbItems
}: MobileTimeEntryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [startTime, endTime] = entry.time.split(' - ');
  const [isEditing, setIsEditing] = useState(false);
  
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
  
  // 編集モードを切り替える
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // 概要表示用のコンポーネント
  const SummaryView = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary/70" />
          <span className="font-medium text-sm">{startTime} - {endTime}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleEditMode} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      
      <div>
        <h3 className="font-medium line-clamp-1 flex items-center gap-1.5">
          {entry.content || "内容未入力"}
        </h3>
        
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.client && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-0.5 bg-primary/5 hover:bg-primary/10 transition-colors">
              <Briefcase className="h-3 w-3 text-primary/70" />
              {entry.client}
            </Badge>
          )}
          {entry.purpose && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-0.5 bg-secondary/5 hover:bg-secondary/10 transition-colors">
              <Target className="h-3 w-3 text-secondary/70" />
              {entry.purpose}
            </Badge>
          )}
          {entry.action && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-0.5 bg-accent/5 hover:bg-accent/10 transition-colors">
              <Waypoints className="h-3 w-3 text-accent/70" />
              {entry.action}
            </Badge>
          )}
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details" className="border-0">
          <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:text-primary transition-colors">詳細を表示</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              {entry.with && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">誰と:</span> {entry.with}
                </div>
              )}
              {entry.pccc && (
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">PC/CC:</span> {entry.pccc}
                </div>
              )}
              {entry.remark && (
                <div className="flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">備考:</span> {entry.remark}
                </div>
              )}
              {!entry.with && !entry.pccc && !entry.remark && (
                <div className="text-muted-foreground text-center py-2">追加情報なし</div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  // 編集フォーム用のコンポーネント
  const EditForm = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{startTime} - {endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleEditMode} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleEditMode} className="h-8 w-8 p-0 text-green-600">
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium mb-1 block">内容</label>
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
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">クライアント</label>
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
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">目的</label>
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
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">アクション</label>
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
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">誰と</label>
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
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">PC/CC</label>
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
        </div>
        
        <div>
          <label className="text-xs font-medium mb-1 block">備考</label>
          <Popover open={openPopovers.remark} onOpenChange={(open) => togglePopover('remark', open)}>
            <PopoverTrigger asChild>
              <Textarea
                value={entry.remark}
                onChange={(e) => onTimeEntryChange(id, 'remark', e.target.value)}
                className="w-full min-h-[60px]"
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
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative w-full mb-2",
        entry.hasError && "border-destructive"
      )}
    >
      <Card className={cn(
        "w-full transition-all duration-200 hover:shadow-md",
        entry.hasError && "border-destructive bg-destructive/5"
      )}>
        <CardHeader className="p-3 pb-2 flex">
          <div className="flex-1">
            <div 
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 flex justify-center"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0">
          {isEditing ? <EditForm /> : <SummaryView />}
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-1 p-3 pt-0 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicateTimeEntry(id)}
            className="h-8 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <Copy className="h-4 w-4 mr-1" />
            <span className="text-xs">複製</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteTimeEntry(id)}
            className="h-8 text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="text-xs">削除</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 