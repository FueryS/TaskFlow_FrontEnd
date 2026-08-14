/**
 * @file Column.tsx
 * @description Represents a Kanban workflow column housing tasks and handling drop events.
 * 
 * Key Responsibilities:
 * - Render column header with dynamic task counter badge.
 * - Manage HTML5 Drag-and-Drop drag-over and drop event targets.
 * - Display empty state when no tasks match current filters.
 * - Provide an inline quick-add trigger button for the column.
 * 
 * Related Modules / Dependencies:
 * - ./TaskCard: Component for individual task cards
 * - lucide-react: Plus icon for quick task addition
 * - ../types: Column, Task models
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Column as ColumnType, Task } from '../types/index';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  allColumns: ColumnType[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask: (taskId: number, destColumnId: number) => void;
  onOpenCreateModal: (columnId: number) => void;
  onTaskDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onTaskDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onTaskDrop: (e: React.DragEvent<HTMLDivElement>, destColumnId: number) => void;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  allColumns,
  tasks,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onOpenCreateModal,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    onTaskDrop(e, column.id);
  };

  return (
    <div
      className={`column-card ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`Column: ${column.name}`}
    >
      {/* Column Header */}
      <div className="column-header">
        <div className="column-title-group">
          <h3 className="column-name">{column.name}</h3>
          <span className="column-count-badge" title={`${tasks.length} tasks in this column`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-container">
        {tasks.length === 0 ? (
          <div className="column-empty-state">
            No tasks in this lane
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              allColumns={allColumns}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
            />
          ))
        )}
      </div>

      {/* Column Footer with Quick Add */}
      <div className="column-footer">
        <button
          type="button"
          className="add-task-btn"
          onClick={() => onOpenCreateModal(column.id)}
        >
          <Plus size={14} />
          <span>Add task</span>
        </button>
      </div>
    </div>
  );
};
