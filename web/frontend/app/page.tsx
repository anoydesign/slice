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

export default function Home() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

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

          {/* Placeholder for Time Entries Table */}
          <div className="mb-4">
            <p className="text-gray-500">（ここにタイムエントリのテーブルが表示されます）</p>
            {/* Add Table component here later */}
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

          {/* Placeholder for DB Add Form */}
          <div className="db-add-form flex space-x-2 mb-4">
             <p className="text-gray-500">（ここにDB追加フォームが表示されます）</p>
             {/* Add Select, Input, Button here later */}
          </div>

          {/* Placeholder for DB Sections */}
          <div className="space-y-4">
              <div className="database-section">
                  <h3 className="font-semibold mb-2">登録済み: 内容</h3>
                  <div className="database-items">
                       <p className="text-gray-500">（ここに内容アイテムが表示されます）</p>
                       {/* Add Badges here later */}
                  </div>
              </div>
              {/* Add other DB sections (function, mall, remark) later */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
