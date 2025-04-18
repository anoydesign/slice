"use client"; // Make this a client component

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { CalendarIcon, Cross2Icon } from "@radix-ui/react-icons";
import { format, isValid, parseISO, subDays } from "date-fns"; // Import isValid for date checking
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableItem } from './components/SortableItem';
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FrontendTimeEntry, DbItems, Preset } from './types';
import { nanoid } from 'nanoid';
import dynamic from 'next/dynamic';
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useMediaQuery } from 'react-responsive';
import { MobileTimeEntryList } from './components/MobileTimeEntryList';
import { DatePicker } from '@/app/components/DatePicker';
import { Calendar, ArrowLeftRight, Database, Clock, RefreshCw, Save, Plus, Sheet, Undo } from 'lucide-react';

// Define the base URL for the backend API
const API_BASE_URL = "http://localhost:8080";

// Backend time entry type
interface BackendTimeEntry {
  id?: string;
  time: string;
  content: string;
  client: string;
  purpose: string;
  action: string;
  with: string;
  pccc: string;
  remark: string;
}

// デフォルトのプリセット
const DEFAULT_PRESETS: Preset[] = [
  {
    id: "meeting",
    name: "会議",
    time: "30",
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
    time: "30",
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
    time: "30",
    content: "休憩",
    client: "個人",
    purpose: "リフレッシュ",
    action: "休憩",
    with: "個人",
    pccc: "P",
    remark: ""
  },
  {
    id: "lunch",
    name: "昼食",
    time: "30",
    content: "昼食",
    client: "個人",
    purpose: "食事",
    action: "休憩",
    with: "個人",
    pccc: "P",
    remark: ""
  },
  {
    id: "reporting",
    name: "報告書作成",
    time: "30",
    content: "報告書作成",
    client: "社内",
    purpose: "ドキュメント作成",
    action: "資料作成",
    with: "個人",
    pccc: "P",
    remark: ""
  },
  {
    id: "research",
    name: "リサーチ",
    time: "30",
    content: "リサーチ",
    client: "プロジェクト",
    purpose: "情報収集",
    action: "調査",
    with: "個人",
    pccc: "P",
    remark: ""
  }
];

// LoadingOverlayコンポーネントはHTML/CSSで実装するので削除
// const LoadingOverlay = dynamic(() => import('./components/LoadingOverlay'), {
//   ssr: false,
// });

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startWorkTime, setStartWorkTime] = useState<string>("09:00"); // 業務開始時間
  // Initialize states with empty data
  const [timeEntries, setTimeEntries] = useState<FrontendTimeEntry[]>([]);
  const [dbItems, setDbItems] = useState<DbItems>({ content: [], client: [], purpose: [], action: [], with: [], pccc: [], remark: [] });
  const [newDbItemType, setNewDbItemType] = useState<keyof DbItems>("content");
  const [newDbItemValue, setNewDbItemValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [lastUpdated, setLastUpdated] = useState<string>("まだ保存されていません");
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  
  // プリセット編集用の状態
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetContent, setNewPresetContent] = useState("");
  const [newPresetClient, setNewPresetClient] = useState("");
  const [newPresetPurpose, setNewPresetPurpose] = useState("");
  const [newPresetAction, setNewPresetAction] = useState("");
  const [newPresetWith, setNewPresetWith] = useState("");
  const [newPresetPccc, setNewPresetPccc] = useState("P");
  const [newPresetRemark, setNewPresetRemark] = useState("");
  const [isEditingPreset, setIsEditingPreset] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // プリセットをローカルストレージから読み込む
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem('timeslice-presets');
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      }
    } catch (error: unknown) {
      console.error('プリセットの読み込みに失敗しました:', error);
    }
  }, []);

  // プリセットをローカルストレージに保存する
  useEffect(() => {
    try {
      localStorage.setItem('timeslice-presets', JSON.stringify(presets));
    } catch (error: unknown) {
      console.error('プリセットの保存に失敗しました:', error);
    }
  }, [presets]);

  // プリセットを追加または更新する関数
  const handleSavePreset = () => {
    if (!newPresetName) return;

    const presetData: Preset = {
      id: selectedPreset ? selectedPreset.id : nanoid(),
      name: newPresetName,
      time: "30", // デフォルト値として30分を使用
      content: newPresetContent,
      client: newPresetClient,
      purpose: newPresetPurpose,
      action: newPresetAction,
      with: newPresetWith,
      pccc: newPresetPccc,
      remark: newPresetRemark
    };

    if (selectedPreset) {
      // 既存のプリセットを更新
      setPresets(currentPresets => 
        currentPresets.map(preset => 
          preset.id === selectedPreset.id ? presetData : preset
        )
      );
    } else {
      // 新しいプリセットを追加
      setPresets(currentPresets => [...currentPresets, presetData]);
    }

    // フォームをリセット
    resetPresetForm();
  };

  // プリセットを削除する関数
  const handleDeletePreset = (presetId: string) => {
    if (confirm("このプリセットを削除してもよろしいですか？")) {
      setPresets(currentPresets => 
        currentPresets.filter(preset => preset.id !== presetId)
      );
    }
  };

  // プリセット編集フォームを開く関数
  const handleEditPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setNewPresetName(preset.name);
    setNewPresetContent(preset.content);
    setNewPresetClient(preset.client);
    setNewPresetPurpose(preset.purpose);
    setNewPresetAction(preset.action);
    setNewPresetWith(preset.with);
    setNewPresetPccc(preset.pccc);
    setNewPresetRemark(preset.remark);
    setIsEditingPreset(true);
  };

  // フォームをリセットする関数
  const resetPresetForm = () => {
    setSelectedPreset(null);
    setNewPresetName("");
    setNewPresetContent("");
    setNewPresetClient("");
    setNewPresetPurpose("");
    setNewPresetAction("");
    setNewPresetWith("");
    setNewPresetPccc("P");
    setNewPresetRemark("");
    setIsEditingPreset(false);
  };

  // Function to fetch time entries for a given date
  const fetchTimeEntries = async () => {
    // Set loading state
    setIsLoading(true);
    // Reset error state
    setError(null);

    try {
      if (!date) {
        throw new Error("日付が選択されていません。");
      }

      // Format the date to 'YYYY-MM-DD' to send to the API
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedDate}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match our frontend model
      let transformedData: FrontendTimeEntry[] = data.map((entry: BackendTimeEntry, index: number) => {
        return {
          id: nanoid(),
          time: entry.time,
          content: entry.content,
          client: entry.client,
          purpose: entry.purpose,
          action: entry.action,
          with: entry.with,
          pccc: entry.pccc,
          remark: entry.remark,
          selected: false,
          hasError: false
        };
      });

      if (transformedData.length === 0) {
        // データがない場合、業務開始時間から最初のエントリを作成
        const firstEndTime = getNextTimeSlot(startWorkTime);
        transformedData = [{
          id: nanoid(),
          time: `${startWorkTime} - ${firstEndTime}`,
          content: "",
          client: "",
          purpose: "",
          action: "",
          with: "",
          pccc: "",
          remark: "",
          selected: false,
          hasError: false
        }];
      } else {
        // 既存のデータがある場合、業務開始時間と実際の開始時間が異なれば調整
        const firstTimeSlot = transformedData[0]?.time || "";
        const currentFirstStartTime = firstTimeSlot.split(" - ")[0];
        
        if (currentFirstStartTime !== startWorkTime && transformedData.length > 0) {
          recalculateTimeEntries(startWorkTime);
        }
      }

      setTimeEntries(transformedData);
      setLastUpdated("最後の更新: " + format(new Date(), "HH:mm:ss"));
    } catch (error) {
      setError(`データの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
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
          await fetchTimeEntries();
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
      fetchTimeEntries();
    }
  }, [date]); // Re-fetch when date changes

  const handleSelectRow = (id: string, checked: boolean) => {
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

  // 業務開始時間が変更された時のハンドラー
  const handleStartTimeChange = (value: string) => {
    setStartWorkTime(value);
  };
  
  // セットボタンが押されたときの処理
  const handleSetStartTime = () => {
    recalculateTimeEntries(startWorkTime);
  };

  // タイムエントリの値を変更する関数
  const handleTimeEntryChange = (id: string, field: string, value: string) => {
    // Save changes to the state
    setTimeEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === id ? { ...entry, [field as keyof FrontendTimeEntry]: value } : entry
      )
    );
  };

  // タイムエントリを削除する関数
  const handleDeleteTimeEntry = (id: string) => {
    setTimeEntries(prevEntries => {
      // 削除する行のインデックスを見つける
      const index = prevEntries.findIndex(entry => entry.id === id);
      if (index === -1) return prevEntries;
      
      // 削除する行の時間情報を取得
      const timeParts = prevEntries[index].time.split(' - ');
      const startTimeToRemove = timeParts[0];
      const endTimeToRemove = timeParts[1];
      
      // 行を削除
      const newEntries = prevEntries.filter(entry => entry.id !== id);
      
      // 後続の行の時間を更新
      if (index < newEntries.length) {
        // 削除された行の次の行から処理を開始
        let currentTime = startTimeToRemove;
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
    // 最後のエントリーを取得
    const lastEntry = timeEntries[timeEntries.length - 1];
    
    // 時間帯を計算
    let newTime = "";
    if (timeEntries.length === 0) {
      // エントリーがない場合は、業務開始時間から始める
      const endTime = getNextTimeSlot(startWorkTime);
      newTime = `${startWorkTime} - ${endTime}`;
    } else {
      // 最後のエントリーの終了時間から始める
      const lastTimeSlots = lastEntry.time.split(" - ");
      const startTime = lastTimeSlots[1];
      const endTime = getNextTimeSlot(startTime);
      newTime = `${startTime} - ${endTime}`;
    }

    // 新しいエントリーを作成して追加
    const newEntry: FrontendTimeEntry = {
      id: nanoid(),
      time: newTime,
      content: "",
      client: "",
      purpose: "",
      action: "",
      with: "",
      pccc: "",
      remark: "",
      selected: false,
      hasError: false
    };

    setTimeEntries([...timeEntries, newEntry]);
  };

  const handleAddPreset = (preset: Preset) => {
    // 最後のエントリーを取得
    const lastEntry = timeEntries.length > 0 ? timeEntries[timeEntries.length - 1] : null;
    
    let newTime = "";
    if (!lastEntry) {
      // エントリーがない場合は、業務開始時間から始める
      const endTime = getNextTimeSlot(startWorkTime);
      newTime = `${startWorkTime} - ${endTime}`;
    } else {
      // 最後のエントリーの終了時間を取得
      const timeParts = lastEntry.time.split(" - ");
      if (timeParts.length === 2) {
        const lastEndTime = timeParts[1];
        // 30分（1行）単位で計算する
        const nextEndTime = getNextTimeSlot(lastEndTime);
        newTime = `${lastEndTime} - ${nextEndTime}`;
      } else {
        // 時間形式が不正な場合は、startWorkTimeから始める
        const endTime = getNextTimeSlot(startWorkTime);
        newTime = `${startWorkTime} - ${endTime}`;
      }
    }

    const newEntry: FrontendTimeEntry = {
      id: nanoid(),
      time: newTime,
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

  const handleImportLastWeek = async () => {
    try {
      if (!date) return;
      
      // 1週間前の日付を計算
      const lastWeek = new Date(date);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const formattedLastWeek = format(lastWeek, 'yyyy-MM-dd');
      
      // 先週のデータを取得
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedLastWeek}`);
      if (!response.ok) {
        throw new Error('先週のデータの取得に失敗しました');
      }
      
      const lastWeekEntries: BackendTimeEntry[] = await response.json();
      if (lastWeekEntries.length === 0) {
        showTemporaryMessage('先週のデータがありません', 'error');
        return;
      }
      
      // 確認ダイアログを表示
      const shouldAppend = window.confirm('先週のデータを現在のデータに追加しますか？（キャンセルを選ぶと上書きします）');
      
      // 新しいIDを割り当てて今日のデータとして追加
      const newEntries: FrontendTimeEntry[] = lastWeekEntries.map(entry => ({
        ...entry,
        id: nanoid(),
        selected: false,
        hasError: false
      }));
      
      if (shouldAppend) {
        setTimeEntries([...timeEntries, ...newEntries]);
      } else {
        setTimeEntries(newEntries);
      }
      
      showTemporaryMessage('先週のデータをインポートしました', 'success');
    } catch (error) {
      console.error('先週のデータのインポートエラー:', error);
      showTemporaryMessage('先週のデータのインポートに失敗しました', 'error');
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setTimeEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        // 項目の順序を変更
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // タイムスロットを再計算（1行目は業務開始時間から、以降は前の行の終了時間から）
        const updatedItems = [...newItems];
        
        // 最初のエントリーの時間を業務開始時間をもとに設定
        if (updatedItems.length > 0) {
          const firstEndTime = getNextTimeSlot(startWorkTime);
          updatedItems[0] = {
            ...updatedItems[0],
            time: `${startWorkTime} - ${firstEndTime}`
          };
          
          // 後続のエントリーの時間を順番に更新
          let currentTime = firstEndTime;
          for (let i = 1; i < updatedItems.length; i++) {
            const nextTime = getNextTimeSlot(currentTime);
            updatedItems[i] = {
              ...updatedItems[i],
              time: `${currentTime} - ${nextTime}`
            };
            currentTime = nextTime;
          }
        }
        
        return updatedItems;
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

  // 時間帯を更新する関数
  const handleUpdateTime = (id: string, startTime: string, endTime: string) => {
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

  // エントリを複製する関数
  const handleDuplicateTimeEntry = (id: string) => {
    const entryToDuplicate = timeEntries.find(entry => entry.id === id);
    if (!entryToDuplicate) return;

    // 複製元のエントリーの位置を特定
    const index = timeEntries.findIndex(entry => entry.id === id);
    
    // 複製元の時間帯を取得
    const [startTime, endTime] = entryToDuplicate.time.split(" - ");
    
    // 複製元の直後の時間帯を計算
    const newStartTime = endTime;
    const newEndTime = getNextTimeSlot(newStartTime);

    const newEntry: FrontendTimeEntry = {
      id: nanoid(),
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
    const newEntries = [...timeEntries];
    newEntries.splice(index + 1, 0, newEntry);
    
    // 後続のエントリーの時間を更新
    if (index < timeEntries.length - 1) {
      let currentTime = newEndTime;
      for (let i = index + 2; i < newEntries.length; i++) {
        const nextTime = getNextTimeSlot(currentTime);
        newEntries[i] = {
          ...newEntries[i],
          time: `${currentTime} - ${nextTime}`
        };
        currentTime = nextTime;
      }
    }

    setTimeEntries(newEntries);
  };

  // 一時的なメッセージを表示する関数
  const showTemporaryMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setLastUpdated(message);
    setTimeout(() => {
      setLastUpdated("最後の更新: " + format(new Date(), "HH:mm:ss"));
    }, 3000);
  };

  // 業務開始時間が変更されたときに timeEntries を再計算する関数
  const recalculateTimeEntries = (newStartTime: string) => {
    if (timeEntries.length === 0) return;

    setTimeEntries(prevEntries => {
      // 新しいエントリー配列を作成
      const newEntries = [...prevEntries];
      
      // 最初のエントリーの時間を新しい開始時間に設定
      const firstEndTime = getNextTimeSlot(newStartTime);
      newEntries[0] = {
        ...newEntries[0],
        time: `${newStartTime} - ${firstEndTime}`
      };
      
      // 後続のエントリーの時間を順番に更新
      let currentTime = firstEndTime;
      for (let i = 1; i < newEntries.length; i++) {
        const nextTime = getNextTimeSlot(currentTime);
        newEntries[i] = {
          ...newEntries[i],
          time: `${currentTime} - ${nextTime}`
        };
        currentTime = nextTime;
      }
      
      return newEntries;
    });
  };

  // 選択したエントリーの削除
  const handleDeleteSelected = () => {
    // Filter out selected entries
    const newEntries = timeEntries.filter(entry => !entry.selected);
    setTimeEntries(newEntries);
  };

  // エントリーの選択状態の切り替え
  const toggleSelect = (id: string) => {
    setTimeEntries(prevEntries => {
      return prevEntries.map(entry => {
        if (entry.id === id) {
          return { ...entry, selected: !entry.selected };
        }
        return entry;
      });
    });
  };

  // 全てのエントリーの選択状態を設定
  const selectAll = (selected: boolean) => {
    setTimeEntries(prevEntries => {
      return prevEntries.map(entry => ({ ...entry, selected }));
    });
  };

  // エントリーの複製
  const handleDuplicate = (id: string) => {
    const entryToDuplicate = timeEntries.find(entry => entry.id === id);
    if (!entryToDuplicate) return;

    // 最後のエントリーの時間帯を取得
    const lastEntry = timeEntries[timeEntries.length - 1];
    const lastTimeParts = lastEntry.time.split(' - ');
    const lastEndTime = lastTimeParts[1];
    
    // 新しい時間帯を計算
    const newStartTime = lastEndTime;
    const newEndTime = getNextTimeSlot(newStartTime);

    // 新しいエントリーを作成
    const newEntry: FrontendTimeEntry = {
      ...entryToDuplicate,
      id: nanoid(),
      time: `${newStartTime} - ${newEndTime}`,
      selected: false
    };

    // 新しいエントリーを追加
    setTimeEntries([...timeEntries, newEntry]);
  };

  // スプレッドシートからデータをインポート
  const importFromSheet = async () => {
    try {
      if (!date) return;
      
      const formattedDate = format(date, "yyyy-MM-dd");
      // バックエンドには/api/import-sheet/エンドポイントがないので、
      // 代わりにスプレッドシートからのデータを特別なパラメータで取得
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedDate}`);
      
      if (!response.ok) {
        throw new Error("スプレッドシートからのデータインポートに失敗しました。");
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        showTemporaryMessage("インポートするデータがありませんでした。", "error");
        return;
      }
      
      // スプレッドシートのデータでタイムエントリを更新
      setTimeEntries(data.map((entry: BackendTimeEntry) => ({
        ...entry,
        id: entry.id || nanoid(),
        selected: false,
        hasError: false
      })));
      
      // 時間帯を業務開始時間から再計算
      recalculateTimeEntries(startWorkTime);
      
      showTemporaryMessage("スプレッドシートからデータをインポートしました。", "success");
      
    } catch (error) {
      console.error("スプレッドシートからのインポートに失敗しました:", error);
      showTemporaryMessage("エラー: スプレッドシートからのインポートに失敗しました。", "error");
    }
  };

  // 前日のデータインポート機能を追加
  const importPreviousDay = async () => {
    try {
      if (!date) return;
      
      // 前日の日付を計算
      const previousDay = subDays(date, 1);
      const formattedPreviousDay = format(previousDay, "yyyy-MM-dd");
      
      // 前日のデータを取得
      const response = await fetch(`${API_BASE_URL}/api/time-entries/${formattedPreviousDay}`);
      
      if (!response.ok) {
        throw new Error("前日のデータを取得できませんでした。");
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        showTemporaryMessage("前日のデータがありません。", "error");
        return;
      }
      
      // 前日のデータを新しいIDで追加
      const newEntries: FrontendTimeEntry[] = data.map((entry: BackendTimeEntry) => ({
        ...entry,
        id: nanoid(),
        selected: false,
        hasError: false
      }));
      
      // 業務開始時間に合わせて時間を再計算
      setTimeEntries(newEntries);
      recalculateTimeEntries(startWorkTime);
      
      showTemporaryMessage("前日のデータをインポートしました。", "success");
    } catch (error) {
      console.error("前日のデータのインポートに失敗しました:", error);
      showTemporaryMessage("エラー: 前日のデータのインポートに失敗しました。", "error");
    }
  };

  // Responsive design helpers
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Handle reordering time entries
  const handleReorderTimeEntries = (activeId: string, overId: string) => {
    setTimeEntries((items) => {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
      
      const newArray = [...items];
      const [removed] = newArray.splice(oldIndex, 1);
      newArray.splice(newIndex, 0, removed);
      
      // Recalculate times after reordering
      let currentTime = startWorkTime;
      return newArray.map((item, index) => {
        const nextTime = getNextTimeSlot(currentTime);
        const updatedItem = {
          ...item,
          time: `${currentTime} - ${nextTime}`
        };
        currentTime = nextTime;
        return updatedItem;
      });
    });
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* LoadingOverlayコンポーネントは削除 */}
      {/* {pageLoading && <LoadingOverlay />} */}
      
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

      <Tabs defaultValue="time-entries" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="time-entries" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>タイムエントリー</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-1.5">
            <Database className="h-4 w-4" />
            <span>データベース</span>
          </TabsTrigger>
        </TabsList>

        {/* Time Entries Tab */}
        <TabsContent value="time-entries">
          <div className="mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <DatePicker
                  selected={date}
                  onChange={(date: Date) => setDate(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full sm:w-auto px-3 py-2 border rounded"
                />
                <div className="flex items-center">
                  <Label htmlFor="startWorkTime" className="mr-2 whitespace-nowrap flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    業務開始時間:
                  </Label>
                  <Input
                    id="startWorkTime"
                    type="text"
                    value={startWorkTime}
                    onChange={(e) => {
                      setStartWorkTime(e.target.value);
                      recalculateTimeEntries(e.target.value);
                    }}
                    className="w-24 px-2 py-1 text-center"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={importFromSheet} variant="outline" size="sm" className="flex items-center gap-1.5">
                  <Sheet className="h-4 w-4" />
                  <span>スプレッドシートからインポート</span>
                </Button>
                <Button onClick={importPreviousDay} variant="outline" size="sm" className="flex items-center gap-1.5">
                  <Undo className="h-4 w-4" />
                  <span>前日のデータをインポート</span>
                </Button>
              </div>
            </div>

            {/* Show quick presets only if we have any */}
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPreset(preset)}
                    className="text-xs hover:bg-primary/5 transition-colors"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4 border rounded-md min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex justify-center items-center flex-grow py-10">
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-6 w-6 text-primary/70 animate-spin mb-2" />
                  <p>読み込み中...</p>
                </div>
              </div>
            ) : error && timeEntries.length === 0 ? (
              <div className="flex justify-center items-center flex-grow py-10">
                <p className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  データの取得に失敗しました
                </p>
              </div>
            ) : !isLoading && timeEntries.length === 0 ? (
              <div className="flex justify-center items-center flex-grow py-10">
                <div className="flex flex-col items-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mb-2 text-primary/30" />
                  <p>この日付のデータはありません</p>
                </div>
              </div>
            ) : (
              <>
                {isMobile ? (
                  // Mobile view with cards
                  <div className="p-2">
                    <MobileTimeEntryList
                      timeEntries={timeEntries}
                      dbItems={dbItems}
                      onAddTimeEntry={handleAddTimeEntry}
                      onTimeEntryChange={handleTimeEntryChange}
                      onDeleteTimeEntry={handleDeleteTimeEntry}
                      onUpdateTime={handleUpdateTime}
                      onDuplicateTimeEntry={handleDuplicateTimeEntry}
                      onReorderTimeEntries={handleReorderTimeEntries}
                    />
                  </div>
                ) : (
                  // Desktop view with table
                  <div className="overflow-x-auto">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">&nbsp;</TableHead>
                            <TableHead className="w-48">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>時間</span>
                              </div>
                            </TableHead>
                            <TableHead>内容</TableHead>
                            <TableHead>クライアント</TableHead>
                            <TableHead>目的</TableHead>
                            <TableHead>アクション</TableHead>
                            <TableHead>誰と</TableHead>
                            <TableHead>PC/CC</TableHead>
                            <TableHead>備考</TableHead>
                            <TableHead className="w-20">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext 
                            items={timeEntries.map(e => e.id)} 
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
                                dbItems={dbItems}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    </DndContext>
                  </div>
                )}
                {!isMobile && (
                  <div className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddTimeEntry}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-primary/70" />
                      <span>新しい行を追加</span>
                    </Button>
                  </div>
                )}
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
            <Button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  <span>保存する</span>
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">{lastUpdated}</span>
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

            {/* プリセット管理セクション */}
            <div className="preset-manager bg-muted/30 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">クイックプリセット管理</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    resetPresetForm();
                    setIsEditingPreset(true);
                  }}
                  className="flex items-center gap-2"
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
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  新しいプリセットを作成
                </Button>
              </div>
              
              {isEditingPreset ? (
                <div className="preset-form bg-card p-4 rounded-lg border shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="preset-name">プリセット名</Label>
                      <Input
                        id="preset-name"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="会議、昼食など"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-content">内容</Label>
                      <Input
                        id="preset-content"
                        value={newPresetContent}
                        onChange={(e) => setNewPresetContent(e.target.value)}
                        placeholder="会議、開発など"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-client">クライアント</Label>
                      <Input
                        id="preset-client"
                        value={newPresetClient}
                        onChange={(e) => setNewPresetClient(e.target.value)}
                        placeholder="社内、チームなど"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-purpose">目的</Label>
                      <Input
                        id="preset-purpose"
                        value={newPresetPurpose}
                        onChange={(e) => setNewPresetPurpose(e.target.value)}
                        placeholder="進捗確認、情報共有など"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-action">アクション</Label>
                      <Input
                        id="preset-action"
                        value={newPresetAction}
                        onChange={(e) => setNewPresetAction(e.target.value)}
                        placeholder="会議実施、資料作成など"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-with">誰と</Label>
                      <Input
                        id="preset-with"
                        value={newPresetWith}
                        onChange={(e) => setNewPresetWith(e.target.value)}
                        placeholder="個人、チームメンバーなど"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-pccc">PC/CC</Label>
                      <Input
                        id="preset-pccc"
                        value={newPresetPccc}
                        onChange={(e) => setNewPresetPccc(e.target.value)}
                        placeholder="P, C, CCなど"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="preset-remark">備考</Label>
                    <Textarea
                      id="preset-remark"
                      value={newPresetRemark}
                      onChange={(e) => setNewPresetRemark(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetPresetForm}>キャンセル</Button>
                    <Button onClick={handleSavePreset} disabled={!newPresetName}>
                      {selectedPreset ? "更新" : "作成"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="presets-list space-y-2">
                  <div className="flex justify-between items-center px-4 py-2 bg-muted rounded-md font-medium text-sm">
                    <span className="w-1/3">プリセット名</span>
                    <span className="w-1/3">内容</span>
                    <span className="w-1/3">クライアント</span>
                    <span className="w-1/6">操作</span>
                  </div>
                  {presets.map((preset) => (
                    <div key={preset.id} className="flex justify-between items-center px-4 py-3 bg-card rounded-md border hover:border-primary transition-colors">
                      <span className="w-1/3 font-medium">{preset.name}</span>
                      <span className="w-1/3 text-muted-foreground truncate">{preset.content}</span>
                      <span className="w-1/3 text-muted-foreground truncate">{preset.client}</span>
                      <span className="w-1/6 flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditPreset(preset)}
                          className="h-8 w-8"
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
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                            <path d="m15 5 4 4"></path>
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeletePreset(preset.id)}
                          className="h-8 w-8 text-destructive"
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
                      </span>
                    </div>
                  ))}
                </div>
              )}
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