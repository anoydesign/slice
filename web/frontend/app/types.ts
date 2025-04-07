export interface FrontendTimeEntry {
  id: number;
  time: string;
  content: string;        // 内容
  client: string;         // クライアント（誰に、誰のために）
  purpose: string;        // 目的
  action: string;         // アクション
  with: string;          // 誰と
  pccc: string;          // PC/CC
  remark: string;        // 備考
  selected: boolean;
  hasError: boolean;
}

export interface DbItems {
  content: string[];      // 内容
  client: string[];       // クライアント（誰に、誰のために）
  purpose: string[];      // 目的
  action: string[];       // アクション
  with: string[];        // 誰と
  pccc: string[];        // PC/CC
  remark: string[];      // 備考
}

export interface Preset {
  id: string;
  name: string;
  time: string;
  content: string;        // 内容
  client: string;         // クライアント（誰に、誰のために）
  purpose: string;        // 目的
  action: string;         // アクション
  with: string;          // 誰と
  pccc: string;          // PC/CC
  remark: string;        // 備考
} 