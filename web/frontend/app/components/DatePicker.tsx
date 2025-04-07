import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ja } from 'date-fns/locale';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '../lib/utils';

interface DatePickerProps {
  selected: Date | undefined;
  onChange: (date: Date) => void;
  dateFormat?: string;
  className?: string;
}

export function DatePicker({ selected, onChange, dateFormat = "yyyy-MM-dd", className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full md:w-[280px] justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "yyyy年MM月dd日 EEEE", { locale: ja }) : <span>日付を選択</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <ReactDatePicker
          selected={selected}
          onChange={onChange}
          inline
          locale={ja}
          dateFormat={dateFormat}
        />
      </PopoverContent>
    </Popover>
  );
} 