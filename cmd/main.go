package main

import (
	"context"
	"encoding/base64"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/timeslice-app/internal/handler"
	"github.com/yourusername/timeslice-app/internal/repository"
)

func main() {
	// 環境変数からポート番号を取得（Cloud Run用）
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Base64エンコードされた認証情報を復号
	credentialsBase64 := os.Getenv("GOOGLE_CREDENTIALS_BASE64")
	if credentialsBase64 == "" {
		log.Fatal("GOOGLE_CREDENTIALS_BASE64 環境変数が設定されていません")
	}

	credentials, err := base64.StdEncoding.DecodeString(credentialsBase64)
	if err != nil {
		log.Fatalf("認証情報のデコードに失敗しました: %v", err)
	}

	// 一時的にcredentials.jsonを作成
	if err := os.WriteFile("credentials.json", credentials, 0644); err != nil {
		log.Fatalf("認証情報の書き込みに失敗しました: %v", err)
	}
	defer os.Remove("credentials.json")

	// スプレッドシートの設定
	ctx := context.Background()
	spreadsheetID := os.Getenv("SPREADSHEET_ID")
	if spreadsheetID == "" {
		log.Fatal("SPREADSHEET_ID 環境変数が設定されていません")
	}

	// リポジトリの初期化
	repo, err := repository.NewSheetsRepository(ctx, "credentials.json", spreadsheetID)
	if err != nil {
		log.Fatalf("リポジトリの初期化に失敗しました: %v", err)
	}

	// ハンドラーの初期化
	h := handler.NewHandler(repo)

	// Ginのルーターを初期化
	r := gin.Default()

	// 静的ファイルの提供
	r.Static("/static", "./static")

	// テンプレートの読み込み
	r.LoadHTMLGlob("templates/*")

	// ルーティングの設定
	r.GET("/", h.ServeIndex)
	r.GET("/api/time-entries/:date", h.GetTimeEntries)
	r.POST("/api/time-entries/", h.SaveTimeEntries)
	r.GET("/api/db-items", h.GetDbItems)
	r.POST("/api/db-items", h.SaveDbItems)

	// サーバーを起動
	log.Printf("サーバーを起動します（ポート: %s）", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("サーバーの起動に失敗しました: %v", err)
	}
}
