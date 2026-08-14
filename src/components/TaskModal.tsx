/**
 * @file TaskModal.tsx
 * @description Dialog modal for creating new tasks or editing existing ones.
 * 
 * Key Responsibilities:
 * - Collect task title, optional description, priority, and destination column.
 * - Perform instant client-side validation (enforcing non-empty trimmed title).
 * - Distinguish between create mode and edit mode.
 * 
 * Related Modules / Dependencies:
 * - lucide-react: Close icon
 * - ../types: Task, Column, Priority interfaces
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, Column, Priority, CreateTaskPayload, UpdateTaskPayload } from '../types/index';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (payload: CreateTaskPayload) => Promise<void>;
  onSubmitUpdate: (taskId: number, payload: UpdateTaskPayload) => Promise<void>;
  columns: Column[];
  initialColumnId?: number;
  editingTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  columns,
  initialColumnId,
  editingTask
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [columnId, setColumnId] = useState<number>(columns[0]?.id || 1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state whenever editingTask or initialColumnId changes
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setColumnId(editingTask.column_id);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      if (initialColumnId) {
        setColumnId(initialColumnId);
      } else if (columns.length > 0) {
        setColumnId(columns[0].id);
      }
    }
    setError(null);
  }, [editingTask, initialColumnId, columns, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate non-empty title
    if (!title.trim()) {
      setError('Task title is required and cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingTask) {
        await onSubmitUpdate(editingTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          priority
        });
      } else {
        await onSubmitCreate({
          column_id: columnId,
          title: title.trim(),
          description: description.trim() || null,
          priority
        });
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="modal-header">
          <h3 id="modal-headline" className="modal-title">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title Field (Required) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="task-title" className="form-label">
                  Title <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: title.length >= 120 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                  {title.length}/120
                </span>
              </div>
              <input
                id="task-title"
                type="text"
                className="form-input"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                maxLength={120}
              />
              {error && <span className="form-error-msg">{error}</span>}
            </div>

            {/* Description Field (Optional) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="task-desc" className="form-label">
                  Description (Optional)
                </label>
                <span style={{ fontSize: '0.72rem', color: description.length >= 600 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                  {description.length}/600
                </span>
              </div>
              <textarea
                id="task-desc"
                className="form-textarea"
                placeholder="Add more details, context, or acceptance criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={600}
              />
            </div>

            {/* Priority & Column Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="task-priority" className="form-label">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {!editingTask && (
                <div className="form-group">
                  <label htmlFor="task-column" className="form-label">
                    Column
                  </label>
                  <select
                    id="task-column"
                    className="form-select"
                    value={columnId}
                    onChange={(e) => setColumnId(Number(e.target.value))}
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
