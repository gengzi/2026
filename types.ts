
export interface Point {
  x: number;
  y: number;
}

export type ParticleShape = 'circle' | 'square';
export type FireworkSize = 'small' | 'medium' | 'large';
export type FireworkEffect = 'classic' | 'willow' | 'ring' | 'galaxy' | 'strobe' | 'double-ring';
export type PatternType = 'heart' | 'star' | 'smile' | 'diamond' | '2026' | 'spiral' | 'crown' | 'music' | 'butterfly';

export interface FireworkSettings {
  color: string; // 'random' or hex code
  size: FireworkSize;
  shape: ParticleShape;
  effect: FireworkEffect;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
  size: number;
  type: 'spark' | 'text' | 'shell';
  shape: ParticleShape;
  // Physics properties
  friction: number;
  gravity: number;
  flicker?: boolean;
  // Text/Pattern animation properties
  holding?: number;
  initialX?: number;
  initialY?: number;
}

export interface FireworkShell {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  hue: number; // specialized for random
  color?: string; // override for specific color
  text?: string;
  pattern?: PatternType; // New: Support for patterns
  settings: FireworkSettings;
  completed: boolean;
}

export interface GeminiResponse {
  wishes: string[];
}
