package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/timeslice-app/internal/handler"
	"github.com/yourusername/timeslice-app/internal/repository"
)

func main() {
	// 環境変数からポート番号を取得（Heroku用）
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // デフォルトポート
	}

	// スプレッドシートの設定
	ctx := context.Background()
	wd, err := os.Getwd()
	if err != nil {
		log.Fatalf("作業ディレクトリの取得に失敗しました: %v", err)
	}
	credentialsFile := filepath.Join(wd, "credentials.json")
	spreadsheetID := "1z1EdC08aVvj0uUfO85HwfIp6k43OmcbPfV91jUrF3EQ"

	// スプレッドシートリポジトリの初期化
	repo, err := repository.NewSheetsRepository(ctx, credentialsFile, spreadsheetID)
	if err != nil {
		log.Fatalf("スプレッドシートリポジトリの初期化に失敗しました: %v", err)
	}

	// ハンドラーの初期化
	h := handler.NewHandler(repo)

	// Ginの設定
	r := gin.Default()

	// テンプレートと静的ファイルの設定
	r.LoadHTMLGlob(filepath.Join(wd, "templates/*"))
	r.Static("/static", filepath.Join(wd, "static"))

	// ルーティング
	r.GET("/", h.ServeIndex)
	r.GET("/api/time-entries/:date", h.GetTimeEntries)
	r.POST("/api/time-entries/:date", h.SaveTimeEntries)
	r.GET("/api/db-items", h.GetDbItems)
	r.POST("/api/db-items", h.SaveDbItems)

	// サーバーの起動
	log.Printf("サーバーを起動します（ポート: %s）", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("サーバーの起動に失敗しました: %v", err)
	}
}
