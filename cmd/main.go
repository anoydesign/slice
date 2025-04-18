package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/yourusername/timeslice-app/internal/handler"
	"github.com/yourusername/timeslice-app/internal/repository"
)

func main() {
	// スプレッドシートの設定
	ctx := context.Background()
	wd, err := os.Getwd()
	if err != nil {
		log.Fatalf("作業ディレクトリの取得に失敗しました: %v", err)
	}
	credentialsFile := filepath.Join(wd, "credentials.json")

	// スプレッドシートIDの設定と確認（環境変数から取得することも検討）
	spreadsheetID := "1z1EdC08aVvj0uUfO85HwfIp6k43OmcbPfV91jUrF3EQ"
	log.Printf("認証ファイル: %s", credentialsFile)
	log.Printf("スプレッドシートID: %s", spreadsheetID)

	// credentials.jsonが存在するか確認
	if _, err := os.Stat(credentialsFile); os.IsNotExist(err) {
		log.Fatalf("認証ファイルが見つかりません: %s", credentialsFile)
	}

	// スプレッドシートリポジトリの初期化
	repo, err := repository.NewSheetsRepository(ctx, credentialsFile, spreadsheetID)
	if err != nil {
		log.Fatalf("スプレッドシートリポジトリの初期化に失敗しました: %v", err)
	}

	log.Println("スプレッドシートリポジトリの初期化に成功しました")

	// ハンドラーの初期化
	h := handler.NewHandler(repo)

	// Ginの設定
	r := gin.Default()

	// CORSミドルウェアの設定
	// フロントエンドのオリジンを許可 (ポート番号が異なる場合でもOK)
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"} // Add potential frontend ports
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	r.Use(cors.New(config))

	// テンプレートと静的ファイルの設定
	r.LoadHTMLGlob(filepath.Join(wd, "templates/*"))
	r.Static("/static", filepath.Join(wd, "static"))

	// ルーティング
	r.GET("/", h.ServeIndex)
	r.GET("/api/time-entries/:date", h.GetTimeEntries)
	r.POST("/api/time-entries/:date", h.SaveTimeEntries)
	r.GET("/api/db-items", h.GetDbItems)
	r.GET("/api/db-items-v2", h.GetDbItems)
	r.POST("/api/db-items", h.SaveDbItems)
	r.DELETE("/api/db-items", h.DeleteDbItems)

	// サーバーの起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := "0.0.0.0:" + port
	log.Printf("サーバーを起動します: http://%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("サーバーの起動に失敗しました: %v", err)
	}
}
