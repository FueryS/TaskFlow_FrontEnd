/**
 * @file TaskCard.tsx
 * @description Individual task card rendering title, description, priority badge, and controls.
 * 
 * Key Responsibilities:
 * - Render task metadata with clear visual hierarchy.
 * - Support HTML5 native Drag-and-Drop functionality.
 * - Provide accessible fallback dropdown controls for moving cards between columns.
 * - Provide edit and delete action triggers.
 * 
 * Related Modules / Dependencies:
 * - lucide-react: Icons for edit, delete, drag grip
 * - ../types: Task, Column interfaces
 */

import React, { useState } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import type { Task, Column } from '../types/index';

interface TaskCardProps {
  task: Task;
  allColumns: Column[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onMove: (taskId: number, destColumnId: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  allColumns,
  onEdit,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format creation timestamp
  const formattedDate = new Date(task.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  const handleDragStartInternal = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, sourceColumnId: task.column_id }));
    onDragStart(e, task);
  };

  const handleDragEndInternal = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    onDragEnd(e);
  };

  const handleDeleteWithAnimation = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(task.id);
    }, 240);
  };

  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''} ${isDeleting ? 'deleting' : ''}`}
      draggable={!isDeleting}
      onDragStart={handleDragStartInternal}
      onDragEnd={handleDragEndInternal}
      aria-label={`Task: ${task.title}`}
    >
      {/* Header: Title and Quick Action Buttons */}
      <div className="task-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          <GripVertical size={14} color="#94a3b8" style={{ cursor: 'grab', flexShrink: 0 }} />
          <h4 className="task-title">{task.title}</h4>
        </div>

        <div className="task-actions">
          <button
            type="button"
            className="icon-btn"
            title="Edit Task"
            onClick={() => onEdit(task)}
            aria-label="Edit Task"
            disabled={isDeleting}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            title="Delete Task"
            onClick={handleDeleteWithAnimation}
            aria-label="Delete Task"
            disabled={isDeleting}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Optional Description */}
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {/* Footer: Priority Badge, Date & Accessible Column Switcher */}
      <div className="task-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge-priority ${task.priority}`}>
            {task.priority}
          </span>
          <span className="task-date">{formattedDate}</span>
        </div>

        {/* Accessible Fallback Control: Select destination column */}
        <select
          className="move-select"
          value={task.column_id}
          onChange={(e) => onMove(task.id, Number(e.target.value))}
          aria-label="Move task to column"
          title="Move to column"
        >
          {allColumns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
