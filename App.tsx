
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
import VoiceAssistant from './components/VoiceAssistant';
import { useAppStore } from './store/useAppStore';
import type { CallLog } from './types';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { fetchAll, loading } = useAppStore();

  useEffect(() => {
    fetchAll();
    const handleGlobalUpdate = () => fetchAll();
    window.addEventListener('nexus-data-updated', handleGlobalUpdate);
    return () => window.removeEventListener('nexus-data-updated', handleGlobalUpdate);
  }, [fetchAll]);

  const handleAddCallLog = async (_newLog: CallLog) => {
    window.dispatchEvent(new CustomEvent('nexus-data-updated'));
  };

  return (
    <div className="flex h-screen bg-[#F0F4F8] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]"></div>
      </div>

      <Sidebar />

      <main className="ml-72 flex-1 relative h-full z-10">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#F0F4F8] to-transparent z-20 pointer-events-none"></div>

        <div className="h-full overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-[1440px] mx-auto min-h-full pb-20">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
                <p className="font-bold text-xs uppercase tracking-widest">Sincronizando Nexus Cloud...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Routes location={location}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/okrs" element={<Okrs />} />
                    <Route path="/pipeline" element={<Pipeline />} />
                    <Route path="/content" element={<ContentMachine />} />
                    <Route path="/knowledge" element={<KnowledgeHub />} />
                    <Route path="/calls" element={<Calls />} />
                    <Route path="/routine" element={<Routine />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/ai" element={<AIAdvisor />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <VoiceAssistant onAddCallLog={handleAddCallLog} />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  </AuthProvider>
);

export default App;
