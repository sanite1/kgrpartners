// Mirrors kgr-backend interfaces/todo.interface.ts. The company's
// shared memory: things to buy, meetings, anything with a date that
// must not slip the mind.

export type TodoView = "all" | "attention" | "upcoming" | "snoozed" | "done";

export interface Todo {
  _id: string;
  title: string;
  notes: string;
  dueDate: string; // YYYY-MM-DD, "" = anytime
  done: boolean;
  doneAt?: string;
  doneByName?: string;
  snoozedUntil?: string;
  snoozedByName?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCounts {
  attention: number;
  upcoming: number;
  snoozed: number;
  done: number;
}

export interface CreateTodoPayload {
  title: string;
  notes?: string;
  dueDate?: string;
}

export interface UpdateTodoPayload {
  title?: string;
  notes?: string;
  dueDate?: string; // "" clears the date
}

export interface TodosQueryParams {
  view?: TodoView;
  page?: number;
  pageSize?: number;
}
