
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Zap, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { supabase } from '@/lib/supabase';
import { CallLog } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

async function getGeminiEphemeralToken(config: object): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Usuário não autenticado')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ config }),
  })

  if (!response.ok) {
    throw new Error('Falha ao obter token Gemini')
  }

  const data = await response.json()
  return data.ephemeralToken
}

interface VoiceAssistantProps {
  onAddCallLog: (log: CallLog) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onAddCallLog }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const sessionRef = useRef<Promise<any> | null>(null);

  // Audio Processing Helpers
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Define the Tool
  const logCallTool: FunctionDeclaration = {
    name: 'log_sales_call',
    description: 'Registra uma nova call de vendas, mentoria ou análise de diagnóstico no sistema Smart Calls.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        leadName: { type: Type.STRING, description: 'Nome do lead ou cliente.' },
        summary: { type: Type.STRING, description: 'Resumo do que foi conversado na call. Identifique se é perfil "Resgate Financeiro" ou "Transição de Carreira".' },
        sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'], description: 'Sentimento geral da call.' },
        type: { type: Type.STRING, enum: ['Discovery', 'Closing', 'Mentorship', 'Mapa da Clareza'], description: 'Tipo da reunião. Use "Mapa da Clareza" para sessões pagas de diagnóstico.' }
      },
      required: ['leadName', 'summary', 'sentiment']
    }
  };

  const connectToGemini = async () => {
    setIsConnecting(true);

    try {
        const liveConfig = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            tools: [{ functionDeclarations: [logCallTool] }],
            systemInstruction: `Você é o Nexus Voice, assistente executivo para Carlos.

            Ao registrar calls do "Mapa da Clareza", fique atento a dois perfis:
            1. "Resgate": Endividado, precisa de dinheiro urgente (Indique Projeto Respirar).
            2. "Transição": Estável financeiramente/CLT, quer liberdade (Indique Formação 3D).

            Use a ferramenta log_sales_call quando solicitado. Fale português do Brasil.`,
        }

        const ephemeralToken = await getGeminiEphemeralToken(liveConfig)
        const ai = new GoogleGenAI({ apiKey: ephemeralToken });
        
        // Setup Audio Contexts
        // Note: Using standard sample rate for output to match system usually works best, but 24000 is common for Gemini output.
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Get Mic Stream
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
        
        // Create a separate context for input processing to ensure correct sample rate for API
        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputSourceRef.current = inputContext.createMediaStreamSource(streamRef.current);
        processorRef.current = inputContext.createScriptProcessor(4096, 1, 1);
        
        // Connect Session usando o token efêmero (API key permanente não chega ao browser)
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: liveConfig,
            callbacks: {
                onopen: () => {
                    console.log("Nexus Voice Connected");
                    setIsConnecting(false);
                    setIsActive(true);
                    setAssistantStatus('listening');
                    
                    // Start Audio Loop
                    if (inputSourceRef.current && processorRef.current) {
                        inputSourceRef.current.connect(processorRef.current);
                        processorRef.current.connect(inputContext.destination);
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Audio Response
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        setAssistantStatus('speaking');
                        const audioBytes = base64ToUint8Array(audioData);
                        
                        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                            const pcmData = new Int16Array(audioBytes.buffer);
                            const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
                            const channelData = audioBuffer.getChannelData(0);

                            for (let i = 0; i < pcmData.length; i++) {
                                channelData[i] = pcmData[i] / 32768.0;
                            }
                            
                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContextRef.current.destination);
                            
                            const currentTime = audioContextRef.current.currentTime;
                            const startTime = Math.max(currentTime, nextStartTimeRef.current);
                            source.start(startTime);
                            
                            nextStartTimeRef.current = startTime + audioBuffer.duration;
                            audioQueueRef.current.push(source);
                            
                            source.onended = () => {
                                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                                    setAssistantStatus('listening');
                                }
                            };
                        }
                    }

                    // Handle Tool Calls
                    if (message.toolCall) {
                        setAssistantStatus('processing');
                        for (const fc of message.toolCall.functionCalls) {
                            if (fc.name === 'log_sales_call') {
                                const args = fc.args as any;
                                
                                const newLog: CallLog = {
                                    id: Date.now().toString(),
                                    leadName: args.leadName,
                                    date: 'Agora (Via Voz)',
                                    duration: 'N/A',
                                    type: args.type || 'Discovery',
                                    status: 'Completed',
                                    sentiment: args.sentiment,
                                    transcriptSnippet: `[Registro de Voz Nexus]\nResumo: ${args.summary}`,
                                    summary: args.summary
                                };
                                
                                onAddCallLog(newLog);

                                sessionPromise.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: [{
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: "Call logged successfully." }
                                        }]
                                    });
                                });
                            }
                        }
                    }
                },
                onclose: () => {
                    console.log("Session closed");
                    disconnect();
                },
                onerror: (err) => {
                    console.error("Session error:", err);
                    disconnect();
                }
            }
        });

        sessionRef.current = sessionPromise;

        // Process Input Audio
        processorRef.current.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Visualizer logic
            let sum = 0;
            for(let i=0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            const vol = Math.sqrt(sum / inputData.length);
            setVolumeLevel(vol);

            // Send to Gemini
            const pcmData = floatTo16BitPCM(inputData);
            const base64Audio = arrayBufferToBase64(pcmData.buffer);
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Audio
                    }
                });
            });
        };

    } catch (error: any) {
        console.error("Connection failed", error);
        setIsConnecting(false);
        setIsActive(false);
        setAssistantStatus('idle');
        const msg = error?.message || String(error);
        if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
            alert("Permissão de microfone negada. Habilite o acesso ao microfone no navegador.");
        } else if (msg.includes('NotFoundError')) {
            alert("Nenhum microfone encontrado. Conecte um microfone e tente novamente.");
        } else {
            alert("Erro ao conectar Nexus Voice: " + msg);
        }
    }
  };

  const disconnect = () => {
    setIsActive(false);
    setAssistantStatus('idle');
    setVolumeLevel(0);
    
    // Cleanup Media Stream
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    // Cleanup Audio Nodes
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    
    // Safely Close Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
    }
    audioContextRef.current = null;
    
    // Cleanup Session
    if (sessionRef.current) {
        sessionRef.current.then(session => {
            try {
                session.close();
            } catch (e) {
                console.warn("Error closing session:", e);
            }
        }).catch(() => {});
        sessionRef.current = null;
    }
  };

  // Visualizer Rings
  const getRingScale = (index: number) => {
      if (assistantStatus === 'speaking') return 1 + (Math.sin(Date.now() / 200 + index) * 0.2);
      if (assistantStatus === 'processing') return 1 + (Math.sin(Date.now() / 100 + index) * 0.1);
      return 1 + (volumeLevel * (index + 2) * 2); 
  };
  
  const [visualizerTick, setVisualizerTick] = useState(0);
  useEffect(() => {
      if (!isActive) return;
      const interval = setInterval(() => setVisualizerTick(t => t + 1), 50);
      return () => clearInterval(interval);
  }, [isActive]);


  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
      
      {/* Expanded Interface */}
      {isActive && (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl border border-slate-700 w-80 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-blue-400" />
                    <span className="font-bold text-sm tracking-widest uppercase">Nexus Voice</span>
                </div>
                <button onClick={disconnect} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center h-32 relative mb-4">
                {/* Visualizer Orb */}
                <div className="relative flex items-center justify-center">
                    <div 
                        className={`absolute w-16 h-16 rounded-full opacity-30 transition-all duration-75 ${assistantStatus === 'speaking' ? 'bg-blue-400' : assistantStatus === 'processing' ? 'bg-purple-500' : 'bg-white'}`}
                        style={{ transform: `scale(${getRingScale(2)})` }}
                    ></div>
                    <div 
                        className={`absolute w-16 h-16 rounded-full opacity-50 transition-all duration-75 ${assistantStatus === 'speaking' ? 'bg-blue-600' : assistantStatus === 'processing' ? 'bg-purple-600' : 'bg-slate-200'}`} // Primary Blue
                        style={{ transform: `scale(${getRingScale(1)})` }}
                    ></div>
                    <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,85,164,0.5)] transition-colors duration-300 ${assistantStatus === 'speaking' ? 'bg-blue-600' : assistantStatus === 'processing' ? 'bg-purple-600 animate-pulse' : 'bg-white'}`}>
                        {assistantStatus === 'processing' ? (
                            <Loader2 size={24} className="text-white animate-spin" />
                        ) : assistantStatus === 'speaking' ? (
                             <Volume2 size={24} className="text-white" />
                        ) : (
                            <Mic size={24} className="text-slate-900" />
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2">
                <p className="font-medium text-lg">
                    {assistantStatus === 'listening' ? "Estou ouvindo..." : 
                     assistantStatus === 'speaking' ? "Nexus falando..." : 
                     assistantStatus === 'processing' ? "Processando..." : "Aguardando"}
                </p>
                <p className="text-xs text-slate-400">
                    "Registre uma call do Mapa da Clareza com a Julia."
                </p>
            </div>
        </div>
      )}

      {/* FAB Trigger */}
      {!isActive && (
          <button
            onClick={connectToGemini}
            disabled={isConnecting}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-110 transition-transform group"
          >
              {isConnecting ? (
                  <Loader2 size={24} className="animate-spin" />
              ) : (
                  <>
                    <Mic size={24} className="group-hover:hidden" />
                    <Zap size={24} className="hidden group-hover:block fill-current" />
                  </>
              )}
          </button>
      )}
    </div>
  );
};

export default VoiceAssistant;