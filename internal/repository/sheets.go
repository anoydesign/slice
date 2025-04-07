package repository

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/yourusername/timeslice-app/internal/models"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	sheetsv4 "google.golang.org/api/sheets/v4"
)

// SheetsRepository はGoogle Sheetsを使用するリポジトリの実装
type SheetsRepository struct {
	Service       *sheetsv4.Service
	spreadsheetID string
}

func NewSheetsRepository(ctx context.Context, credentialsFile string, spreadsheetID string) (*SheetsRepository, error) {
	// 認証情報を読み込む
	credentials, err := os.ReadFile(credentialsFile)
	if err != nil {
		return nil, fmt.Errorf("認証情報の読み込みに失敗しました: %v", err)
	}

	// 認証情報を使用して設定を作成（読み書き可能なスコープに変更）
	config, err := google.JWTConfigFromJSON(credentials, sheetsv4.SpreadsheetsScope)
	if err != nil {
		return nil, fmt.Errorf("認証設定の作成に失敗しました: %v", err)
	}

	// サービスを作成
	client := config.Client(ctx)
	service, err := sheetsv4.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("Sheetsサービスの作成に失敗しました: %v", err)
	}

	return &SheetsRepository{
		Service:       service,
		spreadsheetID: spreadsheetID,
	}, nil
}

func (r *SheetsRepository) GetTimeEntries(date string) ([]models.TimeEntry, error) {
	// スプレッドシートからデータを取得
	// 日付に基づいてシート名を指定
	rangeStr := fmt.Sprintf("%s!A2:F", date)
	resp, err := r.Service.Spreadsheets.Values.Get(r.spreadsheetID, rangeStr).Do()
	if err != nil {
		return nil, fmt.Errorf("データの取得に失敗しました: %v", err)
	}

	var entries []models.TimeEntry
	for _, row := range resp.Values {
		if len(row) < 6 {
			continue
		}

		// Ensure row values are strings, handle potential type assertion errors
		timeStr, _ := row[0].(string)
		taskStr, _ := row[1].(string)
		funcStr, _ := row[2].(string)
		mallStr, _ := row[3].(string)
		// row[4] is CostType, ignore it for the model
		remarkStr := ""   // Default to empty string if not present or wrong type
		if len(row) > 5 { // Check if the 6th element exists
			remarkStr, _ = row[5].(string)
		}

		entry := models.TimeEntry{
			Time:     timeStr,
			Task:     taskStr,
			Function: funcStr,
			Mall:     mallStr,
			Remark:   remarkStr, // Assign row[5] to Remark
			// CostType and UpdatedAt are omitted as per model changes
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

func (r *SheetsRepository) SaveTimeEntries(date string, entries []models.TimeEntry) (time.Time, error) {
	// シートが存在しない場合は作成
	sheetExists := false
	sheets, err := r.Service.Spreadsheets.Get(r.spreadsheetID).Do()
	if err != nil {
		return time.Time{}, fmt.Errorf("シート一覧の取得に失敗しました: %v", err)
	}

	for _, sheet := range sheets.Sheets {
		if sheet.Properties.Title == date {
			sheetExists = true
			break
		}
	}

	if !sheetExists {
		// 新しいシートを作成
		requests := []*sheetsv4.Request{
			{
				AddSheet: &sheetsv4.AddSheetRequest{
					Properties: &sheetsv4.SheetProperties{
						Title: date,
					},
				},
			},
		}

		_, err := r.Service.Spreadsheets.BatchUpdate(r.spreadsheetID, &sheetsv4.BatchUpdateSpreadsheetRequest{
			Requests: requests,
		}).Do()
		if err != nil {
			return time.Time{}, fmt.Errorf("シートの作成に失敗しました: %v", err)
		}
	}

	// ヘッダー行を準備
	header := [][]interface{}{
		{"時間", "内容", "機能別", "モール別", "コスト区分", "更新日時"},
	}

	// データ行を準備
	var values [][]interface{}
	for _, entry := range entries {
		row := []interface{}{
			entry.Time,
			entry.Task,
			entry.Function,
			entry.Mall,
			entry.CostType,
			time.Now().Format("2006/01/02 15:04:05"),
		}
		values = append(values, row)
	}

	// データを書き込む
	valueRange := &sheetsv4.ValueRange{
		Values: append(header, values...),
	}

	// 既存のデータをクリア
	_, err = r.Service.Spreadsheets.Values.Clear(r.spreadsheetID, date+"!A1:Z", &sheetsv4.ClearValuesRequest{}).Do()
	if err != nil {
		return time.Time{}, fmt.Errorf("データのクリアに失敗しました: %v", err)
	}

	// 新しいデータを書き込む
	_, err = r.Service.Spreadsheets.Values.Update(r.spreadsheetID, date+"!A1", valueRange).
		ValueInputOption("RAW").
		Do()
	if err != nil {
		return time.Time{}, fmt.Errorf("データの書き込みに失敗しました: %v", err)
	}

	return time.Now(), nil
}

func (r *SheetsRepository) GetDbItems() ([]models.DbItem, error) {
	// ドロップダウンメニューの項目を取得
	// 業務データベースシートのA2からB列までのデータを取得
	resp, err := r.Service.Spreadsheets.Values.Get(r.spreadsheetID, "業務データベース!A2:B").Do()
	if err != nil {
		return nil, fmt.Errorf("業務データベースの取得に失敗しました: %v", err)
	}

	var items []models.DbItem
	for _, row := range resp.Values {
		if len(row) < 2 {
			continue
		}

		item := models.DbItem{
			Type:  row[0].(string),
			Value: row[1].(string),
		}
		items = append(items, item)
	}

	return items, nil
}

func (r *SheetsRepository) SaveDbItems(items []models.DbItem) error {
	// ヘッダー行を準備
	header := [][]interface{}{
		{"項目種別", "項目名"},
	}

	// データ行を準備
	var values [][]interface{}
	for _, item := range items {
		row := []interface{}{
			item.Type,
			item.Value,
		}
		values = append(values, row)
	}

	// データを書き込む
	valueRange := &sheetsv4.ValueRange{
		Values: append(header, values...),
	}

	// 既存のデータをクリア
	_, err := r.Service.Spreadsheets.Values.Clear(r.spreadsheetID, "業務データベース!A1:Z", &sheetsv4.ClearValuesRequest{}).Do()
	if err != nil {
		return fmt.Errorf("データのクリアに失敗しました: %v", err)
	}

	// 新しいデータを書き込む
	_, err = r.Service.Spreadsheets.Values.Update(r.spreadsheetID, "業務データベース!A1", valueRange).
		ValueInputOption("RAW").
		Do()
	if err != nil {
		return fmt.Errorf("データの書き込みに失敗しました: %v", err)
	}

	return nil
}
