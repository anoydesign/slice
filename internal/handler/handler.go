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

func NewHandler(repo repository.Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetTimeEntries(c *gin.Context) {
	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日付が指定されていません"})
		return
	}

	entries, err := h.repo.GetTimeEntries(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entries)
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
	items, err := h.repo.GetDbItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
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
