
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Command } from 'lucide-react';
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
import ShopifyPage from './pages/Shopify';
import VcChicPage from './pages/VcChicPage';
import SezoPage from './pages/SezoPage';
import Clients from './pages/Clients';
import Users from './pages/Users';
import FinancialDashboard from './pages/FinancialDashboard';
import Digital3DFinancials from './pages/Digital3DFinancials';
import VoiceAssistant from './components/VoiceAssistant';
import { useAppStore } from './store/useAppStore';
import type { CallLog } from './types';
import { Toaster } from 'sonner';
import { SkeletonStat } from './components/ui/skeleton';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { fetchAll, loading, addCallLog } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddCallLog = (newLog: CallLog) => {
    addCallLog(newLog);
  };

  return (
    <div className="flex h-screen bg-[#F0F4F8] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]"></div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main role="main" className="ml-0 md:ml-72 flex-1 relative h-full z-10 flex flex-col">
        {/* Mobile header — hamburger + logo */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#F0F4F8]/90 backdrop-blur-md border-b border-slate-200/60">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white flex-shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Command size={14} className="text-white" />
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tighter">NEXUS <span className="text-blue-500">OS</span></span>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#F0F4F8] to-transparent z-20 pointer-events-none hidden md:block"></div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar md:p-8 p-4 pt-4">
          <div className="max-w-[1440px] mx-auto min-h-full pb-20">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonStat key={i} />)}
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
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/content" element={<ContentMachine />} />
                    <Route path="/knowledge" element={<KnowledgeHub />} />
                    <Route path="/calls" element={<Calls />} />
                    <Route path="/routine" element={<Routine />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/ai" element={<AIAdvisor />} />
                    <Route path="/shopify" element={<ShopifyPage />} />
                    <Route path="/vcchic" element={<VcChicPage />} />
                    <Route path="/sezo" element={<SezoPage />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/financeiro" element={<FinancialDashboard />} />
                    <Route path="/financeiro-3d" element={<Digital3DFinancials />} />
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
      <Toaster position="bottom-right" richColors closeButton />
    </ProtectedRoute>
  </AuthProvider>
);

export default App;
