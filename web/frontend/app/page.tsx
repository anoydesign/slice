"use client"; // Make this a client component

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function Home() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [timeEntries, setTimeEntries] = React.useState([
    { id: 1, time: "09:00 - 09:30", task: "メールチェック", function: "管理", mall: "-", remark: "", selected: false },
    { id: 2, time: "09:30 - 10:00", task: "朝礼", function: "会議", mall: "-", remark: "", selected: false },
    { id: 3, time: "10:00 - 12:00", task: "機能開発A", function: "開発", mall: "共通", remark: "バグ修正含む", selected: true },
  ]);

  const [dbItems, setDbItems] = React.useState<{
    task: string[];
    function: string[];
    mall: string[];
    remark: string[];
  }>({
    task: ["メールチェック", "朝礼", "機能開発A", "定例会議"],
    function: ["管理", "会議", "開発"],
    mall: ["共通", "楽天", "Yahoo"],
    remark: ["急ぎ", "確認中"],
  });
  const [newDbItemType, setNewDbItemType] = React.useState<keyof typeof dbItems>("task");
  const [newDbItemValue, setNewDbItemValue] = React.useState("");

  const handleSelectRow = (id: number, checked: boolean) => {
    setTimeEntries(timeEntries.map(entry =>
      entry.id === id ? { ...entry, selected: checked } : entry
    ));
  };

  const handleAddDbItem = () => {
    if (!newDbItemValue.trim()) return;
    setDbItems(prev => ({
      ...prev,
      [newDbItemType]: [...prev[newDbItemType], newDbItemValue.trim()]
    }));
    setNewDbItemValue("");
    console.log(`Adding ${newDbItemValue} to ${newDbItemType}`);
  };

  const handleDeleteDbItem = (type: keyof typeof dbItems, itemToDelete: string) => {
    setDbItems(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== itemToDelete)
    }));
    console.log(`Deleting ${itemToDelete} from ${type}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タイムスライス入力ツール</h1>

      <Tabs defaultValue="time-input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="time-input">タイム入力</TabsTrigger>
          <TabsTrigger value="database">業務データベース</TabsTrigger>
        </TabsList>

        {/* Time Input Tab */}
        <TabsContent value="time-input">
          <div className="flex justify-between items-center mb-4 mt-4">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>日付を選択</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Action Buttons */}
            <div className="space-x-2">
              <Button variant="secondary">インポート</Button>
              <Button variant="secondary">昨日と同じ</Button>
              <Button variant="secondary">先週と同じ</Button>
              <Button>保存する</Button>
            </div>
          </div>

          {/* Placeholder for Presets */}
          <div className="presets mb-4">
            <h3 className="font-semibold mb-2">クイックプリセット</h3>
            <div className="preset-tags">
              {/* Add Preset Tags here later */}
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                会議 (例)
              </span>
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="mb-4 border rounded-md">
             <Table>
              <TableHeader>
                <TableRow>
                  {/* Add Checkbox column if needed for bulk actions */}
                  {/* <TableHead className="w-[50px]">選択</TableHead> */}
                  <TableHead className="w-[150px]">時間</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>機能別</TableHead>
                  <TableHead>モール別</TableHead>
                  <TableHead>備考</TableHead>
                  <TableHead className="text-right w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    {/* <TableCell>
                      <Checkbox
                        checked={entry.selected}
                        onCheckedChange={(checked) => handleSelectRow(entry.id, Boolean(checked))}
                        aria-label={`Select row ${entry.id}`}
                      />
                    </TableCell> */}
                    <TableCell className="font-medium">{entry.time}</TableCell>
                    {/* Make cells editable later */}
                    <TableCell>{entry.task}</TableCell>
                    <TableCell>{entry.function}</TableCell>
                    <TableCell>{entry.mall}</TableCell>
                    <TableCell>{entry.remark}</TableCell>
                    <TableCell className="text-right">
                      {/* Add action buttons like delete later */}
                       <Button variant="ghost" size="sm">削除</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button variant="secondary" className="mb-4">
            + 新しい時間枠を追加
          </Button>

          {/* Placeholder for Stats */}
          <div className="stats flex justify-end space-x-4 mb-4">
            <div className="stat-item">合計時間 <span className="font-semibold">0.0 時間</span></div>
            <div className="stat-item">スライス数 <span className="font-semibold">0</span></div>
          </div>

          {/* Placeholder for Footer */}
          <div className="footer flex justify-between items-center border-t pt-4">
            <Button>保存する</Button>
            <span>最終更新: まだ保存されていません</span>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database">
          <h2 className="text-xl font-bold mb-4 mt-4">業務データベース管理</h2>
          <p className="mb-4">よく使う項目を登録・削除できます。変更は自動で保存されます。</p>

           <div className="flex justify-end mb-4">
               <Button variant="secondary">スプレッドシートからインポート</Button>
           </div>

          {/* DB Add Form */}
          <div className="db-add-form flex space-x-2 mb-4 p-4 border rounded-md">
             <Select value={newDbItemType} onValueChange={(value) => setNewDbItemType(value as keyof typeof dbItems)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="種類を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">内容</SelectItem>
                  <SelectItem value="function">機能別</SelectItem>
                  <SelectItem value="mall">モール別</SelectItem>
                  <SelectItem value="remark">備考</SelectItem>
                </SelectContent>
              </Select>
              <Input
                  type="text"
                  placeholder="登録する項目名"
                  value={newDbItemValue}
                  onChange={(e) => setNewDbItemValue(e.target.value)}
                  className="flex-grow"
              />
              <Button onClick={handleAddDbItem}>追加</Button>
          </div>

          {/* DB Sections */}
          <div className="space-y-6">
              {(Object.keys(dbItems) as Array<keyof typeof dbItems>).map(type => (
                  <div key={type} className="database-section border rounded-md p-4">
                      <h3 className="font-semibold mb-2 capitalize">登録済み: {type === 'task' ? '内容' : type === 'function' ? '機能別' : type === 'mall' ? 'モール別' : '備考'}</h3>
                      <div className="database-items flex flex-wrap gap-2">
                          {dbItems[type].length > 0 ? (
                              dbItems[type].map(item => (
                                  <Badge key={item} variant="secondary" className="relative group pr-6">
                                      {item}
                                      <button
                                        onClick={() => handleDeleteDbItem(type, item)}
                                        className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label={`Delete ${item}`}
                                      >
                                          <Cross2Icon className="h-3 w-3" />
                                      </button>
                                  </Badge>
                              ))
                          ) : (
                              <p className="text-sm text-muted-foreground">登録済みの項目はありません。</p>
                          )}
                      </div>
                  </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
