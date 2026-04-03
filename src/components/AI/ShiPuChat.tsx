import { useState, useRef, useEffect } from 'react';
import { Lightbulb, Send, X, Mic, MessageSquare, Bot, User, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askShiPuAI, models } from '../../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

export default function ShiPuChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: "Hello! I'm ShiPu AI, your Lume assistant. How can I help you today? You can type your question or click the microphone for a voice conversation." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Live API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await askShiPuAI(userMsg, messages.map(m => `${m.role}: ${m.content}`).join('\n'));
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
      stopVoice();
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      sessionRef.current = await ai.live.connect({
        model: models.live,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are ShiPu AI, a helpful social media assistant for Lume. Speak in a friendly, concise manner. Assist with any app problems or general questions.",
        },
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            startMic();
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              playAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
            }
          },
          onclose: () => stopVoice(),
          onerror: (err) => {
            console.error(err);
            stopVoice();
          }
        }
      });
    } catch (err) {
      console.error("Voice connection failed", err);
    }
  };

  const startMic = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(streamRef.current);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      processor.onaudioprocess = (e) => {
        if (!isMuted && sessionRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };
    } catch (err) {
      console.error("Mic access denied", err);
      stopVoice();
    }
  };

  const stopVoice = () => {
    setIsVoiceActive(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    sessionRef.current?.close();
  };

  const playAudio = (base64Data: string) => {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;

    const audioContext = (audioContextRef.current && audioContextRef.current.state !== 'closed') 
      ? audioContextRef.current 
      : new AudioContext({ sampleRate: 24000 });
    const buffer = audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#6f9cde] text-white rounded-full shadow-2xl shadow-[#6f9cde]/40 flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <Lightbulb className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[300px] max-w-[calc(100vw-2rem)] h-[450px] max-h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[#6f9cde] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">ShiPu AI</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Always active</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-gray-200" : "bg-[#6f9cde]/10"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-[#6f9cde]" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-[#6f9cde] text-white rounded-tr-none" 
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  )}>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#6f9cde]/10 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#6f9cde]" />
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-50">
              {isVoiceActive && (
                <div className="flex items-center justify-center gap-4 mb-4 p-3 bg-[#6f9cde]/5 rounded-2xl border border-[#6f9cde]/10">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 24, 8] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-[#6f9cde] rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#6f9cde] uppercase tracking-widest">Listening...</span>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn("p-2 rounded-xl transition-colors", isMuted ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-500")}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={toggleVoice}
                  className={cn(
                    "p-2.5 rounded-2xl transition-all",
                    isVoiceActive ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "hover:bg-gray-100 text-gray-400"
                  )}
                >
                  {isVoiceActive ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  placeholder="Ask ShiPu AI anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-3 bg-[#6f9cde] text-white rounded-2xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] disabled:opacity-50 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
