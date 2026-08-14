/**
 * @file BrickBreakerGame.tsx
 * @description Standalone, responsive BrickBreaker / Ping-Pong mini-game component.
 * 
 * Key Responsibilities:
 * - Render an interactive HTML5 2D canvas game loop.
 * - Provide multi-device input support: Mouse move, Touch swipe/drag, and Arrow keys.
 * - Keep players engaged during cold-start server waits with score tracking and particle sparks.
 * - Persist personal high score across sessions via localStorage.
 * 
 * Reusability:
 * - Completely self-contained component with zero external state requirements.
 * - Can be imported and mounted into any React or Next.js container.
 * 
 * Related Modules / Dependencies:
 * - ./gameEngine: Physics and collision calculation logic
 * - ./BrickBreakerGame.css: Styling for canvas and HUD
 * - lucide-react: Icons for play, restart, and score
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Heart } from 'lucide-react';
import {
  createInitialGameState,
  updateGamePhysics,
  type GameState
} from './gameEngine';
import './BrickBreakerGame.css';

const HIGH_SCORE_STORAGE_KEY = 'taskflow_brickbreaker_high_score';

export interface BrickBreakerGameProps {
  onScoreChange?: (score: number) => void;
}

export const BrickBreakerGame: React.FC<BrickBreakerGameProps> = ({ onScoreChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<GameState | null>(null);
  const targetPaddleXRef = useRef<number>(240);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize or reset game instance
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const initial = createInitialGameState(width, height);
    stateRef.current = initial;
    targetPaddleXRef.current = width / 2;
    setGameState({ ...initial });
  }, []);

  // Update canvas internal resolution to match container bounding rect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasDimensions = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width || 480);
      const newHeight = 240;

      canvas.width = newWidth;
      canvas.height = newHeight;
      initGame();
    };

    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [initGame]);

  // Start game action
  const handleStartGame = () => {
    if (!stateRef.current) return;
    stateRef.current.isRunning = true;
    stateRef.current.isGameOver = false;
    stateRef.current.isGameWon = false;
    setGameState({ ...stateRef.current });
  };

  // Restart game action
  const handleRestartGame = () => {
    initGame();
    setTimeout(() => {
      if (stateRef.current) {
        stateRef.current.isRunning = true;
        setGameState({ ...stateRef.current });
      }
    }, 50);
  };

  // Track high score in localStorage
  useEffect(() => {
    if (gameState && gameState.score > highScore) {
      setHighScore(gameState.score);
      try {
        localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(gameState.score));
      } catch {
        // Ignore localStorage write failures
      }
    }
    if (gameState && onScoreChange) {
      onScoreChange(gameState.score);
    }
  }, [gameState, highScore, onScoreChange]);

  // Main Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const state = stateRef.current;
      if (state) {
        // 1. Advance Physics
        const updated = updateGamePhysics(state, canvas.width, canvas.height, targetPaddleXRef.current);
        stateRef.current = updated;

        // 2. Clear Screen
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3. Draw Bricks
        for (let i = 0; i < updated.bricks.length; i++) {
          const brick = updated.bricks[i];
          if (brick.status === 1) {
            ctx.fillStyle = brick.color;
            ctx.beginPath();
            ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
            ctx.fill();

            // Subtle highlight border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 4. Draw Paddle
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(updated.paddle.x, updated.paddle.y, updated.paddle.width, updated.paddle.height, 4);
        ctx.fill();

        // 5. Draw Ball
        ctx.beginPath();
        ctx.arc(updated.ball.x, updated.ball.y, updated.ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 6. Draw Sparks/Particles
        for (let i = 0; i < updated.particles.length; i++) {
          const p = updated.particles[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Sync React state if game finishes or lives change
        if (
          updated.isGameOver !== gameState?.isGameOver ||
          updated.isGameWon !== gameState?.isGameWon ||
          updated.lives !== gameState?.lives ||
          updated.score !== gameState?.score
        ) {
          setGameState({ ...updated });
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState?.isGameOver, gameState?.isGameWon, gameState?.lives, gameState?.score]);

  // Input Handling: Mouse & Touch
  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    targetPaddleXRef.current = relativeX;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current || !stateRef.current.isRunning) return;
      const step = 28;
      if (e.key === 'ArrowLeft') {
        targetPaddleXRef.current = Math.max(0, targetPaddleXRef.current - step);
      } else if (e.key === 'ArrowRight') {
        const canvas = canvasRef.current;
        const max = canvas ? canvas.width : 480;
        targetPaddleXRef.current = Math.min(max, targetPaddleXRef.current + step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="brick-breaker-container">
      {/* Top HUD */}
      <div className="brick-breaker-hud">
        <div className="hud-item">
          <span>Score:</span>
          <span className="hud-value">{gameState?.score || 0}</span>
        </div>

        <div className="hud-item" style={{ gap: '4px' }}>
          <Heart size={14} color="#ef4444" fill="#ef4444" />
          <span className="hud-value">{gameState?.lives || 3}</span>
        </div>

        <div className="hud-item">
          <Trophy size={13} color="#f59e0b" />
          <span>Best:</span>
          <span className="hud-value">{highScore}</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="brick-breaker-canvas-wrapper" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="brick-breaker-canvas"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        />

        {/* Start / Paused Overlay */}
        {gameState && !gameState.isRunning && !gameState.isGameOver && !gameState.isGameWon && (
          <div className="brick-breaker-overlay">
            <h4 className="overlay-title">Break The Bricks</h4>
            <p className="overlay-subtitle">
              Pass the time while the server warms up! Drag or use arrow keys to control the paddle.
            </p>
            <button
              type="button"
              className="brick-breaker-btn"
              onClick={handleStartGame}
            >
              <Play size={14} />
              <span>Start Game</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState?.isGameOver && (
          <div className="brick-breaker-overlay">
            <h4 className="overlay-title gameover">Game Over</h4>
            <p className="overlay-subtitle">Final Score: {gameState.score} points</p>
            <button
              type="button"
              className="brick-breaker-btn"
              onClick={handleRestartGame}
            >
              <RotateCcw size={14} />
              <span>Play Again</span>
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState?.isGameWon && (
          <div className="brick-breaker-overlay">
            <h4 className="overlay-title win">Board Cleared!</h4>
            <p className="overlay-subtitle">Score: {gameState.score} points</p>
            <button
              type="button"
              className="brick-breaker-btn"
              onClick={handleRestartGame}
            >
              <RotateCcw size={14} />
              <span>Play Next Round</span>
            </button>
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className="brick-breaker-footer">
        Controls: Move mouse / Touch drag / Left & Right Arrow keys
      </div>
    </div>
  );
};

export default BrickBreakerGame;
