
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Okrs from './pages/Okrs';
import Pipeline from './pages/Pipeline';
import Routine from './pages/Routine';
import Tasks from './pages/Tasks';
import AIAdvisor from './pages/AIAdvisor';
import Calls from './pages/Calls';
import ContentMachine from './pages/ContentMachine';
import KnowledgeHub from './pages/KnowledgeHub';
import ShopifyPage from './pages/Shopify';
import VcChicPage from './pages/VcChicPage';
import SezoPage from './pages/SezoPage';
import VoiceAssistant from './components/VoiceAssistant';
import { CallLog, Task, Lead, CalendarEvent, OKR, Post, LeadRow, TaskRow, EventRow, CallLogRow, OKRRow } from './types';
import { Loader2 } from 'lucide-react';

// Tipagem para métricas de loja
interface StoreMetric {
    id?: string;
    store_name: string;
    sales: number | string;
    spend: number | string;
    roas: number | string;
    date: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // GLOBAL STATE
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [storeMetrics, setStoreMetrics] = useState<StoreMetric[]>([]);

  const fetchData = useCallback(async () => {
    try {
      console.log("Nexus OS: Sincronizando ecossistema...");
      
      const now = new Date();
      const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [leadsRes, tasksRes, eventsRes, callsRes, okrsRes, postsRes, metricsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('start_time', { ascending: true }),
        supabase.from('call_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('okrs').select('*').order('created_at', { ascending: true }),
        supabase.from('content_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('store_metrics').select('*').gte('date', firstDayOfMonth).order('date', { ascending: false })
      ]);

      if (leadsRes.data) {
        setLeads(leadsRes.data.map((l: LeadRow) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          source: l.source as Lead['source'],
          status: l.status as Lead['status'],
          value: l.value,
          product: l.product as Lead['product'],
          createdAt: l.created_at
        })));
      }

      if (tasksRes.data) {
        setTasks(tasksRes.data.map((t: TaskRow) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          completed: t.completed,
          category: t.category as Task['category']
        })));
      }

      if (eventsRes.data) {
        setEvents(eventsRes.data.map((e: EventRow) => ({
          id: e.id,
          title: e.title,
          start: e.start_time,
          end: e.end_time,
          type: e.type as CalendarEvent['type'],
          attendees: e.attendees,
          dayOffset: e.day_offset
        })));
      }

      if (callsRes.data) {
         setCallLogs(callsRes.data.map((c: CallLogRow) => ({
           id: c.id,
           leadName: c.lead_name,
           date: c.date,
           duration: c.duration,
           type: c.type as CallLog['type'],
           status: c.status as CallLog['status'],
           sentiment: c.sentiment as CallLog['sentiment'],
           transcriptSnippet: c.transcript_snippet,
           summary: c.summary
         })));
      }

      if (okrsRes.data) {
          setOkrs(okrsRes.data.map((o: OKRRow) => ({
              id: o.id,
              unit: o.unit as OKR['unit'],
              objective: o.objective,
              progress: o.progress,
              keyResults: o.key_results
          })));
      }

      if (postsRes.data) setPosts(postsRes.data);
      if (metricsRes.data) setStoreMetrics(metricsRes.data);

    } catch (error) {
      console.error("Critical Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Ouvinte global para recarregar dados quando qualquer componente disparar um update
    const handleGlobalUpdate = () => fetchData();
    window.addEventListener('nexus-data-updated', handleGlobalUpdate);
    return () => window.removeEventListener('nexus-data-updated', handleGlobalUpdate);
  }, [fetchData]);

  const handleAddCallLog = async (newLog: CallLog) => {
    window.dispatchEvent(new CustomEvent('nexus-data-updated'));
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
           <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
           <p className="font-bold text-xs uppercase tracking-widest">Sincronizando Nexus Cloud...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard tasks={tasks} leads={leads} events={events} setActiveTab={setActiveTab} storeMetrics={storeMetrics} isLoading={isLoading} />;
      case 'okrs': 
        return <Okrs okrs={okrs} setOkrs={setOkrs} />;
      case 'pipeline': 
        return <Pipeline leads={leads} setLeads={setLeads} />;
      case 'content': 
        return <ContentMachine posts={posts} setPosts={setPosts} />;
      case 'knowledge':
        return <KnowledgeHub />;
      case 'vcchic':
        return <VcChicPage />;
      case 'sezo':
        return <SezoPage />;
      case 'shopify':
        return <ShopifyPage />;
      case 'calls': 
        return <Calls callLogs={callLogs} setCallLogs={setCallLogs} leads={leads} />;
      case 'routine': 
        return <Routine events={events} setEvents={setEvents} tasks={tasks} />;
      case 'tasks': 
        return <Tasks tasks={tasks} setTasks={setTasks} />;
      case 'ai': 
        return <AIAdvisor />;
      default: 
        return <Dashboard tasks={tasks} leads={leads} events={events} setActiveTab={setActiveTab} storeMetrics={storeMetrics} isLoading={isLoading} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F0F4F8] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]"></div>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-72 flex-1 relative h-full z-10">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#F0F4F8] to-transparent z-20 pointer-events-none"></div>

        <div className="h-full overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-[1440px] mx-auto min-h-full pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
      </main>

      <VoiceAssistant onAddCallLog={handleAddCallLog} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
