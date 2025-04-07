"use client"; // Make this a client component

import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Calendar as CalendarComponent } from "./components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { CalendarIcon, Cross2Icon } from "@radix-ui/react-icons";
import { format, isValid } from "date-fns"; // Import isValid for date checking
import { ja } from "date-fns/locale";
import { cn } from "./lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './components/SortableItem';
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FrontendTimeEntry, DbItems, Preset } from './types';

// Define the base URL for the backend API
const API_BASE_URL = "http://localhost:8080";

// デフォルトのプリセット
const DEFAULT_PRESETS: Preset[] = [
  {
    id: "meeting",
    name: "会議",
    time: "1:00",
    content: "会議",
    client: "チーム",
    purpose: "進捗確認",
    action: "会議実施",
    with: "チームメンバー",
    pccc: "P",
    remark: ""
  },
  {
    id: "development",
    name: "開発",
    time: "2:00",
    content: "開発",
    client: "プロジェクト",
    purpose: "機能実装",
    action: "コーディング",
    with: "個人",
    pccc: "P",
    remark: ""
  },
  {
    id: "break",
    name: "休憩",
    time: "0:30",
    content: "休憩",
    client: "個人",
    purpose: "リフレッシュ",
    action: "休憩",
    with: "個人",
    pccc: "P",
    remark: ""
  }
];

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Initialize states with empty data
  const [timeEntries, setTimeEntries] = useState<FrontendTimeEntry[]>([]);
  const [dbItems, setDbItems] = useState<DbItems>({ content: [], client: [], purpose: [], action: [], with: [], pccc: [], remark: [] });
  const [newDbItemType, setNewDbItemType] = useState<keyof DbItems>("content");
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
  const fetchTimeEntries = async (date: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${date}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }
      const data = await response.json();
      
      // データを新しい形式に変換
      const transformedData = data.map((item: any) => ({
        id: item.id || 0,
        time: item.time || '',
        content: item.content || '',
        client: item.client || '',
        purpose: item.purpose || '',
        action: item.action || '',
        with: item.with || '',
        pccc: item.pccc || '',
        remark: item.remark || '',
        selected: false,
        hasError: false,
      }));
      
      setTimeEntries(transformedData);
    } catch (err: any) {
      console.error('Failed to fetch time entries:', err);
      setError(err.message || 'データの取得に失敗しました');
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
      
      // APIレスポンスを取得
      const data = await response.json();
      
      // 新しい形式のDbItems構造を作成
      const convertedData: DbItems = {
        content: [],
        client: [],
        purpose: [],
        action: [],
        with: [],
        pccc: [],
        remark: []
      };
      
      // 古い形式のレスポンスを検出（例: task, function, mall キーがある場合）
      if (data.task !== undefined) {
        // 古い形式から新しい形式に変換
        convertedData.content = data.task || [];
        convertedData.action = data.function || [];
        convertedData.with = data.mall || [];
        convertedData.pccc = data.costtype || [];
        convertedData.remark = data.remark || [];
      } else {
        // すでに新しい形式の場合はそのまま使用
        convertedData.content = data.content || [];
        convertedData.client = data.client || [];
        convertedData.purpose = data.purpose || [];
        convertedData.action = data.action || [];
        convertedData.with = data.with || [];
        convertedData.pccc = data.pccc || [];
        convertedData.remark = data.remark || [];
      }
      
      // ダミーデータとして基本的な項目を追加しておく（DB項目がない場合）
      if (convertedData.content.length === 0) {
        convertedData.content = ["会議", "資料作成", "メール対応"];
      }
      if (convertedData.client.length === 0) {
        convertedData.client = ["A社", "B社", "社内"];
      }
      if (convertedData.purpose.length === 0) {
        convertedData.purpose = ["営業活動", "情報共有", "フォローアップ"];
      }
      if (convertedData.action.length === 0) {
        convertedData.action = ["会議実施", "資料作成", "連絡"];
      }
      if (convertedData.with.length === 0) {
        convertedData.with = ["チーム", "個人", "顧客"];
      }
      if (convertedData.pccc.length === 0) {
        convertedData.pccc = ["P", "C", "CC"];
      }
      
      setDbItems(convertedData);
    } catch (err: any) { // Catch block expects 'any' or 'unknown'
      console.error("Failed to fetch DB items:", err);
      setError(err.message || "データベース項目の取得に失敗しました。");
      // 初期値を設定
      setDbItems({ 
        content: ["会議", "資料作成", "メール対応"],
        client: ["A社", "B社", "社内"],
        purpose: ["営業活動", "情報共有", "フォローアップ"],
        action: ["会議実施", "資料作成", "連絡"],
        with: ["チーム", "個人", "顧客"],
        pccc: ["P", "C", "CC"],
        remark: []
      });
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // まず既存のデータを取得 (これは通常 /api/db-items が返す map[string][]string)
        const existingResponse = await fetch(`${API_BASE_URL}/api/db-items`);
        if (!existingResponse.ok) {
          console.error(`Error fetching existing DB items: ${existingResponse.statusText}`);
          // エラーが発生しても処理を続行する（空のデータで初期化）
          // throw new Error(`Error fetching existing DB items: ${existingResponse.statusText}`);
        }
        const existingData: DbItems = await existingResponse.json().catch(() => ({ // JSONパース失敗も考慮
            content: [], client: [], purpose: [], action: [], with: [], pccc: [], remark: []
        }));


        // スプレッドシートからデータを取得 (これも map[string][]string で返ってくるはず)
        const spreadsheetResponse = await fetch(`${API_BASE_URL}/api/db-items?source=spreadsheet`);
        if (!spreadsheetResponse.ok) {
           console.error(`Error importing DB items: ${spreadsheetResponse.statusText}`);
           // エラーが発生しても処理を続行する
          // throw new Error(`Error importing DB items: ${spreadsheetResponse.statusText}`);
        }
        const spreadsheetData: DbItems = await spreadsheetResponse.json().catch(() => ({ // JSONパース失敗も考慮
            content: [], client: [], purpose: [], action: [], with: [], pccc: [], remark: []
        }));


        // データをDbItems型にマージ
        const mergedData: DbItems = {
          content: [], client: [], purpose: [], action: [], with: [], pccc: [], remark: []
        };

        // 既存のデータを追加 (existingData が DbItems 型であることを前提とする)
        if (existingData) {
            for (const key in mergedData) {
                if (existingData[key as keyof DbItems]) {
                    const uniqueValues = new Set(existingData[key as keyof DbItems]);
                    mergedData[key as keyof DbItems] = Array.from(uniqueValues);
                }
            }
        }


        // スプレッドシートのデータを追加（重複を避ける）
        if (spreadsheetData) {
            for (const key in mergedData) {
                if (spreadsheetData[key as keyof DbItems]) {
                    const currentValues = new Set(mergedData[key as keyof DbItems]);
                    spreadsheetData[key as keyof DbItems].forEach(value => currentValues.add(value));
                    mergedData[key as keyof DbItems] = Array.from(currentValues);
                }
            }
        }


        setDbItems(mergedData);

        // タイムエントリを取得
        if (date && isValid(date)) {
          await fetchTimeEntries(format(date, "yyyy-MM-dd"));
        }
      } catch (err: any) {
        console.error("Failed to fetch initial data:", err);
        setError(err.message || "初期データの取得に失敗しました。");
        // エラー時もDB項目は空で初期化
        setDbItems({ content: [], client: [], purpose: [], action: [], with: [], pccc: [], remark: [] });
        // タイムエントリも空にする
        setTimeEntries([]);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]); // date が変更されたときにも fetchInitialData を再実行

  // Fetch time entries when date changes
  useEffect(() => {
    if (date && isValid(date)) {
      fetchTimeEntries(format(date, "yyyy-MM-dd"));
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
      // UIのみで追加し、バックエンドAPIは呼び出さない
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
      showTemporaryMessage('項目を追加しました', 'success');
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
      // UIのみで削除し、バックエンドAPIは呼び出さない
      setDbItems(prev => ({
        ...prev,
        [type]: (prev[type] || []).filter(item => item !== itemToDelete)
      }));
      
      showTemporaryMessage('項目を削除しました', 'success');
    } catch (error) {
      console.error('項目の削除エラー:', error);
      setError(error instanceof Error ? error.message : '項目の削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDbItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // スプレッドシートからデータを取得
      const spreadsheetResponse = await fetch(`${API_BASE_URL}/api/db-items?source=spreadsheet`);
      if (!spreadsheetResponse.ok) {
        throw new Error(`Error importing DB items: ${spreadsheetResponse.statusText}`);
      }
      const spreadsheetData = await spreadsheetResponse.json();

      // スプレッドシートからのデータを現在のデータと統合
      const mergedData: DbItems = {
        content: [...dbItems.content],
        client: [...dbItems.client],
        purpose: [...dbItems.purpose],
        action: [...dbItems.action],
        with: [...dbItems.with],
        pccc: [...dbItems.pccc],
        remark: [...dbItems.remark]
      };

      // スプレッドシートのデータを追加（重複を避ける）
      if (spreadsheetData && typeof spreadsheetData === 'object') {
        Object.keys(spreadsheetData).forEach(key => {
          const typedKey = key as keyof DbItems;
          if (typedKey in mergedData && Array.isArray(spreadsheetData[typedKey])) {
            // 既存の項目と新しい項目をマージして重複を排除
            const uniqueSet = new Set([...mergedData[typedKey], ...spreadsheetData[typedKey]]);
            mergedData[typedKey] = Array.from(uniqueSet);
          }
        });
      }

      // UIのみを更新（スプレッドシートは更新しない）
      setDbItems(mergedData);
      showTemporaryMessage('インポートが完了しました', 'success');
    } catch (err: any) {
      console.error("Failed to import DB items:", err);
      setError(err.message || "データベース項目のインポートに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!date) {
      setError("日付が選択されていません。");
      return;
    }

    // 内容が空のエントリをチェック
    const emptyContentEntries = timeEntries.filter(entry => !entry.content.trim());
    if (emptyContentEntries.length > 0) {
      showTemporaryMessage("内容が入力されていない行があります。", "error");
      // 該当する行にエラーフラグを設定
      setTimeEntries(timeEntries.map(entry => ({
        ...entry,
        hasError: !entry.content.trim()
      })));
      return;
    }

    setIsLoading(true);
    setError(null);
    const formattedDate = format(date, "yyyy-MM-dd");

    // Prepare entries to save
    const entriesToSave = timeEntries.map(entry => ({
      time: entry.time?.trim() || '',
      content: entry.content?.trim() || '',
      client: entry.client?.trim() || '',
      purpose: entry.purpose?.trim() || '',
      action: entry.action?.trim() || '',
      with: entry.with?.trim() || '',
      pccc: entry.pccc?.trim() || '',
      remark: entry.remark?.trim() || ''
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedDate}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entriesToSave),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `データの保存に失敗しました: ${response.statusText}`);
      }
      showTemporaryMessage("保存しました", 'success');
      setLastUpdated(responseData.updated_at || new Date().toLocaleString());
      
      // エラー表示をクリア
      setTimeEntries(timeEntries.map(entry => ({
        ...entry,
        hasError: false
      })));
    } catch (err: any) {
      console.error("Failed to save time entries:", err);
      showTemporaryMessage(err.message || "データの保存中にエラーが発生しました。", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific field in a time entry
  const handleTimeEntryChange = (id: number, field: string, value: string) => {
    // Ensure the field is a valid key of FrontendTimeEntry (excluding id, selected, hasError)
    const validFields: (keyof Omit<FrontendTimeEntry, 'id' | 'selected' | 'hasError'>)[] = [
        'time', 'content', 'client', 'purpose', 'action', 'with', 'pccc', 'remark'
    ];

    if (!(validFields as string[]).includes(field)) {
        console.error(`無効なフィールドです: ${field}`);
        return;
    }

    setTimeEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === id ? { ...entry, [field as keyof FrontendTimeEntry]: value } : entry
      )
    );
  };

  const handleDeleteTimeEntry = (id: number) => {
    setTimeEntries(prevEntries => {
      // 削除する行のインデックスを見つける
      const index = prevEntries.findIndex(entry => entry.id === id);
      if (index === -1) return prevEntries;
      
      // 削除する行の時間情報を取得
      const deletedEntry = prevEntries[index];
      const [startTime, endTime] = deletedEntry.time.split(' - ');
      
      // 行を削除
      const newEntries = prevEntries.filter(entry => entry.id !== id);
      
      // 後続の行の時間を更新
      if (index < newEntries.length) {
        let currentTime = startTime;
        
        // 削除した行以降の行の時間を更新
        for (let i = index; i < newEntries.length; i++) {
          const nextTime = getNextTimeSlot(currentTime);
          newEntries[i] = {
            ...newEntries[i],
            time: `${currentTime} - ${nextTime}`
          };
          currentTime = nextTime;
        }
      }
      
      return newEntries;
    });
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
      content: '',
      client: '',
      purpose: '',
      action: '',
      with: '',
      pccc: '',
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
      content: preset.content,
      client: preset.client,
      purpose: preset.purpose,
      action: preset.action,
      with: preset.with,
      pccc: preset.pccc,
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
    if (active.id !== over?.id) {
      setTimeEntries((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // 新しい位置の前後の行の時間を取得
        let prevTime = newIndex > 0 ? newItems[newIndex - 1].time.split(' - ')[1] : newItems[newIndex].time.split(' - ')[0];
        let nextTime = newIndex < newItems.length - 1 ? newItems[newIndex + 1].time.split(' - ')[0] : getNextTimeSlot(prevTime);
        
        // 同じ時間にならないように調整
        if (prevTime === nextTime) {
          nextTime = getNextTimeSlot(prevTime);
        }
        
        // ドラッグされた行の時間を更新
        newItems[newIndex] = {
          ...newItems[newIndex],
          time: `${prevTime} - ${nextTime}`
        };
        
        // 後続の行の時間を更新
        let currentTime = nextTime;
        for (let i = newIndex + 1; i < newItems.length; i++) {
          const nextTime = getNextTimeSlot(currentTime);
          newItems[i] = {
            ...newItems[i],
            time: `${currentTime} - ${nextTime}`
          };
          currentTime = nextTime;
        }
        
        return newItems;
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
      content: entryToDuplicate.content,
      client: entryToDuplicate.client,
      purpose: entryToDuplicate.purpose,
      action: entryToDuplicate.action,
      with: entryToDuplicate.with,
      pccc: entryToDuplicate.pccc,
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

  const showTemporaryMessage = (message: string, type: 'success' | 'error') => {
    setError(type === 'error' ? message : null);
    // 3秒後にメッセージをクリア
    setTimeout(() => {
      setError(null);
    }, 3000);
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
                <CalendarComponent
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
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10"></TableHead>
                          <TableHead className="w-48">時間</TableHead>
                          <TableHead>内容</TableHead>
                          <TableHead>クライアント</TableHead>
                          <TableHead>目的</TableHead>
                          <TableHead>アクション</TableHead>
                          <TableHead>誰と</TableHead>
                          <TableHead>PC/CC</TableHead>
                          <TableHead>備考</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext items={timeEntries.map(entry => entry.id)} strategy={verticalListSortingStrategy}>
                          {timeEntries.map((entry) => (
                            <SortableItem
                              key={entry.id}
                              id={entry.id}
                              entry={entry}
                              onTimeEntryChange={handleTimeEntryChange}
                              onDeleteTimeEntry={handleDeleteTimeEntry}
                              onUpdateTime={handleUpdateTime}
                              onDuplicateTimeEntry={handleDuplicateTimeEntry}
                              dbItems={dbItems}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
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
          <div className="flex flex-col gap-4">
            {/* 警告メッセージ */}
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>業務データベースについての重要なお知らせ</AlertTitle>
              <AlertDescription>
                現在、技術的な問題により業務データベースの更新機能は無効になっています。項目の追加・削除はこの画面上でのみ反映され、スプレッドシートには保存されません。スプレッドシートのデータを更新する場合は、直接スプレッドシートを編集してください。
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">業務データベース</h2>
                <p className="text-muted-foreground mt-1">よく使う項目を登録して、入力をスピードアップしましょう。</p>
              </div>
              <div>
                <Button variant="outline" onClick={handleImportDbItems} disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? (
                    "インポート中..."
                  ) : (
                    <>
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
                        className="mr-1"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      スプレッドシートからインポート
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* DB Add Form */} 
            <div className="db-add-form bg-muted/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium">新しい項目を追加</h3>
              <div className="flex flex-wrap gap-4 items-start md:items-center">
                <Select value={newDbItemType} onValueChange={(value) => setNewDbItemType(value as keyof DbItems)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="種類を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">内容</SelectItem>
                    <SelectItem value="client">クライアント</SelectItem>
                    <SelectItem value="purpose">目的</SelectItem>
                    <SelectItem value="action">アクション</SelectItem>
                    <SelectItem value="with">誰と</SelectItem>
                    <SelectItem value="pccc">PC/CC</SelectItem>
                    <SelectItem value="remark">備考</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex w-full md:flex-1 space-x-2">
                  <Input
                    type="text"
                    placeholder="登録する項目名"
                    value={newDbItemValue}
                    onChange={(e) => setNewDbItemValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddDbItem} disabled={!newDbItemValue.trim()}>追加</Button>
                </div>
              </div>
            </div>

            {/* DB Sections */} 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(dbItems) as Array<keyof DbItems>).map(type => (
                <div key={type} className="database-section border rounded-lg p-6 shadow-sm">
                  <h3 className="font-medium text-lg mb-3">
                    {type === 'content' ? '内容' : 
                     type === 'client' ? 'クライアント' : 
                     type === 'purpose' ? '目的' : 
                     type === 'action' ? 'アクション' : 
                     type === 'with' ? '誰と' : 
                     type === 'pccc' ? 'PC/CC' : '備考'}
                  </h3>
                  <div className="database-items flex flex-wrap gap-2">
                    {/* Check if dbItems[type] exists and is an array before mapping */}
                    {Array.isArray(dbItems[type]) && dbItems[type].length > 0 ? (
                      dbItems[type].map(item => (
                        <Badge 
                          key={`${type}-${item}`} 
                          variant="secondary" 
                          className="relative group pr-6 py-1.5 rounded-md hover:bg-muted transition-colors"
                        >
                          {item}
                          <button
                            onClick={() => handleDeleteDbItem(type, item)}
                            className="absolute top-1/2 right-1.5 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="bg-muted/20 rounded-lg p-6">
              <h3 className="font-medium mb-2">使い方</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mt-0.5">STEP 1</span>
                  <span>よく使う項目を登録します。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mt-0.5">STEP 2</span>
                  <span>タイム入力タブで入力フィールドをクリックすると候補が表示されます。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5 mt-0.5">STEP 3</span>
                  <span>候補から項目を選択するか、新しい値を入力できます。</span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}