
import React, { useState, useEffect } from 'react';
import { generateNewYearWishes } from '../services/geminiService';
import { Sparkles, Send, Wand2, Info, Settings2, Palette, Box, Circle, Scaling, Volume2, VolumeX, Snowflake, Activity, Aperture, Star } from 'lucide-react';
import { FireworkSettings, ParticleShape, FireworkSize, FireworkEffect } from '../types';
import { toggleMute, getMuteState } from '../utils/soundEngine';

interface UIOverlayProps {
  onLaunch: (text: string, settings: FireworkSettings) => void;
  onAutoFireToggle: (enabled: boolean) => void;
}

const TEMPLATES = [
  "2026大吉",
  "马到成功", 
  "龙马精神",
  "新年快乐",
  "万事如意",
  "一马当先",
  "万马奔腾",
  "前程似锦"
];

const COLORS = [
  { name: '随机', value: 'random', class: 'bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500' },
  { name: '中国红', value: '#ef4444', class: 'bg-red-500' },
  { name: '富贵金', value: '#fbbf24', class: 'bg-amber-400' },
  { name: '星空蓝', value: '#3b82f6', class: 'bg-blue-500' },
  { name: '翡翠绿', value: '#10b981', class: 'bg-emerald-500' },
  { name: '紫气东来', value: '#a855f7', class: 'bg-purple-500' },
];

const EFFECTS: {id: FireworkEffect, name: string, icon: React.ReactNode}[] = [
  { id: 'classic', name: '经典', icon: <Star size={14} /> },
  { id: 'willow', name: '垂柳', icon: <Snowflake size={14} /> },
  { id: 'ring', name: '光环', icon: <Aperture size={14} /> },
  { id: 'galaxy', name: '星云', icon: <Activity size={14} /> },
];

const UIOverlay: React.FC<UIOverlayProps> = ({ onLaunch, onAutoFireToggle }) => {
  const [text, setText] = useState('');
  const [wishes, setWishes] = useState<string[]>(TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [autoFire, setAutoFire] = useState(true); 
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(false);
  
  // Customization State
  const [settings, setSettings] = useState<FireworkSettings>({
    color: 'random',
    size: 'medium',
    shape: 'circle',
    effect: 'classic'
  });

  // Init default auto-fire on mount
  useEffect(() => {
    onAutoFireToggle(true);
  }, []);

  const handleLaunch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onLaunch(text.trim(), settings);
    setText('');
  };

  const handleGenerateWishes = async () => {
    setLoading(true);
    const newWishes = await generateNewYearWishes();
    setWishes([...TEMPLATES, ...newWishes]);
    setLoading(false);
  };

  const handleSelectWish = (wish: string) => {
    setText(wish);
  };
  
  const toggleAutoFire = () => {
    const newState = !autoFire;
    setAutoFire(newState);
    onAutoFireToggle(newState);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMuted = toggleMute();
    setMuted(isMuted);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 drop-shadow-sm font-serif">
            2026 
            <span className="text-white text-lg md:text-2xl block md:inline md:ml-2 font-light tracking-widest">
              农历马年新春
            </span>
          </h1>
          <p className="text-gray-300 text-sm mt-1 max-w-md">
            金蛇狂舞辞旧岁，骏马奔腾迎新春。自定义您的烟花盛宴，点亮2026的夜空。
          </p>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={handleMuteToggle}
              className="p-3 rounded-full backdrop-blur-md bg-slate-900/40 border border-white/10 text-gray-300 hover:bg-white/10 transition-all shadow-lg"
              title={muted ? "开启声音" : "静音"}
            >
              {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-full backdrop-blur-md border transition-all shadow-lg ${showSettings ? 'bg-indigo-600/50 border-indigo-400 text-white' : 'bg-slate-900/40 border-white/10 text-gray-300 hover:bg-white/10'}`}
              title="设置"
            >
              <Settings2 size={24} />
            </button>
        </div>
      </div>

      {/* Settings Panel (Floating) */}
      {showSettings && (
        <div className="pointer-events-auto absolute top-24 right-4 md:right-8 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl animate-fade-in-down">
           <h3 className="text-white font-serif mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
             <Settings2 size={16} /> 烟花设置
           </h3>
           
           {/* Color Selection */}
           <div className="mb-4">
             <label className="text-gray-400 text-xs mb-2 flex items-center gap-2"><Palette size={14} /> 颜色</label>
             <div className="grid grid-cols-6 gap-2">
               {COLORS.map((c) => (
                 <button
                   key={c.value}
                   onClick={() => setSettings(s => ({...s, color: c.value}))}
                   className={`w-8 h-8 rounded-full shadow-inner border-2 transition-transform hover:scale-110 ${c.class} ${settings.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                   title={c.name}
                 />
               ))}
             </div>
           </div>

           {/* Effect Selection */}
           <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 flex items-center gap-2"><Sparkles size={14} /> 特效</label>
              <div className="grid grid-cols-2 gap-2">
                {EFFECTS.map((eff) => (
                  <button
                    key={eff.id}
                    onClick={() => setSettings(s => ({...s, effect: eff.id}))}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg text-xs border transition-all ${settings.effect === eff.id ? 'bg-white/20 border-white text-white' : 'bg-black/20 border-transparent text-gray-400 hover:bg-white/5'}`}
                  >
                    {eff.icon}
                    {eff.name}
                  </button>
                ))}
              </div>
           </div>

           {/* Size Selection */}
           <div className="mb-4">
             <label className="text-gray-400 text-xs mb-2 flex items-center gap-2"><Scaling size={14} /> 大小</label>
             <div className="flex bg-black/20 rounded-lg p-1">
               {(['small', 'medium', 'large'] as FireworkSize[]).map((s) => (
                 <button
                   key={s}
                   onClick={() => setSettings(prev => ({...prev, size: s}))}
                   className={`flex-1 py-1.5 text-xs rounded-md capitalize transition-colors ${settings.size === s ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   {{'small': '小', 'medium': '中', 'large': '大'}[s]}
                 </button>
               ))}
             </div>
           </div>

           {/* Shape Selection */}
           <div>
             <label className="text-gray-400 text-xs mb-2 flex items-center gap-2"><Box size={14} /> 粒子形状</label>
             <div className="flex gap-2">
                <button 
                  onClick={() => setSettings(s => ({...s, shape: 'circle'}))}
                  className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 ${settings.shape === 'circle' ? 'bg-white/10 border-indigo-500 text-indigo-300' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}
                >
                  <Circle size={16} />
                  <span className="text-[10px]">圆形</span>
                </button>
                <button 
                  onClick={() => setSettings(s => ({...s, shape: 'square'}))}
                  className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 ${settings.shape === 'square' ? 'bg-white/10 border-indigo-500 text-indigo-300' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}
                >
                  <Box size={16} />
                  <span className="text-[10px]">方形</span>
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Center Controls - Bottom */}
      <div className="pointer-events-auto self-center w-full max-w-lg mb-8 space-y-4">
        
        {/* Wish Suggestions Chips */}
        <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto custom-scrollbar p-1">
          {wishes.map((wish, i) => (
            <button
              key={i}
              onClick={() => handleSelectWish(wish)}
              className="px-3 py-1 text-xs md:text-sm bg-white/10 hover:bg-red-600/80 hover:text-white backdrop-blur transition-all rounded-full border border-white/10 text-gray-200"
            >
              {wish}
            </button>
          ))}
          <button 
             onClick={handleGenerateWishes}
             disabled={loading}
             className="px-3 py-1 text-xs md:text-sm bg-indigo-600/50 hover:bg-indigo-500/80 backdrop-blur transition-all rounded-full border border-indigo-400/30 text-indigo-100 flex items-center gap-1"
          >
            {loading ? '思考中...' : <><Wand2 size={12} /> AI 祝福</>}
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-yellow-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
          <form onSubmit={handleLaunch} className="relative flex items-center bg-slate-950 rounded-lg p-1.5 border border-white/10">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入您的2026愿望 (例如: 马到成功)"
              className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 outline-none font-serif text-lg"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-md transition-colors shadow-lg flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Floating Toggles */}
        <div className="flex justify-center gap-4">
           <button
             onClick={toggleAutoFire}
             className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all border ${
               autoFire 
                ? 'bg-red-600/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
             }`}
           >
             <Sparkles size={16} className={autoFire ? "animate-spin-slow" : ""} />
             <span className="text-sm font-medium">{autoFire ? "自动播放: 开" : "自动播放: 关"}</span>
           </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="pointer-events-auto absolute bottom-4 right-4">
         <div className="group relative flex justify-end">
            <button className="p-2 text-white/30 hover:text-white/80 transition-colors">
               <Info size={20} />
            </button>
            <div className="absolute bottom-full right-0 mb-2 w-64 p-4 bg-slate-900/90 backdrop-blur border border-white/10 rounded-lg text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
               <p>由 React, Canvas API & Gemini 驱动。</p>
               <p className="mt-1">点击右上角设置图标自定义烟花样式。</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UIOverlay;
