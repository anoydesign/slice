package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"github.com/yourusername/timeslice-app/internal/models"
	"github.com/yourusername/timeslice-app/internal/repository"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("使用方法: go run import_data.go <JSONファイルのパス>")
		os.Exit(1)
	}

	jsonPath := os.Args[1]
	data, err := ioutil.ReadFile(jsonPath)
	if err != nil {
		log.Fatalf("JSONファイルの読み込みに失敗しました: %v", err)
	}

	var importData struct {
		DbItems []models.DbItem `json:"db_items"`
	}

	if err := json.Unmarshal(data, &importData); err != nil {
		log.Fatalf("JSONのパースに失敗しました: %v", err)
	}

	// データベースの初期化
	dbPath := filepath.Join("..", "timeslice.db")
	repo, err := repository.NewRepository(dbPath)
	if err != nil {
		log.Fatalf("データベースの初期化に失敗しました: %v", err)
	}

	// DbItemsのインポート
	if err := repo.SaveDbItems(importData.DbItems); err != nil {
		log.Fatalf("DbItemsの保存に失敗しました: %v", err)
	}

	fmt.Println("データのインポートが完了しました")
}
