
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FireworkShell, Particle, FireworkSettings, FireworkEffect } from '../types';
import { updatePhysics, random } from '../utils/fireworksEngine';
import { playLaunchSound } from '../utils/soundEngine';
import { getRandomHotWord } from '../data/hotWords';

export interface FireworksCanvasHandle {
  launch: (x: number, y: number, text?: string, settings?: FireworkSettings) => void;
  autoLaunch: () => void;
  triggerSpecial: (type: 'salvo' | 'strafe' | 'fan') => void;
  snapshot: () => string | null;
  recordVideo: (durationMs: number) => Promise<Blob | null>;
}

const FireworksCanvas = forwardRef<FireworksCanvasHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellsRef = useRef<FireworkShell[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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

      createShell(safeX, safeY, text, settings || defaultSettings);
    },
    autoLaunch() {
      if (canvasRef.current) {
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        
        const hasText = Math.random() > 0.3;
        const text = hasText ? getRandomHotWord() : undefined;
        
        const paddingPercent = hasText ? 0.25 : 0.15; 
        
        const x = random(w * paddingPercent, w * (1 - paddingPercent));
        const y = random(h * 0.15, h * 0.45); 
        
        const r = Math.random();
        let effect: FireworkEffect = 'classic';
        if (r > 0.90) effect = 'galaxy';
        else if (r > 0.80) effect = 'strobe';
        else if (r > 0.70) effect = 'double-ring';
        else if (r > 0.60) effect = 'ring';
        else if (r > 0.45) effect = 'willow';

        const randomSettings: FireworkSettings = {
          color: 'random',
          size: Math.random() > 0.6 ? 'large' : 'medium',
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          effect: effect
        };

        createShell(x, y, text, randomSettings);
      }
    },
    triggerSpecial(type: 'salvo' | 'strafe' | 'fan') {
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      const colors = ['gold', 'red', 'silver', 'blue', 'colorful', 'sunset', 'mint', 'cherry'];
      const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

      if (type === 'salvo') {
        // 万箭齐发: 10-15 shots at once across screen
        const count = 12;
        const color = randomColor();
        for (let i = 0; i < count; i++) {
            const x = (w * 0.1) + ((w * 0.8) / count) * i;
            const y = h * 0.2 + Math.random() * (h * 0.2); // Upper area
            // Slight delay between each so it's not a single frame lag spike
            setTimeout(() => {
                createShell(x, y, undefined, {
                    color: color,
                    size: 'medium',
                    shape: 'circle',
                    effect: 'willow' // Willow looks best for salvo
                });
            }, i * 50);
        }
      } else if (type === 'strafe') {
        // 扫射: Rapid fire left to right
        const count = 20;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const x = (w * 0.1) + ((w * 0.8) / count) * i;
                const y = h * 0.3 + Math.sin(i * 0.5) * (h * 0.1); // Wave pattern
                createShell(x, y, undefined, {
                    color: randomColor(),
                    size: 'small',
                    shape: 'square',
                    effect: 'strobe' // Strobe for machine gun feel
                });
            }, i * 80); // Fast timing
        }
      } else if (type === 'fan') {
        // 五谷丰登: Fan out from center
        const centerX = w / 2;
        const count = 10;
        const color = randomColor();
        for (let i = 0; i < count; i++) {
             // Calculate target based on angle
             const angle = Math.PI + (Math.PI / (count - 1)) * i; // Semi-circle arch
             const radius = h * 0.4;
             // Map angle to screen coordinates roughly
             const t = i / (count - 1);
             const x = (w * 0.2) + (w * 0.6) * t;
             const y = h * 0.2 + Math.abs(t - 0.5) * (h * 0.2);
             
             setTimeout(() => {
                createShell(x, y, undefined, {
                    color: color,
                    size: 'large',
                    shape: 'circle',
                    effect: 'double-ring'
                });
             }, i * 100);
        }
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

      // Prioritize H.264 (MP4-friendly) or VP9 (High Quality WebM)
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

      // HIGH QUALITY RECORDING SETTINGS
      const stream = canvas.captureStream(60); 
      
      try {
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 8000000 
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

  const createShell = (targetX: number, targetY: number, text?: string, settings: FireworkSettings = defaultSettings) => {
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
      // Clean Background Logic:
      // Increased opacity to 0.70 to create a sharper "fade" which looks better in video compression.
      // Higher opacity = less trails, higher contrast.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(2, 6, 23, 0.70)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles with additive blending for glow
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

      createShell(safeX, targetY, undefined, defaultSettings);
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
