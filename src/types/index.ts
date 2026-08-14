/**
 * @file index.ts
 * @description Central TypeScript type and interface definitions for TaskFlow frontend.
 * 
 * Key Responsibilities:
 * - Define domain models (Board, Column, Task, Priority).
 * - Define API payload shapes for creation, updates, and moves.
 * - Define UI state types (connection status, filters, notifications).
 */

export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  priority: Priority;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  created_at: string;
  tasks: Task[];
}

export interface Board {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface BoardData {
  board: Board;
  columns: Column[];
}

export interface CreateTaskPayload {
  column_id: number;
  title: string;
  description?: string | null;
  priority?: Priority;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: Priority;
}

export interface MoveTaskPayload {
  column_id: number;
  position?: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'waking_up';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
