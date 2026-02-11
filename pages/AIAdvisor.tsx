
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, Send, Bot, User, ArrowUp, Zap, ExternalLink, TrendingUp, X, FileText, Image as ImageIcon, UploadCloud, Copy, Download, Check } from 'lucide-react';
import { AI_MODELS } from '../constants';

interface Source {
    title: string;
    uri: string;
}

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    sources?: Source[];
    attachment?: {
        name: string;
        type: string;
    };
}

interface AttachmentData {
    file: File;
    data: string; // Base64 string for binary, raw text for text files
    isText: boolean;
}

const AIAdvisor: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
      { id: '0', role: 'ai', content: 'Olá, Carlos. Sou seu Advisor Estratégico. Posso analisar documentos, contratos ou relatórios. Basta anexar o arquivo (PDF, TXT ou Imagem) e pedir um resumo.', timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isText = file.type.startsWith('text/') || 
                     file.name.endsWith('.txt') || 
                     file.name.endsWith('.md') || 
                     file.name.endsWith('.csv') || 
                     file.name.endsWith('.json');
                     
      const supportedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const isPDF = file.type === 'application/pdf';
      const isImage = supportedImages.includes(file.type);

      if (!isText && !isPDF && !isImage) {
          alert("Formato não suportado. Por favor envie PDF, Imagem (JPG/PNG) ou Texto (TXT/MD/CSV).");
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      
      if (isText) {
          reader.onload = () => {
              setAttachment({ file, data: reader.result as string, isText: true });
          };
          reader.readAsText(file);
      } else {
          reader.onload = () => {
              const base64String = (reader.result as string).split(',')[1];
              setAttachment({ file, data: base64String, isText: false });
          };
          reader.readAsDataURL(file);
      }
      
      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
  };

  const removeAttachment = () => {
      setAttachment(null);
  };

  const handleCopy = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (text: string) => {
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Advisor_Report_${new Date().toISOString().slice(0,10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !attachment) return;
    
    const currentAttachment = attachment; // Capture current state
    
    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: textToSend || (currentAttachment ? `Analise o arquivo: ${currentAttachment.file.name}` : ''), 
        timestamp: new Date(),
        attachment: currentAttachment ? { name: currentAttachment.file.name, type: currentAttachment.file.type } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null); // Clear attachment immediately after sending
    setLoading(true);

    try {
        let aiText = "";
        let sources: Source[] = [];

        if (!process.env.GEMINI_API_KEY) {
             await new Promise(r => setTimeout(r, 2000));
             aiText = "Simulação (Sem API Key): \n\n### 📄 Resumo do Documento\n**Tipo:** Relatório Financeiro (Simulado)\n\n**Pontos Chave:**\n* A margem bruta subiu para 48%.\n* O custo de aquisição (CAC) está alto no canal Facebook.\n\n**Ação Recomendada:** Revisar criativos do Ads.";
        } else {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const history = messages.map(m => `${m.role === 'user' ? 'Carlos' : 'Advisor'}: ${m.content}`).join('\n');
            
            // Construct Prompt
            let promptText = `Você é um Advisor de Negócios de Elite para um CEO (Carlos). 
            
            **Contexto:**
            Carlos é CEO de Educação 3D e E-commerce de Moda (VcChic).
            
            **Sua Missão:**
            ${currentAttachment ? 'O usuário enviou um documento. LEIA O ARQUIVO COMPLETAMENTE. Forneça um resumo fiel, executivo e estruturado (Bullet points). Destaque: 1) Objetivo do doc, 2) Pontos Críticos/Riscos, 3) Dados Financeiros (se houver), 4) Ações sugeridas para o CEO.' : 'Responda de forma curta, estratégica e acionável.'}

            Histórico da conversa:
            ${history}
            
            Carlos: ${userMsg.content}`;

            // Handle Text Attachments directly in prompt to avoid MIME type issues
            if (currentAttachment && currentAttachment.isText) {
                promptText += `\n\n--- CONTEÚDO DO ARQUIVO (${currentAttachment.file.name}) ---\n${currentAttachment.data}\n--- FIM DO ARQUIVO ---`;
            }

            // Prepare content parts
            const parts: any[] = [{ text: promptText }];
            
            // Add Binary Attachment (PDF/Image) if exists
            if (currentAttachment && !currentAttachment.isText) {
                parts.push({
                    inlineData: {
                        mimeType: currentAttachment.file.type,
                        data: currentAttachment.data
                    }
                });
            }

            const result = await ai.models.generateContent({
                model: AI_MODELS.FLASH,
                contents: {
                    role: 'user',
                    parts: parts
                },
                config: {
                    // Only use search if NO attachment (to avoid distraction when summarizing docs)
                    tools: currentAttachment ? [] : [{ googleSearch: {} }] 
                }
            });
            
            aiText = result.text || "Desculpe, não consegui processar o documento/pergunta.";

            // Extract Grounding Metadata (Only if Search was used)
            const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                sources = chunks
                    .map((c: any) => c.web)
                    .filter((w: any) => w)
                    .map((w: any) => ({ title: w.title, uri: w.uri }));
            }
        }

        setMessages(prev => [...prev, { 
            id: (Date.now()+1).toString(), 
            role: 'ai', 
            content: aiText, 
            timestamp: new Date(),
            sources: sources.length > 0 ? sources : undefined
        }]);

    } catch (error: any) {
        console.error("AI Error:", error);
        let errorMessage = "Erro ao processar. Tente novamente.";
        if (error.message?.includes('MIME type')) {
            errorMessage = "Erro de formato: O arquivo enviado não é suportado pela IA (Use PDF, JPG, PNG ou TXT).";
        } else if (error.message?.includes('400')) {
             errorMessage = "Erro na requisição. O arquivo pode ser muito grande.";
        }
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', content: errorMessage, timestamp: new Date() }]);
    } finally {
        setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  }

  const quickPrompts = [
      { id: 'trends', label: '🔥 Trends do Nicho', query: 'Pesquise agora no Google as principais tendências atuais (última semana) para "Blender 3D Art" e "Moda Feminina Luxo". Com base nisso, me dê 3 ideias de posts virais (com ganchos) para postar hoje.' },
      { id: 'roas', label: 'Analisar ROAS VcChic', query: 'Analise o ROAS atual da VcChic e me dê 3 ações para otimizar.' },
      { id: 'finance', label: 'Cálculo Payback', query: 'Me ajude a estruturar um cálculo de Payback para um novo projeto de mentoria high-ticket.' },
      { id: 'tasks', label: 'Priorizar Dia', query: 'Me ajude a priorizar minhas tarefas de hoje baseado na Regra 1-3-5.' }
  ];

  return (
    <div className="h-full flex flex-col relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
                <Sparkles className="text-indigo-600" size={20} />
            </div>
            <div>
                <h2 className="font-bold text-slate-800 leading-tight">Advisor Estratégico</h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-slate-500 font-medium">Online • Docs & Search</span>
                </div>
            </div>
        </div>
        <button 
            onClick={() => setMessages([{ id: '0', role: 'ai', content: 'Memória limpa. Qual o próximo foco, Carlos?', timestamp: new Date() }])}
            className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
        >
            Limpar Conversa
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                            {msg.role === 'user' ? <User size={14} className="text-white"/> : <Bot size={16} className="text-white"/>}
                        </div>
                        
                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-slate-800 text-white rounded-br-none' 
                            : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                        }`}>
                             {/* Attachment Display in History */}
                             {msg.attachment && (
                                <div className={`flex items-center gap-3 p-3 rounded-lg mb-3 ${msg.role === 'user' ? 'bg-slate-700/50 border border-white/10' : 'bg-indigo-50 border border-indigo-100'}`}>
                                    <div className="bg-white p-2 rounded text-slate-600">
                                        {msg.attachment.type.includes('image') ? <ImageIcon size={20}/> : <FileText size={20}/>}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-bold truncate max-w-[150px]">{msg.attachment.name}</span>
                                        <span className="text-[10px] opacity-70 uppercase">Arquivo Anexado</span>
                                    </div>
                                </div>
                            )}

                            {msg.role === 'ai' ? (
                                <div className="prose prose-sm max-w-none prose-indigo leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {/* Action Bar for AI Messages */}
                            {msg.role === 'ai' && (
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                                    <button 
                                        onClick={() => handleCopy(msg.content, msg.id)}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        {copiedId === msg.id ? 'Copiado' : 'Copiar'}
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(msg.content)}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Download size={12} />
                                        Baixar Relatório (.md)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sources (Grounding) */}
                    {msg.sources && msg.sources.length > 0 && (
                        <div className="ml-10 mt-1 flex flex-wrap gap-2">
                            {msg.sources.map((source, idx) => (
                                <a 
                                    key={idx} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-600 px-2 py-1 rounded-md transition-colors max-w-[200px] truncate"
                                >
                                    <ExternalLink size={10} />
                                    <span className="truncate">{source.title}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                 <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Loader2 size={16} className="text-white animate-spin"/>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                        <div className="flex gap-2 items-center text-xs text-slate-500 font-medium">
                            <Sparkles size={12} className="text-indigo-500 animate-pulse" />
                            {attachment ? 'Lendo documento e gerando resumo...' : 'Pensando...'}
                        </div>
                    </div>
                 </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        
        {/* Attachment Preview */}
        {attachment && (
            <div className="flex items-center gap-2 mb-2 bg-slate-50 border border-indigo-200 p-2 rounded-lg w-fit animate-in slide-in-from-bottom duration-200">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded">
                    <FileText size={14} />
                </div>
                <span className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">
                    {attachment.file.name}
                </span>
                <button onClick={removeAttachment} className="text-slate-400 hover:text-red-500 ml-2">
                    <X size={14} />
                </button>
            </div>
        )}

        {/* Action Toolbar: Prompts Left, Upload Right */}
        <div className="flex items-center justify-between mb-3 gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar flex-1 mask-linear-fade">
                {quickPrompts.map(qp => (
                    <button
                        key={qp.id}
                        onClick={() => handleSend(qp.query)}
                        disabled={loading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap border ${
                            qp.id === 'trends' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                        }`}
                    >
                        {qp.id === 'trends' ? <TrendingUp size={12} /> : <Zap size={12} className="fill-current" />}
                        {qp.label}
                    </button>
                ))}
            </div>

            {/* Modern Upload Button */}
             <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.txt,.csv,.json,.md,.jpg,.jpeg,.png,.webp"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white pl-3 pr-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm transform hover:-translate-y-0.5 whitespace-nowrap"
                title="Anexar Documento para Análise"
            >
                <UploadCloud size={14} />
                Carregar Doc
            </button>
        </div>

        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachment ? "O que você quer saber sobre este arquivo?" : "Pergunte sobre estratégia, conteúdo ou métricas..."}
                className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none max-h-32 shadow-inner"
                rows={1}
            />
            <button 
                onClick={() => handleSend()}
                disabled={(!input.trim() && !attachment) || loading}
                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-sm transform hover:scale-105 active:scale-95"
            >
                <ArrowUp size={18} />
            </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">Suporta PDF, Imagens e Texto (TXT/CSV).</p>
      </div>
    </div>
  );
};

export default AIAdvisor;
