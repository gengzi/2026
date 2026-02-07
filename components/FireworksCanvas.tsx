
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FireworkShell, Particle, FireworkSettings, FireworkEffect } from '../types';
import { updatePhysics, random } from '../utils/fireworksEngine';
import { playLaunchSound } from '../utils/soundEngine';
import { getRandomHotWord } from '../data/hotWords';

export interface FireworksCanvasHandle {
  launch: (x: number, y: number, text?: string, settings?: FireworkSettings) => void;
  autoLaunch: () => void;
}

const FireworksCanvas = forwardRef<FireworksCanvasHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellsRef = useRef<FireworkShell[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

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
      // Smoother trails: 0.1 opacity creates longer, smoother trails than 0.15
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
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
