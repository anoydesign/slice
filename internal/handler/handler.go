package handler

import (
	"fmt"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/timeslice-app/internal/models"
	"github.com/yourusername/timeslice-app/internal/repository"
)

type Handler struct {
	repo repository.Repository
}

// Define a struct for the frontend time entry format
type FrontendTimeEntry struct {
	ID       int    `json:"id"`
	Time     string `json:"time"`
	Content  string `json:"content"`
	Client   string `json:"client"`
	Purpose  string `json:"purpose"`
	Action   string `json:"action"`
	With     string `json:"with"`
	PcCc     string `json:"pccc"`
	Remark   string `json:"remark"`
	Selected bool   `json:"selected"`
}

func NewHandler(repo repository.Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetTimeEntries(c *gin.Context) {
	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付が指定されていません"})
		return
	}

	// 日付の形式を確認（YYYY-MM-DD）
	datePattern := `^\d{4}-\d{2}-\d{2}$`
	matched, err := regexp.MatchString(datePattern, date)
	if err != nil || !matched {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付の形式が正しくありません（YYYY-MM-DD）"})
		return
	}

	// リポジトリから日付シートのデータを取得
	backendEntries, err := h.repo.GetTimeEntries(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Transform data for frontend
	frontendEntries := make([]FrontendTimeEntry, len(backendEntries))
	fmt.Printf("バックエンドから %d 件のエントリを取得しました\n", len(backendEntries))

	for i, entry := range backendEntries {
		frontendEntries[i] = FrontendTimeEntry{
			ID:       i + 1, // Simple ID based on row number (starts from 1)
			Time:     entry.Time,
			Content:  entry.Content,
			Client:   entry.Client,
			Purpose:  entry.Purpose,
			Action:   entry.Action,
			With:     entry.With,
			PcCc:     entry.PcCc,
			Remark:   entry.Remark,
			Selected: false, // Default to not selected
		}
		fmt.Printf("- エントリ[%d]: 時間=%s, 内容=%s, 備考=%s\n",
			i+1, entry.Time, entry.Content, entry.Remark)
	}

	// テスト用のダミーデータは不要なので削除
	c.JSON(http.StatusOK, frontendEntries) // Return the transformed slice
}

func (h *Handler) SaveTimeEntries(c *gin.Context) {
	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付が指定されていません"})
		return
	}

	var entries []models.TimeEntry
	if err := c.ShouldBindJSON(&entries); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedAt, err := h.repo.SaveTimeEntries(date, entries)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "保存しました",
		"updated_at": updatedAt.Format("2006/01/02 15:04:05"),
	})
}

func (h *Handler) GetDbItems(c *gin.Context) {
	source := c.Query("source")
	var rawItems []models.DbItem
	var err error

	if source == "spreadsheet" {
		// スプレッドシートから直接データを取得
		rawItems, err = h.repo.GetDbItems()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// 通常のデータベースから取得
		rawItems, err = h.repo.GetDbItems()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 新しい形式の構造体にマッピング
	dbItems := models.DbItems{
		Content: []string{},
		Client:  []string{},
		Purpose: []string{},
		Action:  []string{},
		With:    []string{},
		PcCc:    []string{},
		Remark:  []string{},
	}

	// Map old spreadsheet types to new types
	typeMap := map[string]string{
		"内容":     "content",
		"クライアント": "client",
		"クライアント（誰に、誰のために）": "client",
		"目的":      "purpose",
		"アクション":   "action",
		"誰と":      "with",
		"PC/CC":   "pccc",
		"備考":      "remark",
		"content": "content",
		"client":  "client",
		"purpose": "purpose",
		"action":  "action",
		"with":    "with",
		"pccc":    "pccc",
		"remark":  "remark",
		// 古いタイプも新しい形式に変換する
		"task":     "content",
		"function": "action",
		"mall":     "with",
		"costtype": "pccc",
	}

	// 重複を避けるためのセット
	uniqueValues := map[string]map[string]bool{
		"content": {},
		"client":  {},
		"purpose": {},
		"action":  {},
		"with":    {},
		"pccc":    {},
		"remark":  {},
	}

	for _, item := range rawItems {
		if newType, ok := typeMap[item.Type]; ok {
			// 重複を避ける
			if _, exists := uniqueValues[newType][item.Value]; !exists {
				uniqueValues[newType][item.Value] = true

				// 適切なフィールドに追加
				switch newType {
				case "content":
					dbItems.Content = append(dbItems.Content, item.Value)
				case "client":
					dbItems.Client = append(dbItems.Client, item.Value)
				case "purpose":
					dbItems.Purpose = append(dbItems.Purpose, item.Value)
				case "action":
					dbItems.Action = append(dbItems.Action, item.Value)
				case "with":
					dbItems.With = append(dbItems.With, item.Value)
				case "pccc":
					dbItems.PcCc = append(dbItems.PcCc, item.Value)
				case "remark":
					dbItems.Remark = append(dbItems.Remark, item.Value)
				}
			}
		}
	}

	// ダミーデータは追加しない（スプレッドシートからのデータのみを使用）

	c.JSON(http.StatusOK, dbItems)
}

func (h *Handler) SaveDbItems(c *gin.Context) {
	var items []models.DbItem
	if err := c.ShouldBindJSON(&items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.SaveDbItems(items); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "保存しました"})
}

func (h *Handler) DeleteDbItems(c *gin.Context) {
	var items []models.DbItem
	if err := c.ShouldBindJSON(&items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.DeleteDbItems(items); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "削除しました"})
}

func (h *Handler) ServeIndex(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", nil)
}
