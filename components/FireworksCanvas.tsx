
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FireworkShell, Particle, FireworkSettings, FireworkEffect } from '../types';
import { updatePhysics, random } from '../utils/fireworksEngine';
import { playLaunchSound } from '../utils/soundEngine';
import { getRandomHotWord } from '../data/hotWords';

export interface FireworksCanvasHandle {
  launch: (x: number, y: number, text?: string, settings?: FireworkSettings) => void;
  autoLaunch: () => void;
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
        if (r > 0.85) effect = 'galaxy';
        else if (r > 0.70) effect = 'ring';
        else if (r > 0.50) effect = 'willow';

        const randomSettings: FireworkSettings = {
          color: 'random',
          size: Math.random() > 0.6 ? 'large' : 'medium',
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          effect: effect
        };

        createShell(x, y, text, randomSettings);
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
      // Capture at 60FPS for smoothness
      const stream = canvas.captureStream(60); 
      
      try {
        const recorder = new MediaRecorder(stream, {
          mimeType,
          // 8 Mbps bitrate for crisp visuals, similar to a high-quality GIF/Video
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
      // Background handling: 
      // We use 'source-over' with semi-transparent black to create trails.
      // But we MUST ensure the base is dark for video recording.
      
      // 1. Fade existing trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Draw a faint black layer to ensure video background isn't transparent
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = 'rgba(2, 6, 23, 1)'; // slate-950 full opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Draw particles
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
