
import { Particle, FireworkShell, Point, FireworkSettings, PatternType } from '../types';
import { playExplosionSound } from './soundEngine';

/**
 * Helper to get random number in range
 */
export const random = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Curated Color Palettes for 2026 CNY - Realistic Fireworks
 */
const PALETTES = {
  // Real Gold (Elegant, Classic, Shimmering)
  gold: ['#FFD700', '#FDB931', '#FFFACD', '#DAA520', '#FFFFFF'],
  // China Red (Festive, Deep)
  red: ['#FF0000', '#DC143C', '#B22222', '#FF4500', '#FFD700'],
  // Icy Silver (Modern, Clean, Sparkly)
  silver: ['#FFFFFF', '#F0F8FF', '#E0FFFF', '#C0C0C0', '#B0C4DE'],
  // Cyan/Blue (Tech/Cool/High Temp)
  blue: ['#00BFFF', '#1E90FF', '#4169E1', '#0000FF', '#E0FFFF'],
  // Colorful (Traditional Fireworks Show)
  colorful: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
  
  // NEW PALETTES
  // Sunset (Warm, Romantic - Orange, Red, Magenta)
  sunset: ['#FF4500', '#FF8C00', '#FFD700', '#C71585', '#FF1493'],
  // Mint (Fresh, Cool - Light Green, Cyan, White)
  mint: ['#98FF98', '#00FFFF', '#E0FFFF', '#7FFFD4', '#F0FFF0'],
  // Cherry Blossom (Soft, Pink, White)
  cherry: ['#FFB7C5', '#FFC0CB', '#FF69B4', '#FFF0F5', '#FF1493'],
};

/**
 * PATTERN GENERATORS
 */
export const getPatternPoints = (type: PatternType): Point[] => {
  const points: Point[] = [];
  const scale = 80; // Base scale for shapes

  if (type === 'heart') {
    // Parametric Heart Equation
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      // x = 16sin^3(t)
      const x = 16 * Math.pow(Math.sin(t), 3);
      // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      points.push({ x: x * (scale / 16), y: y * (scale / 16) });
      // Fill inside slightly
      if (Math.random() > 0.5) {
         points.push({ x: x * (scale / 16) * 0.8, y: y * (scale / 16) * 0.8 });
      }
    }
  } 
  else if (type === 'star') {
    // 5-Point Star
    const spikes = 5;
    const outerRadius = scale;
    const innerRadius = scale * 0.4;
    
    for (let i = 0; i < spikes * 2; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const nextAngle = (Math.PI / spikes) * (i + 1) - Math.PI / 2;
        
        // Draw lines between points
        const x1 = Math.cos(angle) * r;
        const y1 = Math.sin(angle) * r;
        const x2 = Math.cos(nextAngle) * ((i % 2 === 0) ? innerRadius : outerRadius);
        const y2 = Math.sin(nextAngle) * ((i % 2 === 0) ? innerRadius : outerRadius);

        // Interpolate points along the line
        const steps = 10;
        for(let j=0; j<steps; j++) {
            const t = j/steps;
            points.push({
                x: x1 + (x2 - x1) * t,
                y: y1 + (y2 - y1) * t
            });
        }
    }
  }
  else if (type === 'smile') {
     // Face
     for(let i=0; i<50; i++) {
         const angle = (i/50) * Math.PI * 2;
         points.push({x: Math.cos(angle)*scale, y: Math.sin(angle)*scale});
     }
     // Eyes
     points.push({x: -scale*0.4, y: -scale*0.3}, {x: -scale*0.35, y: -scale*0.3}); // Left
     points.push({x: scale*0.4, y: -scale*0.3}, {x: scale*0.35, y: -scale*0.3}); // Right
     // Mouth (Arc)
     for(let i=0; i<30; i++) {
         const angle = Math.PI * 0.2 + (i/30) * Math.PI * 0.6;
         points.push({x: Math.cos(angle)*scale*0.6, y: Math.sin(angle)*scale*0.6});
     }
  }
  else if (type === 'diamond') {
     const s = scale * 0.8;
     // Diamond shape is just rotated square, simple lines
     for(let t=0; t<=1; t+=0.05) points.push({x: 0 + s*t, y: -s + s*t}); // Top to Right
     for(let t=0; t<=1; t+=0.05) points.push({x: s - s*t, y: 0 + s*t}); // Right to Bottom
     for(let t=0; t<=1; t+=0.05) points.push({x: 0 - s*t, y: s - s*t}); // Bottom to Left
     for(let t=0; t<=1; t+=0.05) points.push({x: -s + s*t, y: 0 - s*t}); // Left to Top
     // Cross
     for(let t=0; t<=1; t+=0.1) points.push({x: -s/2 + s*t, y: 0});
     for(let t=0; t<=1; t+=0.1) points.push({x: 0, y: -s/2 + s*t});
  }
  else if (type === 'spiral') {
    // Archimedean Spiral
    const loops = 3;
    const pointsCount = 100;
    for(let i=0; i<pointsCount; i++) {
        const theta = (i / pointsCount) * Math.PI * 2 * loops;
        const r = (i / pointsCount) * scale;
        points.push({
            x: r * Math.cos(theta),
            y: r * Math.sin(theta)
        });
    }
  }
  else if (type === 'crown') {
    const w = scale;
    const h = scale * 0.6;
    // Base
    const steps = 20;
    for(let i=0; i<=steps; i++) {
        const t = i/steps;
        points.push({x: -w + 2*w*t, y: h});
    }
    // Sides and spikes
    const spikes = [
        {x: -w, y: h},
        {x: -w*0.8, y: -h*0.5},
        {x: -w*0.4, y: 0},
        {x: 0, y: -h},
        {x: w*0.4, y: 0},
        {x: w*0.8, y: -h*0.5},
        {x: w, y: h}
    ];
    for(let i=0; i<spikes.length-1; i++) {
        const p1 = spikes[i];
        const p2 = spikes[i+1];
        const segSteps = 10;
        for(let j=0; j<segSteps; j++) {
            const t = j/segSteps;
            points.push({
                x: p1.x + (p2.x - p1.x)*t,
                y: p1.y + (p2.y - p1.y)*t
            });
        }
    }
  }
  else if (type === 'music') {
    // Note head
    const headX = -scale * 0.3;
    const headY = scale * 0.5;
    const r = scale * 0.25;
    // Draw filled circle roughly
    for(let i=0; i<5; i++) {
        for(let ang=0; ang<Math.PI*2; ang+=0.5) {
            points.push({
                x: headX + Math.cos(ang)*(r * (i/5)),
                y: headY + Math.sin(ang)*(r * (i/5))
            });
        }
    }
    // Stem
    const stemX = headX + r;
    for(let y = headY; y > -scale*0.8; y-=5) {
        points.push({x: stemX, y: y});
    }
    // Flag
    const topY = -scale*0.8;
    for(let t=0; t<1; t+=0.05) {
        // Curve down
        const x = stemX + t * scale * 0.8;
        const y = topY + Math.sin(t * Math.PI) * scale * 0.4;
        points.push({x, y});
        // Thickness
        points.push({x, y: y+5});
    }
  }
  else if (type === 'butterfly') {
    const steps = 100;
    for(let i=0; i<steps; i++) {
        const t = (i/steps) * 12 * Math.PI; 
        const r = Math.exp(Math.cos(t)) - 2*Math.cos(4*t) + Math.pow(Math.sin(t/12), 5);
        const rScaled = r * (scale * 0.25);
        points.push({
            x: rScaled * Math.sin(t),
            y: -rScaled * Math.cos(t) 
        });
    }
  }
  else if (type === 'lantern') {
      const w = scale * 0.7;
      const h = scale * 0.9;
      // Ellipse body
      for(let t=0; t<Math.PI*2; t+=0.1) {
          points.push({x: w*Math.cos(t), y: h*Math.sin(t)});
          if(Math.random()>0.5) points.push({x: w*0.8*Math.cos(t), y: h*0.8*Math.sin(t)}); // Inner fill
      }
      // Top/Bottom blocks
      for(let x=-w/2; x<=w/2; x+=4) points.push({x, y: -h});
      for(let x=-w/2; x<=w/2; x+=4) points.push({x, y: h});
      // Tassel
      for(let y=h; y<=h*1.5; y+=4) points.push({x:0, y});
  }
  else if (type === 'coin') {
      const r = scale * 0.8;
      // Outer Circle
      for(let t=0; t<Math.PI*2; t+=0.05) {
          points.push({x: r*Math.cos(t), y: r*Math.sin(t)});
          points.push({x: (r-4)*Math.cos(t), y: (r-4)*Math.sin(t)}); // Thickness
      }
      // Inner Square
      const s = r * 0.4;
      const step = 4;
      for(let x=-s; x<=s; x+=step) { points.push({x, y: -s}); points.push({x, y: s}); }
      for(let y=-s; y<=s; y+=step) { points.push({x: -s, y}); points.push({x: s, y}); }
  }
  else if (type === 'fish') {
      // Simple fish shape
      const len = scale;
      const wid = scale * 0.6;
      // Body (2 parabolas)
      for(let t=-1; t<=1; t+=0.05) {
          const x = t * len;
          const yTop = wid * (1 - t*t);
          const yBot = -wid * (1 - t*t);
          points.push({x, y: yTop});
          points.push({x, y: yBot});
      }
      // Tail
      for(let t=0; t<=1; t+=0.1) {
          points.push({x: -len - t*wid*0.5, y: t*wid});
          points.push({x: -len - t*wid*0.5, y: -t*wid});
      }
      points.push({x:-len-wid*0.5, y:wid}, {x:-len-wid*0.5, y:-wid});
  }
  else if (type === 'snowflake') {
      const r = scale;
      const arms = 6;
      for(let i=0; i<arms; i++) {
          const angle = (Math.PI*2 * i) / arms;
          const cx = Math.cos(angle);
          const cy = Math.sin(angle);
          // Main arm
          for(let d=0; d<=r; d+=4) {
              points.push({x: cx*d, y: cy*d});
          }
          // V shape on arm
          const vDist = r * 0.6;
          const vSize = r * 0.2;
          const vAngle1 = angle + Math.PI/4;
          const vAngle2 = angle - Math.PI/4;
          for(let d=0; d<=vSize; d+=4) {
               points.push({x: cx*vDist + Math.cos(vAngle1)*d, y: cy*vDist + Math.sin(vAngle1)*d});
               points.push({x: cx*vDist + Math.cos(vAngle2)*d, y: cy*vDist + Math.sin(vAngle2)*d});
          }
      }
  }
  else if (type === '2026') {
      // Simplified grid for "2026"
      // This uses relative offsets. 
      const charW = scale * 0.5;
      const spacing = scale * 0.6;
      const startX = -(spacing * 1.5);
      
      // Helper to plot line
      const line = (x1: number, y1: number, x2: number, y2: number, offsetX: number) => {
          const dist = Math.hypot(x2-x1, y2-y1);
          const steps = Math.max(5, Math.floor(dist / 5));
          for(let i=0; i<=steps; i++) {
              points.push({
                  x: (x1 + (x2-x1)*(i/steps)) + offsetX,
                  y: (y1 + (y2-y1)*(i/steps))
              });
          }
      };

      // 2
      let off = startX;
      line(0,0, charW,0, off); line(charW,0, charW, charW, off); 
      line(charW,charW, 0,charW, off); line(0,charW, 0,charW*2, off); line(0,charW*2, charW,charW*2, off);
      
      // 0
      off += spacing;
      line(0,0, charW,0, off); line(charW,0, charW,charW*2, off); 
      line(charW,charW*2, 0,charW*2, off); line(0,charW*2, 0,0, off);

      // 2
      off += spacing;
      line(0,0, charW,0, off); line(charW,0, charW, charW, off); 
      line(charW,charW, 0,charW, off); line(0,charW, 0,charW*2, off); line(0,charW*2, charW,charW*2, off);

      // 6
      off += spacing;
      line(0,0, 0,charW*2, off); line(0,charW*2, charW,charW*2, off); 
      line(charW,charW*2, charW,charW, off); line(charW,charW, 0,charW, off); line(0,0, charW,0, off); // Top cap
  }

  return points;
};

/**
 * Generates coordinate points for text shape with auto-scaling
 */
export const getTextPoints = (text: string, baseSize: number = 100): Point[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const fontSize = Math.max(70, Math.min(baseSize, 800 / Math.max(2, text.length)));
  
  canvas.width = Math.max(800, text.length * fontSize + 200);
  canvas.height = 500;
  
  // Draw text
  ctx.font = `900 ${fontSize}px "Noto Serif SC", serif`; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const points: Point[] = [];
  
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

const pickColor = (paletteName: string) => {
  if (paletteName === 'random') {
    const keys = Object.keys(PALETTES) as (keyof typeof PALETTES)[];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const colors = PALETTES[key];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  if (paletteName.startsWith('#')) return paletteName;
  const colors = PALETTES[paletteName as keyof typeof PALETTES] || PALETTES['gold'];
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
    countMultiplier = 1.5; 
    speedMultiplier = 1.3;
  }

  const baseCount = 80; 
  const particleCount = (shell.text || shell.pattern) ? 0 : Math.floor(baseCount * countMultiplier); 
  
  // 0. PATTERN EXPLOSION
  if (shell.pattern) {
      const points = getPatternPoints(shell.pattern);
      
      // Determine pattern colors
      let patternColors = [pickColor(color)];
      if (color === 'random') {
        // Random bright color for patterns if random is selected
        patternColors = [`hsl(${Math.random() * 360}, 100%, 75%)`];
      }
      
      // Special overrides
      if (shell.pattern === '2026' || shell.pattern === 'coin') patternColors = PALETTES['gold'];
      if (shell.pattern === 'heart' || shell.pattern === 'lantern') patternColors = ['#FF0000', '#FF69B4', '#FFD700']; 
      if (shell.pattern === 'fish') patternColors = ['#FF4500', '#FFA500'];
      if (shell.pattern === 'snowflake') patternColors = PALETTES['silver'];
      
      points.forEach(pt => {
        const px = shell.x + pt.x;
        const py = shell.y + pt.y;
        
        particles.push({
            x: px, y: py,
            initialX: px, initialY: py,
            holding: 40,
            vx: (random(-0.02, 0.02) + shell.vx * 0.02),
            vy: (random(-0.02, 0.02) + shell.vy * 0.02),
            life: random(150, 220),
            maxLife: 220,
            color: patternColors[Math.floor(Math.random()*patternColors.length)],
            alpha: 1,
            size: random(3.0, 5.0),
            type: 'text',
            shape: 'square',
            friction: 0.96,
            gravity: 0.002,
            flicker: true
        });
      });
      
      // Sparkle surround
      for(let i=0; i<30; i++) {
        const angle = random(0, Math.PI*2);
        const s = random(10, 30);
        particles.push({
            x: shell.x, y: shell.y,
            vx: Math.cos(angle)*s, vy: Math.sin(angle)*s,
            life: random(40, 80), maxLife: 80,
            color: '#FFF', alpha: 1, size: random(1,2),
            type: 'spark', shape: 'circle',
            friction: 0.9, gravity: 0.05
        });
      }
      return particles;
  }

  // 1. Text Explosion
  if (shell.text) {
    const points = getTextPoints(shell.text, size === 'large' ? 140 : 100);
    
    // Dynamic Text Color Generation
    let textColors = ['#FFFFFF', '#FFD700', '#E0FFFF', '#FF69B4']; 
    if (color === 'random') {
       // Generate a random vibrant palette for this specific shell
       const baseHue = Math.random() * 360;
       textColors = [
           `hsl(${baseHue}, 100%, 80%)`,
           `hsl(${(baseHue + 30) % 360}, 100%, 70%)`,
           '#FFFFFF'
       ];
    } else if (PALETTES[color as keyof typeof PALETTES]) {
       textColors = PALETTES[color as keyof typeof PALETTES];
    }
    
    const getRandomTextColor = () => textColors[Math.floor(Math.random() * textColors.length)];

    points.forEach((pt) => {
      if (Math.random() > 0.96) return; 

      const px = shell.x + pt.x;
      const py = shell.y + pt.y;

      particles.push({
        x: px, 
        y: py,
        initialX: px,
        initialY: py,
        holding: 60, 
        vx: (random(-0.05, 0.05) + shell.vx * 0.02), 
        vy: (random(-0.05, 0.05) + shell.vy * 0.02),
        life: random(200, 300), 
        maxLife: 300,
        color: getRandomTextColor(), 
        alpha: 1,
        size: random(3.0, 4.5), 
        type: 'text',
        shape: 'square', 
        friction: 0.96, 
        gravity: 0.001, 
        flicker: true 
      });
    });
    
    // Minimal Bang
    for (let i = 0; i < 20; i++) { 
       const angle = random(0, Math.PI * 2);
       const speed = random(5, 15);
       particles.push({
         x: shell.x,
         y: shell.y,
         vx: Math.cos(angle) * speed,
         vy: Math.sin(angle) * speed,
         life: random(30, 50),
         maxLife: 50,
         color: '#ffffff',
         alpha: 0.9,
         size: random(1, 3),
         type: 'spark',
         shape: 'circle',
         friction: 0.85, 
         gravity: 0.05
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
        life: random(150, 250), 
        maxLife: 250,
        color: baseC,
        alpha: 1,
        size: random(1.5, 2.5), 
        type: 'spark',
        shape: shape,
        friction: 0.92, 
        gravity: 0.03, 
        flicker: true 
      });
    }
  } 
  
  // --- STROBE (Flickering stars) ---
  else if (effect === 'strobe') {
    const count = Math.floor(particleCount * 0.8);
    const c = pickColor(color);
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(4, 15) * speedMultiplier;
      particles.push({
        x: shell.x,
        y: shell.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(100, 180),
        maxLife: 180,
        color: c,
        alpha: 1,
        size: random(2.5, 4.5), 
        type: 'spark',
        shape: shape,
        friction: 0.93,
        gravity: 0.02,
        flicker: true
      });
    }
  }

  // --- RING / DOUBLE-RING ---
  else if (effect === 'ring' || effect === 'double-ring') {
    const isDouble = effect === 'double-ring';
    const ringCount = Math.floor(particleCount * 0.6);
    const ringColor = pickColor(color);
    const innerColor = pickColor(color === 'random' ? 'random' : color);
    
    // Outer Ring
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
        size: random(2, 3),
        type: 'spark',
        shape: shape,
        friction: 0.95,
        gravity: 0.02,
        flicker: false
      });
    }

    // Inner Ring
    if (isDouble) {
      const innerCount = Math.floor(ringCount * 0.6);
      for (let i = 0; i < innerCount; i++) {
        const angle = (Math.PI * 2 * i) / innerCount;
        const speed = 5 * speedMultiplier;
        
        particles.push({
          x: shell.x,
          y: shell.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: random(80, 120),
          maxLife: 120,
          color: innerColor,
          alpha: 1,
          size: random(2, 3),
          type: 'spark',
          shape: shape,
          friction: 0.95,
          gravity: 0.02,
          flicker: true
        });
      }
    }
  }
  
  // --- GALAXY (Spiral) ---
  else if (effect === 'galaxy') {
    const arms = random(3, 6); 
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
                size: random(1.5, 3.5),
                type: 'spark',
                shape: shape,
                friction: 0.94,
                gravity: 0.03,
                flicker: Math.random() > 0.5
            });
        }
    }
  }

  // --- CLASSIC ---
  else {
    const style = Math.random() > 0.5 ? 'peony' : 'streak';
    
    for (let i = 0; i < particleCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(2, 14) * speedMultiplier;
      
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
        friction: style === 'peony' ? 0.92 : 0.96, 
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
    ctx.arc(shell.x, shell.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeedd';
    ctx.fill();

    // Trail
    ctx.beginPath();
    ctx.moveTo(shell.x, shell.y);
    ctx.lineTo(shell.x - shell.vx * 2, shell.y - shell.vy * 2);
    ctx.strokeStyle = 'rgba(255,230,200,0.4)';
    ctx.lineWidth = 1.5;
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

    // Handle Holding State (Pre-Explosion Animation)
    if (p.holding && p.holding > 0 && p.initialX !== undefined && p.initialY !== undefined) {
       p.holding--;
       // Minimal shake for text/pattern clarity
       const shakeIntensity = (p.type === 'text') ? 0.2 : 0.5;
       p.x = p.initialX + (Math.random() - 0.5) * shakeIntensity;
       p.y = p.initialY + (Math.random() - 0.5) * shakeIntensity;
       
       // Pulse effect while holding
       p.alpha = 0.9 + Math.sin(Date.now() / 50) * 0.1; 
    } else {
        // Standard Physics
        p.x += p.vx;
        p.y += p.vy;
        
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        
        p.life -= 1;

        // Visual Decay
        const lifeRatio = p.life / p.maxLife;
        // Keep text/patterns visible longer at full brightness
        const threshold = p.type === 'text' ? 0.15 : 0.3;
        p.alpha = lifeRatio > threshold ? 1 : lifeRatio / threshold;
    }

    // Intense Flicker
    let renderAlpha = p.alpha;
    if (p.flicker) {
       if (Math.random() > 0.5) {
         renderAlpha = p.alpha;
       } else {
         // Text flickers less aggressively to maintain readability
         const dimFactor = p.type === 'text' ? 0.7 : 0.4;
         renderAlpha = dimFactor * p.alpha; 
       }
    }

    if (p.life <= 0 || p.alpha <= 0.01) {
      particles.splice(i, 1);
      continue;
    }

    // Draw
    ctx.globalAlpha = Math.max(0, renderAlpha);
    ctx.fillStyle = p.color;
    
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
