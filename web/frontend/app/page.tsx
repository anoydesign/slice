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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './components/SortableItem';

// Define types for the data fetched from the API
interface FrontendTimeEntry {
  id: number;
  time: string;
  task: string;
  function: string;
  mall: string;
  remark: string;
  selected: boolean;
  hasError: boolean;
}

interface DbItems {
  task: string[];
  function: string[];
  mall: string[];
  remark: string[];
}

interface Preset {
  id: string;
  name: string;
  time: string;
  task: string;
  function: string;
  mall: string;
  remark: string;
}

// Define the base URL for the backend API
const API_BASE_URL = "http://localhost:8080";

// デフォルトのプリセット
const DEFAULT_PRESETS: Preset[] = [
  {
    id: "meeting",
    name: "会議",
    time: "1:00",
    task: "会議",
    function: "会議",
    mall: "",
    remark: ""
  },
  {
    id: "development",
    name: "開発",
    time: "2:00",
    task: "開発",
    function: "フロントエンド",
    mall: "",
    remark: ""
  },
  {
    id: "break",
    name: "休憩",
    time: "0:30",
    task: "休憩",
    function: "休憩",
    mall: "",
    remark: ""
  }
];

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Initialize states with empty data
  const [timeEntries, setTimeEntries] = useState<FrontendTimeEntry[]>([]);
  const [dbItems, setDbItems] = useState<DbItems>({ task: [], function: [], mall: [], remark: [] });
  const [newDbItemType, setNewDbItemType] = useState<keyof DbItems>("task");
  const [newDbItemValue, setNewDbItemValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [lastUpdated, setLastUpdated] = useState<string>("まだ保存されていません");
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddDbItem = async () => {
    if (!newDbItemValue.trim()) return;
    const newItemValue = newDbItemValue.trim();
    setIsLoading(true);
    try {
      // バックエンドに保存
      const response = await fetch(`${API_BASE_URL}/api/db-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newDbItemType,
          value: newItemValue
        }),
      });

      if (!response.ok) {
        throw new Error('項目の追加に失敗しました');
      }

      // 成功したらUIを更新
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
    } catch (error) {
      console.error('項目の追加エラー:', error);
      setError(error instanceof Error ? error.message : '項目の追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDbItem = async (type: keyof DbItems, itemToDelete: string) => {
    setIsLoading(true);
    try {
      // バックエンドから削除
      const response = await fetch(`${API_BASE_URL}/api/db-items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          value: itemToDelete
        }),
      });

      if (!response.ok) {
        throw new Error('項目の削除に失敗しました');
      }

      // 成功したらUIを更新
      setDbItems(prev => ({
        ...prev,
        [type]: (prev[type] || []).filter(item => item !== itemToDelete)
      }));
    } catch (error) {
      console.error('項目の削除エラー:', error);
      setError(error instanceof Error ? error.message : '項目の削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDbItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/db-items?source=spreadsheet`);
      if (!response.ok) {
        throw new Error('スプレッドシートからのデータ取得に失敗しました');
      }

      const data = await response.json();
      setDbItems(data);
    } catch (error) {
      console.error('インポートエラー:', error);
      setError(error instanceof Error ? error.message : 'インポートに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!date) return;

    // バリデーション：内容が空の行があるかチェック
    const emptyTaskEntries = timeEntries.filter(entry => !entry.task.trim());
    if (emptyTaskEntries.length > 0) {
      // エラー状態を設定
      const emptyTaskIds = emptyTaskEntries.map(entry => entry.id);
      setTimeEntries(timeEntries.map(entry => ({
        ...entry,
        hasError: emptyTaskIds.includes(entry.id)
      })));
      setError('内容が入力されていない行があります。');
      return;
    }

    setIsLoading(true);
    setError(null);
    // エラー状態をクリア
    setTimeEntries(timeEntries.map(entry => ({
      ...entry,
      hasError: false
    })));
    try {
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${format(date, 'yyyy-MM-dd')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeEntries),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      const data = await response.json();
      setLastUpdated(`最終更新: ${data.updated_at}`);
    } catch (error) {
      console.error('保存エラー:', error);
      setError(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeEntryChange = (id: number, field: keyof FrontendTimeEntry, value: string) => {
    setTimeEntries(timeEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleDeleteTimeEntry = (id: number) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
  };

  const handleAddTimeEntry = () => {
    let newStartTime = "09:00";
    let newEndTime = "09:30";

    if (timeEntries.length > 0) {
      const lastEntry = timeEntries[timeEntries.length - 1];
      const [lastStartTime, lastEndTime] = lastEntry.time.split(' - ');
      newStartTime = lastEndTime;
      newEndTime = getNextTimeSlot(newStartTime);
    }

    const newEntry: FrontendTimeEntry = {
      id: timeEntries.length > 0 ? Math.max(...timeEntries.map(e => e.id)) + 1 : 1,
      time: `${newStartTime} - ${newEndTime}`,
      task: '',
      function: '',
      mall: '',
      remark: '',
      selected: false,
      hasError: false
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  const handleAddPreset = (preset: Preset) => {
    const newEntry: FrontendTimeEntry = {
      id: timeEntries.length > 0 ? Math.max(...timeEntries.map(e => e.id)) + 1 : 1,
      time: preset.time,
      task: preset.task,
      function: preset.function,
      mall: preset.mall,
      remark: preset.remark,
      selected: false,
      hasError: false
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  const handleImportYesterday = async () => {
    if (!date) return;
    setIsLoading(true);
    try {
      // 昨日の日付を計算
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const formattedYesterday = format(yesterday, 'yyyy-MM-dd');

      // 昨日のデータを取得
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedYesterday}`);
      if (!response.ok) {
        throw new Error('昨日のデータの取得に失敗しました');
      }

      const yesterdayEntries: FrontendTimeEntry[] = await response.json();
      if (yesterdayEntries.length === 0) {
        throw new Error('昨日のデータがありません');
      }

      // 確認ダイアログを表示
      const shouldOverwrite = window.confirm('現在のデータを昨日のデータで上書きしますか？');
      if (!shouldOverwrite) {
        setIsLoading(false);
        return;
      }

      // 新しいIDを割り当てて今日のデータとして追加
      const newEntries = yesterdayEntries.map(entry => ({
        ...entry,
        id: timeEntries.length > 0 ? Math.max(...timeEntries.map(e => e.id)) + 1 : 1,
        selected: false,
        hasError: false
      }));

      setTimeEntries(newEntries);
    } catch (error) {
      console.error('昨日のデータのインポートエラー:', error);
      setError(error instanceof Error ? error.message : '昨日のデータのインポートに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLastWeek = async () => {
    if (!date) return;
    setIsLoading(true);
    try {
      // 先週の日付を計算
      const lastWeek = new Date(date);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const formattedLastWeek = format(lastWeek, 'yyyy-MM-dd');

      // 先週のデータを取得
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedLastWeek}`);
      if (!response.ok) {
        throw new Error('先週のデータの取得に失敗しました');
      }

      const lastWeekEntries: FrontendTimeEntry[] = await response.json();
      if (lastWeekEntries.length === 0) {
        throw new Error('先週のデータがありません');
      }

      // 新しいIDを割り当てて今日のデータとして追加
      const newEntries = lastWeekEntries.map(entry => ({
        ...entry,
        id: timeEntries.length > 0 ? Math.max(...timeEntries.map(e => e.id)) + 1 : 1,
        selected: false,
        hasError: false
      }));

      setTimeEntries([...timeEntries, ...newEntries]);
    } catch (error) {
      console.error('先週のデータのインポートエラー:', error);
      setError(error instanceof Error ? error.message : '先週のデータのインポートに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromSpreadsheet = async () => {
    if (!date) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${format(date, 'yyyy-MM-dd')}`);
      if (!response.ok) {
        throw new Error('スプレッドシートからのデータ取得に失敗しました');
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error('スプレッドシートにデータがありません');
      }

      // 既存のデータを上書き
      setTimeEntries(data.map((entry: any) => ({
        ...entry,
        id: entry.id || Math.floor(Math.random() * 1000000),
        selected: false,
        hasError: false
      })));
    } catch (error) {
      console.error('インポートエラー:', error);
      setError(error instanceof Error ? error.message : 'インポートに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTimeEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // 時間を更新
        let currentTime = newItems[0].time.split(' - ')[0];
        return newItems.map((item, index) => {
          if (index === 0) return item;
          const nextTime = getNextTimeSlot(currentTime);
          const updatedItem = {
            ...item,
            time: `${currentTime} - ${nextTime}`
          };
          currentTime = nextTime;
          return updatedItem;
        });
      });
    }
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

  const handleUpdateTime = (id: number, startTime: string, endTime: string) => {
    setTimeEntries((items) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return items;
      
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        time: `${startTime} - ${endTime}`
      };
      
      // 後続の行の時間を更新
      let currentTime = endTime;
      for (let i = index + 1; i < newItems.length; i++) {
        const nextTime = getNextTimeSlot(currentTime);
        newItems[i] = {
          ...newItems[i],
          time: `${currentTime} - ${nextTime}`
        };
        currentTime = nextTime;
      }
      
      return newItems;
    });
  };

  const handleDuplicateTimeEntry = (id: number) => {
    const entryToDuplicate = timeEntries.find(entry => entry.id === id);
    if (!entryToDuplicate) return;

    const [startTime, endTime] = entryToDuplicate.time.split(' - ');
    const newStartTime = endTime;
    const newEndTime = getNextTimeSlot(newStartTime);

    const newEntry: FrontendTimeEntry = {
      id: Math.max(...timeEntries.map(e => e.id)) + 1,
      time: `${newStartTime} - ${newEndTime}`,
      task: entryToDuplicate.task,
      function: entryToDuplicate.function,
      mall: entryToDuplicate.mall,
      remark: entryToDuplicate.remark,
      selected: false,
      hasError: false
    };

    // 元のエントリの直後に新しいエントリを挿入
    const index = timeEntries.findIndex(entry => entry.id === id);
    const newEntries = [...timeEntries];
    newEntries.splice(index + 1, 0, newEntry);

    // 後続の行の時間を更新
    let currentTime = newEndTime;
    for (let i = index + 2; i < newEntries.length; i++) {
      const nextTime = getNextTimeSlot(currentTime);
      newEntries[i] = {
        ...newEntries[i],
        time: `${currentTime} - ${nextTime}`
      };
      currentTime = nextTime;
    }

    setTimeEntries(newEntries);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">タイムスライス入力ツール</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
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
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span className="text-red-600">{error}</span>
        </div>
      )}

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
              <Button 
                variant="secondary" 
                onClick={handleImportFromSpreadsheet}
                disabled={isLoading}
              >
                インポート
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleImportYesterday}
                disabled={isLoading}
              >
                昨日と同じ
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleImportLastWeek}
                disabled={isLoading}
              >
                先週と同じ
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? '保存中...' : '保存する'}
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div className="presets mb-4">
            <h3 className="font-semibold mb-2">クイックプリセット</h3>
            <div className="preset-tags flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPreset(preset)}
                  className="rounded-full"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">タイムスライス入力</h2>
            <Button
              variant="outline"
              onClick={handleAddTimeEntry}
              className="flex items-center gap-2 hover:bg-gray-50"
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
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>新しい行を追加</span>
            </Button>
          </div>

          <div className="mb-4 border rounded-md min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex justify-center items-center flex-grow"><p>読み込み中...</p></div>
            ) : error && timeEntries.length === 0 ? (
              <div className="flex justify-center items-center flex-grow"><p className="text-red-500">データの取得に失敗しました。</p></div>
            ) : !isLoading && timeEntries.length === 0 ? (
              <div className="flex justify-center items-center flex-grow"><p>この日付のデータはありません。</p></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 w-8"></th>
                          <th className="p-2 text-left">時間</th>
                          <th className="p-2 text-left">内容</th>
                          <th className="p-2 text-left">機能</th>
                          <th className="p-2 text-left">モール</th>
                          <th className="p-2 text-left">備考</th>
                          <th className="p-2 w-24 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <SortableContext
                          items={timeEntries.map((entry) => entry.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {timeEntries.map((entry) => (
                            <SortableItem
                              key={entry.id}
                              id={entry.id}
                              entry={entry}
                              onTimeEntryChange={handleTimeEntryChange}
                              onDeleteTimeEntry={handleDeleteTimeEntry}
                              onUpdateTime={handleUpdateTime}
                              onDuplicateTimeEntry={handleDuplicateTimeEntry}
                            />
                          ))}
                        </SortableContext>
                      </tbody>
                    </table>
                  </DndContext>
                </div>
                <div className="p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimeEntry}
                    disabled={isLoading}
                  >
                    新しい行を追加
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* TODO: Calculate total hours correctly */} 
          <div className="stats flex justify-end space-x-4 mb-4">
            <div className="stat-item">合計時間 <span className="font-semibold">0.0 時間</span></div>
            <div className="stat-item">スライス数 <span className="font-semibold">{isLoading ? '...' : timeEntries.length}</span></div>
          </div>

          {/* TODO: Implement save functionality and update last updated time */} 
          <div className="footer flex justify-between items-center border-t pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? '保存中...' : '保存する'}
            </Button>
            <span>{lastUpdated}</span>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database">
          <h2 className="text-xl font-bold mb-4 mt-4">業務データベース管理</h2>
          <p className="mb-4">よく使う項目を登録・削除できます。変更は自動で保存されます。</p>
          <div className="flex justify-end mb-4">
            <Button 
              variant="secondary" 
              onClick={handleImportDbItems}
              disabled={isLoading}
            >
              スプレッドシートからインポート
            </Button>
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