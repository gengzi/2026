
import React, { useRef, useEffect, useState } from 'react';
import FireworksCanvas, { FireworksCanvasHandle } from './components/FireworksCanvas';
import UIOverlay from './components/UIOverlay';
import { FireworkSettings, PatternType } from './types';
import { initAudio, resumeAudio } from './utils/soundEngine';

function App() {
  const fireworksRef = useRef<FireworksCanvasHandle>(null);
  
  // Ref to track the 'active' state synchronously
  const isAutoFireActiveRef = useRef(false);
  // Ref to track the current speed multiplier
  const speedMultiplierRef = useRef(1);
  const autoFireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLaunch = (text: string, settings: FireworkSettings) => {
    // Immediate launch of the main text
    const w = window.innerWidth;
    const h = window.innerHeight;
    fireworksRef.current?.launch(w / 2, h * 0.3, text, undefined, settings);

    // BARRAGE LOGIC: Continuous firing for 5 seconds
    const duration = 5000;
    const startTime = Date.now();
    
    const fireBarrage = () => {
        const now = Date.now();
        if (now - startTime > duration) return;

        // Random target covering the entire upper screen (10% to 70% height)
        const targetX = w * 0.1 + Math.random() * (w * 0.8);
        const targetY = h * 0.1 + Math.random() * (h * 0.6); 

        const r = Math.random();
        
        if (r < 0.50) {
            // 50% chance to repeat the text (Significantly increased)
            fireworksRef.current?.launch(targetX, targetY, text, undefined, settings);
        } else if (r < 0.85) {
            // 35% chance for a random pattern (Significantly increased)
            const patterns: PatternType[] = ['heart', 'star', 'smile', 'diamond', 'spiral', 'crown', 'music', 'butterfly', 'lantern', 'coin', 'fish', 'snowflake'];
            const p = patterns[Math.floor(Math.random() * patterns.length)];
            fireworksRef.current?.launch(targetX, targetY, undefined, p, settings);
        } else {
            // 15% chance for a standard colorful firework
            fireworksRef.current?.launch(targetX, targetY, undefined, undefined, {
                ...settings,
                color: 'random', 
                size: Math.random() > 0.5 ? 'large' : 'medium'
            });
        }

        // Schedule next shot (EXTREME rapid fire: 50-150ms)
        setTimeout(fireBarrage, Math.random() * 100 + 50);
    };

    // Start the barrage
    fireBarrage();
  };

  const scheduleNextFire = () => {
    if (!isAutoFireActiveRef.current) return;

    // Base delay logic adjusted by speedMultiplier
    // Multiplier > 1 means faster (shorter delay)
    // Multiplier < 1 means slower (longer delay)
    const baseDelay = 1200 / speedMultiplierRef.current;
    const randomDelay = Math.random() * (1000 / speedMultiplierRef.current);
    const nextDelay = baseDelay + randomDelay;

    autoFireTimeoutRef.current = setTimeout(() => {
      if (!isAutoFireActiveRef.current) return;
      
      fireworksRef.current?.autoLaunch();
      scheduleNextFire();
    }, nextDelay);
  };

  const handleAutoFireToggle = (enabled: boolean, speedMult: number) => {
    isAutoFireActiveRef.current = enabled;
    speedMultiplierRef.current = speedMult;

    // Clear existing timeout to apply new speed immediately if re-toggled
    if (autoFireTimeoutRef.current) {
        clearTimeout(autoFireTimeoutRef.current);
        autoFireTimeoutRef.current = null;
    }

    if (enabled) {
         fireworksRef.current?.autoLaunch();
         scheduleNextFire();
    }
  };

  const handleTriggerSpecial = (type: 'salvo' | 'strafe' | 'fan' | 'finale', customText?: string) => {
    fireworksRef.current?.triggerSpecial(type, customText);
  };

  const handleInteraction = () => {
    initAudio();
    resumeAudio();
  };
  
  const handleGetSnapshot = () => {
    return fireworksRef.current?.snapshot() || null;
  };

  const handleStartVideoRecording = async () => {
    // Increased duration to 10 seconds for better capture of text/finale
    return await fireworksRef.current?.recordVideo(10000) || null;
  };

  useEffect(() => {
    return () => {
      isAutoFireActiveRef.current = false;
      if (autoFireTimeoutRef.current) {
        clearTimeout(autoFireTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-slate-950" 
      onClick={handleInteraction} 
      onKeyDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <FireworksCanvas ref={fireworksRef} />
      <UIOverlay 
        onLaunch={handleLaunch} 
        onAutoFireToggle={handleAutoFireToggle}
        onTriggerSpecial={handleTriggerSpecial}
        getSnapshot={handleGetSnapshot}
        startVideoRecording={handleStartVideoRecording}
      />
    </div>
  );
}

export default App;
