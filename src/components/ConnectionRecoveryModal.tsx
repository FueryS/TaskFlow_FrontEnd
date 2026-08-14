/**
 * @file ConnectionRecoveryModal.tsx
 * @description Modal dialog displayed when server connection is lost or Render cold-start is occurring.
 * 
 * Key Responsibilities:
 * - Inform the user gracefully about free-tier server spin-up latency (3-4 minutes).
 * - Render an animated progress bar with background reconnection status.
 * - Provide a modular container slot designated for the interactive breakout / ping-pong mini-game.
 * - Allow the user to manually trigger a retry check.
 * 
 * Related Modules / Dependencies:
 * - lucide-react: Icons for server state, reload, and gamepad indicators
 */

import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';
import { BrickBreakerGame } from './BrickBreakerGame/BrickBreakerGame';

interface ConnectionRecoveryModalProps {
  isOpen: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}

export const ConnectionRecoveryModal: React.FC<ConnectionRecoveryModalProps> = ({
  isOpen,
  onRetry,
  isRetrying
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card recovery-modal-card">
        {/* Animated State Icon */}
        <div className="recovery-icon-wrap">
          <ServerCrash size={24} />
        </div>

        {/* Informative Status Message */}
        <h2 className="recovery-title">Server Spinning Up</h2>
        <p className="recovery-description">
          Connection lost. Please wait while the server spins up (it may take 3-4 minutes as the website uses the free tier on Render)...
        </p>

        {/* Indeterminate Animated Progress Bar */}
        <div className="recovery-progress-bar">
          <div className="recovery-progress-fill" />
        </div>

        {/* Interactive Breakout / Ping-Pong Mini-Game */}
        <div style={{ marginBottom: '18px', width: '100%' }}>
          <BrickBreakerGame />
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw size={14} className={isRetrying ? 'status-dot waking_up' : ''} />
            {isRetrying ? 'Connecting to Server...' : 'Check Server Status'}
          </button>
        </div>
      </div>
    </div>
  );
};
