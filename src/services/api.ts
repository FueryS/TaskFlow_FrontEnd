/**
 * @file api.ts
 * @description API service client communicating with the TaskFlow backend.
 * 
 * Key Responsibilities:
 * - Automatically inject the required security handshake header (x-taskflow-client).
 * - Provide clean, strongly typed asynchronous methods for Board and Task CRUD operations.
 * - Manage background heartbeat pinging to keep free-tier instances (Render) awake.
 * - Detect network disconnections and server cold-start latencies.
 * 
 * Related Modules / Dependencies:
 * - ../types/index: Data contract interfaces
 */

import type {
  BoardData,
  CreateTaskPayload,
  UpdateTaskPayload,
  MoveTaskPayload,
  Task
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const CLIENT_SECRET_TOKEN = import.meta.env.VITE_CLIENT_SECRET_TOKEN || 'taskflow-web-client-v1';

/**
 * Standard fetch wrapper with built-in headers, timeout, and JSON response parsing.
 */
async function fetchWithSecurity<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-taskflow-client': CLIENT_SECRET_TOKEN,
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      (error as unknown as { code?: string }).code = data?.error?.code || 'API_ERROR';
      throw error;
    }

    return data.data as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      const timeoutError = new Error('Server response timed out. The server might be spinning up.');
      (timeoutError as unknown as { code?: string }).code = 'SERVER_TIMEOUT';
      throw timeoutError;
    }
    throw err;
  }
}

// ==============================================================================
// API Client Functions
// ==============================================================================

/**
 * Fetch a full board with its columns and tasks.
 */
export async function getBoard(boardId: number = 1): Promise<BoardData> {
  return fetchWithSecurity<BoardData>(`/boards/${boardId}`);
}

/**
 * Create a new task.
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return fetchWithSecurity<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Update an existing task.
 */
export async function updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
  return fetchWithSecurity<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

/**
 * Move a task to a different column or reorder its position.
 */
export async function moveTask(id: number, payload: MoveTaskPayload): Promise<Task> {
  return fetchWithSecurity<Task>(`/tasks/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/**
 * Delete a task by ID.
 */
export async function deleteTask(id: number): Promise<{ id: number }> {
  return fetchWithSecurity<{ id: number }>(`/tasks/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Heartbeat Ping: Lightweight check verifying server is online.
 */
export async function pingServer(): Promise<{ status: string; uptimeSeconds: number }> {
  return fetchWithSecurity<{ status: string; uptimeSeconds: number }>(
    '/health/ping',
    { method: 'GET' },
    5000
  );
}
