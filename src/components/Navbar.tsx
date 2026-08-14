/**
 * @file Navbar.tsx
 * @description Top navigation bar housing branding, search, priority filters, and task creation trigger.
 * 
 * Key Responsibilities:
 * - Display application branding with clean vector icons.
 * - Provide live search input filtering board cards.
 * - Provide priority filter toggle controls (All / High / Medium / Low).
 * - Render real-time server connectivity badge.
 * - Trigger the TaskModal for new task creation.
 * 
 * Related Modules / Dependencies:
 * - lucide-react: Icons for logo, search, addition, and connection
 * - ../types: Priority and ConnectionStatus types
 */

import React from 'react';
import { Kanban, Search, Plus } from 'lucide-react';
import type { Priority, ConnectionStatus } from '../types/index';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPriority: Priority | 'All';
  onPriorityChange: (priority: Priority | 'All') => void;
  connectionStatus: ConnectionStatus;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  connectionStatus,
  onOpenCreateModal
}) => {
  const priorities: (Priority | 'All')[] = ['All', 'High', 'Medium', 'Low'];

  // Format connection status text
  const statusLabel = {
    connected: 'Online',
    connecting: 'Connecting...',
    waking_up: 'Server Warming...',
    disconnected: 'Offline'
  }[connectionStatus];

  return (
    <header className="navbar">
      {/* Brand & Connection State */}
      <div className="brand-section">
        <div className="brand-logo-icon" aria-label="TaskFlow Logo">
          <Kanban size={18} />
        </div>
        <h1 className="brand-title">TaskFlow</h1>
        <div className="connection-pill" title={`Server status: ${statusLabel}`}>
          <span className={`status-dot ${connectionStatus}`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Navigation Controls: Search, Filter, Action */}
      <div className="nav-controls">
        {/* Instant Search Bar */}
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="priority-filter-group" role="group" aria-label="Filter tasks by priority">
          {priorities.map((p) => (
            <button
              key={p}
              type="button"
              className={`filter-btn ${selectedPriority === p ? 'active' : ''}`}
              onClick={() => onPriorityChange(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Create Task Action Button */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCreateModal}
        >
          <Plus size={15} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
