package models

// TimeEntry はタイムスライスのエントリを表します
type TimeEntry struct {
	ID        int64  `json:"id"`
	Time      string `json:"time"`
	Task      string `json:"task"`
	Function  string `json:"function"`
	Mall      string `json:"mall"`
	Remark    string `json:"remark"`
	CostType  string `json:"-"`
	UpdatedAt string `json:"-"`
}

// DbItem は業務データベースの項目を表します
type DbItem struct {
	ID    int64  `json:"id"`
	Type  string `json:"Type"`
	Value string `json:"Value"`
}
