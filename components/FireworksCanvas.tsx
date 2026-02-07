
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FireworkShell, Particle, FireworkSettings, FireworkEffect, PatternType } from '../types';
import { updatePhysics, random } from '../utils/fireworksEngine';
import { playLaunchSound } from '../utils/soundEngine';
import { getRandomHotWord } from '../data/hotWords';

export interface FireworksCanvasHandle {
  launch: (x: number, y: number, text?: string, settings?: FireworkSettings) => void;
  launchPattern: (pattern: PatternType) => void;
  autoLaunch: () => void;
  triggerSpecial: (type: 'salvo' | 'strafe' | 'fan' | 'finale') => void;
  snapshot: () => string | null;
  recordVideo: (durationMs: number) => Promise<Blob | null>;
}

// Track recent text explosions to prevent overlap
interface TextZone {
  x: number;
  y: number;
  timestamp: number;
}

const FireworksCanvas = forwardRef<FireworksCanvasHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellsRef = useRef<FireworkShell[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Store recent text explosion locations
  const textZonesRef = useRef<TextZone[]>([]);

  // Default settings if none provided
  const defaultSettings: FireworkSettings = {
    color: 'random',
    size: 'medium',
    shape: 'circle',
    effect: 'classic'
  };

  useImperativeHandle(ref, () => ({
    launch(x: number, y: number, text?: string, settings?: FireworkSettings) {
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      
      const safeX = Math.max(w * 0.1, Math.min(x, w * 0.9));
      const safeY = Math.max(h * 0.1, Math.min(y, h * 0.6));

      createShell(safeX, safeY, text, undefined, settings || defaultSettings);
    },
    launchPattern(pattern: PatternType) {
       if (!canvasRef.current) return;
       const w = canvasRef.current.width;
       const h = canvasRef.current.height;
       // Launch in center area
       createShell(w/2, h*0.3, undefined, pattern, defaultSettings);
    },
    autoLaunch() {
      if (canvasRef.current) {
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        const now = Date.now();

        // Clean up old zones (> 4 seconds)
        textZonesRef.current = textZonesRef.current.filter(z => now - z.timestamp < 4000);

        // Random Logic: Text > Pattern > Normal
        const r = Math.random();
        let text: string | undefined;
        let pattern: PatternType | undefined;
        let isSpecial = false;
        
        if (r > 0.85) {
             const patterns: PatternType[] = ['heart', 'star', 'smile', 'diamond', 'spiral', 'crown', 'music', 'butterfly'];
             pattern = patterns[Math.floor(Math.random() * patterns.length)];
             isSpecial = true;
        } else if (r > 0.60) {
             text = getRandomHotWord();
             isSpecial = true;
        }
        
        // Overlap Check for Text/Pattern
        let x: number, y: number;
        let validPosition = false;
        
        // Try finding a valid position
        const maxAttempts = 5;
        for (let i = 0; i < maxAttempts; i++) {
            const paddingPercent = isSpecial ? 0.2 : 0.15; 
            x = random(w * paddingPercent, w * (1 - paddingPercent));
            y = random(h * 0.15, h * 0.45); 

            if (isSpecial) {
                // Check distance against existing zones
                const tooClose = textZonesRef.current.some(zone => {
                    const dx = zone.x - x;
                    const dy = zone.y - y;
                    return Math.hypot(dx, dy) < 250; // Minimum distance 250px
                });
                if (!tooClose) {
                    validPosition = true;
                    break;
                }
            } else {
                validPosition = true;
                break;
            }
        }
        
        // If we couldn't find a spot for special text, fallback to normal firework
        if (isSpecial && !validPosition) {
            text = undefined;
            pattern = undefined;
            x = random(w * 0.1, w * 0.9);
            y = random(h * 0.15, h * 0.45);
        }

        // Register new zone if special
        if (text || pattern) {
            textZonesRef.current.push({ x, y, timestamp: now });
        }
        
        const effectRoll = Math.random();
        let effect: FireworkEffect = 'classic';
        if (effectRoll > 0.90) effect = 'galaxy';
        else if (effectRoll > 0.80) effect = 'strobe';
        else if (effectRoll > 0.70) effect = 'double-ring';
        else if (effectRoll > 0.60) effect = 'ring';
        else if (effectRoll > 0.45) effect = 'willow';

        const randomSettings: FireworkSettings = {
          color: 'random',
          size: Math.random() > 0.6 ? 'large' : 'medium',
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          effect: effect
        };

        createShell(x!, y!, text, pattern, randomSettings);
      }
    },
    triggerSpecial(type: 'salvo' | 'strafe' | 'fan' | 'finale') {
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      const colors = ['gold', 'red', 'silver', 'blue', 'colorful', 'sunset', 'mint', 'cherry'];
      const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

      if (type === 'salvo') {
        // 图案齐射 (Pattern Salvo)
        const count = 8;
        const pattern: PatternType = (['heart', 'star', 'music', 'butterfly'] as PatternType[])[Math.floor(Math.random()*4)];
        const color = randomColor();
        
        for (let i = 0; i < count; i++) {
            const x = (w * 0.15) + ((w * 0.7) / (count-1)) * i;
            const y = h * 0.3;
            setTimeout(() => {
                createShell(x, y, undefined, pattern, {
                    color: color,
                    size: 'large',
                    shape: 'square',
                    effect: 'classic'
                });
            }, i * 80);
        }
      } else if (type === 'strafe') {
        // 极速加特林 (Gatling Gun) - Very Fast
        const count = 40;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const x = (w * 0.1) + ((w * 0.8) / count) * i;
                const y = h * 0.4 + Math.sin(i * 0.8) * (h * 0.1); 
                createShell(x, y, undefined, undefined, {
                    color: randomColor(),
                    size: 'small',
                    shape: 'square',
                    effect: 'strobe'
                });
            }, i * 30); // Super fast 30ms delay
        }
      } else if (type === 'fan') {
        // 密集扇形 (Dense Fan)
        const count = 15;
        const color = randomColor();
        for (let i = 0; i < count; i++) {
             const t = i / (count - 1);
             const x = (w * 0.1) + (w * 0.8) * t;
             const y = h * 0.2 + Math.abs(t - 0.5) * (h * 0.3);
             
             setTimeout(() => {
                createShell(x, y, undefined, undefined, {
                    color: color,
                    size: 'large',
                    shape: 'circle',
                    effect: 'willow'
                });
             }, i * 60);
        }
      } else if (type === 'finale') {
        // 终极审判 (The Nuclear Option)
        
        // 1. Chaos Phase
        for(let i=0; i<20; i++) {
            setTimeout(() => {
                createShell(random(w*0.1, w*0.9), random(h*0.2, h*0.6), undefined, undefined, {
                    color: randomColor(), size: 'medium', shape: 'circle', effect: 'strobe'
                });
            }, i * 50);
        }

        // 2. Pattern Barrage
        setTimeout(() => {
            const patterns: PatternType[] = ['heart', 'smile', 'diamond', 'spiral', 'butterfly'];
            for(let i=0; i<6; i++) {
                setTimeout(() => {
                   createShell(random(w*0.1, w*0.9), h*0.3, undefined, patterns[i%patterns.length], {
                        color: 'random', size: 'large', shape: 'square', effect: 'classic'
                   });
                }, i * 300);
            }
        }, 1200);

        // 3. Wall of Willows
        setTimeout(() => {
            for(let i=0; i<12; i++) {
                createShell((w/12)*i + 50, h*0.25, undefined, undefined, {
                    color: 'gold', size: 'large', shape: 'circle', effect: 'willow'
                });
            }
        }, 3000);
        
        // 4. Grand Finale Text
        setTimeout(() => {
             createShell(w/2, h*0.2, undefined, '2026', {
                 color: 'gold', size: 'large', shape: 'square', effect: 'classic'
             });
             // Flanking crowns
             createShell(w*0.2, h*0.3, undefined, 'crown', { color: 'silver', size: 'medium', shape: 'square', effect: 'classic'});
             createShell(w*0.8, h*0.3, undefined, 'crown', { color: 'silver', size: 'medium', shape: 'square', effect: 'classic'});
        }, 4500);

        // 5. Whiteout
        setTimeout(() => {
             for(let i=0; i<30; i++) {
                 setTimeout(() => {
                     createShell(random(w*0.05, w*0.95), random(h*0.05, h*0.5), undefined, undefined, {
                         color: 'white', size: 'large', shape: 'circle', effect: 'strobe'
                     });
                 }, i * 20);
             }
        }, 6000);
      }
    },
    snapshot() {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');
      if (!tCtx) return null;

      tCtx.fillStyle = '#020617'; 
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.drawImage(canvas, 0, 0);
      tCtx.font = '20px "Noto Serif SC", serif';
      tCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      tCtx.textAlign = 'right';
      tCtx.fillText('2026 新春烟花庆典', tempCanvas.width - 20, tempCanvas.height - 20);

      return tempCanvas.toDataURL('image/png');
    },
    async recordVideo(durationMs: number) {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!mimeType) {
        console.error("MediaRecorder not supported");
        return null;
      }

      const stream = canvas.captureStream(60); 
      
      try {
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 15000000 
        });

        recordedChunksRef.current = [];
        mediaRecorderRef.current = recorder;

        return new Promise((resolve) => {
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            resolve(blob);
          };

          recorder.start();

          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, durationMs);
        });

      } catch (e) {
        console.error("Failed to start recording", e);
        return null;
      }
    }
  }));

  const createShell = (
      targetX: number, 
      targetY: number, 
      text?: string, 
      pattern?: PatternType, 
      settings: FireworkSettings = defaultSettings
  ) => {
    if (!canvasRef.current) return;
    const startX = canvasRef.current.width / 2 + random(-100, 100); 
    const startY = canvasRef.current.height;

    const heightDiff = startY - targetY;
    const baseSpeed = Math.sqrt(2 * 0.04 * heightDiff);
    const speed = baseSpeed * random(0.98, 1.02); 
    
    const angle = Math.atan2(targetY - startY, targetX - startX);
    
    shellsRef.current.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * (Math.abs(targetX - startX) / (speed / 0.04 * 2)), 
      vy: Math.sin(angle) * speed,
      targetX,
      targetY,
      hue: random(0, 360),
      color: settings.color,
      text,
      pattern,
      settings,
      completed: false
    });
    
    playLaunchSound();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const loop = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';
      updatePhysics(shellsRef.current, particlesRef.current, ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      const w = rect.width;
      const h = rect.height;
      
      const safeX = Math.max(w * 0.15, Math.min(rawX, w * 0.85));
      
      let targetY;
      if (rawY > h * 0.5) {
         targetY = random(h * 0.15, h * 0.45);
      } else {
         targetY = Math.max(h * 0.1, rawY);
      }
      
      // Chance to fire a random pattern on click
      const patterns: PatternType[] = ['heart', 'star', 'smile', 'spiral', 'butterfly', 'music'];
      const pattern: PatternType | undefined = Math.random() > 0.7 
          ? patterns[Math.floor(Math.random()*patterns.length)] 
          : undefined;

      createShell(safeX, targetY, undefined, pattern, defaultSettings);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 cursor-crosshair bg-slate-950"
      onClick={handleCanvasClick}
    />
  );
});

export default FireworksCanvas;
