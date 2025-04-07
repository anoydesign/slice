package repository

import (
	"database/sql"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/yourusername/timeslice-app/internal/models"
)

type Repository interface {
	GetTimeEntries(date string) ([]models.TimeEntry, error)
	SaveTimeEntries(date string, entries []models.TimeEntry) (time.Time, error)
	GetDbItems() ([]models.DbItem, error)
	SaveDbItems(items []models.DbItem) error
}

// SQLiteRepository はSQLiteデータベースを使用するリポジトリの実装
type SQLiteRepository struct {
	db *sql.DB
}

func NewSQLiteRepository(dbPath string) (*SQLiteRepository, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// テーブル作成
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS time_entries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			time TEXT NOT NULL,
			task TEXT,
			function TEXT,
			mall TEXT,
			cost_type TEXT,
			updated_at TEXT NOT NULL
		);
		
		CREATE TABLE IF NOT EXISTS db_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL,
			value TEXT NOT NULL
		);
	`)
	if err != nil {
		return nil, err
	}

	return &SQLiteRepository{db: db}, nil
}

func (r *SQLiteRepository) GetTimeEntries(date string) ([]models.TimeEntry, error) {
	rows, err := r.db.Query(`
		SELECT id, time, task, function, mall, cost_type, updated_at
		FROM time_entries
		ORDER BY time
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.TimeEntry
	for rows.Next() {
		var entry models.TimeEntry
		err := rows.Scan(
			&entry.ID,
			&entry.Time,
			&entry.Task,
			&entry.Function,
			&entry.Mall,
			&entry.CostType,
			&entry.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

func (r *SQLiteRepository) SaveTimeEntries(date string, entries []models.TimeEntry) (time.Time, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return time.Time{}, err
	}

	// 既存のエントリを削除
	_, err = tx.Exec("DELETE FROM time_entries")
	if err != nil {
		tx.Rollback()
		return time.Time{}, err
	}

	// 新しいエントリを追加
	stmt, err := tx.Prepare(`
		INSERT INTO time_entries (time, task, function, mall, cost_type, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		tx.Rollback()
		return time.Time{}, err
	}
	defer stmt.Close()

	now := time.Now()
	for _, entry := range entries {
		_, err := stmt.Exec(
			entry.Time,
			entry.Task,
			entry.Function,
			entry.Mall,
			entry.CostType,
			entry.UpdatedAt,
		)
		if err != nil {
			tx.Rollback()
			return time.Time{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return time.Time{}, err
	}

	return now, nil
}

func (r *SQLiteRepository) GetDbItems() ([]models.DbItem, error) {
	rows, err := r.db.Query(`
		SELECT id, type, value
		FROM db_items
		ORDER BY type, value
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.DbItem
	for rows.Next() {
		var item models.DbItem
		err := rows.Scan(&item.ID, &item.Type, &item.Value)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}

func (r *SQLiteRepository) SaveDbItems(items []models.DbItem) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	// 既存のアイテムを削除
	_, err = tx.Exec("DELETE FROM db_items")
	if err != nil {
		tx.Rollback()
		return err
	}

	// 新しいアイテムを追加
	for _, item := range items {
		_, err = tx.Exec(`
			INSERT INTO db_items (type, value)
			VALUES (?, ?)
		`, item.Type, item.Value)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}
