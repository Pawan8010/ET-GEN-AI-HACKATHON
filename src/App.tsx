import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar, MobileNav } from './components/layout/Sidebar'
import { AppHeader } from './components/layout/AppHeader'
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Cpu } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

const ChatCopilot = lazy(() => import('./pages/ChatCopilot').then((module) => ({ default: module.ChatCopilot })))
const DocumentLibrary = lazy(() => import('./pages/DocumentLibrary').then((module) => ({ default: module.DocumentLibrary })))
const AssetHistory = lazy(() => import('./pages/AssetHistory').then((module) => ({ default: module.AssetHistory })))
const GraphExplorer = lazy(() => import('./pages/GraphExplorer').then((module) => ({ default: module.GraphExplorer })))
const RCAAssistant = lazy(() => import('./pages/RCAAssistant').then((module) => ({ default: module.RCAAssistant })))
const ComplianceDashboard = lazy(() => import('./pages/ComplianceDashboard').then((module) => ({ default: module.ComplianceDashboard })))
const LessonsLearned = lazy(() => import('./pages/LessonsLearned').then((module) => ({ default: module.LessonsLearned })))
const KnowledgeInsights = lazy(() => import('./pages/KnowledgeInsights').then((module) => ({ default: module.KnowledgeInsights })))
const RAGArchitecture = lazy(() => import('./pages/RAGArchitecture').then((module) => ({ default: module.RAGArchitecture })))

function RouteLoading() {
  return <div className="grid min-h-[60vh] place-items-center"><div className="flex items-center gap-3 rounded-2xl border border-industrial-800 bg-industrial-900/70 px-5 py-3 text-xs font-bold text-slate-400 shadow-xl backdrop-blur-xl"><Cpu className="animate-spin text-industrial-accent" size={18}/> Loading workspace</div></div>
}

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-industrial-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Cpu className="text-industrial-accent animate-spin" size={40} />
          <h2 className="text-lg font-semibold tracking-wide">OpsBrain AI</h2>
          <p className="text-xs text-slate-500">Initializing secure session...</p>
        </div>
      </div>
    )
  }

  // Public Landing Page
  if (location.pathname === '/') {
    return <LandingPage />
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="app-shell-bg authenticated-shell flex h-dvh w-screen overflow-hidden relative">
      <Sidebar />
      <main className="cyber-grid flex min-w-0 flex-1 flex-col overflow-hidden font-sans relative">
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(78px+env(safe-area-inset-bottom))] md:pb-0">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .2, ease: [0.2, 0, 0, 1] }} className="min-h-full">
              <Suspense fallback={<RouteLoading />}><Routes location={location}>
          <Route path="/copilot" element={<ChatCopilot />} />
          <Route path="/documents" element={<DocumentLibrary />} />
          <Route path="/assets" element={<AssetHistory />} />
          <Route path="/graph" element={<GraphExplorer />} />
          <Route path="/rca" element={<RCAAssistant />} />
          <Route path="/compliance" element={<ComplianceDashboard />} />
          <Route path="/lessons" element={<LessonsLearned />} />
          <Route path="/insights" element={<KnowledgeInsights />} />
          <Route path="/rag-architecture" element={<RAGArchitecture />} />
          <Route path="*" element={<Navigate to="/copilot" replace />} />
              </Routes></Suspense>
          </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
