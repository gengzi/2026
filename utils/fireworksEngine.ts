
import { Particle, FireworkShell, Point, FireworkSettings } from '../types';
import { playExplosionSound } from './soundEngine';

/**
 * Helper to get random number in range
 */
export const random = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Converts an HSL color to string
 */
export const hslToRgb = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;

/**
 * Generates coordinate points for text shape
 */
export const getTextPoints = (text: string, fontSize: number = 80): Point[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Dynamic sizing based on text length to prevent clipping
  canvas.width = Math.max(800, text.length * fontSize + 200);
  canvas.height = 400;
  
  // Draw text
  ctx.font = `bold ${fontSize}px "Noto Serif SC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const points: Point[] = [];
  
  // Adaptive sampling: denser for small text, looser for large text to maintain performance
  const step = 4; 
  
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

/**
 * Creates particles for a shell explosion
 */
export const explodeShell = (shell: FireworkShell): Particle[] => {
  const particles: Particle[] = [];
  const { size, shape, color, effect } = shell.settings;
  
  let countMultiplier = 1;
  let speedMultiplier = 1;
  let textSize = 80;

  if (size === 'small') {
    countMultiplier = 0.6;
    speedMultiplier = 0.8;
    textSize = 50;
  } else if (size === 'large') {
    countMultiplier = 1.5; // Optimized count for performance
    speedMultiplier = 1.3;
    textSize = 100;
  }

  const baseCount = 120; // Slightly reduced base count for smoother fps
  const particleCount = shell.text ? 0 : Math.floor(baseCount * countMultiplier); 
  
  const getParticleColor = (isSparkle: boolean, overrideHue?: number) => {
    if (color !== 'random') return color; 
    
    const h = overrideHue ?? shell.hue;
    
    if (effect === 'willow') {
      return `hsl(${45 + random(-10, 10)}, 100%, ${random(60, 90)}%)`; 
    }
    
    // Improved random color logic
    const hueVar = random(-20, 20);
    return hslToRgb((h + hueVar + 360) % 360, 100, isSparkle ? random(60, 90) : 70);
  };

  // 1. Text Explosion
  if (shell.text) {
    const points = getTextPoints(shell.text, textSize);
    points.forEach((pt) => {
      if (Math.random() > 0.85) return; 

      particles.push({
        x: shell.x + pt.x, 
        y: shell.y + pt.y,
        vx: random(-0.1, 0.1) + shell.vx * 0.2, 
        vy: random(-0.1, 0.1) + shell.vy * 0.2,
        life: random(200, 260), 
        maxLife: 260,
        color: getParticleColor(false),
        alpha: 1,
        size: 2.2 * (size === 'large' ? 1.2 : 1),
        type: 'text',
        shape: shape,
        friction: 0.94, // Very high friction for text to "float"
        gravity: 0.012, // Very low gravity
        flicker: Math.random() > 0.85 
      });
    });
    
    // Flash background
    for (let i = 0; i < 40; i++) {
       const angle = random(0, Math.PI * 2);
       const speed = random(5, 18);
       particles.push({
         x: shell.x,
         y: shell.y,
         vx: Math.cos(angle) * speed,
         vy: Math.sin(angle) * speed,
         life: random(20, 50),
         maxLife: 50,
         color: '#ffffff',
         alpha: 1,
         size: random(1, 4),
         type: 'spark',
         shape: 'circle',
         friction: 0.88, 
         gravity: 0.01
       });
    }
    return particles;
  }

  // 2. Pattern Explosions
  
  // --- WILLOW ---
  if (effect === 'willow') {
    const willowCount = particleCount * 0.9;
    for (let i = 0; i < willowCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1, 6) * speedMultiplier; 
      
      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(180, 280),
        maxLife: 280,
        color: getParticleColor(true),
        alpha: 1,
        size: random(1.5, 2.5),
        type: 'spark',
        shape: shape,
        friction: 0.93, // Drag makes them slow down horizontally
        gravity: 0.04, // Gravity pulls them down vertically
        flicker: true 
      });
    }
  } 
  
  // --- RING ---
  else if (effect === 'ring') {
    const ringCount = Math.floor(particleCount * 0.7);
    for (let i = 0; i < ringCount; i++) {
      const angle = (Math.PI * 2 * i) / ringCount;
      const speed = 7 * speedMultiplier;
      
      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(100, 140),
        maxLife: 140,
        color: getParticleColor(true),
        alpha: 1,
        size: random(2, 3.5),
        type: 'spark',
        shape: shape,
        friction: 0.96, // Low friction helps ring expand uniformly
        gravity: 0.02,
        flicker: false
      });
    }
  }
  
  // --- GALAXY ---
  else if (effect === 'galaxy') {
    const arms = 4; // More arms for galaxy
    const pointsPerArm = Math.floor(particleCount / arms);
    
    for (let arm = 0; arm < arms; arm++) {
        for (let i = 0; i < pointsPerArm; i++) {
            const angleOffset = (Math.PI * 2 * arm) / arms;
            const t = i / pointsPerArm; 
            const angle = angleOffset + (t * Math.PI * 1.5); 
            const speed = (1 + t * 9) * speedMultiplier;
            
            particles.push({
                x: shell.x,
                y: shell.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: random(120, 180),
                maxLife: 180,
                color: getParticleColor(true, shell.hue + (t * 90)),
                alpha: 1,
                size: random(1, 2.5),
                type: 'spark',
                shape: shape,
                friction: 0.95,
                gravity: 0.03,
                flicker: Math.random() > 0.6
            });
        }
    }
  }

  // --- CLASSIC ---
  else {
    for (let i = 0; i < particleCount; i++) {
      const angle = random(0, Math.PI * 2);
      // Bell curve distribution for speed: more particles in the middle layer
      const r = Math.random();
      const rawSpeed = (r * r) * 9 * speedMultiplier + 2; 

      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * rawSpeed,
        vy: Math.sin(angle) * rawSpeed,
        life: random(100, 180),
        maxLife: 180,
        color: getParticleColor(true),
        alpha: 1,
        size: random(1.5, 3.5),
        type: 'spark',
        shape: shape,
        friction: 0.96, // Standard friction
        gravity: 0.035,
        flicker: Math.random() > 0.4
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
    ctx.fillStyle = shell.color && shell.color !== 'random' 
      ? shell.color 
      : hslToRgb(shell.hue, 100, 50);
    ctx.fill();

    // Subtle Trail
    ctx.beginPath();
    ctx.arc(shell.x - shell.vx * 1.5, shell.y - shell.vy * 1.5, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
    ctx.fill();

    const dist = Math.hypot(shell.x - shell.targetX, shell.y - shell.targetY);
    const outOfBounds = shell.x < 50 || shell.x > width - 50 || shell.y < 50;
    const isFalling = shell.vy > 0.5; 

    if (dist < 15 || isFalling || outOfBounds) {
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

    // Smoother Alpha Decay
    // Instead of linear decay, we use a curve. 
    // It stays bright longer, then fades out quickly at the end.
    const lifeRatio = p.life / p.maxLife;
    
    if (lifeRatio > 0.3) {
      p.alpha = 1; // Stay fully visible for 70% of life
    } else {
      // Fade out in last 30%
      p.alpha = lifeRatio / 0.3; 
    }
    
    // Improved Flicker: varied intensity, not just on/off
    let renderAlpha = p.alpha;
    if (p.flicker) {
      // 30% chance to dim per frame, creates shimmering
      if (Math.random() > 0.7) {
        renderAlpha = p.alpha * (0.4 + Math.random() * 0.6);
      }
    }

    if (p.life <= 0 || p.alpha <= 0.01) {
      particles.splice(i, 1);
      continue;
    }

    // Draw Particle
    ctx.globalAlpha = Math.max(0, renderAlpha);
    ctx.fillStyle = p.color;
    
    // Text sparkle glimmer
    if (p.type === 'text') {
      if (Math.random() > 0.98) {
         ctx.fillStyle = '#ffffff';
         ctx.shadowBlur = 4;
         ctx.shadowColor = '#ffffff';
      }
    } 
    // Classic spark glow for large particles
    else if (p.size > 2.5) {
       ctx.shadowBlur = 2;
       ctx.shadowColor = p.color;
    }

    ctx.beginPath();
    if (p.shape === 'circle') {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0; 
  }
};
