/**
 * @file App.tsx
 * @description Root application component managing state, network heartbeats, and UI routing.
 * 
 * Key Responsibilities:
 * - Load initial board data and synchronize real-time mutations with the backend.
 * - Manage background heartbeat pinging to keep free-tier instances (Render) active.
 * - Detect cold-start server latencies and trigger ConnectionRecoveryModal.
 * - Provide centralized CRUD handlers with optimistic updates and toast feedback.
 * 
 * Related Modules / Dependencies:
 * - ./services/api: Backend API client
 * - ./components/Navbar: Navigation, search, and priority controls
 * - ./components/Board: Kanban board and column renderer
 * - ./components/TaskModal: Task creation/editing modal
 * - ./components/ConnectionRecoveryModal: Cold-start alert modal
 * - ./components/Toast: Floating toast notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Board } from './components/Board';
import { TaskModal } from './components/TaskModal';
import { ConnectionRecoveryModal } from './components/ConnectionRecoveryModal';
import { Toast } from './components/Toast';
import {
  getBoard,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  pingServer
} from './services/api';
import type {
  Column,
  Task,
  Priority,
  ConnectionStatus,
  ToastMessage,
  CreateTaskPayload,
  UpdateTaskPayload
} from './types/index';

const NORMAL_PING_INTERVAL_MS = 25000;
const RECOVERY_PING_INTERVAL_MS = 2500;

export const App: React.FC = () => {
  // Board & Column State
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'All'>('All');

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [modalColumnId, setModalColumnId] = useState<number | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Connection & Heartbeat State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);
  const [isRetryingConnection, setIsRetryingConnection] = useState<boolean>(false);

  // Toast Feedback State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Fetches the board data from the backend.
   */
  const loadBoardData = useCallback(async (isInitial: boolean = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const data = await getBoard(1);
      setColumns(data.columns);
      setConnectionStatus('connected');
      setIsRecoveryModalOpen(false);
    } catch {
      setConnectionStatus('waking_up');
      setIsRecoveryModalOpen(true);
      if (!isInitial) {
        showToast('Connection interrupted. Server may be spinning up.', 'error');
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [showToast]);

  // Initial Load
  useEffect(() => {
    loadBoardData(true);
  }, [loadBoardData]);

  /**
   * Adaptive Heartbeat Ping & Fast Auto-Recovery Polling:
   * When connected, pings every 25s to keep Render active.
   * When disconnected or waking up, aggressively polls every 2.5s so the UI recovers
   * the instant the backend finishes spinning up, eliminating unnecessary idle time.
   */
  useEffect(() => {
    const isWarmingUp = connectionStatus !== 'connected' || isRecoveryModalOpen;
    const intervalTime = isWarmingUp ? RECOVERY_PING_INTERVAL_MS : NORMAL_PING_INTERVAL_MS;

    const interval = setInterval(async () => {
      try {
        await pingServer();
        // If server is responsive, refresh data and restore online status immediately
        if (connectionStatus !== 'connected' || isRecoveryModalOpen) {
          const boardData = await getBoard(1);
          setColumns(boardData.columns);
          setConnectionStatus('connected');
          setIsRecoveryModalOpen(false);
          showToast('Server active. Connected successfully.', 'success');
        }
      } catch {
        if (connectionStatus === 'connected') {
          setConnectionStatus('waking_up');
          setIsRecoveryModalOpen(true);
        }
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [connectionStatus, isRecoveryModalOpen, showToast]);

  /**
   * Manual retry handler for connection recovery modal.
   */
  const handleManualRetry = async () => {
    setIsRetryingConnection(true);
    try {
      await pingServer();
      await loadBoardData(false);
      setConnectionStatus('connected');
      setIsRecoveryModalOpen(false);
      showToast('Connected to server successfully', 'success');
    } catch {
      showToast('Server is still starting. Please give it another moment.', 'info');
    } finally {
      setIsRetryingConnection(false);
    }
  };

  // ============================================================================
  // Task Mutation Handlers
  // ============================================================================

  const handleOpenCreateModal = (columnId?: number) => {
    setEditingTask(null);
    setModalColumnId(columnId || columns[0]?.id);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setModalColumnId(task.column_id);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    try {
      await createTask(payload);
      await loadBoardData(false);
      showToast('Task created successfully', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to create task', 'error');
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: number, payload: UpdateTaskPayload) => {
    try {
      await updateTask(taskId, payload);
      await loadBoardData(false);
      showToast('Task updated successfully', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to update task', 'error');
      throw err;
    }
  };

  const handleMoveTask = async (taskId: number, destColumnId: number) => {
    try {
      // Optimistic UI update for immediate tactile feedback
      setColumns((prev) => {
        let taskToMove: Task | null = null;
        const cleaned = prev.map((col) => {
          const found = col.tasks.find((t) => t.id === taskId);
          if (found) {
            taskToMove = { ...found, column_id: destColumnId };
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }
          return col;
        });

        if (!taskToMove) return prev;

        return cleaned.map((col) => {
          if (col.id === destColumnId && taskToMove) {
            return { ...col, tasks: [...col.tasks, taskToMove] };
          }
          return col;
        });
      });

      // Synchronize with backend
      await moveTask(taskId, { column_id: destColumnId });
      showToast('Task moved', 'success');
    } catch (err) {
      showToast('Failed to move task. Reverting state...', 'error');
      await loadBoardData(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      // Optimistic removal
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId)
        }))
      );

      await deleteTask(taskId);
      showToast('Task deleted', 'success');
    } catch (err) {
      showToast('Failed to delete task', 'error');
      await loadBoardData(false);
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        connectionStatus={connectionStatus}
        onOpenCreateModal={() => handleOpenCreateModal()}
      />

      {/* Main Board View */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
          Loading tasks...
        </div>
      ) : (
        <Board
          columns={columns}
          searchTerm={searchTerm}
          selectedPriority={selectedPriority}
          onEditTask={handleOpenEditModal}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onOpenCreateModal={handleOpenCreateModal}
        />
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmitCreate={handleCreateTask}
        onSubmitUpdate={handleUpdateTask}
        columns={columns}
        initialColumnId={modalColumnId}
        editingTask={editingTask}
      />

      {/* Free-Tier Cold Start & Connection Recovery Alert */}
      <ConnectionRecoveryModal
        isOpen={isRecoveryModalOpen}
        onRetry={handleManualRetry}
        isRetrying={isRetryingConnection}
      />

      {/* Floating Action Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
