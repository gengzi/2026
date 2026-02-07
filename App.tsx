
import React, { useRef, useEffect, useState } from 'react';
import FireworksCanvas, { FireworksCanvasHandle } from './components/FireworksCanvas';
import UIOverlay from './components/UIOverlay';
import { FireworkSettings } from './types';
import { initAudio, resumeAudio } from './utils/soundEngine';

function App() {
  const fireworksRef = useRef<FireworksCanvasHandle>(null);
  
  // Use a Ref to track the 'active' state synchronously for the timeout loop
  const isAutoFireActiveRef = useRef(false);
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
    // Strictly check if active
    if (!isAutoFireActiveRef.current) return;

    // Performance aware delay: 
    // If we are just running text fireworks or heavy load, maybe slow down slightly?
    const baseDelay = 800;
    const randomDelay = Math.random() * 1500;
    const nextDelay = baseDelay + randomDelay;

    autoFireTimeoutRef.current = setTimeout(() => {
      // Double check inside the timeout callback
      if (!isAutoFireActiveRef.current) return;
      
      fireworksRef.current?.autoLaunch();
      scheduleNextFire();
    }, nextDelay);
  };

  const handleAutoFireToggle = (enabled: boolean) => {
    isAutoFireActiveRef.current = enabled;

    if (enabled) {
      // Start the loop if not already running
      if (!autoFireTimeoutRef.current) {
         // Fire immediately once, then schedule
         fireworksRef.current?.autoLaunch();
         scheduleNextFire();
      }
    } else {
      // Stop the loop immediately
      if (autoFireTimeoutRef.current) {
        clearTimeout(autoFireTimeoutRef.current);
        autoFireTimeoutRef.current = null;
      }
    }
  };

  const handleInteraction = () => {
    initAudio();
    resumeAudio();
  };
  
  const handleGetSnapshot = () => {
    return fireworksRef.current?.snapshot() || null;
  };

  const handleStartVideoRecording = async () => {
    return await fireworksRef.current?.recordVideo(4000) || null;
  };

  // Cleanup on unmount
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
        getSnapshot={handleGetSnapshot}
        startVideoRecording={handleStartVideoRecording}
      />
    </div>
  );
}

export default App;
