/**
 * @file Board.tsx
 * @description Main Kanban board view orchestrating columns, drag-and-drop state, and search filtering.
 * 
 * Key Responsibilities:
 * - Render all Kanban columns side-by-side in a responsive container.
 * - Filter tasks per column based on live title search and priority filters.
 * - Coordinate HTML5 drag and drop movement between columns.
 * 
 * Related Modules / Dependencies:
 * - ./Column: Individual column component
 * - ../types: Column, Task, Priority types
 */

import React from 'react';
import type { Column as ColumnType, Task, Priority } from '../types/index';
import { Column } from './Column';

interface BoardProps {
  columns: ColumnType[];
  searchTerm: string;
  selectedPriority: Priority | 'All';
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask: (taskId: number, destColumnId: number) => void;
  onOpenCreateModal: (columnId?: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  columns,
  searchTerm,
  selectedPriority,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onOpenCreateModal
}) => {
  const handleTaskDragStart = (_e: React.DragEvent<HTMLDivElement>, _task: Task) => {
    // Drag data is attached directly to DataTransfer
  };

  const handleTaskDragEnd = () => {
    // Drag end cleanup
  };

  const handleTaskDrop = (e: React.DragEvent<HTMLDivElement>, destColumnId: number) => {
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.taskId && parsed.sourceColumnId !== destColumnId) {
          onMoveTask(parsed.taskId, destColumnId);
        }
      }
    } catch {
      // Ignore invalid drag transfer data
    }
  };

  return (
    <main className="board-main">
      <div className="board-container">
        {columns.map((column) => {
          // Filter tasks based on search keyword and priority selection
          const filteredTasks = column.tasks.filter((task) => {
            const matchesSearch =
              searchTerm.trim() === '' ||
              task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesPriority =
              selectedPriority === 'All' || task.priority === selectedPriority;

            return matchesSearch && matchesPriority;
          });

          return (
            <Column
              key={column.id}
              column={column}
              allColumns={columns}
              tasks={filteredTasks}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onMoveTask={onMoveTask}
              onOpenCreateModal={onOpenCreateModal}
              onTaskDragStart={handleTaskDragStart}
              onTaskDragEnd={handleTaskDragEnd}
              onTaskDrop={handleTaskDrop}
            />
          );
        })}
      </div>
    </main>
  );
};
