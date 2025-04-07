"use client"; // Make this a client component

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Cross2Icon } from "@radix-ui/react-icons";
import { format, isValid } from "date-fns"; // Import isValid for date checking
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

// Define types for the data fetched from the API
interface FrontendTimeEntry {
  id: number;
  time: string;
  task: string;
  function: string;
  mall: string;
  remark: string;
  selected: boolean;
}

interface DbItems {
  task: string[];
  function: string[];
  mall: string[];
  remark: string[];
}

// Define the base URL for the backend API
const API_BASE_URL = "http://localhost:8080";

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Initialize states with empty data
  const [timeEntries, setTimeEntries] = useState<FrontendTimeEntry[]>([]);
  const [dbItems, setDbItems] = useState<DbItems>({ task: [], function: [], mall: [], remark: [] });
  const [newDbItemType, setNewDbItemType] = useState<keyof DbItems>("task");
  const [newDbItemValue, setNewDbItemValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Function to fetch time entries for a given date
  const fetchTimeEntries = async (fetchDate: Date) => {
    if (!isValid(fetchDate)) { // Check if date is valid before fetching
        setError("無効な日付です。");
        setTimeEntries([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    const formattedDate = format(fetchDate, "yyyy-MM-dd");
    try {
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedDate}`);
      if (!response.ok) {
        // Try to get error message from backend if available
        let errorMsg = `Error fetching time entries: ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg = errorData.error;
            }
        } catch (jsonError) {
            // Ignore if response body is not JSON
        }
        throw new Error(errorMsg);
      }
      const data: FrontendTimeEntry[] = await response.json();
      setTimeEntries(data || []); // Ensure data is an array
    } catch (err: any) { // Catch block expects 'any' or 'unknown'
      console.error("Failed to fetch time entries:", err);
      setError(err.message || "タイムエントリの取得に失敗しました。");
      setTimeEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch DB items
  const fetchDbItems = async () => {
    setError(null); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/api/db-items`);
      if (!response.ok) {
        throw new Error(`Error fetching DB items: ${response.statusText}`);
      }
      const data: DbItems = await response.json();
      setDbItems(data || { task: [], function: [], mall: [], remark: [] }); // Ensure data structure
    } catch (err: any) { // Catch block expects 'any' or 'unknown'
      console.error("Failed to fetch DB items:", err);
      setError(err.message || "データベース項目の取得に失敗しました。");
      setDbItems({ task: [], function: [], mall: [], remark: [] });
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchDbItems();
    if (date && isValid(date)) {
      fetchTimeEntries(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch only

  // Fetch time entries when date changes
  useEffect(() => {
    if (date && isValid(date)) {
      fetchTimeEntries(date);
    }
  }, [date]); // Re-fetch when date changes

  const handleSelectRow = (id: number, checked: boolean) => {
    setTimeEntries(timeEntries.map(entry =>
      entry.id === id ? { ...entry, selected: checked } : entry
    ));
  };

  const handleAddDbItem = () => {
    if (!newDbItemValue.trim()) return;
    const newItemValue = newDbItemValue.trim();
    // Optimistically update UI
    setDbItems(prev => {
        const currentItems = prev[newDbItemType] || [];
        if (currentItems.includes(newItemValue)) {
            return prev;
        }
        return {
            ...prev,
            [newDbItemType]: [...currentItems, newItemValue]
        };
    });
    setNewDbItemValue("");
    console.log(`Adding ${newItemValue} to ${newDbItemType} (API call needed)`);
  };

  const handleDeleteDbItem = (type: keyof DbItems, itemToDelete: string) => {
    // Optimistically update UI
    setDbItems(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter(item => item !== itemToDelete)
    }));
    console.log(`Deleting ${itemToDelete} from ${type} (API call needed)`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タイムスライス入力ツール</h1>
      {error && <p className="text-red-500 mb-4">エラー: {error}</p>}

      <Tabs defaultValue="time-input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="time-input">タイム入力</TabsTrigger>
          <TabsTrigger value="database">業務データベース</TabsTrigger>
        </TabsList>

        {/* Time Input Tab */}
        <TabsContent value="time-input">
          <div className="flex justify-between items-center mb-4 mt-4">
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
                  {/* Ensure date is valid before formatting */} 
                  {date && isValid(date) ? format(date, "PPP") : <span>日付を選択</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate} // Let the useEffect handle fetching
                  initialFocus
                  disabled={isLoading} // Disable calendar while loading
                />
              </PopoverContent>
            </Popover>

            <div className="space-x-2">
              {/* TODO: Implement Import/Yesterday/LastWeek/Save functionality */} 
              <Button variant="secondary" disabled={isLoading}>インポート</Button>
              <Button variant="secondary" disabled={isLoading}>昨日と同じ</Button>
              <Button variant="secondary" disabled={isLoading}>先週と同じ</Button>
              <Button disabled={isLoading}>保存する</Button>
            </div>
          </div>

          {/* TODO: Implement Presets */} 
          <div className="presets mb-4">
            <h3 className="font-semibold mb-2">クイックプリセット</h3>
            <div className="preset-tags">
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                会議 (例)
              </span>
            </div>
          </div>

          <div className="mb-4 border rounded-md min-h-[200px] flex flex-col"> {/* Use flex column */}
            {isLoading ? (
              <div className="flex justify-center items-center flex-grow"><p>読み込み中...</p></div>
            ) : error && timeEntries.length === 0 ? ( // Show error only if no entries are loaded
              <div className="flex justify-center items-center flex-grow"><p className="text-red-500">データの取得に失敗しました。</p></div>
            ) : !isLoading && timeEntries.length === 0 ? (
              <div className="flex justify-center items-center flex-grow"><p>この日付のデータはありません。</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                      {/* TODO: Make cells editable */} 
                      <TableCell className="font-medium">{entry.time}</TableCell>
                      <TableCell>{entry.task}</TableCell>
                      <TableCell>{entry.function}</TableCell>
                      <TableCell>{entry.mall}</TableCell>
                      <TableCell>{entry.remark}</TableCell>
                      <TableCell className="text-right">
                        {/* TODO: Implement delete functionality */} 
                        <Button variant="ghost" size="sm" disabled={isLoading}>削除</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* TODO: Implement Add Row functionality */} 
          <Button variant="secondary" className="mb-4" disabled={isLoading}>+ 新しい時間枠を追加</Button>

          {/* TODO: Calculate total hours correctly */} 
          <div className="stats flex justify-end space-x-4 mb-4">
            <div className="stat-item">合計時間 <span className="font-semibold">0.0 時間</span></div>
            <div className="stat-item">スライス数 <span className="font-semibold">{isLoading ? '...' : timeEntries.length}</span></div>
          </div>

          {/* TODO: Implement save functionality and update last updated time */} 
          <div className="footer flex justify-between items-center border-t pt-4">
            <Button disabled={isLoading}>保存する</Button>
            <span>最終更新: まだ保存されていません</span>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database">
          <h2 className="text-xl font-bold mb-4 mt-4">業務データベース管理</h2>
          <p className="mb-4">よく使う項目を登録・削除できます。変更は自動で保存されます。</p>
          {/* TODO: Implement DB Import */} 
          <div className="flex justify-end mb-4">
              <Button variant="secondary">スプレッドシートからインポート</Button>
          </div>

          {/* DB Add Form */} 
          <div className="db-add-form flex space-x-2 mb-4 p-4 border rounded-md">
             <Select value={newDbItemType} onValueChange={(value) => setNewDbItemType(value as keyof DbItems)}>
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
              {(Object.keys(dbItems) as Array<keyof DbItems>).map(type => (
                  <div key={type} className="database-section border rounded-md p-4">
                      <h3 className="font-semibold mb-2 capitalize">登録済み: {type === 'task' ? '内容' : type === 'function' ? '機能別' : type === 'mall' ? 'モール別' : '備考'}</h3>
                      <div className="database-items flex flex-wrap gap-2">
                          {/* Check if dbItems[type] exists and is an array before mapping */}
                          {Array.isArray(dbItems[type]) && dbItems[type].length > 0 ? (
                              dbItems[type].map(item => (
                                  <Badge key={`${type}-${item}`} variant="secondary" className="relative group pr-6">
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
