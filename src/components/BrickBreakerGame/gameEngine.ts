/**
 * @file gameEngine.ts
 * @description Core physics engine and collision detection routines for BrickBreaker mini-game.
 * 
 * Key Responsibilities:
 * - Generate grid layout of destructible bricks based on canvas dimensions.
 * - Calculate ball trajectory, paddle bounce angle dynamics, and wall reflections.
 * - Handle collision detection between ball, bricks, paddle, and boundaries.
 * - Manage score calculation and particle sparks on brick destruction.
 * 
 * Reusability:
 * - Pure TypeScript game logic with zero external UI dependencies.
 */

export interface Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  speed: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  status: number; // 1 = alive, 0 = destroyed
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

export interface GameState {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  particles: Particle[];
  score: number;
  lives: number;
  isGameOver: boolean;
  isGameWon: boolean;
  isRunning: boolean;
}

// Brick row palette matching slate/zinc SaaS aesthetic
const BRICK_ROW_COLORS = [
  { color: '#ef4444', points: 30 }, // Top row (Red)
  { color: '#f59e0b', points: 20 }, // Middle row (Amber)
  { color: '#3b82f6', points: 15 }, // Lower row (Blue)
  { color: '#10b981', points: 10 }  // Bottom row (Emerald)
];

/**
 * Initializes a new brick wall grid scaled to canvas dimensions.
 */
export function createBricks(canvasWidth: number, canvasHeight: number): Brick[] {
  const rows = 4;
  const cols = Math.min(8, Math.floor(canvasWidth / 48));
  const brickPadding = 6;
  const brickOffsetTop = 30;
  const totalPadding = (cols - 1) * brickPadding + 20; // 10px margin on sides
  const brickWidth = Math.floor((canvasWidth - totalPadding) / cols);
  const brickHeight = Math.max(14, Math.floor(canvasHeight * 0.055));
  const brickOffsetLeft = (canvasWidth - (cols * brickWidth + (cols - 1) * brickPadding)) / 2;

  const bricks: Brick[] = [];

  for (let r = 0; r < rows; r++) {
    const rowConfig = BRICK_ROW_COLORS[r % BRICK_ROW_COLORS.length];
    for (let c = 0; c < cols; c++) {
      const brickX = brickOffsetLeft + c * (brickWidth + brickPadding);
      const brickY = brickOffsetTop + r * (brickHeight + brickPadding);
      bricks.push({
        x: brickX,
        y: brickY,
        width: brickWidth,
        height: brickHeight,
        color: rowConfig.color,
        points: rowConfig.points,
        status: 1
      });
    }
  }

  return bricks;
}

/**
 * Initializes a fresh game state.
 */
export function createInitialGameState(canvasWidth: number, canvasHeight: number): GameState {
  const paddleWidth = Math.max(70, Math.floor(canvasWidth * 0.22));
  const paddleHeight = 10;
  const paddleY = canvasHeight - paddleHeight - 12;
  const paddleX = (canvasWidth - paddleWidth) / 2;

  const ballRadius = Math.max(5, Math.floor(canvasWidth * 0.015));
  const initialSpeed = 4;

  return {
    ball: {
      x: canvasWidth / 2,
      y: paddleY - ballRadius - 4,
      radius: ballRadius,
      dx: (Math.random() > 0.5 ? 1 : -1) * (initialSpeed * 0.7),
      dy: -initialSpeed,
      speed: initialSpeed
    },
    paddle: {
      x: paddleX,
      y: paddleY,
      width: paddleWidth,
      height: paddleHeight,
      speed: 7
    },
    bricks: createBricks(canvasWidth, canvasHeight),
    particles: [],
    score: 0,
    lives: 3,
    isGameOver: false,
    isGameWon: false,
    isRunning: false
  };
}

/**
 * Creates visual spark particles when a brick is shattered.
 */
export function spawnParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 1.5,
      color,
      alpha: 1,
      life: 20 + Math.random() * 10
    });
  }

  return particles;
}

/**
 * Advances the game physics simulation by one tick.
 */
export function updateGamePhysics(
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  targetPaddleX: number
): GameState {
  if (!state.isRunning || state.isGameOver || state.isGameWon) {
    return state;
  }

  const { ball, paddle, bricks } = state;
  let score = state.score;
  let lives = state.lives;
  let isGameOver: boolean = false;
  let isGameWon: boolean = false;

  // 1. Move Paddle smoothly toward target position
  const clampedTargetX = Math.max(0, Math.min(canvasWidth - paddle.width, targetPaddleX - paddle.width / 2));
  paddle.x += (clampedTargetX - paddle.x) * 0.25;

  // 2. Move Ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // 3. Wall Collisions
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.dx = Math.abs(ball.dx);
  } else if (ball.x + ball.radius >= canvasWidth) {
    ball.x = canvasWidth - ball.radius;
    ball.dx = -Math.abs(ball.dx);
  }

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.dy = Math.abs(ball.dy);
  }

  // 4. Paddle Collision (Calculates realistic angle reflection based on impact offset)
  if (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width &&
    ball.dy > 0
  ) {
    const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const maxBounceAngle = (Math.PI / 180) * 60; // 60 degrees max reflection
    const bounceAngle = hitOffset * maxBounceAngle;

    const currentSpeed = Math.min(8, ball.speed + 0.1); // Gradual speed ramp
    ball.speed = currentSpeed;
    ball.dx = currentSpeed * Math.sin(bounceAngle);
    ball.dy = -currentSpeed * Math.cos(bounceAngle);
    ball.y = paddle.y - ball.radius;
  }

  // 5. Brick Collisions
  let newParticles = [...state.particles];
  let activeBrickCount = 0;

  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (brick.status === 1) {
      activeBrickCount++;

      // AABB ball collision with brick
      if (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height
      ) {
        brick.status = 0;
        score += brick.points;
        activeBrickCount--;

        // Reflect ball
        ball.dy = -ball.dy;

        // Spawn hit particle effect
        newParticles = newParticles.concat(
          spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color)
        );
        break; // One collision per frame
      }
    }
  }

  // Check victory condition
  if (activeBrickCount === 0) {
    isGameWon = true;
  }

  // 6. Bottom Boundary (Ball Lost)
  if (ball.y - ball.radius > canvasHeight) {
    lives -= 1;
    if (lives <= 0) {
      isGameOver = true;
    } else {
      // Reset ball on paddle
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius - 4;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * (ball.speed * 0.7);
      ball.dy = -ball.speed;
    }
  }

  // 7. Update Particle Physics
  newParticles = newParticles
    .map((p) => ({
      ...p,
      x: p.x + p.dx,
      y: p.y + p.dy,
      alpha: p.alpha - 1 / p.life
    }))
    .filter((p) => p.alpha > 0);

  return {
    ...state,
    ball,
    paddle,
    bricks,
    particles: newParticles,
    score,
    lives,
    isGameOver,
    isGameWon
  };
}
