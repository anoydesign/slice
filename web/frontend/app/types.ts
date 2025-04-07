export interface FrontendTimeEntry {
  id: number;
  time: string;
  task: string;
  function: string;
  mall: string;
  remark: string;
  selected: boolean;
}

export interface DbItems {
  task: string[];
  function: string[];
  mall: string[];
  remark: string[];
} 