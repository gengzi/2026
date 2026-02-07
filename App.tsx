import React, { useRef, useEffect, useState } from 'react';
import FireworksCanvas, { FireworksCanvasHandle } from './components/FireworksCanvas';
import UIOverlay from './components/UIOverlay';
import { FireworkSettings } from './types';
import { initAudio, resumeAudio } from './utils/soundEngine';

function App() {
  const fireworksRef = useRef<FireworksCanvasHandle>(null);
  const autoFireRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLaunch = (text: string, settings: FireworkSettings) => {
    // Launch towards the center-ish area but slightly randomized
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Constraint: Keep text fireworks well within the central area to ensure readability and visibility
    const x = w * 0.5 + (Math.random() - 0.5) * (w * 0.6); // Range 20% - 80% width
    // Target height: 20% to 50% from top (higher up)
    const y = h * 0.2 + Math.random() * (h * 0.3);
    
    // The FireworksCanvas now also has internal clamping, but we guide it here first
    fireworksRef.current?.launch(x, y, text, settings);
  };

  const handleAutoFireToggle = (enabled: boolean) => {
    if (enabled) {
      // Start auto fire loop
      const fire = () => {
         fireworksRef.current?.autoLaunch();
         // Random interval between 500ms and 2000ms
         const nextDelay = Math.random() * 1500 + 500;
         autoFireRef.current = setTimeout(fire, nextDelay);
      };
      fire();
    } else {
      if (autoFireRef.current) {
        clearTimeout(autoFireRef.current);
        autoFireRef.current = null;
      }
    }
  };

  const handleInteraction = () => {
    // Initialize or resume audio context on first interaction
    initAudio();
    resumeAudio();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoFireRef.current) clearTimeout(autoFireRef.current);
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-slate-950" 
      onClick={handleInteraction} // Capture interaction anywhere
      onKeyDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <FireworksCanvas ref={fireworksRef} />
      <UIOverlay 
        onLaunch={handleLaunch} 
        onAutoFireToggle={handleAutoFireToggle}
      />
    </div>
  );
}

export default App;