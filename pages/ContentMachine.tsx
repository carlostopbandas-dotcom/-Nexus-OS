
import React, { useState } from 'react';
import { Linkedin, Instagram, Mail, Send, Sparkles, Loader2, Image as ImageIcon, Copy, CheckCircle2, TrendingUp, Users, Eye, MoreHorizontal, ThumbsUp, MessageSquare, Repeat, Heart, Bookmark, Share2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Platform, Post } from '../types';
import { supabase } from '../lib/supabase';

import { useAppStore } from '../store/useAppStore';

const ContentMachine: React.FC = () => {
  const { contentPosts: posts, setContentPosts: setPosts } = useAppStore();
  const [activePlatform, setActivePlatform] = useState<Platform>('linkedin');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedContent('');

    try {
        if (!process.env.API_KEY) {
            await new Promise(r => setTimeout(r, 2000));
            if (activePlatform === 'linkedin') {
                setGeneratedContent(`🚀 **O fim da renderização tradicional?**\n\nAcabei de testar uma nova técnica no Blender que reduziu meu tempo de render em 40%.\n\nO segredo não está na GPU, mas no workflow.\n\n👇 Vou explicar o passo a passo nos comentários.\n\n#3D #Blender #Produtividade`);
            } else if (activePlatform === 'instagram') {
                setGeneratedContent(`Foco total no lançamento do Nexus. 🚀\n\nQuem aí também vira a noite quando o projeto apaixona?\n\n#ceo #workhard #3dmodelling #setup`);
            } else {
                setGeneratedContent(`**Assunto:** O segredo que dobrei meu faturamento\n\nOlá Carlos,\n\nHoje quero ser direto. Muita gente me pergunta como escalei a agência...\n\n[Corpo do email simulado...]`);
            }
        } else {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let systemPrompt = "";
            if (activePlatform === 'linkedin') {
                systemPrompt = "Você é um Ghostwriter de elite para LinkedIn. Crie um post viral, com gancho forte na primeira linha, espaçamento entre parágrafos (one-sentence paragraphs) e um Call to Action no final. Tom: Autoridade, Visionário.";
            } else if (activePlatform === 'instagram') {
                systemPrompt = "Você é um estrategista de Instagram. Escreva APENAS a legenda. Use emojis moderados e hashtags relevantes. Tom: Lifestyle, Inspirador.";
            } else {
                systemPrompt = "Você é um Copywriter de Newsletter. Escreva um Assunto (Subject) altamente clicável e o corpo do e-mail. Tom: Pessoal, Storytelling.";
            }

            const result = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `${systemPrompt}\n\nTópico: ${topic}`
            });
            
            setGeneratedContent(result.text || "Erro ao gerar.");
        }
    } catch (e) {
        console.error(e);
        setGeneratedContent("Erro na geração.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
      if (!generatedContent) return;
      setIsSaving(true);
      
      const newPostPayload = {
          platform: activePlatform,
          content: generatedContent,
          status: 'Draft',
          date: 'Sem data',
          created_at: new Date().toISOString()
      };

      try {
          const { data, error } = await supabase.from('content_posts').insert(newPostPayload).select().single();
          
          if (error) throw error;
          
          if (data) {
              setPosts([data, ...posts]);
              setTopic('');
              setGeneratedContent('');
          }
      } catch (e) {
          console.error("Error saving post:", e);
      } finally {
          setIsSaving(false);
      }
  };

  const platformStyles: Record<Platform, { active: string; iconActive: string }> = {
      linkedin: {
          active: 'bg-white border-blue-500 text-blue-600 shadow-md ring-1 ring-blue-100',
          iconActive: 'text-blue-600'
      },
      instagram: {
          active: 'bg-white border-pink-500 text-pink-600 shadow-md ring-1 ring-pink-100',
          iconActive: 'text-pink-600'
      },
      newsletter: {
          active: 'bg-white border-amber-500 text-amber-600 shadow-md ring-1 ring-amber-100',
          iconActive: 'text-amber-600'
      }
  };

  const PlatformButton = ({ id, label, icon: Icon }: { id: Platform, label: string, icon: any }) => {
      const isActive = activePlatform === id;
      const styles = platformStyles[id];
      return (
          <button
            onClick={() => { setActivePlatform(id); setGeneratedContent(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold ${
                isActive
                ? styles.active
                : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'
            }`}
          >
              <Icon size={18} className={isActive ? styles.iconActive : ''} />
              {label}
          </button>
      );
  };

  // --- Social Media Preview Components ---

  const LinkedInPreview = ({ content }: { content: string }) => (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden font-sans text-sm shadow-sm max-w-lg mx-auto w-full">
          <div className="p-4 border-b border-slate-100 flex gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">CS</div>
              <div>
                  <h4 className="font-bold text-slate-900 leading-tight">Carlos Silva</h4>
                  <p className="text-xs text-slate-500">CEO Founder @ Framework 2026 • 2h • <span className="inline-block">🌐</span></p>
              </div>
          </div>
          <div className="p-4 text-slate-800 whitespace-pre-wrap leading-relaxed">
              {content}
          </div>
          {/* LinkedIn Image Placeholder */}
          <div className="bg-slate-100 h-64 flex flex-col items-center justify-center text-slate-400 border-y border-slate-100">
              <ImageIcon size={48} className="mb-2 opacity-50" />
              <span className="text-xs font-medium uppercase tracking-wide">Mídia do Post</span>
          </div>
          <div className="p-2 flex justify-between items-center border-t border-slate-100 px-4">
              <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-3 py-2 rounded font-semibold text-xs transition-colors">
                  <ThumbsUp size={16} /> Gostei
              </button>
              <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-3 py-2 rounded font-semibold text-xs transition-colors">
                  <MessageSquare size={16} /> Comentar
              </button>
              <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-3 py-2 rounded font-semibold text-xs transition-colors">
                  <Repeat size={16} /> Repost
              </button>
              <button className="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-3 py-2 rounded font-semibold text-xs transition-colors">
                  <Send size={16} /> Enviar
              </button>
          </div>
      </div>
  );

  const InstagramPreview = ({ content }: { content: string }) => (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden font-sans text-sm shadow-sm max-w-[350px] mx-auto w-full">
          <div className="p-3 flex justify-between items-center border-b border-slate-50">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-200 border-2 border-white"></div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">carlos.ceo</span>
              </div>
              <MoreHorizontal size={16} className="text-slate-400" />
          </div>
          
          {/* Instagram Image Placeholder */}
          <div className="bg-slate-100 aspect-square flex flex-col items-center justify-center text-slate-400 relative">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Formato 1:1</span>
              <div className="absolute bottom-3 right-3 bg-black/50 rounded-full p-1.5 text-white">
                  <Users size={12} />
              </div>
          </div>

          <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-4">
                      <Heart size={20} className="text-slate-800" />
                      <MessageSquare size={20} className="text-slate-800" />
                      <Share2 size={20} className="text-slate-800" />
                  </div>
                  <Bookmark size={20} className="text-slate-800" />
              </div>
              <div className="text-xs text-slate-900 mb-1 font-bold">1.234 curtidas</div>
              <div className="text-xs text-slate-800 leading-relaxed">
                  <span className="font-bold mr-1">carlos.ceo</span>
                  {content}
              </div>
              <div className="text-[10px] text-slate-400 mt-2 uppercase">Há 2 horas</div>
          </div>
      </div>
  );

  const EmailPreview = ({ content }: { content: string }) => (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden font-sans text-sm shadow-sm max-w-lg mx-auto w-full">
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="text-xs font-medium text-slate-400">Preview: Newsletter</div>
          </div>
          <div className="p-6">
              <div className="mb-6 border-b border-slate-100 pb-4">
                  <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-900 text-lg">Nexus Weekly #42</span>
                      <span className="text-xs text-slate-400">10:30 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">C</div>
                      <div>
                          <div className="text-xs font-bold text-slate-800">Carlos Silva <span className="font-normal text-slate-500">&lt;carlos@nexus.com&gt;</span></div>
                          <div className="text-xs text-slate-500">Para: Lista VIP</div>
                      </div>
                  </div>
              </div>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-serif">
                  {content}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                   <button className="bg-slate-900 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider">Ler Online</button>
                   <p className="text-[10px] text-slate-400 mt-4">Unsubscribe • Preferences</p>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Content Machine</h2>
          <p className="text-slate-500 font-medium mt-1">Gestão de Marca Pessoal & Distribuição</p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-slate-500">
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                 <Users size={16} className="text-blue-500"/>
                 <span>25.4k Seguidores</span>
             </div>
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                 <Eye size={16} className="text-emerald-500"/>
                 <span>120k Alcance (30d)</span>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-full flex-1 min-h-0">
          
          {/* LEFT: Generator */}
          <div className="col-span-12 lg:col-span-7 flex flex-col space-y-4">
              {/* Platform Selector */}
              <div className="flex gap-3">
                  <PlatformButton id="linkedin" label="LinkedIn" icon={Linkedin} />
                  <PlatformButton id="instagram" label="Instagram" icon={Instagram} />
                  <PlatformButton id="newsletter" label="Newsletter" icon={Mail} />
              </div>

              {/* Status Integration Bar */}
              <div className="bg-white px-4 py-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <div className={`w-2 h-2 rounded-full ${activePlatform === 'linkedin' ? 'bg-blue-500' : activePlatform === 'instagram' ? 'bg-pink-500' : 'bg-amber-500'} animate-pulse`}></div>
                      Status: Conectado
                  </div>
                  <button className="text-xs text-indigo-600 hover:underline font-medium">Configurar Integração</button>
              </div>

              {/* Input Area */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">
                  <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-500" />
                      Sobre o que vamos falar hoje?
                  </label>
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={
                        activePlatform === 'linkedin' ? "Ex: A importância da gestão de tempo para criativos..." :
                        activePlatform === 'instagram' ? "Ex: Bastidores do novo setup..." :
                        "Ex: Lições que aprendi perdendo um contrato..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4 h-24 resize-none"
                  />
                  
                  <div className="flex justify-end mb-6">
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          {isGenerating ? 'Criando Mágica...' : 'Gerar Draft com IA'}
                      </button>
                  </div>

                  {/* Generated Output Preview Area */}
                  {generatedContent ? (
                      <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 rounded-xl border border-slate-200 p-4">
                          <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Eye size={12}/> Preview em Tempo Real
                              </span>
                              <div className="flex gap-2">
                                <button 
                                    onClick={() => navigator.clipboard.writeText(generatedContent)}
                                    className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                                >
                                    <Copy size={12} /> Copiar
                                </button>
                              </div>
                          </div>
                          
                          {/* THE PREVIEW COMPONENT */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 flex justify-center items-start">
                              {activePlatform === 'linkedin' && <LinkedInPreview content={generatedContent} />}
                              {activePlatform === 'instagram' && <InstagramPreview content={generatedContent} />}
                              {activePlatform === 'newsletter' && <EmailPreview content={generatedContent} />}
                          </div>

                          <div className="flex gap-3 mt-auto pt-2 border-t border-slate-200/50">
                              <button onClick={() => setGeneratedContent('')} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-sm transition-colors">
                                  Descartar
                              </button>
                              <button 
                                onClick={handleSaveDraft} 
                                disabled={isSaving}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-70"
                              >
                                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16} />} 
                                  {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                          <ImageIcon size={48} className="mb-2 opacity-20" />
                          <p className="text-sm font-medium">Aguardando seu comando criativo</p>
                      </div>
                  )}
              </div>
          </div>

          {/* RIGHT: Feed Preview */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Linha do Tempo</h3>
                  <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">Ver Calendário</button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-4 flex-1">
                  {posts.filter(p => p.platform === activePlatform).length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-sm">Nenhum post nesta plataforma ainda.</div>
                  )}
                  
                  {posts.filter(p => p.platform === activePlatform).map(post => (
                      <div key={post.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white group">
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      post.status === 'Published' ? 'bg-green-100 text-green-700' :
                                      post.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-600'
                                  }`}>
                                      {post.status}
                                  </span>
                                  <span className="text-xs text-slate-400">{post.date}</span>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600">
                                  <Send size={14} />
                              </button>
                          </div>
                          
                          <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap mb-3 font-medium">
                              {post.content}
                          </p>

                          {post.stats && (
                              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-3 border-t border-slate-50">
                                  <span className="flex items-center gap-1"><TrendingUp size={12} className="text-blue-500" /> {post.stats.views.toLocaleString()} Views</span>
                                  <span className="flex items-center gap-1">👍 {post.stats.likes.toLocaleString()} Likes</span>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ContentMachine;
