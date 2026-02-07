
import { Particle, FireworkShell, Point, FireworkSettings } from '../types';
import { playExplosionSound } from './soundEngine';

/**
 * Helper to get random number in range
 */
export const random = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Curated Color Palettes for 2026 CNY
 */
const PALETTES = {
  // Red & Gold (Classic CNY)
  classic: ['#ff0000', '#ff2400', '#ffcc00', '#ffd700', '#ffffff'],
  // Cyan & Pink & Purple (Cyberpunk)
  cyber: ['#00ffff', '#ff00ff', '#bd00ff', '#ffffff', '#00ccff'],
  // Gold & Silver (Rich)
  rich: ['#ffd700', '#fdb931', '#e5e4e2', '#ffffff', '#c0c0c0'],
  // Jade & Emerald (Nature)
  jade: ['#00ff00', '#00cc00', '#ccffcc', '#ffff00', '#50c878'],
  // Pastel (Dreamy)
  pastel: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'],
};

/**
 * Converts Hex to RGB for alpha manipulation
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Generates coordinate points for text shape with auto-scaling
 */
export const getTextPoints = (text: string, baseSize: number = 100): Point[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Auto-scale font size based on text length to fit screen
  // Short text (2 chars) -> 120px
  // Long text (8 chars) -> 60px
  const fontSize = Math.max(50, Math.min(baseSize, 800 / Math.max(2, text.length)));
  
  canvas.width = Math.max(800, text.length * fontSize + 200);
  canvas.height = 500;
  
  // Draw text
  ctx.font = `900 ${fontSize}px "Noto Serif SC", serif`; // Ultra bold
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const points: Point[] = [];
  
  // Optimization: Increase step to 6 to reduce particle count significantly
  // Was 4, increasing to 6 reduces particles by ~50%
  const step = 6; 
  
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] > 128) {
        points.push({
          x: x - canvas.width / 2, 
          y: y - canvas.height / 2
        });
      }
    }
  }

  return points;
};

const pickColor = (paletteName: string) => {
  if (paletteName === 'random') {
    const keys = Object.keys(PALETTES) as (keyof typeof PALETTES)[];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const colors = PALETTES[key];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // If it's a specific hex code
  if (paletteName.startsWith('#')) return paletteName;

  // If it's a palette key
  const colors = PALETTES[paletteName as keyof typeof PALETTES] || PALETTES['classic'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Creates particles for a shell explosion
 */
export const explodeShell = (shell: FireworkShell): Particle[] => {
  const particles: Particle[] = [];
  const { size, shape, color, effect } = shell.settings;
  
  let countMultiplier = 1;
  let speedMultiplier = 1;

  if (size === 'small') {
    countMultiplier = 0.6;
    speedMultiplier = 0.8;
  } else if (size === 'large') {
    countMultiplier = 1.5; // Reduced from 1.8 for performance
    speedMultiplier = 1.3;
  }

  // Optimization: Reduced base count from 150 to 80
  const baseCount = 80; 
  const particleCount = shell.text ? 0 : Math.floor(baseCount * countMultiplier); 
  
  // 1. Text Explosion
  if (shell.text) {
    const points = getTextPoints(shell.text, size === 'large' ? 140 : 100);
    // Shuffle points to create a "forming" effect if we wanted, but here we just use them
    points.forEach((pt) => {
      // Density check: Optimization
      if (Math.random() > 0.9) return; 

      particles.push({
        x: shell.x + pt.x, 
        y: shell.y + pt.y,
        vx: random(-0.2, 0.2) + shell.vx * 0.1, 
        vy: random(-0.2, 0.2) + shell.vy * 0.1,
        life: random(100, 180), // Reduced life for faster cleanup (was 180-240)
        maxLife: 180,
        color: pickColor(color), 
        alpha: 1,
        size: random(1.5, 2.5),
        type: 'text',
        shape: shape,
        friction: 0.92, 
        gravity: 0.015,
        flicker: true 
      });
    });
    
    // Add a "Bang" effect behind the text (reduced count)
    for (let i = 0; i < 20; i++) { // Was 50
       const angle = random(0, Math.PI * 2);
       const speed = random(5, 20);
       particles.push({
         x: shell.x,
         y: shell.y,
         vx: Math.cos(angle) * speed,
         vy: Math.sin(angle) * speed,
         life: random(20, 60),
         maxLife: 60,
         color: '#ffffff',
         alpha: 1,
         size: random(1, 4),
         type: 'spark',
         shape: 'circle',
         friction: 0.85, 
         gravity: 0
       });
    }
    return particles;
  }

  // 2. Pattern Explosions
  
  // --- WILLOW (Long trails, falling) ---
  if (effect === 'willow') {
    const willowCount = particleCount;
    const baseC = pickColor(color);
    for (let i = 0; i < willowCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1, 8) * speedMultiplier; 
      
      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(150, 250), // Reduced max life
        maxLife: 250,
        color: baseC,
        alpha: 1,
        size: random(1.0, 2.0),
        type: 'spark',
        shape: shape,
        friction: 0.92, 
        gravity: 0.03, 
        flicker: true 
      });
    }
  } 
  
  // --- RING (Perfect Circle) ---
  else if (effect === 'ring') {
    const ringCount = Math.floor(particleCount * 0.8);
    const ringColor = pickColor(color);
    for (let i = 0; i < ringCount; i++) {
      const angle = (Math.PI * 2 * i) / ringCount;
      const speed = 8 * speedMultiplier;
      
      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(80, 120),
        maxLife: 120,
        color: ringColor,
        alpha: 1,
        size: random(2, 4),
        type: 'spark',
        shape: shape,
        friction: 0.95,
        gravity: 0.02,
        flicker: false
      });
    }
  }
  
  // --- GALAXY (Spiral) ---
  else if (effect === 'galaxy') {
    const arms = 5;
    const pointsPerArm = Math.floor(particleCount / arms);
    
    for (let arm = 0; arm < arms; arm++) {
        const armColor = pickColor(color);
        for (let i = 0; i < pointsPerArm; i++) {
            const angleOffset = (Math.PI * 2 * arm) / arms;
            const t = i / pointsPerArm; 
            const angle = angleOffset + (t * Math.PI * 2); 
            const speed = (2 + t * 12) * speedMultiplier;
            
            particles.push({
                x: shell.x,
                y: shell.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: random(80, 160),
                maxLife: 160,
                color: armColor,
                alpha: 1,
                size: random(1, 3),
                type: 'spark',
                shape: shape,
                friction: 0.94,
                gravity: 0.03,
                flicker: Math.random() > 0.5
            });
        }
    }
  }

  // --- CLASSIC (Peony/Chrysanthemum) ---
  else {
    for (let i = 0; i < particleCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(2, 12) * speedMultiplier;
      
      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(80, 150),
        maxLife: 150,
        color: pickColor(color),
        alpha: 1,
        size: random(2, 4),
        type: 'spark',
        shape: shape,
        friction: 0.95,
        gravity: 0.03,
        flicker: Math.random() > 0.3
      });
    }
  }

  return particles;
};

/**
 * Core Physics Update Loop
 */
export const updatePhysics = (
  shells: FireworkShell[],
  particles: Particle[],
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // Update Shells
  for (let i = shells.length - 1; i >= 0; i--) {
    const shell = shells[i];
    
    shell.x += shell.vx;
    shell.y += shell.vy;
    shell.vy += 0.04; 

    // Draw Shell
    ctx.beginPath();
    ctx.arc(shell.x, shell.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Trail
    ctx.beginPath();
    ctx.moveTo(shell.x, shell.y);
    ctx.lineTo(shell.x - shell.vx * 3, shell.y - shell.vy * 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();

    const dist = Math.hypot(shell.x - shell.targetX, shell.y - shell.targetY);
    const outOfBounds = shell.x < 50 || shell.x > width - 50 || shell.y < 50;
    const isFalling = shell.vy > 1; 

    if (dist < 20 || isFalling || outOfBounds) {
      shell.completed = true;
      const newParticles = explodeShell(shell);
      particles.push(...newParticles);
      shells.splice(i, 1);
      playExplosionSound(shell.settings.size);
    }
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    p.x += p.vx;
    p.y += p.vy;
    
    p.vx *= p.friction;
    p.vy *= p.friction;
    p.vy += p.gravity;
    
    p.life -= 1;

    // Visual Decay
    const lifeRatio = p.life / p.maxLife;
    p.alpha = lifeRatio > 0.2 ? 1 : lifeRatio / 0.2;
    
    // Intense Flicker
    let renderAlpha = p.alpha;
    if (p.flicker) {
       // Sharp flickering
       renderAlpha = p.alpha * (0.5 + Math.random() * 0.5);
    }

    if (p.life <= 0 || p.alpha <= 0.01) {
      particles.splice(i, 1);
      continue;
    }

    // Draw
    ctx.globalAlpha = Math.max(0, renderAlpha);
    ctx.fillStyle = p.color;
    
    // Performance Optimization: REMOVED ctx.shadowBlur
    // ShadowBlur is extremely expensive on CPU/GPU. 
    // We rely on globalCompositeOperation 'lighter' in the main loop for the glow effect.
    
    ctx.beginPath();
    if (p.shape === 'circle') {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    
    ctx.globalAlpha = 1;
  }
};
