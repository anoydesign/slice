package models

// TimeEntry はタイムスライスのエントリを表します
type TimeEntry struct {
	Time    string `json:"time"`
	Content string `json:"content"` // 内容
	Client  string `json:"client"`  // クライアント（誰に、誰のために）
	Purpose string `json:"purpose"` // 目的
	Action  string `json:"action"`  // アクション
	With    string `json:"with"`    // 誰と
	PcCc    string `json:"pccc"`    // PC/CC
	Remark  string `json:"remark"`  // 備考
}

// DbItem は業務データベースの項目を表します
type DbItem struct {
	ID    int64  `json:"id"`
	Type  string `json:"type"`
	Value string `json:"value"`
}

type DbItems struct {
	Content []string `json:"content"` // 内容
	Client  []string `json:"client"`  // クライアント（誰に、誰のために）
	Purpose []string `json:"purpose"` // 目的
	Action  []string `json:"action"`  // アクション
	With    []string `json:"with"`    // 誰と
	PcCc    []string `json:"pccc"`    // PC/CC
	Remark  []string `json:"remark"`  // 備考
}
