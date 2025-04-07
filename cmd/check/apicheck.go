package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/yourusername/timeslice-app/internal/repository"
)

func main() {
	// スプレッドシートの設定
	ctx := context.Background()
	wd, err := os.Getwd()
	if err != nil {
		log.Fatalf("作業ディレクトリの取得に失敗しました: %v", err)
	}

	// 認証ファイルへのパスを修正
	credentialsFile := filepath.Join(wd, "credentials.json")
	spreadsheetID := "1z1EdC08aVvj0uUfO85HwfIp6k43OmcbPfV91jUrF3EQ"

	fmt.Printf("作業ディレクトリ: %s\n", wd)
	fmt.Printf("認証ファイル: %s\n", credentialsFile)

	// スプレッドシートリポジトリの初期化
	repo, err := repository.NewSheetsRepository(ctx, credentialsFile, spreadsheetID)
	if err != nil {
		log.Fatalf("スプレッドシートリポジトリの初期化に失敗しました: %v", err)
	}

	// DB項目の取得
	fmt.Println("DB項目を取得中...")
	items, err := repo.GetDbItems()
	if err != nil {
		log.Fatalf("DB項目の取得に失敗しました: %v", err)
	}

	// 結果を表示
	fmt.Println("--- 取得したDB項目 ---")
	fmt.Printf("件数: %d\n", len(items))
	jsonData, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		log.Fatalf("JSONへの変換に失敗しました: %v", err)
	}
	fmt.Println(string(jsonData))

	// アイテムのタイプをカウント
	typeCounts := make(map[string]int)
	for _, item := range items {
		typeCounts[item.Type]++
	}

	fmt.Println("\n--- タイプ別集計 ---")
	for t, count := range typeCounts {
		fmt.Printf("%s: %d件\n", t, count)
	}

	// タイムエントリの取得
	date := "2025-04-07" // 確認したい日付
	fmt.Printf("\n日付 %s のタイムエントリを取得中...\n", date)
	entries, err := repo.GetTimeEntries(date)
	if err != nil {
		log.Fatalf("タイムエントリの取得に失敗しました: %v", err)
	}

	// 結果を表示
	fmt.Println("--- 取得したタイムエントリ ---")
	fmt.Printf("件数: %d\n", len(entries))
	jsonData, err = json.MarshalIndent(entries, "", "  ")
	if err != nil {
		log.Fatalf("JSONへの変換に失敗しました: %v", err)
	}
	fmt.Println(string(jsonData))
}
