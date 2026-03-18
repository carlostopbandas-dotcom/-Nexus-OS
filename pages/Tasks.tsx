
import React, { useState } from 'react';
import { Task, BusinessUnit } from '../types';
import { useAppStore } from '../store/useAppStore';
import { tasksService } from '../services/tasksService';
import { CheckSquare, Plus, Trash2, Sparkles, Loader2, Trophy, ArrowUp, ArrowDown, Briefcase, ShoppingBag, User, Store, Youtube, BarChart3, Target, MousePointer2, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { AI_MODELS } from '../constants';

interface TaskCardProps {
    task: Task;
    onToggle: (id: string, type: string, currentStatus: boolean) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onRemove: (id: string) => void;
}


const getCategoryStyles = (cat: string) => {
    if (cat === '3D Digital') return { icon: <Briefcase size={12} />, style: 'text-blue-600 bg-blue-50' };
    if (cat === 'VcChic') return { icon: <ShoppingBag size={12} />, style: 'text-pink-600 bg-pink-50' };
    if (cat === 'Mivave') return { icon: <Store size={12} />, style: 'text-purple-600 bg-purple-50' };
    if (cat === 'Sezo') return { icon: <Store size={12} />, style: 'text-orange-600 bg-orange-50' };
    if (cat === 'Moriel') return { icon: <Store size={12} />, style: 'text-teal-600 bg-teal-50' };
    return { icon: <User size={12} />, style: 'text-amber-600 bg-amber-50' };
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onMove, onRemove }) => {
    const { icon, style } = getCategoryStyles(task.category);
    
    return (
    <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-lg bg-white ${task.completed ? 'border-slate-100 bg-slate-50/50 opacity-60' : 'border-slate-200'}`}
    >
        <button 
            onClick={() => onToggle(task.id, task.type, task.completed)}
            className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                task.completed 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
        >
            {task.completed && <CheckSquare size={16} />}
        </button>
        
        <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold leading-snug tracking-tight ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {task.title}
            </p>
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5 px-2 py-1 rounded-md ${style}`}>
                    {icon}
                    {task.category}
                </span>
            </div>
        </div>

        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {task.type !== 'Big Rock' && (
                    <button onClick={() => onMove(task.id, 'up')} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Promover">
                        <ArrowUp size={14} />
                    </button>
                )}
                {task.type !== 'Small' && (
                    <button onClick={() => onMove(task.id, 'down')} className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Rebaixar">
                        <ArrowDown size={14} />
                    </button>
                )}
                <button onClick={() => onRemove(task.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Remover">
                    <Trash2 size={14} />
                </button>
        </div>
    </motion.div>
)};

const Tasks: React.FC = () => {
  const { tasks, setTasks, addTask, updateTask, removeTask: removeTaskFromStore } = useAppStore();
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isReorganizing, setIsReorganizing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const BigRocks = tasks.filter(t => t.type === 'Big Rock' && !t.completed);
  const Mediums = tasks.filter(t => t.type === 'Medium' && !t.completed);
  const Smalls = tasks.filter(t => t.type === 'Small' && !t.completed);

  const handleRebalance = async () => {
      const incompleteTasks = tasks.filter(t => !t.completed);
      if (incompleteTasks.length === 0) return;
      setIsReorganizing(true);

      try {
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

          const taskList = incompleteTasks.map(t => `ID: ${t.id} | Título: "${t.title}" | Tipo Atual: ${t.type} | Categoria: ${t.category}`).join('\n');

          const prompt = `Você é o Advisor de Produtividade do Carlos (CEO).
          Regra 1-3-5: Máximo 1 Big Rock, 3 Mediums, 5 Smalls.

          CRITÉRIOS DE CLASSIFICAÇÃO:
          - Big Rock: APENAS a tarefa que gera MAIS CAIXA ou ESCALA imediata HOJE.
          - Medium: Tarefas de gestão ou execução técnica importante.
          - Small: Manutenção, e-mails, rotina, saúde.

          TAREFAS ATUAIS:
          ${taskList}

          Reclassifique as tarefas respeitando RIGOROSAMENTE os limites (1-3-5).
          Retorne APENAS um JSON array com objetos { "id": "...", "type": "Big Rock" | "Medium" | "Small" }.`;

          const result = await ai.models.generateContent({
              model: AI_MODELS.FLASH,
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              id: { type: Type.STRING },
                              type: { type: Type.STRING, enum: ['Big Rock', 'Medium', 'Small'] }
                          },
                          required: ['id', 'type']
                      }
                  }
              }
          });

          const rebalanced: { id: string; type: string }[] = JSON.parse(result.text || '[]');

          const updatedTasks = tasks.map(t => {
              const match = rebalanced.find(r => r.id === t.id);
              return match ? { ...t, type: match.type as Task['type'] } : t;
          });

          setTasks(updatedTasks);

          for (const item of rebalanced) {
              await tasksService.update(item.id, { type: item.type as Task['type'] });
          }

      } catch (error) {
          console.error("Erro ao rebalancear:", error);
      } finally {
          setIsReorganizing(false);
      }
  };

  const QUICK_SUGGESTIONS = [
      { label: 'Gravar p/ YouTube (Mapa)', icon: <Youtube size={12} />, unit: '3D Digital' },
      { label: 'Review de Ads (Mivave)', icon: <BarChart3 size={12} />, unit: 'Mivave' },
      { label: 'Alinhamento com Paula', icon: <User size={12} />, unit: 'Grupo VcChic' },
      { label: 'Treino de Força', icon: <Trophy size={12} />, unit: 'Personal' },
  ];

  const handleSmartAdd = async (directValue?: string) => {
      const taskValue = directValue || newTaskInput;
      if (!taskValue.trim()) return;
      setIsClassifying(true);

      try {
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
          
          const prompt = `Você é o Advisor de Produtividade do Carlos (CEO).
          O Carlos usa a Regra 1-3-5:
          - 1 BIG ROCK: Somente tarefas que geram CAIXA ou ESCALA imediata. Se for operacional, NÃO é Big Rock.
          - 3 MEDIUM: Tarefas importantes de gestão ou execução técnica necessária.
          - 5 SMALL: Manutenção, e-mails, rotina, saúde.

          ESTADO ATUAL (Slots Ocupados):
          - Big Rocks: ${BigRocks.length}/1
          - Mediums: ${Mediums.length}/3
          - Smalls: ${Smalls.length}/5

          Tarefa: "${taskValue}"

          SUA MISSÃO: Classificar com RIGOR EXECUTIVO.
          IMPORTANTE: Se já existe 1 Big Rock, você DEVE classificar como 'Medium' ou 'Small', a menos que a nova tarefa seja VITAL para o faturamento de hoje.
          
          Categorias permitidas: '3D Digital', 'VcChic', 'Mivave', 'Sezo', 'Moriel', 'Grupo VcChic', 'Personal'.

          Retorne apenas JSON.`;

          const result = await ai.models.generateContent({
              model: AI_MODELS.FLASH,
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          type: { type: Type.STRING, enum: ['Big Rock', 'Medium', 'Small'] },
                          category: { type: Type.STRING }
                      },
                      required: ['type', 'category']
                  }
              }
          });

          const aiData = JSON.parse(result.text || '{}');
          
          // Double Check Logic: If slot is full, demote unless it's a specific instruction
          let finalType = aiData.type || 'Small';
          if (finalType === 'Big Rock' && BigRocks.length >= 1) {
              finalType = 'Medium';
          }

          const { data } = await tasksService.create({
              title: taskValue,
              type: finalType as Task['type'],
              completed: false,
              category: (aiData.category || 'Personal') as Task['category'],
          });

          if (data) addTask(data);
          setNewTaskInput('');
      } catch (error) {
          console.error(error);
      } finally {
          setIsClassifying(false);
      }
  };

  const toggleTask = async (id: string, type: string, currentStatus: boolean) => {
      updateTask(id, { completed: !currentStatus });
      if (type === 'Big Rock' && !currentStatus) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 3000);
      }
      await tasksService.toggleCompleted(id, !currentStatus);
  };

  const removeTask = async (id: string) => {
      removeTaskFromStore(id);
      await tasksService.delete(id);
  };

  const moveTask = async (id: string, direction: 'up' | 'down') => {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      let next: 'Big Rock' | 'Medium' | 'Small' = task.type;
      if (direction === 'up') {
          if (task.type === 'Small') next = 'Medium';
          else if (task.type === 'Medium') next = 'Big Rock';
      } else {
          if (task.type === 'Big Rock') next = 'Medium';
          else if (task.type === 'Medium') next = 'Small';
      }
      updateTask(id, { type: next });
      tasksService.update(id, { type: next });
  };

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence>
          {celebrate && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-500/30"
              >
                  <Trophy size={20} className="text-yellow-400" />
                  <span className="font-black text-xs uppercase tracking-widest">Foco Concluído. Próximo alvo, Carlos.</span>
              </motion.div>
          )}
      </AnimatePresence>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">STRATEGIC SPRINT</h2>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${BigRocks.length >= 1 ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">Big Rock {BigRocks.length}/1</span>
             </div>
             <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${Mediums.length >= 3 ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">Medium {Mediums.length}/3</span>
             </div>
             <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${Smalls.length >= 5 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">Small {Smalls.length}/5</span>
             </div>
          </div>
        </div>
        
        <button
            onClick={handleRebalance}
            disabled={isReorganizing}
            className="group flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-xs disabled:opacity-50"
        >
            {isReorganizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="group-hover:animate-pulse" />}
            {isReorganizing ? 'Rebalanceando...' : 'IA Balancear Slots'}
        </button>
      </div>

      <div className="space-y-4 max-w-4xl mx-auto w-full">
          <div className={`relative bg-white p-2 rounded-[2rem] shadow-2xl border-2 transition-all ${isClassifying ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 focus-within:border-blue-500 focus-within:shadow-blue-500/10'}`}>
              <div className="flex items-center gap-4 px-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                      {isClassifying ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
                  </div>
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSmartAdd()}
                    placeholder="O que o CEO precisa resolver agora? (A IA prioriza p/ você)"
                    aria-label="Nova tarefa"
                    className="flex-1 h-14 bg-transparent outline-none text-lg font-bold text-slate-800 placeholder-slate-300"
                  />
                  <button 
                    onClick={() => handleSmartAdd()}
                    disabled={!newTaskInput.trim()}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-20"
                  >
                      Add
                  </button>
              </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSmartAdd(s.label)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md border border-slate-200 rounded-full text-[11px] font-bold text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                  >
                      {s.icon} {s.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* BIG ROCK COLUMN */}
          <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                      <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white"><Trophy size={12}/></div>
                      1. Big Rock
                  </h3>
                  {BigRocks.length > 1 && <AlertTriangle size={16} className="text-red-500 animate-bounce" title="Atenção: Apenas 1 foco por vez!" />}
              </div>
              <div className="space-y-4">
                  {tasks.filter(t => t.type === 'Big Rock').map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onMove={moveTask} onRemove={removeTask} />)}
                  {tasks.filter(t => t.type === 'Big Rock').length === 0 && (
                      <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center opacity-30">
                          <Target size={40} className="mb-2" />
                          <p className="text-[10px] font-black uppercase">Sem Foco Definido</p>
                      </div>
                  )}
              </div>
          </div>

          {/* MEDIUM COLUMN */}
          <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                      <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center text-white"><Briefcase size={12}/></div>
                      3. Mediums
                  </h3>
              </div>
              <div className="space-y-4">
                  {tasks.filter(t => t.type === 'Medium').map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onMove={moveTask} onRemove={removeTask} />)}
              </div>
          </div>

          {/* SMALL COLUMN */}
          <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white"><CheckSquare size={12}/></div>
                      5. Smalls
                  </h3>
              </div>
              <div className="space-y-4">
                  {tasks.filter(t => t.type === 'Small').map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onMove={moveTask} onRemove={removeTask} />)}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Tasks;
