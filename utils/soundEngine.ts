let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted = false;
let ambienceNode: AudioBufferSourceNode | null = null;

export const initAudio = () => {
  if (audioCtx) return;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  audioCtx = new Ctx();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);
  
  startAmbience();
};

export const resumeAudio = () => {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.3, audioCtx!.currentTime, 0.1);
  }
  return isMuted;
};

export const getMuteState = () => isMuted;

const startAmbience = () => {
  if (!audioCtx || !masterGain) return;
  
  // Create pinkish noise for wind/ambience
  const bufferSize = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; 
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200; 

  const gain = audioCtx.createGain();
  gain.gain.value = 0.05; // Very subtle

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start();
  ambienceNode = noise;
};

export const playLaunchSound = () => {
  if (!audioCtx || !masterGain || isMuted) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(masterGain);
  
  const now = audioCtx.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
  
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.4);
  
  osc.start(now);
  osc.stop(now + 0.4);
};

export const playExplosionSound = (size: 'small'|'medium'|'large') => {
  if (!audioCtx || !masterGain || isMuted) return;
  
  const now = audioCtx.currentTime;
  
  // 1. Noise Burst
  const bufferSize = audioCtx.sampleRate * 1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(1000, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(50, now + 0.8);
  
  const noiseGain = audioCtx.createGain();
  const vol = size === 'large' ? 0.6 : size === 'medium' ? 0.4 : 0.2;
  noiseGain.gain.setValueAtTime(vol, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start(now);
  noise.stop(now + 1);
  
  // 2. Low Thump (Oscillator)
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
  
  oscGain.gain.setValueAtTime(vol * 0.8, now);
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  osc.connect(oscGain);
  oscGain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.3);
};
