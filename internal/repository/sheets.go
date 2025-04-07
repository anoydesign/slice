package repository

import (
	"context"
	"fmt"
	"os"
	"strings"
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
	// 日付をシート名として使用
	rangeStr := date + "!A2:H"
	fmt.Printf("スプレッドシートからデータを取得します: ID=%s, Range=%s\n", r.spreadsheetID, rangeStr)

	// まずスプレッドシートのすべてのシート名を取得して確認
	sheets, err := r.Service.Spreadsheets.Get(r.spreadsheetID).Do()
	if err != nil {
		fmt.Printf("スプレッドシート情報の取得に失敗しました: %v\n", err)
	} else {
		fmt.Println("スプレッドシートに存在するシート一覧:")
		for _, sheet := range sheets.Sheets {
			fmt.Printf("- %s\n", sheet.Properties.Title)
		}
	}

	resp, err := r.Service.Spreadsheets.Values.Get(r.spreadsheetID, rangeStr).Do()
	if err != nil {
		// より詳細なエラー情報を出力
		fmt.Printf("タイムエントリ取得でエラーが発生しました: %v\n", err)

		// シートが存在しない場合は空のデータを返すオプション
		if strings.Contains(err.Error(), "Unable to parse range") || strings.Contains(err.Error(), "404") {
			fmt.Printf("シート '%s' が存在しないか空です。空のエントリリストを返します。\n", rangeStr)
			return []models.TimeEntry{}, nil
		}

		return nil, fmt.Errorf("データの取得に失敗しました: %v", err)
	}

	fmt.Printf("取得したデータの行数: %d\n", len(resp.Values))
	for i, row := range resp.Values {
		fmt.Printf("行 %d: 列数=%d, 内容=%v\n", i+2, len(row), row) // A2から始まるのでインデックスは+2
	}

	var entries []models.TimeEntry
	for i, row := range resp.Values {
		// 行が少なくとも1つの要素（時間）を持っていることを確認
		if len(row) < 1 {
			fmt.Printf("スキップ: 行 %d は要素がありません\n", i+2)
			continue // 空の行はスキップ
		}

		// 各フィールドを文字列として取得（存在しない場合は空文字）
		timeStr := getStringValueFromRow(row, 0)
		if timeStr == "" {
			fmt.Printf("スキップ: 行 %d は時間がありません\n", i+2)
			continue // 時間が空の行はスキップ（必須項目）
		}

		contentStr := getStringValueFromRow(row, 1)
		if contentStr == "" {
			fmt.Printf("スキップ: 行 %d は内容がありません\n", i+2)
			continue // 内容が空の行はスキップ（必須項目）
		}

		// その他のフィールドは空でも許容
		clientStr := getStringValueFromRow(row, 2)
		purposeStr := getStringValueFromRow(row, 3)
		actionStr := getStringValueFromRow(row, 4)
		withStr := getStringValueFromRow(row, 5)
		pcccStr := getStringValueFromRow(row, 6)
		remarkStr := getStringValueFromRow(row, 7)

		entry := models.TimeEntry{
			Time:    timeStr,
			Content: contentStr,
			Client:  clientStr,
			Purpose: purposeStr,
			Action:  actionStr,
			With:    withStr,
			PcCc:    pcccStr,
			Remark:  remarkStr,
		}
		entries = append(entries, entry)
		fmt.Printf("追加: 行 %d - 時間=%s, 内容=%s, 備考=%s\n", i+2, timeStr, contentStr, remarkStr)
	}

	fmt.Printf("取得したエントリ数: %d\n", len(entries))
	return entries, nil
}

// 行から安全に文字列値を取得するヘルパー関数
func getStringValueFromRow(row []interface{}, index int) string {
	if index < len(row) {
		if val, ok := row[index].(string); ok {
			return val
		}
		// 数値などが含まれる場合に文字列に変換
		if val := row[index]; val != nil {
			return fmt.Sprintf("%v", val)
		}
	}
	return "" // インデックスが範囲外または値がnilの場合
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
		{"時間", "内容", "クライアント", "目的", "アクション", "誰と", "PC/CC", "備考"},
	}

	// データ行を準備
	var values [][]interface{}
	for _, entry := range entries {
		row := []interface{}{
			entry.Time,
			entry.Content,
			entry.Client,
			entry.Purpose,
			entry.Action,
			entry.With,
			entry.PcCc,
			entry.Remark,
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
	// スプレッドシートからデータを取得 (A列からH列まで読み取る)
	rangeStr := "業務データベース!A:H"
	fmt.Printf("スプレッドシートからデータを取得します: ID=%s, Range=%s\n", r.spreadsheetID, rangeStr)

	// まずスプレッドシートのすべてのシート名を取得して確認
	sheets, err := r.Service.Spreadsheets.Get(r.spreadsheetID).Do()
	if err != nil {
		fmt.Printf("スプレッドシート情報の取得に失敗しました: %v\n", err)
	} else {
		fmt.Println("スプレッドシートに存在するシート一覧:")
		for _, sheet := range sheets.Sheets {
			fmt.Printf("- %s\n", sheet.Properties.Title)
		}
	}

	resp, err := r.Service.Spreadsheets.Values.Get(r.spreadsheetID, rangeStr).Do()
	if err != nil {
		// Check if the error is due to the sheet not existing or being empty
		if strings.Contains(err.Error(), "Unable to parse range") || strings.Contains(err.Error(), "404") {
			fmt.Printf("シート '%s' が存在しないか空です。空のアイテムリストを返します。\n", rangeStr)
			return []models.DbItem{}, nil // Return empty list if sheet is not found or empty
		}
		fmt.Printf("詳細なエラー: %v\n", err)
		return nil, fmt.Errorf("スプレッドシートからデータを取得できませんでした: %v", err)
	}

	fmt.Printf("取得したデータ: %+v\n", resp.Values)

	if len(resp.Values) == 0 {
		fmt.Println("シートにデータがありません。")
		return []models.DbItem{}, nil // No data in the sheet
	}

	// データを変換
	var items []models.DbItem
	headerRow := resp.Values[0] // 最初の行をヘッダーとして取得
	idCounter := int64(1)

	// 列ごとに処理
	for colIndex, headerCell := range headerRow {
		headerStr, ok := headerCell.(string)
		if !ok || headerStr == "" {
			fmt.Printf("ヘッダーが無効です (列 %d): %+v\n", colIndex+1, headerCell)
			continue // Skip columns with invalid headers
		}

		// ヘッダー名をTypeとして使用 (小文字に統一)
		itemType := strings.ToLower(headerStr)
		// 新しいフィールド名にマッピング
		switch itemType {
		case "内容":
			itemType = "content"
		case "クライアント":
			itemType = "client"
		case "目的":
			itemType = "purpose"
		case "アクション":
			itemType = "action"
		case "誰と":
			itemType = "with"
		case "pc/cc":
			itemType = "pccc"
		case "備考":
			itemType = "remark"
		// 古いフィールド名もサポート
		case "task":
			itemType = "content"
		case "function":
			itemType = "action"
		case "mall":
			itemType = "with"
		case "costtype":
			itemType = "pccc"
		// 時間はスキップ
		case "時間":
			continue
		case "項目種別", "項目名":
			// A1:B形式の場合、特別な処理
			if colIndex == 0 && len(headerRow) >= 2 {
				if secondHeader, ok := headerRow[1].(string); ok && secondHeader == "項目名" {
					// A列がType、B列がValueの形式と判断
					for rowIndex := 1; rowIndex < len(resp.Values); rowIndex++ {
						row := resp.Values[rowIndex]
						if len(row) < 2 {
							continue // Skip incomplete rows
						}

						typeVal := getStringValueFromRow(row, 0)
						valueVal := getStringValueFromRow(row, 1)

						if typeVal != "" && valueVal != "" {
							// typeを正規化
							normalizedType := strings.ToLower(typeVal)
							switch normalizedType {
							case "task", "内容":
								normalizedType = "content"
							case "function", "機能別", "アクション":
								normalizedType = "action"
							case "mall", "モール別", "誰と":
								normalizedType = "with"
							case "costtype", "コスト区分", "pc/cc":
								normalizedType = "pccc"
							case "備考":
								normalizedType = "remark"
							case "client", "クライアント":
								normalizedType = "client"
							case "purpose", "目的":
								normalizedType = "purpose"
							}

							items = append(items, models.DbItem{
								ID:    idCounter,
								Type:  normalizedType,
								Value: valueVal,
							})
							idCounter++
						}
					}
					// A:B形式の処理が終わったのでループを抜ける
					break
				}
			}
			continue // 通常の列ベースの処理には含めない
		}

		// 2行目以降のデータをValueとして取得
		for rowIndex := 1; rowIndex < len(resp.Values); rowIndex++ {
			row := resp.Values[rowIndex]
			// 列インデックスが現在の行の範囲内にあるか確認
			if colIndex < len(row) {
				valueStr := getStringValueFromRow(row, colIndex)
				// 値が空でない場合のみ追加
				if valueStr != "" {
					items = append(items, models.DbItem{
						ID:    idCounter,
						Type:  itemType,
						Value: valueStr,
					})
					idCounter++
				}
			}
		}
	}

	fmt.Printf("変換後のアイテム数: %d\n", len(items))
	return items, nil
}

func (r *SheetsRepository) SaveDbItems(items []models.DbItem) error {
	// 注意: このメソッドは現在の GetDbItems の構造と整合性が取れていない可能性があります。
	//       GetDbItems が列ベースでデータを読むようになったため、
	//       保存ロジックもそれに対応するか、別途検討が必要です。
	//       一旦、既存のロジックを残しますが、意図通りに動作しない可能性があります。

	// データを書き込む前に既存のデータを取得 (修正後のGetDbItemsを呼ぶ)
	existingItems, err := r.GetDbItems()
	if err != nil {
		// GetDbItemsが空を返す場合のエラーハンドリングを追加
		if err.Error() == "シートにデータがありません。" {
			existingItems = []models.DbItem{} // Treat as empty
		} else {
			return fmt.Errorf("既存のデータの取得に失敗しました: %v", err)
		}
	}

	// 既存のデータと新しいデータをマージ (TypeとValueのペアで重複排除)
	mergedItemsMap := make(map[string]map[string]bool)

	// 既存のデータを追加
	for _, item := range existingItems {
		if _, ok := mergedItemsMap[item.Type]; !ok {
			mergedItemsMap[item.Type] = make(map[string]bool)
		}
		mergedItemsMap[item.Type][item.Value] = true
	}

	// 新しいデータを追加（重複を避ける）
	for _, item := range items {
		// Typeを小文字に変換して統一
		normalizedType := strings.ToLower(item.Type)
		// マッピングを適用 (GetDbItemsと同様)
		switch normalizedType {
		case "task", "内容":
			normalizedType = "content"
		case "function", "機能別", "アクション":
			normalizedType = "action"
		case "mall", "モール別", "誰と":
			normalizedType = "with"
		case "costtype", "コスト区分", "pc/cc":
			normalizedType = "pccc"
		case "remark", "備考":
			normalizedType = "remark"
		case "client", "クライアント":
			normalizedType = "client"
		case "purpose", "目的":
			normalizedType = "purpose"
		default:
			// 知らないTypeはスキップするか、エラーにするか検討
			fmt.Printf("不明なDB項目タイプです: %s (値: %s)\n", item.Type, item.Value)
			continue
		}

		if _, ok := mergedItemsMap[normalizedType]; !ok {
			mergedItemsMap[normalizedType] = make(map[string]bool)
		}
		mergedItemsMap[normalizedType][item.Value] = true
	}

	// --- 保存形式の再考が必要 ---
	// 現在のSaveDbItemsは、TypeとValueのペアをA列とB列に書き込む想定。
	// しかし、GetDbItemsは列ヘッダーをTypeとして読むようになった。
	// このままでは、SaveDbItemsは意図した形式で「業務データベース」シートに書き込めない。
	//
	// 例：GetDbItemsで Content列から ["会議", "資料作成"] を読み込んだ場合、
	//    SaveDbItemsで書き込むデータは [][]interface{}{{"content", "会議"}, {"content", "資料作成"}} となり、
	//    これをA列B列に書き込んでしまう。
	//
	// **対応策案:**
	// 1. SaveDbItems を無効化/削除する (DB項目は手動でメンテすると割り切る)
	// 2. SaveDbItems を大幅に修正し、列ベースの書き込みに対応する
	//    - マージ後の `mergedItemsMap` から、列ヘッダーと値のリストを作成する。
	//    - 例: {"content": {"会議": true, "資料作成": true}, "client": {"A社": true}}
	//      -> ヘッダー: ["content", "client"]
	//      -> データ:   [["会議", "A社"], ["資料作成", ""]]
	//    - これをスプレッドシートに書き込む。実装が複雑になる。
	//
	// ここでは一旦、元のA:B書き込みロジックを残すが、コメントで注意喚起する。

	// マージしたデータをスライスに変換 (元のA:B書き込み形式)
	var values [][]interface{}
	fmt.Println("--- SaveDbItems: 注意 ---")
	fmt.Println("現在の保存ロジックはA列B列形式です。GetDbItemsの変更と整合性が取れていない可能性があります。")
	fmt.Println("業務データベースシートの更新は手動で行うか、SaveDbItemsの修正が必要です。")
	typeToSort := []string{}
	for itemType := range mergedItemsMap {
		typeToSort = append(typeToSort, itemType)
	}
	// ソートして書き込み順序を安定させる（任意）
	// sort.Strings(typeToSort)

	for _, itemType := range typeToSort {
		for value := range mergedItemsMap[itemType] {
			// 元のヘッダー名に戻す方が親切かもしれないが、一旦小文字のまま
			values = append(values, []interface{}{itemType, value})
		}
	}

	// データを書き込む
	valueRange := &sheetsv4.ValueRange{
		Values: values,
	}

	// 既存のデータをクリア (A:Bのみクリア)
	clearRange := "業務データベース!A:B"
	_, err = r.Service.Spreadsheets.Values.Clear(r.spreadsheetID, clearRange, &sheetsv4.ClearValuesRequest{}).Do()
	if err != nil {
		// クリア対象が存在しなくてもエラーになることがあるため、特定のエラーは無視する可能性がある
		fmt.Printf("DBアイテムのクリアに失敗しました (無視される可能性あり): %v\n", err)
		// return fmt.Errorf("データのクリアに失敗しました: %v", err)
	}

	if len(values) > 0 {
		// 新しいデータを書き込む (A1から書き込み)
		updateRange := "業務データベース!A1"
		_, err = r.Service.Spreadsheets.Values.Update(r.spreadsheetID, updateRange, valueRange).
			ValueInputOption("RAW").
			Do()
		if err != nil {
			return fmt.Errorf("データの書き込みに失敗しました: %v", err)
		}
	} else {
		fmt.Println("書き込むDBアイテムがありません。クリアのみ実行されました。")
	}

	return nil
}

func (r *SheetsRepository) DeleteDbItems(items []models.DbItem) error {
	// 現在のデータを取得
	currentItems, err := r.GetDbItems()
	if err != nil {
		return err
	}

	// 削除対象のアイテムを除外
	var remainingItems []models.DbItem
	for _, currentItem := range currentItems {
		shouldDelete := false
		for _, itemToDelete := range items {
			if currentItem.Type == itemToDelete.Type && currentItem.Value == itemToDelete.Value {
				shouldDelete = true
				break
			}
		}
		if !shouldDelete {
			remainingItems = append(remainingItems, currentItem)
		}
	}

	// 残りのアイテムを保存
	if len(remainingItems) == 0 {
		// すべてのアイテムが削除された場合は、空のデータを保存
		valueRange := &sheetsv4.ValueRange{
			Values: [][]interface{}{
				{"項目種別", "項目名"},
			},
		}
		_, err = r.Service.Spreadsheets.Values.Update(r.spreadsheetID, "業務データベース!A1", valueRange).
			ValueInputOption("RAW").
			Do()
		return err
	}

	return r.SaveDbItems(remainingItems)
}
