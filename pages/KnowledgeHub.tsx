
import React, { useState, useRef } from 'react';
import { BookOpen, Play, FileText, BrainCircuit, Clock, ChevronRight, Bookmark, X, Loader2, Sparkles, GraduationCap, ArrowRight, Search, UploadCloud } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Resource {
    id: string;
    title: string;
    type: 'Video' | 'Article' | 'Book' | 'Custom';
    category: 'Sales' | 'Strategy' | 'Biohacking' | '3D Art' | 'General';
    duration: string;
    description: string;
    tags: string[];
}

interface AttachmentData {
    file: File;
    data: string; // Base64 string for binary, raw text for text files
    isText: boolean;
}

const MOCK_RESOURCES: Resource[] = [
    { id: '1', title: 'Spin Selling: A Bíblia das Vendas Complexas', type: 'Book', category: 'Sales', duration: '5h Leitura', description: 'Metodologia essencial para fechar contratos High-Ticket.', tags: ['Vendas', 'Negociação'] },
    { id: '2', title: 'Alex Hormozi: $100M Offers', type: 'Video', category: 'Strategy', duration: '45 min', description: 'Como criar ofertas tão boas que as pessoas se sintam estúpidas em dizer não.', tags: ['Marketing', 'Oferta'] },
    { id: '3', title: 'Protocolos de Dopamina - Andrew Huberman', type: 'Article', category: 'Biohacking', duration: '15 min read', description: 'Gerencie sua energia e foco através da neurociência.', tags: ['Saúde', 'Foco'] },
    { id: '4', title: 'Blender 4.0: Geometry Nodes para Arquitetura', type: 'Video', category: '3D Art', duration: '20 min', description: 'Workflow procedural para escalar produção de cenários.', tags: ['3D', 'Técnico'] },
    { id: '5', title: 'A Arte da Guerra para Startups', type: 'Book', category: 'Strategy', duration: '3h Leitura', description: 'Estratégias militares aplicadas ao crescimento de negócios digitais.', tags: ['Liderança', 'Estratégia'] },
    { id: '6', title: 'Funil Perpétuo vs Lançamento', type: 'Article', category: 'Sales', duration: '10 min read', description: 'Comparativo de previsibilidade de caixa para 2026.', tags: ['Growth', 'Funil'] }
];

const KnowledgeHub: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [aiLesson, setAiLesson] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customTopic, setCustomTopic] = useState('');
    
    // Attachment State
    const [attachment, setAttachment] = useState<AttachmentData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredResources = activeFilter === 'All' 
        ? MOCK_RESOURCES 
        : MOCK_RESOURCES.filter(r => r.category === activeFilter);

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
            alert("Formato não suportado. Por favor envie PDF, Imagem ou Texto.");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        
        if (isText) {
            reader.onload = () => {
                setAttachment({ file, data: reader.result as string, isText: true });
                if (!customTopic) {
                    setCustomTopic(file.name.replace(/\.[^/.]+$/, "")); // Auto-fill title
                }
            };
            reader.readAsText(file);
        } else {
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                setAttachment({ file, data: base64String, isText: false });
                if (!customTopic) {
                    setCustomTopic(file.name.replace(/\.[^/.]+$/, "")); // Auto-fill title
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCustomStudy = () => {
        if (!customTopic.trim() && !attachment) return;
        
        const customResource: Resource = {
            id: 'custom-' + Date.now(),
            title: customTopic || (attachment ? attachment.file.name : 'Estudo Personalizado'),
            type: 'Custom', 
            category: 'General', 
            duration: 'Aula IA',
            description: attachment ? `Análise profunda do arquivo: ${attachment.file.name}` : 'Tópico personalizado solicitado para estudo profundo.',
            tags: ['Personalizado', 'Deep Dive']
        };

        handleDeepDive(customResource, attachment);
        setCustomTopic('');
        setAttachment(null);
    };

    const handleDeepDive = async (resource: Resource, fileData?: AttachmentData | null) => {
        setSelectedResource(resource);
        setAiLesson(null);
        setIsLoading(true);

        try {
            if (!process.env.API_KEY) {
                await new Promise(r => setTimeout(r, 2000));
                setAiLesson(`### 🔑 Conceito Central
Esta metodologia envolve a compreensão profunda dos fundamentos de **${resource.title}**, focando na aplicação prática para alavancagem de resultados imediatos.

### 💼 Aplicação no Nexus
Utilize este conhecimento para otimizar processos na VcChic ou na Escola 3D, buscando sempre eficiência operacional e aumento de margem.

### ✅ Plano de Ação Imediato
* Pesquisar 3 referências de mercado sobre ${resource.title}.
* Agendar uma sessão de brainstorming com o time.
* Implementar um teste piloto (MVP) na próxima semana.`);
            } else {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                let prompt = `Atue como um Mentor Executivo de Elite.
                
                O CEO Carlos quer estudar sobre: "${resource.title}" (${resource.description}).
                
                Contexto do Carlos: Dono de Escola 3D e E-commerce de Moda.
                
                Gere uma "Aula Expressa" em Markdown com:
                1. **Conceito Central** (O 80/20 do conteúdo).
                2. **Aplicação Prática** (Como usar isso especificamente na VcChic ou na Escola 3D).
                3. **Plano de Ação** (3 passos para implementar hoje).
                
                Use headers (###) para os títulos das seções e bullet points (*) para listas.
                Seja direto, inspirador e estratégico.`;

                const parts: any[] = [];

                if (fileData) {
                    prompt = `Atue como um Mentor Executivo de Elite.
                    
                    Analise o ARQUIVO ANEXADO (${fileData.file.name}) profundamente.
                    
                    Com base no conteúdo deste arquivo, gere uma aula estratégica para o CEO Carlos (Dono de Escola 3D e E-commerce).
                    
                    Gere uma "Aula Expressa" em Markdown com:
                    1. **Resumo Executivo** (O que é este arquivo?).
                    2. **Insights Chave** (O 80/20 do conteúdo do arquivo).
                    3. **Aplicação Prática** (Como usar o conteúdo do arquivo nos negócios do Carlos).
                    4. **Plano de Ação** (Passos imediatos baseados no arquivo).`;

                    if (fileData.isText) {
                        prompt += `\n\n--- CONTEÚDO DO ARQUIVO ---\n${fileData.data}\n--- FIM DO ARQUIVO ---`;
                        parts.push({ text: prompt });
                    } else {
                        parts.push({ text: prompt });
                        parts.push({
                            inlineData: {
                                mimeType: fileData.file.type,
                                data: fileData.data
                            }
                        });
                    }
                } else {
                    parts.push({ text: prompt });
                }

                const result = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                        role: 'user',
                        parts: parts
                    },
                });

                setAiLesson(result.text || "Erro ao gerar aula.");
            }
        } catch (e) {
            console.error(e);
            setAiLesson("Erro na conexão com IA.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to render Markdown-like text cleanly in React
    const renderFormattedContent = (text: string | null) => {
        if (!text) return null;
        
        return text.split('\n').map((line, index) => {
            const cleanLine = line.trim();
            if (!cleanLine) return <div key={index} className="h-3"></div>;

            // Handle H3 Headers (###)
            if (cleanLine.startsWith('###')) {
                return (
                    <h3 key={index} className="text-lg font-bold text-indigo-700 mt-6 mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block"></span>
                        {cleanLine.replace(/^###\s*/, '')}
                    </h3>
                );
            }
            
            // Handle H2 Headers (##)
            if (cleanLine.startsWith('##')) {
                 return (
                    <h2 key={index} className="text-xl font-bold text-slate-800 mt-8 mb-4 border-b border-slate-200 pb-2">
                        {cleanLine.replace(/^##\s*/, '')}
                    </h2>
                );
            }
            
            // Handle Lists (* or -)
            if (cleanLine.startsWith('*') || cleanLine.startsWith('-')) {
                const content = cleanLine.substring(1).trim();
                const parts = content.split('**');
                return (
                    <div key={index} className="flex items-start gap-3 mb-2 ml-1 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0 group-hover:bg-indigo-600 transition-colors"></div>
                        <p className="text-slate-700 text-sm leading-relaxed">
                            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 font-bold">{part}</strong> : part)}
                        </p>
                    </div>
                );
            }

            // Handle Paragraphs with Bold
            const parts = cleanLine.split('**');
            return (
                <p key={index} className="text-slate-600 text-sm leading-relaxed mb-2">
                    {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 font-bold">{part}</strong> : part)}
                </p>
            );
        });
    };

    return (
        <div className="flex flex-col space-y-6 relative pb-10">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Knowledge Hub</h2>
                <p className="text-slate-500 font-medium mt-1">Sua biblioteca de evolução contínua (com Tutor IA).</p>
            </div>

            {/* AI Learning Engine (Custom Input) */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-2">
                {/* Decorative Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-2 mb-2 text-indigo-200 font-bold uppercase tracking-widest text-xs">
                        <Sparkles size={14} />
                        <span>AI Learning Engine</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">O que você quer dominar hoje?</h3>
                    <p className="text-indigo-100 mb-6 text-sm">Digite qualquer assunto ou anexe um material. A IA criará uma aula executiva personalizada.</p>
                    
                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="flex items-center gap-2 mb-3 bg-white/10 border border-white/20 p-2 rounded-lg w-fit animate-in slide-in-from-bottom duration-200 backdrop-blur-sm">
                            <div className="bg-white text-indigo-600 p-1.5 rounded">
                                <FileText size={14} />
                            </div>
                            <span className="text-xs font-bold text-white max-w-[200px] truncate">
                                {attachment.file.name}
                            </span>
                            <button onClick={removeAttachment} className="text-indigo-200 hover:text-white ml-2 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm shadow-inner">
                        <div className="flex-1 flex items-center px-3 gap-3">
                            <Search className="text-indigo-200" size={20} />
                            <input 
                                type="text" 
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomStudy()}
                                placeholder={attachment ? "Adicione contexto sobre o arquivo (opcional)..." : "Ex: Gestão de Crise, Estoicismo, Blender 4.0..."}
                                className="bg-transparent border-none outline-none text-white placeholder-indigo-300 w-full font-medium focus:placeholder-indigo-400/50"
                            />
                        </div>
                        
                        {/* File Upload Button */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.txt,.csv,.json,.md,.jpg,.jpeg,.png,.webp"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-all"
                            title="Anexar Material de Estudo"
                        >
                            <UploadCloud size={20} />
                        </button>

                        <button 
                            onClick={handleCustomStudy}
                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform duration-200 whitespace-nowrap"
                        >
                            <BrainCircuit size={16} />
                            {attachment ? 'Analisar Doc' : 'Gerar Aula'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {['All', 'Sales', 'Strategy', 'Biohacking', '3D Art'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            activeFilter === cat 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {cat === 'All' ? 'Todos' : cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                {filteredResources.map(resource => (
                    <div key={resource.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                resource.type === 'Video' ? 'bg-red-50 text-red-600' :
                                resource.type === 'Book' ? 'bg-amber-50 text-amber-600' :
                                resource.type === 'Custom' ? 'bg-indigo-50 text-indigo-600' :
                                'bg-blue-50 text-blue-600'
                            }`}>
                                {resource.type}
                            </span>
                            <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                                <Bookmark size={18} />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                            {resource.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                            {resource.description}
                        </p>

                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            {resource.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">#{tag}</span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <Clock size={14} />
                                {resource.duration}
                            </div>
                            <button 
                                onClick={() => handleDeepDive(resource)}
                                className="flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-md transform active:scale-95 duration-150"
                            >
                                <BrainCircuit size={14} />
                                Estudar com IA
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Deep Dive Modal */}
            {selectedResource && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2">
                                    <GraduationCap size={16} />
                                    Modo Deep Dive
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedResource.title}</h2>
                                <p className="text-slate-500 text-sm mt-1">{selectedResource.description}</p>
                            </div>
                            <button onClick={() => setSelectedResource(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-6">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 size={32} className="text-indigo-600 animate-spin" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-bold text-slate-800">Processando Conteúdo...</h3>
                                        <p className="text-slate-500 text-sm">A IA está estruturando sua aula executiva personalizada.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left: AI Lesson */}
                                    <div className="lg:col-span-2 space-y-2">
                                        {/* Use Custom Renderer instead of dangerouslySetInnerHTML */}
                                        {renderFormattedContent(aiLesson)}
                                        
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex gap-4 items-start mt-6">
                                            <Sparkles className="text-amber-500 flex-shrink-0 mt-1" size={20} />
                                            <div>
                                                <h4 className="font-bold text-amber-800 text-sm uppercase mb-1">Insight de Ouro</h4>
                                                <p className="text-amber-700 text-sm leading-relaxed">
                                                    Para o CEO: Não perca tempo implementando tudo. Foque apenas no "Plano de Ação". Delegue a leitura técnica para o time operacional.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Quick Actions */}
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                            <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wide">Ferramentas de Estudo</h4>
                                            <div className="space-y-3">
                                                <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                                                    <span>Resumo em Áudio</span>
                                                    <Play size={14} />
                                                </button>
                                                <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                                                    <span>Gerar Quiz Rápido</span>
                                                    <FileText size={14} />
                                                </button>
                                                <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                                                    <span>Salvar Notas</span>
                                                    <Bookmark size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg">
                                            <h4 className="font-bold text-sm mb-2">Próximo Passo</h4>
                                            <p className="text-xs text-indigo-200 mb-4 leading-relaxed">
                                                Agendar reunião com o time para implementar o conceito aprendido?
                                            </p>
                                            <button className="w-full py-2 bg-white text-indigo-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
                                                Agendar na Rotina <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeHub;