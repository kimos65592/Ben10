import React, { useState, useEffect, useRef } from 'react';
import { GeminiLiveService } from './lib/gemini';
import { Scene } from './components/Scene';
import { Mic, MicOff, Settings, MessageSquare, Zap, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [inputText, setInputText] = useState('');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'fbx' | 'obj'>('fbx');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const geminiRef = useRef<GeminiLiveService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const isConnectedRef = useRef(false);

  useEffect(() => {
    geminiRef.current = new GeminiLiveService();
    return () => {
      geminiRef.current?.close();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'obj') setModelType('obj');
      else setModelType('fbx');
    }
  };

  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTextureUrl(url);
    }
  };

  const startAssistant = async () => {
    if (!geminiRef.current) return;

    try {
      await geminiRef.current.connect({
        voiceName: selectedVoice,
        onOpen: () => {
          setIsConnected(true);
          isConnectedRef.current = true;
          startMic();
        },
        onMessage: (msg) => {
          if (msg.serverContent?.modelTurn) {
            setIsTalking(true);
            setTimeout(() => setIsTalking(false), 2000);
          }
          if (msg.serverContent?.interrupted) {
            setIsTalking(false);
          }
        },
        onError: (err) => {
          console.error('Gemini Error:', err);
          stopAssistant();
        },
        onClose: () => {
          setIsConnected(false);
          isConnectedRef.current = false;
        },
      });
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !geminiRef.current || !isConnected) return;
    
    await geminiRef.current.sendText(inputText);
    setInputText('');
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext({ sampleRate: 16000 });
      await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!isConnectedRef.current || !geminiRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        // Convert to Base64 safely
        const bytes = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        geminiRef.current.sendAudio(base64);
      };

      setIsListening(true);
      // Store references to stop later
      (window as any)._audioStream = stream;
      (window as any)._audioContext = audioContext;
    } catch (err) {
      console.error('Mic access denied:', err);
      stopAssistant();
    }
  };

  const stopAssistant = () => {
    if ((window as any)._audioStream) {
      (window as any)._audioStream.getTracks().forEach((t: any) => t.stop());
      (window as any)._audioStream = null;
    }
    if ((window as any)._audioContext) {
      (window as any)._audioContext.close();
      (window as any)._audioContext = null;
    }
    geminiRef.current?.close();
    setIsListening(false);
    setIsConnected(false);
    isConnectedRef.current = false;
  };

  if (!isSetupComplete) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center p-6 font-sans text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-3xl bg-green-500/5 border border-green-500/20 backdrop-blur-xl text-center"
        >
          <Zap className="w-16 h-16 text-green-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-widest text-green-500 uppercase mb-4">إعدادات الأومنيتريكس</h1>
          <p className="text-green-500/70 mb-8">ارفع موديل 3D وصورة الأنسجة عشان نبدأ.</p>
          
          <div className="space-y-4 mb-8 text-left">
            <label className="block p-4 rounded-xl bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-all">
              <p className="text-xs text-green-500/50 uppercase tracking-widest mb-1">اختار موديل 3D (.fbx, .obj)</p>
              <p className="font-mono text-sm text-green-500 truncate">
                {modelUrl ? "تم اختيار الموديل" : "اضغط هنا لرفع الموديل"}
              </p>
              <input 
                type="file" 
                accept=".fbx,.obj" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            <label className="block p-4 rounded-xl bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-all">
              <p className="text-xs text-green-500/50 uppercase tracking-widest mb-1">اختار صورة الأنسجة (اختياري)</p>
              <p className="font-mono text-sm text-green-500 truncate">
                {textureUrl ? "تم اختيار الصورة" : "اضغط هنا لرفع الصورة"}
              </p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleTextureUpload} 
                className="hidden" 
              />
            </label>

            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-green-500/50 uppercase tracking-widest mb-2">اختار صوت الذكاء الاصطناعي</p>
              <div className="grid grid-cols-3 gap-2">
                {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map((voice) => (
                  <button
                    key={voice}
                    onClick={() => setSelectedVoice(voice)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      selectedVoice === voice 
                        ? 'bg-green-500 text-black' 
                        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    }`}
                  >
                    {voice}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSetupComplete(true)}
            disabled={!modelUrl}
            className={`w-full py-4 rounded-full font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] ${
              modelUrl ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-green-900/20 text-green-900 cursor-not-allowed border border-green-900/30'
            }`}
          >
            بدء تشغيل النظام
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Scene isListening={isListening} isTalking={isTalking} modelUrl={modelUrl} modelType={modelType} textureUrl={textureUrl} />
      </div>

      {/* Futuristic HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center animate-pulse">
              <Zap className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-green-500 uppercase">أومنيتريكس AI</h1>
              <p className="text-[10px] text-green-800 tracking-[0.2em]">إصدار النظام 10.0.4</p>
            </div>
          </div>
          <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={() => setIsSetupComplete(false)}
              className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
            >
              <Settings className="w-5 h-5 text-green-500" />
            </button>
          </div>
        </div>

        {/* Side Panels */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6">
          {[Shield, Activity, MessageSquare].map((Icon, i) => (
            <div key={i} className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 backdrop-blur-md">
              <Icon className="w-6 h-6 text-green-500/50" />
            </div>
          ))}
        </div>

        {/* Bottom Interface */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 pointer-events-auto">
          <div className="flex flex-col gap-4">
            {/* Text Input HUD */}
            <AnimatePresence>
              {isConnected && (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onSubmit={handleSendText}
                  className="flex gap-2 p-2 rounded-full bg-black/40 border border-green-500/30 backdrop-blur-xl"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="اكتب أمرك هنا..."
                    className="flex-1 bg-transparent border-none outline-none px-4 text-green-500 placeholder-green-900 text-right"
                  />
                  <button
                    type="submit"
                    className="p-3 rounded-full bg-green-500 text-black hover:bg-green-400 transition-all"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Activation Button */}
            <div className="relative group">
              <div className={`absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${isConnected ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <button
                onClick={isConnected ? stopAssistant : startAssistant}
                className={`relative w-full py-4 rounded-full flex items-center justify-center gap-4 transition-all duration-300 ${
                  isConnected ? 'bg-red-500/20 border-red-500' : 'bg-green-500/20 border-green-500'
                } border-2 backdrop-blur-xl`}
              >
                {isConnected ? (
                  <>
                    <MicOff className="w-6 h-6 text-red-500" />
                    <span className="font-bold tracking-widest text-red-500 uppercase">إيقاف التشغيل</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6 text-green-500" />
                    <span className="font-bold tracking-widest text-green-500 uppercase">تفعيل الأومنيتريكس</span>
                  </>
                )}
              </button>
            </div>
            
            <AnimatePresence>
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 backdrop-blur-md text-center"
                >
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: isTalking ? [4, 16, 4] : 4 }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-1 bg-green-500 rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-green-500 text-sm font-medium">
                    {isTalking ? 'الذكاء الاصطناعي يتحدث...' : 'أنا بسمعك، اتفضل قول اللي عاوزه...'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #00ff00 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>
    </div>
  );
}

