import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Database, 
  Sparkles, 
  Check, 
  X, 
  ChevronDown, 
  RefreshCw, 
  MessageCircle, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock
} from 'lucide-react'
import { api, type RAGStatusResponse } from '../lib/api'
import { ChatInput } from '../components/chat/ChatInput'
import { MessageBubble, type ChatMessage } from '../components/chat/MessageBubble'

const SUGGESTED_QUERIES = [
  'What is the maintenance history of PMP-101?',
  'Are there any open safety findings related to VLV-204?',
  'What caused the near-miss incident involving PMP-101?',
  'What regulatory standards apply to CMP-302?',
]

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

export function ChatCopilot() {
  // RAG Knowledge Base Live Status states
  const [status, setStatus] = useState<RAGStatusResponse | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [showStatusDetails, setShowStatusDetails] = useState(false)

  // Sidebar visibility states
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('opsbrain_chat_sidebar_open')
    return saved !== 'false' // Default to open
  })
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)

  // Chat History Sessions State loaded from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('opsbrain_chat_sessions')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {
        console.error('Failed to parse saved chat sessions:', e)
      }
    }
    // Default initial session
    const defaultId = Date.now().toString()
    return [{
      id: defaultId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
    }]
  })

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('opsbrain_current_chat_session_id')
    return saved || (sessions.length > 0 ? sessions[0].id : '')
  })

  // State to track manual editing of session titles
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState('')

  // State for sidebar chat history keyword search
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [summarizingSessionId, setSummarizingSessionId] = useState<string | null>(null)

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('opsbrain_chat_sidebar_open', String(sidebarOpen))
  }, [sidebarOpen])

  useEffect(() => {
    localStorage.setItem('opsbrain_chat_sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('opsbrain_current_chat_session_id', currentSessionId)
    } else {
      localStorage.removeItem('opsbrain_current_chat_session_id')
    }
  }, [currentSessionId])

  // Healing routine in case currentSessionId becomes invalid
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultId = Date.now().toString()
      const defaultSession: ChatSession = {
        id: defaultId,
        title: 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString()
      }
      setSessions([defaultSession])
      setCurrentSessionId(defaultId)
    } else if (!currentSessionId || !sessions.some(s => s.id === currentSessionId)) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions, currentSessionId])

  // Derive current active session and its messages
  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0]
  const messages = activeSession ? activeSession.messages : []

  const fetchStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await api.ragStatus()
      setStatus(res)
    } catch (err) {
      console.error('Failed to fetch RAG status:', err)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Helper updater for updating the messages of the active session
  const updateActiveSessionMessages = (updater: (prevMsgs: ChatMessage[]) => ChatMessage[]) => {
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === currentSessionId) {
          const nextMsgs = updater(s.messages)
          let nextTitle = s.title
          // Auto-name if still default
          if (s.title === 'New Conversation' || s.title === 'New Chat') {
            const firstUserMsg = nextMsgs.find(m => m.role === 'user')
            if (firstUserMsg) {
              nextTitle = firstUserMsg.text.length > 35 
                ? firstUserMsg.text.slice(0, 32) + '...' 
                : firstUserMsg.text
            }
          }
          return {
            ...s,
            title: nextTitle,
            messages: nextMsgs
          }
        }
        return s
      })
    })
  }

  const handleSend = async (text: string) => {
    if (!currentSessionId) return

    updateActiveSessionMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant-loading' }
    ])
    setBusy(true)

    try {
      const response = await api.query(text)
      updateActiveSessionMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', response }
      ])
      fetchStatus()
    } catch (err: any) {
      updateActiveSessionMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant-error', error: err?.message ?? 'Something went wrong. Try again.' }
      ])
    } finally {
      setBusy(false)
    }
  }

  const handleNewChat = () => {
    const newId = Date.now().toString()
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
    }
    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newId)
    setEditingSessionId(null)
    setMobileHistoryOpen(false)
  }

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id)
    setEditingSessionId(null)
    setMobileHistoryOpen(false)
  }

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      if (currentSessionId === id && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id)
      }
      return filtered
    })
    if (editingSessionId === id) {
      setEditingSessionId(null)
    }
  }

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(id)
    setEditingTitleValue(currentTitle)
  }

  const handleSaveRename = (id: string) => {
    const trimmed = editingTitleValue.trim()
    if (trimmed) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
      )
    }
    setEditingSessionId(null)
  }

  const handleGenerateSummary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const session = sessions.find((s) => s.id === id)
    if (!session || session.messages.length === 0) return

    setSummarizingSessionId(id)
    try {
      const res = await api.summarizeSession(session.messages)
      if (res && res.summary) {
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, summary: res.summary } : s))
        )
      }
    } catch (err) {
      console.error('Failed to generate session summary:', err)
    } finally {
      setSummarizingSessionId(null)
    }
  }

  const renderSidebarContents = () => {
    const filteredSessions = sessions.filter((s) => {
      const q = searchHistoryQuery.toLowerCase().trim()
      if (!q) return true
      if (s.title.toLowerCase().includes(q)) return true
      return s.messages.some((msg) => {
        if (msg.role === 'user') {
          return msg.text.toLowerCase().includes(q)
        } else if (msg.role === 'assistant') {
          return msg.response?.answer?.toLowerCase().includes(q)
        } else if (msg.role === 'assistant-error') {
          return msg.error?.toLowerCase().includes(q)
        }
        return false
      })
    })

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-industrial-950/20 font-mono">
        {/* Actions section */}
        <div className="p-4 flex flex-col gap-3 shrink-0 border-b border-industrial-900/60">
          <motion.button
            onClick={handleNewChat}
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(0,240,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-industrial-accent/40 bg-industrial-accent/10 hover:bg-industrial-accent/15 text-industrial-accent text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <Plus size={14} />
            New Chat
          </motion.button>

          {/* Search bar inside Sidebar */}
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchHistoryQuery}
              onChange={(e) => setSearchHistoryQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-industrial-950 border border-industrial-850 focus:border-industrial-accent/50 rounded-xl text-[11px] text-slate-200 placeholder-slate-500 outline-none transition-all font-sans font-medium"
            />
            {searchHistoryQuery && (
              <button
                onClick={() => setSearchHistoryQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-1.5 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-6 px-4">
              <p className="text-[11px] text-slate-500 font-semibold font-sans">No matches found</p>
              {searchHistoryQuery && (
                <button
                  onClick={() => setSearchHistoryQuery('')}
                  className="text-[10px] text-industrial-accent hover:underline mt-1.5 font-sans cursor-pointer font-bold"
                >
                  Clear search filter
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === currentSessionId
              const isEditing = s.id === editingSessionId

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none relative overflow-hidden ${
                    isActive
                      ? 'border-industrial-accent/40 bg-industrial-900/80 text-white shadow-[0_0_12px_rgba(0,240,255,0.04)]'
                      : 'border-transparent hover:border-industrial-850 bg-transparent hover:bg-industrial-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Visual Accent bar on hover/active */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-opacity ${
                      isActive ? 'bg-industrial-accent opacity-100' : 'bg-industrial-accent/20 opacity-0 group-hover:opacity-100'
                    }`}
                  />

                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                    <MessageSquare
                      size={14}
                      className={`shrink-0 transition-colors ${isActive ? 'text-industrial-accent' : 'text-slate-500 group-hover:text-slate-400'}`}
                    />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(s.id)
                          if (e.key === 'Escape') setEditingSessionId(null)
                        }}
                        onBlur={() => handleSaveRename(s.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-industrial-950 border border-industrial-800 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-industrial-accent font-sans"
                      />
                    ) : (
                      <div className="flex flex-col min-w-0 leading-tight w-full">
                        <span className="text-xs font-semibold truncate leading-normal font-sans">
                          {s.title}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase flex items-center gap-1">
                          <Clock size={8} />
                          {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {s.summary && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 text-[10px] bg-industrial-950 border border-industrial-850 p-2 rounded-lg text-slate-300 font-sans leading-relaxed relative"
                          >
                            <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-industrial-accent mb-0.5 flex items-center gap-1">
                              <Sparkles size={8} className="text-industrial-accent" />
                              AI Summary
                            </div>
                            <p className="line-clamp-3 hover:line-clamp-none transition-all duration-300">
                              {s.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side actions (edit + delete) */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0 ml-2 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {s.messages && s.messages.filter(m => m.role !== 'assistant-loading').length > 0 && (
                        <button
                          onClick={(e) => handleGenerateSummary(s.id, e)}
                          disabled={summarizingSessionId === s.id}
                          className={`p-1 rounded transition ${
                            summarizingSessionId === s.id
                              ? 'text-industrial-accent animate-spin bg-industrial-850'
                              : s.summary
                              ? 'text-industrial-accent hover:bg-industrial-850 bg-industrial-950/40'
                              : 'text-slate-500 hover:text-industrial-accent hover:bg-industrial-850'
                          }`}
                          title={s.summary ? "Regenerate AI Summary" : "Generate AI Summary"}
                        >
                          <Sparkles size={11} className={summarizingSessionId === s.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleStartRename(s.id, s.title, e)}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-industrial-850 transition"
                        title="Rename conversation"
                      >
                        <span className="text-[10px] font-bold">✎</span>
                      </button>
                      {sessions.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
                          title="Delete conversation"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-transparent">
      {/* Sticky RAG Header */}
      <header className="copilot-header sticky top-0 z-20 bg-[#080e19]/82 backdrop-blur-2xl border-b border-white/[.06] px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0 shadow-[0_1px_0_rgba(255,255,255,.02)]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          {/* Dual Action Toggle Button for Desktop (collapsible) and Mobile (drawer) */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileHistoryOpen(true)
              } else {
                setSidebarOpen(!sidebarOpen)
              }
            }}
            className={`h-10 min-w-10 shrink-0 px-2.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
              sidebarOpen 
                ? 'bg-industrial-accent/10 border-industrial-accent/25 text-industrial-accent hover:bg-industrial-accent/15'
                : 'bg-white/[.025] border-white/[.08] text-slate-400 hover:text-white hover:border-white/15'
            }`}
            title="Toggle conversation history"
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline text-xs font-semibold">History</span>
            <span className="hidden sm:inline text-[9px] bg-industrial-950 border border-industrial-850 px-1.5 py-0.5 rounded-md font-mono font-bold text-slate-400">
              {sessions.length}
            </span>
          </button>

          <div className="hidden sm:block p-2.5 bg-gradient-to-br from-industrial-accent/15 to-industrial-purple/10 border border-industrial-accent/20 text-industrial-accent rounded-xl relative shadow-[0_8px_30px_rgba(34,211,238,.08)]">
            <Sparkles size={20} className="animate-pulse glow-text-cyan" />
            <div className="absolute inset-0 bg-industrial-accent/20 rounded-xl blur-md -z-10 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[13px] sm:text-base font-bold text-white tracking-tight flex items-center gap-2 font-display">
              <span className="sm:hidden">Knowledge Copilot</span><span className="hidden sm:inline">Expert Knowledge Copilot</span>
              <span className="hidden lg:inline px-2 py-0.5 text-[9px] font-mono bg-industrial-800 border border-industrial-700 text-industrial-accent rounded-full font-bold">
                Graph-RAG
              </span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              AI assistant grounded in cited source documentation
            </p>
          </div>
        </div>

        {/* RAG Status Badge */}
        <div className="relative flex shrink-0 items-center justify-end">
          <button
            onClick={() => setShowStatusDetails(!showStatusDetails)}
            className="flex h-10 items-center gap-2 bg-white/[.025] hover:bg-white/[.045] border border-white/[.08] rounded-xl px-2.5 sm:px-4 py-2 cursor-pointer select-none transition-all duration-200 text-[10px] sm:text-xs text-slate-300 font-semibold hover:border-industrial-accent/30"
          >
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                !status ? 'bg-slate-400' :
                status.database_connected
                  ? status.total_documents > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                  : 'bg-rose-500'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                !status ? 'bg-slate-500' :
                status.database_connected
                  ? status.total_documents > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                  : 'bg-rose-600'
              }`}></span>
            </span>

            <span className="tracking-wide sm:hidden">{!status ? 'Connecting' : status.database_connected && status.total_documents > 0 ? 'Grounded' : status.database_connected ? 'No data' : 'Offline'}</span>
            <span className="hidden tracking-wide sm:inline">{!status ? 'Connecting...' : status.database_connected ? status.total_documents > 0 ? 'Grounded Engine Active' : 'No Data Ingested' : 'RAG Offline'}</span>

            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${showStatusDetails ? 'rotate-180' : ''}`} />
          </button>

          {/* Popover Dropdown details */}
          <AnimatePresence>
            {showStatusDetails && (
              <>
                <div 
                  className="fixed inset-0 z-20 cursor-default" 
                  onClick={() => setShowStatusDetails(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-[min(288px,calc(100vw-24px))] surface-glass rounded-2xl p-4.5 z-30 cyber-panel-glow"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-industrial-800 mb-3 font-mono">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      System Connections
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        fetchStatus()
                      }}
                      disabled={loadingStatus}
                      className={`text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-industrial-800 transition-colors ${loadingStatus ? 'animate-spin text-industrial-accent' : ''}`}
                      title="Force refresh status"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2 font-medium">
                        <Database size={14} className="text-slate-400" />
                        <span>Corpus Index</span>
                      </div>
                      {status?.database_connected ? (
                        <span className="text-[9px] font-bold bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <Check size={8} /> LIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-rose-950/40 border border-rose-900/30 text-rose-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <X size={8} /> ERROR
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2 font-medium">
                        <Sparkles size={14} className="text-slate-400" />
                        <span>Answer Generator</span>
                      </div>
                      {status?.gemini_connected ? (
                        <span className="text-[9px] font-bold bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <Check size={8} /> READY
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-amber-950/40 border border-amber-900/30 text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                          <Check size={8} /> LOCAL GROUNDED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-industrial-950/60 rounded-xl p-3 border border-industrial-800 space-y-2.5 shadow-inner font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium font-sans">Indexed Manuals</span>
                      <span className="font-mono text-slate-300 font-bold">
                        {status ? status.indexed_documents : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium font-sans">Vector Chunks</span>
                      <span className="font-mono text-slate-300 font-bold">
                        {status ? status.total_chunks : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium font-sans">Graph Relations</span>
                      <span className="font-mono text-slate-300 font-bold">
                        {status ? status.entity_index_size : '—'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-600 text-center mt-3 font-mono">
                    Dynamic graph vector ingestion v2
                  </p>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Area containing Sidebar and Active Message Feed */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* Collapsible Desktop History Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="hidden md:flex flex-col border-r border-white/[.06] bg-[#080e19]/72 backdrop-blur-xl shrink-0 h-full overflow-hidden"
            >
              {renderSidebarContents()}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile slide-out Drawer panel */}
        <AnimatePresence>
          {mobileHistoryOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileHistoryOpen(false)}
                className="fixed inset-0 z-30 bg-black md:hidden"
              />
              {/* Sliding sheet */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.22 }}
                className="fixed inset-y-0 left-0 z-40 w-[min(320px,88vw)] bg-[#080e19]/98 border-r border-white/10 shadow-2xl flex flex-col h-full md:hidden"
              >
                <div className="flex items-center justify-between px-4 py-4 border-b border-industrial-800 shrink-0 font-mono">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Chat History</span>
                  <button 
                    onClick={() => setMobileHistoryOpen(false)}
                    className="p-1 rounded bg-industrial-900 border border-industrial-850 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                {renderSidebarContents()}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Message Bubble Feed & Chat Input Area */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-transparent overflow-hidden">
          
          <div className="flex-1 px-3 sm:px-5 md:px-8 py-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div 
                  key="empty-chat-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-3 py-6 sm:px-4 sm:py-10"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-industrial-accent/15 to-industrial-purple/10 border border-industrial-accent/20 text-industrial-accent flex items-center justify-center mb-4 sm:mb-5 shadow-[0_14px_40px_rgba(34,211,238,.1)]">
                    <MessageCircle size={22} className="glow-text-cyan" />
                  </div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-industrial-accent">Enterprise knowledge copilot</p>
                  <h2 className="text-[1.65rem] leading-tight sm:text-3xl font-black tracking-[-.035em] text-white font-display mb-3">Ask your operational knowledge</h2>
                  <p className="text-xs text-slate-400 max-w-sm mb-5 sm:mb-8 leading-relaxed">
                    Consult complex Standard Operating Procedures, regulatory manuals, and failure checklists with direct source grounding.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                    {SUGGESTED_QUERIES.map((q, i) => (
                      <motion.button
                        key={q}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleSend(q)}
                        className="group text-left text-xs font-semibold rounded-2xl border border-white/[.08] bg-white/[.025] px-4 py-3.5 text-slate-400 hover:border-industrial-accent/30 hover:bg-industrial-accent/[.035] hover:text-white transition-all cursor-pointer"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div key="message-list" className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MessageBubble message={m} />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Persistent sticky input zone at the bottom */}
          <div className="copilot-composer-zone px-2 sm:px-5 md:px-8 pt-2.5 sm:pt-3 pb-2.5 sm:pb-4 border-t border-white/[.06] bg-[#080e19]/78 backdrop-blur-2xl shrink-0">
            <div className="w-full max-w-5xl mx-auto"><ChatInput onSend={handleSend} disabled={busy} /><p className="mt-2 text-center text-[9px] text-slate-700">Grounded answers may require source verification for safety-critical decisions.</p></div>
          </div>

        </div>

      </div>
    </div>
  )
}
