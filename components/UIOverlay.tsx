
import React, { useState, useEffect } from 'react';
import { generateNewYearWishes } from '../services/geminiService';
import { Sparkles, Send, Wand2, Info, Settings2, Palette, Box, Circle, Scaling, Volume2, VolumeX, Snowflake, Activity, Aperture, Star, Share2, Download, X, Copy, Camera, Video, Loader2, Zap, Disc } from 'lucide-react';
import { FireworkSettings, ParticleShape, FireworkSize, FireworkEffect } from '../types';
import { toggleMute, getMuteState } from '../utils/soundEngine';

interface UIOverlayProps {
  onLaunch: (text: string, settings: FireworkSettings) => void;
  onAutoFireToggle: (enabled: boolean) => void;
  getSnapshot: () => string | null;
  startVideoRecording: () => Promise<Blob | null>;
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

// Updated Palettes to match engine realistic colors
const COLORS = [
  { name: '随机', value: 'random', class: 'bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500' },
  { name: '流光金', value: 'gold', class: 'bg-gradient-to-r from-yellow-300 to-yellow-600' },
  { name: '中国红', value: 'red', class: 'bg-gradient-to-r from-red-500 to-red-700' },
  { name: '钛金银', value: 'silver', class: 'bg-gradient-to-r from-slate-200 to-slate-400' },
  { name: '冰川蓝', value: 'blue', class: 'bg-gradient-to-r from-blue-400 to-blue-600' },
  { name: '绚丽彩', value: 'colorful', class: 'bg-gradient-to-r from-green-400 via-red-400 to-purple-400' },
];

const EFFECTS: {id: FireworkEffect, name: string, icon: React.ReactNode}[] = [
  { id: 'classic', name: '经典', icon: <Star size={14} /> },
  { id: 'willow', name: '垂柳', icon: <Snowflake size={14} /> },
  { id: 'ring', name: '光环', icon: <Aperture size={14} /> },
  { id: 'double-ring', name: '双环', icon: <Disc size={14} /> },
  { id: 'galaxy', name: '星云', icon: <Activity size={14} /> },
  { id: 'strobe', name: '闪耀', icon: <Zap size={14} /> },
];

const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

const UIOverlay: React.FC<UIOverlayProps> = ({ onLaunch, onAutoFireToggle, getSnapshot, startVideoRecording }) => {
  const [text, setText] = useState('');
  const [wishes, setWishes] = useState<string[]>(TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [autoFire, setAutoFire] = useState(true); 
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(false);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  
  // Customization State
  const [settings, setSettings] = useState<FireworkSettings>({
    color: 'random',
    size: 'medium',
    shape: 'circle',
    effect: 'classic'
  });

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

  // --- IMAGE SHARING ---
  const handleSnapshotClick = async () => {
    const dataUrl = getSnapshot();
    if (!dataUrl) return;
    
    setShareType('image');
    setMediaUrl(dataUrl);
    setMediaBlob(dataURItoBlob(dataUrl));
    setShowShareModal(true);
  };

  // --- VIDEO RECORDING ---
  const handleVideoRecordClick = async () => {
    if (isRecording) return;
    setIsRecording(true);
    
    try {
      // Force enable autofire during recording to ensure content
      if (!autoFire) onAutoFireToggle(true);

      const blob = await startVideoRecording();
      
      if (!autoFire) onAutoFireToggle(false); // Restore state if needed
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        setShareType('video');
        setMediaUrl(url);
        setMediaBlob(blob);
        setShowShareModal(true);
      }
    } catch (err) {
      console.error("Recording failed", err);
      alert("无法录制视频，请检查浏览器兼容性");
    } finally {
      setIsRecording(false);
    }
  };

  // --- NATIVE SHARE ---
  const handleNativeShare = async () => {
    if (!navigator.share || !mediaBlob) return;
    
    try {
      const fileName = shareType === 'video' ? 'fireworks-2026.webm' : 'fireworks-2026.png';
      const file = new File([mediaBlob], fileName, { type: mediaBlob.type });
      
      const shareData: ShareData = {
        title: '2026 新春烟花庆典',
        text: `我在2026新春烟花庆典为你放了一场烟花！\n祝你：${text || '马年大吉，万事如意'}！\n点击链接一起放烟花：`,
        url: window.location.href,
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
      } else {
        await navigator.share(shareData);
      }
    } catch (err) {
      console.log('Share cancelled or failed', err);
    }
  };

  const copyToClipboard = () => {
    const shareText = `2026 新春烟花庆典\n${window.location.href}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert("链接已复制，快去分享给好友吧！");
    });
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
            金蛇狂舞辞旧岁，骏马奔腾迎新春。
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
            
            {/* Snapshot Button */}
            <button 
              onClick={handleSnapshotClick}
              disabled={isRecording}
              className="p-3 rounded-full backdrop-blur-md bg-slate-900/40 border border-white/10 text-gray-300 hover:bg-white/10 transition-all shadow-lg disabled:opacity-30"
              title="拍照分享"
            >
              <Camera size={24} />
            </button>

            {/* Video Record Button */}
            <button 
              onClick={handleVideoRecordClick}
              disabled={isRecording}
              className={`p-3 rounded-full backdrop-blur-md border transition-all shadow-lg relative ${isRecording ? 'bg-red-900/50 border-red-500' : 'bg-gradient-to-br from-red-600 to-red-500 border-red-400 hover:scale-105'}`}
              title="录制动图/视频"
            >
              {isRecording ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : (
                <Video size={24} className="text-white animate-pulse-slow" />
              )}
              {isRecording && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
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

      {/* Share/Preview Modal */}
      {showShareModal && mediaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-fade-in">
           <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 flex justify-between items-center border-b border-white/10">
                 <h3 className="text-white font-serif flex items-center gap-2">
                   {shareType === 'video' ? <Video size={18} /> : <Camera size={18} />} 
                   {shareType === 'video' ? '烟花实况 (高清)' : '烟花贺卡'}
                 </h3>
                 <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="relative bg-black group flex items-center justify-center min-h-[300px]">
                {shareType === 'video' ? (
                  <video 
                    src={mediaUrl} 
                    autoPlay 
                    loop 
                    playsInline 
                    controls
                    className="w-full h-auto max-h-[60vh] object-contain" 
                  />
                ) : (
                  <img src={mediaUrl} alt="Fireworks Snapshot" className="w-full h-auto max-h-[60vh] object-cover" />
                )}
                
                {shareType === 'image' && (
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                    <p className="text-yellow-400 font-serif text-xl font-bold">2026 马年大吉</p>
                  </div>
                )}
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 bg-slate-800/50">
                 {/* Native Share */}
                 {navigator.share && (
                    <button 
                    onClick={handleNativeShare}
                    className="col-span-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl transition-colors font-bold shadow-lg"
                    >
                        <Share2 size={18} /> 发送给好友
                    </button>
                 )}

                 <a 
                   href={mediaUrl} 
                   download={shareType === 'video' ? "fireworks-2026.webm" : "fireworks-2026.png"}
                   className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
                 >
                    <Download size={18} /> 保存到相册
                 </a>
                 <button 
                   onClick={copyToClipboard}
                   className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl transition-colors"
                 >
                    <Copy size={18} /> 复制链接
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Settings Panel (Floating) */}
      {showSettings && (
        <div className="pointer-events-auto absolute top-24 right-4 md:right-8 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl animate-fade-in-down">
           <h3 className="text-white font-serif mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
             <Settings2 size={16} /> 烟花设置
           </h3>
           
           <div className="mb-4">
             <label className="text-gray-400 text-xs mb-2 flex items-center gap-2"><Palette size={14} /> 颜色风格</label>
             <div className="grid grid-cols-3 gap-2">
               {COLORS.map((c) => (
                 <button
                   key={c.value}
                   onClick={() => setSettings(s => ({...s, color: c.value}))}
                   className={`h-8 rounded-md shadow-sm border transition-transform hover:scale-105 ${c.class} ${settings.color === c.value ? 'border-white ring-2 ring-white/50' : 'border-transparent opacity-80 hover:opacity-100'}`}
                   title={c.name}
                 />
               ))}
             </div>
             <div className="text-center text-[10px] text-gray-500 mt-1">
                {COLORS.find(c => c.value === settings.color)?.name}
             </div>
           </div>

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

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-yellow-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
          <form onSubmit={handleLaunch} className="relative flex items-center bg-slate-950 rounded-lg p-1.5 border border-white/10">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入您的愿望... (支持长句)"
              className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 outline-none font-serif text-lg"
              maxLength={20} 
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
