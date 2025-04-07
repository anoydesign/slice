package handler

import (
	"net/http"

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
	Task     string `json:"task"`
	Function string `json:"function"`
	Mall     string `json:"mall"`
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

	backendEntries, err := h.repo.GetTimeEntries(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Transform data for frontend
	frontendEntries := make([]FrontendTimeEntry, len(backendEntries))
	for i, entry := range backendEntries {
		frontendEntries[i] = FrontendTimeEntry{
			ID:       i + 1, // Simple ID based on row number (starts from 1)
			Time:     entry.Time,
			Task:     entry.Task,
			Function: entry.Function,
			Mall:     entry.Mall,
			Remark:   entry.Remark,
			Selected: false, // Default to not selected
		}
	}

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
	rawItems, err := h.repo.GetDbItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Transform data for frontend
	formattedItems := map[string][]string{
		"task":     []string{},
		"function": []string{},
		"mall":     []string{},
		"remark":   []string{},
	}

	// Map spreadsheet types to frontend keys (adjust if needed)
	typeMap := map[string]string{
		"内容":   "task",     // Assuming "内容" in spreadsheet maps to "task"
		"機能別":  "function", // Assuming "機能別" maps to "function"
		"モール別": "mall",     // Assuming "モール別" maps to "mall" (This might be case-sensitive)
		"備考":   "remark",   // Assuming "備考" maps to "remark"
		"mall": "mall",     // Add mapping for the actual value in the sheet
	}

	for _, item := range rawItems {
		if frontendKey, ok := typeMap[item.Type]; ok {
			formattedItems[frontendKey] = append(formattedItems[frontendKey], item.Value)
		}
	}

	// Ensure all keys exist even if empty
	for _, key := range []string{"task", "function", "mall", "remark"} {
		if _, exists := formattedItems[key]; !exists {
			formattedItems[key] = []string{}
		}
	}

	c.JSON(http.StatusOK, formattedItems) // Return the transformed map
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

func (h *Handler) ServeIndex(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", nil)
}
