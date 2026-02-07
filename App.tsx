
import React, { useRef, useEffect, useState } from 'react';
import FireworksCanvas, { FireworksCanvasHandle } from './components/FireworksCanvas';
import UIOverlay from './components/UIOverlay';
import { FireworkSettings } from './types';
import { initAudio, resumeAudio } from './utils/soundEngine';

function App() {
  const fireworksRef = useRef<FireworksCanvasHandle>(null);
  
  // Ref to track the 'active' state synchronously
  const isAutoFireActiveRef = useRef(false);
  // Ref to track the current speed multiplier
  const speedMultiplierRef = useRef(1);
  const autoFireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLaunch = (text: string, settings: FireworkSettings) => {
    // Launch towards the center-ish area but slightly randomized
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const x = w * 0.5 + (Math.random() - 0.5) * (w * 0.6); 
    const y = h * 0.2 + Math.random() * (h * 0.3);
    
    fireworksRef.current?.launch(x, y, text, settings);
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

  const handleTriggerSpecial = (type: 'salvo' | 'strafe' | 'fan' | 'finale') => {
    fireworksRef.current?.triggerSpecial(type);
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
