import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Upload, FileText, CheckCircle2, Clock, XCircle, Sparkles, Database, FileCheck, Search, FileSearch, Folder, Tag, Archive, Trash2, Check, CheckSquare, Square, Filter, FolderOpen, X, ExternalLink, Calendar, Cpu, Layers, Eye, Download, BookOpen, Maximize2, Minimize2, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react'
import { api, type DocumentSummary, type SearchChunkResult } from '../lib/api'
import { IngestionPipelineSimulator } from '../components/layout/IngestionPipelineSimulator'

const DOC_TYPES = ['sop', 'inspection_report', 'work_order', 'incident', 'manual', 'other']

function parseSuggestedTags(value?: string | null): string[] {
  if (!value?.trim()) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((tag) => tag.trim()).filter(Boolean)
    }
  } catch {
    // The API also supports the legacy comma-separated representation.
  }

  return value.split(',').map((tag) => tag.trim()).filter(Boolean)
}

export function getAssociatedProject(doc: { id: string; filename: string; folder_path?: string | null }) {
  const name = doc.filename.toLowerCase();
  const folder = (doc.folder_path || '/').toLowerCase();
  if (name.includes('refinery') || folder.includes('refinery') || name.includes('h2') || name.includes('hydrogen')) {
    return 'Refinery Expansion'
  }
  if (name.includes('safety') || folder.includes('safety') || name.includes('incident') || name.includes('hazard')) {
    return 'HSSE Compliance'
  }
  if (name.includes('maintenance') || name.includes('work_order') || name.includes('pump') || name.includes('valve')) {
    return 'Asset Modernization'
  }
  
  // Deterministic stable fallback assignment based on ID
  const sum = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const projects = ['Refinery Expansion', 'HSSE Compliance', 'Asset Modernization', 'Standard Operations'];
  return projects[sum % projects.length];
}

function matchesDateFilter(uploadDateStr: string, filter: string) {
  if (filter === 'All') return true
  const uploadDate = new Date(uploadDateStr)
  const now = new Date()
  
  // Set hours to 0 for today comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const diffTime = now.getTime() - uploadDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  if (filter === 'today') {
    return uploadDate >= todayStart
  }
  if (filter === 'week') {
    return diffDays <= 7
  }
  if (filter === 'month') {
    return diffDays <= 30
  }
  if (filter === 'year') {
    return uploadDate.getFullYear() === now.getFullYear()
  }
  return true
}

const STATUS_STYLING: Record<string, { icon: React.ReactNode; text: string; bg: string; border: string }> = {
  indexed: {
    icon: <CheckCircle2 size={13} className="text-emerald-400" />,
    text: 'Grounded & Indexed',
    bg: 'bg-emerald-950/15 text-emerald-400',
    border: 'border-emerald-900/30',
  },
  processing: {
    icon: <Clock size={13} className="text-amber-400 animate-spin" />,
    text: 'Neural Chunking...',
    bg: 'bg-amber-950/15 text-amber-400',
    border: 'border-amber-900/30',
  },
  pending: {
    icon: <Clock size={13} className="text-slate-400" />,
    text: 'Pending Ingestion',
    bg: 'bg-slate-900 text-slate-400',
    border: 'border-slate-800',
  },
  failed: {
    icon: <XCircle size={13} className="text-red-400" />,
    text: 'Parse Failed',
    bg: 'bg-red-950/15 text-red-400',
    border: 'border-red-900/30',
  },
}

function highlightText(text: string, highlight: string) {
  if (!highlight.trim()) {
    return <span>{text}</span>
  }
  
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedHighlight})`, 'gi')
  const parts = text.split(regex)
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-industrial-accent/25 text-industrial-accent font-semibold px-0.5 rounded shadow-[0_0_8px_rgba(0,240,255,0.15)]">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  )
}

export function DocumentLibrary() {
  const [docs, setDocs] = useState<DocumentSummary[]>([])
  const [docType, setDocType] = useState('sop')
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const paperStageRef = useRef<HTMLDivElement>(null)

  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null)

  const handleScroll = () => {
    const el = paperStageRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const totalScrollable = scrollHeight - clientHeight
    if (totalScrollable <= 0) {
      setScrollProgress(100)
    } else {
      const percentage = Math.round((scrollTop / totalScrollable) * 100)
      setScrollProgress(percentage)
    }

    // Find active chunk/segment
    if (quickViewDoc?.chunks) {
      const wrapper = el.querySelector('.space-y-6')
      const children = wrapper ? wrapper.children : el.children
      let currentActive = 0
      let minDistance = Infinity
      const containerTop = el.getBoundingClientRect().top

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement
        if (child.id && child.id.startsWith('preview-chunk-')) {
          const rect = child.getBoundingClientRect()
          const distance = Math.abs(rect.top - containerTop)
          if (distance < minDistance) {
            minDistance = distance
            const idx = parseInt(child.id.split('-').pop() || '0', 10)
            currentActive = idx
          }
        }
      }
      setActiveChunkIndex(currentActive)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchChunkResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Router Search Params for sync
  const [searchParams, setSearchParams] = useSearchParams()
  const docIdParam = searchParams.get('docId')

  // Quick view modal state
  const [selectedQuickViewId, setSelectedQuickViewId] = useState<string | null>(null)
  const [quickViewDoc, setQuickViewDoc] = useState<any | null>(null)
  const [loadingQuickView, setLoadingQuickView] = useState(false)
  const [quickViewError, setQuickViewError] = useState<string | null>(null)
  const [modalTab, setModalTab] = useState<'insights' | 'preview'>('insights')
  const [previewSearch, setPreviewSearch] = useState('')
  const [previewFontSize, setPreviewFontSize] = useState<'sm' | 'base' | 'lg'>('base')
  const [previewMode, setPreviewMode] = useState<'text' | 'pdf'>('text')

  // Bulk selection and actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('All')
  const [showArchived, setShowArchived] = useState(false)
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [bulkFolderInput, setBulkFolderInput] = useState('')
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // Discovery Filter States
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState('All')
  const [selectedDateFilter, setSelectedDateFilter] = useState('All')
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('All')

  const [isSeeding, setIsSeeding] = useState(false)

  const refresh = () => api.listDocuments().then(setDocs).catch(() => {})

  const handleSeedDocuments = async () => {
    setIsSeeding(true)
    try {
      const res = await api.seedDocuments()
      if (res.success) {
        await refresh()
      }
    } catch (e) {
      console.error('Failed to seed documents:', e)
    } finally {
      setIsSeeding(false)
    }
  }

  // Synchronize URL search params with active quick-view state
  useEffect(() => {
    if (docIdParam) {
      setSelectedQuickViewId(docIdParam)
    }
  }, [docIdParam])

  // Fetch document details when active quick-view id changes
  useEffect(() => {
    setScrollProgress(0)
    setActiveChunkIndex(null)
    if (!selectedQuickViewId) {
      setQuickViewDoc(null)
      setQuickViewError(null)
      return
    }

    setModalTab('insights')
    setPreviewSearch('')
    setPreviewMode('text')
    setLoadingQuickView(true)
    setQuickViewError(null)
    api.getDocumentDetails(selectedQuickViewId)
      .then((res) => {
        setQuickViewDoc(res)
      })
      .catch((err) => {
        console.error('Error loading document details:', err)
        setQuickViewError('Failed to load document summary and metadata.')
      })
      .finally(() => {
        setLoadingQuickView(false)
      })
  }, [selectedQuickViewId])

  // Reset progress and section tracking when switching tabs inside quick-view
  useEffect(() => {
    setScrollProgress(0)
    setActiveChunkIndex(null)
  }, [modalTab])

  const handleCloseQuickView = () => {
    setSelectedQuickViewId(null)
    if (searchParams.has('docId')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('docId')
      setSearchParams(nextParams)
    }
  }

  // Calculate unique folders across documents
  const allFolders = useMemo(() => {
    const folders = new Set<string>()
    docs.forEach(d => {
      if (d.folder_path) {
        folders.add(d.folder_path)
      } else {
        folders.add('/')
      }
    })
    return ['All', ...Array.from(folders).sort()]
  }, [docs])

  // Filter documents by selected folder, archived state, doc type, date modified, and project
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      // Archived filter
      const matchArchive = showArchived ? d.is_archived === 1 : !d.is_archived
      
      // Folder filter
      const docFolder = d.folder_path || '/'
      const matchFolder = selectedFolderFilter === 'All' || docFolder === selectedFolderFilter

      // Document Type filter
      const matchDocType = selectedDocTypeFilter === 'All' || d.doc_type === selectedDocTypeFilter

      // Date Modified filter
      const matchDate = matchesDateFilter(d.upload_date, selectedDateFilter)

      // Associated Project filter
      const matchProject = selectedProjectFilter === 'All' || getAssociatedProject(d) === selectedProjectFilter
      
      return matchArchive && matchFolder && matchDocType && matchDate && matchProject
    })
  }, [docs, selectedFolderFilter, showArchived, selectedDocTypeFilter, selectedDateFilter, selectedProjectFilter])

  // Clear selected files when folder or archive filter changes
  useEffect(() => {
    setSelectedIds([])
  }, [selectedFolderFilter, showArchived])

  const handleBulkAction = async (action: 'tag' | 'archive' | 'unarchive' | 'move_folder' | 'delete', value?: string) => {
    if (selectedIds.length === 0) return
    setIsBulkProcessing(true)
    try {
      await api.bulkAction(selectedIds, action, value)
      // Clear selections and inputs on success
      setSelectedIds([])
      if (action === 'tag') setBulkTagInput('')
      if (action === 'move_folder') setBulkFolderInput('')
      await refresh()
    } catch (err) {
      console.error('Error performing bulk action:', err)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleToggleSuggestion = async (docId: string, tag: string, currentTagsList: string[]) => {
    const nextTags = [...currentTagsList, tag]
    try {
      const res = await api.applyTags(docId, nextTags)
      if (res.success) {
        await refresh()
        if (selectedQuickViewId === docId) {
          api.getDocumentDetails(docId).then(setQuickViewDoc).catch(() => {})
        }
      }
    } catch (err) {
      console.error('Failed to apply suggested tag:', err)
    }
  }

  const handleApplyAllSuggestions = async (docId: string, suggestedTags: string[], currentTagsStr: string) => {
    const currentTagsList = currentTagsStr ? currentTagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
    const mergedTags = Array.from(new Set([...currentTagsList, ...suggestedTags]))
    try {
      const res = await api.applyTags(docId, mergedTags)
      if (res.success) {
        await refresh()
        if (selectedQuickViewId === docId) {
          api.getDocumentDetails(docId).then(setQuickViewDoc).catch(() => {})
        }
      }
    } catch (err) {
      console.error('Failed to apply all suggested tags:', err)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const term = searchQuery.trim()
    if (!term) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const delayDebounce = setTimeout(() => {
      api.searchDocuments(term)
        .then((res) => {
          setSearchResults(res || [])
        })
        .catch((err) => {
          console.error('Error searching documents:', err)
        })
        .finally(() => {
          setIsSearching(false)
        })
    }, 220)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const groupedSearchResults = useMemo(() => {
    const groups: Record<string, { 
      document_id: string; 
      filename: string; 
      doc_type: string; 
      chunks: SearchChunkResult[] 
    }> = {}

    searchResults.forEach((r) => {
      // Look up full document info from docs state
      const d = docs.find(doc => doc.id === r.document_id)
      
      if (d) {
        // Document Type filter
        if (selectedDocTypeFilter !== 'All' && d.doc_type !== selectedDocTypeFilter) {
          return
        }
        
        // Date Modified filter
        if (!matchesDateFilter(d.upload_date, selectedDateFilter)) {
          return
        }
        
        // Associated Project filter
        if (selectedProjectFilter !== 'All' && getAssociatedProject(d) !== selectedProjectFilter) {
          return
        }

        // Apply folder filter during search if user is actively browsing a folder
        const docFolder = d.folder_path || '/'
        if (selectedFolderFilter !== 'All' && docFolder !== selectedFolderFilter) {
          return
        }

        // Apply archived state filter
        const isArchived = d.is_archived === 1
        if (showArchived !== isArchived) {
          return
        }
      } else {
        // If document doesn't exist in docs list, filter it if any filter other than All is active
        if (selectedDocTypeFilter !== 'All' || selectedDateFilter !== 'All' || selectedProjectFilter !== 'All') {
          return
        }
      }

      if (!groups[r.document_id]) {
        groups[r.document_id] = {
          document_id: r.document_id,
          filename: r.filename,
          doc_type: r.doc_type,
          chunks: []
        }
      }
      groups[r.document_id].chunks.push(r)
    })

    return Object.values(groups)
  }, [searchResults, docs, selectedDocTypeFilter, selectedDateFilter, selectedProjectFilter, selectedFolderFilter, showArchived])

  const filteredChunksCount = useMemo(() => {
    return groupedSearchResults.reduce((acc, g) => acc + g.chunks.length, 0)
  }, [groupedSearchResults])

  const handleFile = async (file: File) => {
    setUploading(true)
    setSimulatedProgress(10)
    
    try {
      const uploaded = await api.uploadDocument(file, docType)
      await new Promise<void>((resolve) => {
        const stream = new EventSource(`/api/documents/${encodeURIComponent(uploaded.document_id)}/stream`)
        const timeout = window.setTimeout(() => { stream.close(); resolve() }, 120000)
        stream.addEventListener('ingestion-progress', (event) => {
          const update = JSON.parse((event as MessageEvent).data)
          setSimulatedProgress(update.progress)
          refresh()
          if (update.stage === 'indexed') { clearTimeout(timeout); stream.close(); resolve() }
        })
        stream.addEventListener('ingestion-error', () => { clearTimeout(timeout); stream.close(); resolve() })
        stream.onerror = () => { clearTimeout(timeout); stream.close(); resolve() }
      })
      await refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setSimulatedProgress(0)
      }, 600)
    }
  }

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) {
      handleFile(f)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-6 font-sans pb-24"
    >
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-industrial-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white font-display flex items-center gap-2">
            <Database className="text-industrial-accent glow-text-cyan" size={24} />
            Document &amp; SOP Library
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ingest engineering guidelines, standard operating procedures (SOPs), safety check sheets, and historical logs.
            Our multi-agent indexers extract entity relations and load them directly into your secure operational graph.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={handleSeedDocuments}
            disabled={isSeeding}
            className="flex items-center justify-center gap-2 bg-industrial-accent/10 border border-industrial-accent/25 text-industrial-accent hover:bg-industrial-accent/20 hover:border-industrial-accent/40 px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={13} className={isSeeding ? "animate-spin" : "text-industrial-accent"} />
            {isSeeding ? "Seeding..." : "Load Demo Corpus"}
          </button>
          <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-800 px-3.5 py-1.5 rounded-xl justify-center">
            <FileCheck size={14} className="text-industrial-purple" />
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {docs.length} Active Sources
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Simulator showcasing handdrawn architecture */}
      <IngestionPipelineSimulator />

      {/* Drag & Drop Upload Panel */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-4 text-center transition-all duration-300 ${
          isDragOver 
            ? 'border-industrial-accent bg-industrial-accent/5 scale-[1.01]' 
            : 'border-industrial-700 bg-industrial-900/40 hover:border-industrial-600 hover:bg-industrial-900/60'
        }`}
      >
        <Upload size={32} className={`transition-all duration-300 ${isDragOver ? 'text-industrial-accent scale-110' : 'text-industrial-purple'}`} />
        
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">
            Drag and drop your engineering file here, or click Browse
          </p>
          <p className="text-xs text-slate-500">
            Supports PDF manuals, TXT procedures, and XLSX checklists (Max 25MB)
          </p>
        </div>

        {/* Upload Controls Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 z-10">
          <div className="relative flex items-center bg-industrial-950 border border-industrial-800 rounded-xl pl-3 pr-7 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono select-none">Category:</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="appearance-none bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pl-1.5"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t} className="bg-industrial-900 text-slate-200">
                  {t.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-500">
              <ChevronDown size={11} />
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl bg-industrial-accent hover:brightness-110 px-5 py-2 text-xs font-bold text-industrial-950 uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-industrial-accent/10"
          >
            {uploading ? (
              <>
                <Clock size={13} className="animate-spin" />
                <span>Uploading {simulatedProgress}%</span>
              </>
            ) : (
              <span>Browse File</span>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-industrial-950 overflow-hidden rounded-b-2xl">
            <motion.div 
              className="h-full bg-gradient-to-r from-industrial-accent to-industrial-purple"
              style={{ width: `${simulatedProgress}%` }}
              layoutId="uploadProgress"
            />
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Search size={12} className="text-industrial-accent" />
          Active Library Search
        </h3>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            id="doc-library-search"
            type="text"
            placeholder="Search matching procedures, safety guidelines, and work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-industrial-950 border border-industrial-800 focus:border-industrial-accent/50 rounded-2xl py-3.5 pl-11 pr-16 text-xs font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:shadow-[0_0_15px_rgba(0,240,255,0.05)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px] font-mono font-bold uppercase border border-industrial-800 bg-industrial-900 hover:bg-industrial-800/80 px-2 py-1 rounded-md transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Discovery & Search Filters Panel */}
      <div className="bg-industrial-900/40 border border-industrial-800 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-industrial-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-industrial-accent" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Discovery &amp; Search Filters
            </h4>
          </div>
          {(selectedDocTypeFilter !== 'All' || selectedDateFilter !== 'All' || selectedProjectFilter !== 'All') && (
            <button
              onClick={() => {
                setSelectedDocTypeFilter('All')
                setSelectedDateFilter('All')
                setSelectedProjectFilter('All')
              }}
              className="text-[10px] font-mono font-bold uppercase text-industrial-accent hover:text-white border border-industrial-accent/30 bg-industrial-accent/5 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <X size={10} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Document Type Chips Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 w-32 shrink-0 flex items-center gap-1.5">
              <FileText size={12} className="text-industrial-purple" />
              Doc Type:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['All', ...DOC_TYPES].map((type) => {
                const label = type === 'All' ? 'All Types' : type.replace('_', ' ').toUpperCase();
                const isActive = selectedDocTypeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedDocTypeFilter(type)}
                    className={`text-[10.5px] px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-industrial-purple/20 text-industrial-purple border-industrial-purple/40 shadow-[0_0_8px_rgba(168,85,247,0.1)] font-semibold'
                        : 'bg-industrial-950/60 text-slate-400 border-industrial-850 hover:border-industrial-700 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Modified Chips Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 w-32 shrink-0 flex items-center gap-1.5">
              <Calendar size={12} className="text-industrial-accent" />
              Date Modified:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'All', label: 'Any Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'year', label: 'This Year' }
              ].map((opt) => {
                const isActive = selectedDateFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDateFilter(opt.value)}
                    className={`text-[10.5px] px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-industrial-accent/20 text-industrial-accent border-industrial-accent/40 shadow-[0_0_8px_rgba(0,240,255,0.1)] font-semibold'
                        : 'bg-industrial-950/60 text-slate-400 border-industrial-850 hover:border-industrial-700 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Associated Project Chips Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 w-32 shrink-0 flex items-center gap-1.5">
              <Layers size={12} className="text-emerald-400" />
              Project:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'All',
                'Refinery Expansion',
                'HSSE Compliance',
                'Asset Modernization',
                'Standard Operations'
              ].map((proj) => {
                const label = proj === 'All' ? 'All Projects' : proj;
                const isActive = selectedProjectFilter === proj;
                return (
                  <button
                    key={proj}
                    onClick={() => setSelectedProjectFilter(proj)}
                    className={`text-[10.5px] px-3 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.1)] font-semibold'
                        : 'bg-industrial-950/60 text-slate-400 border-industrial-850 hover:border-industrial-700 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Listing */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
          <Sparkles size={12} className="text-industrial-purple" />
          {searchQuery.trim() ? 'Search Results & Content Previews' : 'Ingested Repositories'}
        </h3>

        {!searchQuery.trim() && docs.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Folder Filter & Archive Toggle Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-industrial-900/30 border border-industrial-800 p-3 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
                  <Filter size={11} className="text-industrial-accent" />
                  Folders:
                </span>
                {allFolders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => {
                      setSelectedFolderFilter(folder);
                      setSelectedIds([]);
                    }}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium shrink-0 transition-all ${
                      selectedFolderFilter === folder
                        ? 'bg-industrial-accent/15 text-industrial-accent border-industrial-accent/30'
                        : 'bg-industrial-950/60 text-slate-400 border-industrial-850 hover:border-industrial-700 hover:text-slate-200'
                    }`}
                  >
                    {folder === 'All' ? 'All' : `📂 ${folder}`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setShowArchived(!showArchived);
                    setSelectedIds([]);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                    showArchived
                      ? 'bg-industrial-purple/15 text-industrial-purple border-industrial-purple/30'
                      : 'bg-industrial-950 text-slate-400 border-industrial-800 hover:border-industrial-700'
                  }`}
                >
                  <Archive size={13} />
                  <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
                </button>
              </div>
            </div>

            {/* Selection Info / Select All Button Row */}
            <div className="flex items-center justify-between mt-1 px-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                {filteredDocs.length} {filteredDocs.length === 1 ? 'Document' : 'Documents'} in {selectedFolderFilter === 'All' ? 'all folders' : `📂 ${selectedFolderFilter}`} {showArchived && '(Archived)'}
              </div>
              {filteredDocs.length > 0 && (
                <button
                  onClick={() => {
                    const allFilteredIds = filteredDocs.map(d => d.id);
                    const allAreSelected = allFilteredIds.every(id => selectedIds.includes(id));
                    if (allAreSelected) {
                      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                    } else {
                      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                    }
                  }}
                  className="text-[10px] text-industrial-accent hover:brightness-110 font-mono font-bold uppercase border border-industrial-800 bg-industrial-900/60 hover:bg-industrial-900 px-2.5 py-1 rounded-lg transition"
                >
                  {filteredDocs.every(d => selectedIds.includes(d.id)) ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {searchQuery.trim() ? (
            // Search Results Mode
            isSearching ? (
              <motion.div 
                key="searching-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-500 text-center py-16 border border-industrial-800 bg-industrial-900/20 rounded-2xl flex flex-col items-center justify-center gap-3"
              >
                <div className="w-6 h-6 border-2 border-industrial-accent border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">Querying Operational Graph...</span>
              </motion.div>
            ) : searchResults.length === 0 ? (
              <motion.div 
                key="no-results-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-500 text-center py-16 border border-industrial-800 bg-industrial-900/20 rounded-2xl flex flex-col items-center justify-center gap-2"
              >
                <FileSearch size={28} className="text-slate-600 animate-bounce" />
                <span className="font-semibold text-slate-300">No matching text previews found</span>
                <span className="text-xs text-slate-500 max-w-sm px-6">
                  Try adjusting your search terms or check if the target document category has been successfully indexed.
                </span>
              </motion.div>
            ) : (
              <motion.div 
                key="search-results-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                <div className="text-[10px] font-mono font-bold text-industrial-accent flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-accent animate-pulse" />
                  Found {filteredChunksCount} {filteredChunksCount === 1 ? 'passage' : 'passages'} across {groupedSearchResults.length} {groupedSearchResults.length === 1 ? 'document' : 'documents'}
                </div>
                
                {groupedSearchResults.map((group, idx) => {
                  const d = docs.find(doc => doc.id === group.document_id);
                  return (
                    <motion.div
                      key={group.document_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border border-industrial-800/80 bg-industrial-900/30 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-industrial-accent to-industrial-purple" />
                      
                      {/* Document Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-industrial-800/50 pb-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-industrial-950 border border-industrial-850 text-industrial-accent mt-0.5 shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 
                              onClick={() => setSelectedQuickViewId(group.document_id)}
                              className="text-sm font-bold text-slate-200 hover:text-industrial-accent hover:underline cursor-pointer transition-colors truncate"
                            >
                              {highlightText(group.filename, searchQuery)}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-mono text-[9px] text-slate-500">
                              <span className="uppercase">
                                Type: {group.doc_type.replace('_', ' ')}
                              </span>
                              {d && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Layers size={9} className="text-emerald-400" />
                                    {getAssociatedProject(d)}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Calendar size={9} className="text-slate-500" />
                                    {new Date(d.upload_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          onClick={() => {
                            setSelectedQuickViewId(group.document_id)
                            setModalTab('preview')
                          }}
                          className="text-[9px] bg-industrial-950 hover:bg-industrial-900 text-slate-300 hover:text-industrial-accent px-2.5 py-1 rounded-lg border border-industrial-850 hover:border-industrial-800 font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={11} />
                          <span>Preview File</span>
                        </button>
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-industrial-950/80 border border-industrial-850 px-2.5 py-1 rounded-lg shrink-0 uppercase tracking-wide">
                          {group.chunks.length} {group.chunks.length === 1 ? 'match' : 'matches'}
                        </span>
                      </div>
                    </div>

                    {/* Matching chunks previews */}
                    <div className="flex flex-col gap-3">
                      {group.chunks.map((chunk) => (
                        <div 
                          key={chunk.id} 
                          className="bg-industrial-950/40 border border-industrial-850/40 hover:border-industrial-800/60 transition-all rounded-xl p-3.5 flex flex-col gap-2 relative"
                        >
                          <div className="flex items-center justify-between gap-4 border-b border-industrial-900/50 pb-1.5">
                            <span className="text-[9px] font-mono font-bold text-industrial-purple uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={10} className="text-industrial-purple" />
                              {chunk.section_label || `Section Chunk #${chunk.chunk_index + 1}`}
                            </span>
                            <div className="flex items-center gap-2">
                              {chunk.score !== undefined && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-industrial-accent/10 border border-industrial-accent/25 text-industrial-accent">
                                  {(chunk.score * 100).toFixed(1)}% Match
                                </span>
                              )}
                              <span className="text-[8px] font-mono text-slate-500">Chunk {chunk.chunk_index + 1}</span>
                            </div>
                          </div>
                          
                          {/* Text Preview Content with Highlights */}
                          <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal whitespace-pre-wrap">
                            {highlightText(chunk.content, searchQuery)}
                          </p>
                        </div>
                      ))}
                    </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )
          ) : (
            // Default Ingested Repositories Listing
            docs.length === 0 ? (
              <motion.div 
                key="empty-library-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-500 text-center py-16 border border-industrial-800 bg-industrial-900/20 rounded-2xl flex flex-col items-center justify-center gap-2"
              >
                <FileText size={24} className="text-slate-600 animate-pulse" />
                <span>No operational manuals indexed. Complete your first upload to initialize search.</span>
              </motion.div>
            ) : filteredDocs.length === 0 ? (
              <motion.div 
                key="empty-folder-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-500 text-center py-16 border border-industrial-800 bg-industrial-900/20 rounded-2xl flex flex-col items-center justify-center gap-3 w-full"
              >
                <FolderOpen size={28} className="text-slate-600" />
                <span className="font-semibold text-slate-300">No documents found</span>
                <span className="text-xs text-slate-500 max-w-sm">
                  {showArchived 
                    ? `No archived files are present in folder "${selectedFolderFilter}".` 
                    : `No active files are present in folder "${selectedFolderFilter}". You can try shifting folders or uploading a new file here.`}
                </span>
              </motion.div>
            ) : (
              <motion.div 
                key="default-repositories-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
              >
                {filteredDocs.map((d, i) => {
                  const styling = STATUS_STYLING[d.ingest_status] || STATUS_STYLING.pending
                  const isSelected = selectedIds.includes(d.id)
                  const folderPath = d.folder_path || '/'
                  const tagsList = d.tags ? d.tags.split(',').map(t => t.trim()).filter(Boolean) : []

                   const suggestedTagsList = parseSuggestedTags(d.suggested_tags)

                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ scale: 1.005, y: -2 }}
                      className={`flex flex-col justify-between p-4.5 rounded-xl border transition-all shadow-md group relative overflow-hidden ${
                        isSelected 
                          ? 'bg-industrial-accent/5 border-industrial-accent/50 animate-pulse-subtle' 
                          : 'border-industrial-800 bg-industrial-900/50 hover:bg-industrial-900 hover:border-industrial-700/80'
                      }`}
                    >
                      {/* Tiny neon side accent bar on hover/selection */}
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-industrial-accent to-industrial-purple transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`} />

                      <div className="flex items-start gap-3">
                        {/* Checkbox button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIds(prev => 
                              prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id]
                            )
                          }}
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all mt-0.5 cursor-pointer ${
                            isSelected 
                              ? 'bg-industrial-accent border-industrial-accent text-industrial-950 shadow-[0_0_8px_rgba(0,240,255,0.25)]' 
                              : 'border-industrial-700 hover:border-industrial-500 bg-industrial-950 text-transparent'
                          }`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </button>

                        <div className="p-2 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-400 group-hover:text-industrial-accent transition-colors shrink-0">
                          <FileText size={18} />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p 
                            onClick={() => setSelectedQuickViewId(d.id)}
                            className="text-sm font-semibold text-slate-200 hover:text-industrial-accent hover:underline cursor-pointer transition-colors truncate"
                          >
                            {d.filename}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 font-mono text-[10px]">
                            <span className="text-slate-500 tracking-wider uppercase">
                              Type: {d.doc_type.replace('_', ' ')}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Folder size={10} className="text-industrial-purple" />
                              {folderPath}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Layers size={10} className="text-emerald-400" />
                              {getAssociatedProject(d)}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar size={10} className="text-slate-500" />
                              {new Date(d.upload_date).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Render Tags */}
                          {tagsList.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {tagsList.map(tag => (
                                <span 
                                  key={tag} 
                                  className="text-[9px] font-mono font-semibold bg-industrial-accent/5 text-industrial-accent border border-industrial-accent/20 px-2 py-0.5 rounded-md flex items-center gap-1"
                                >
                                  <Tag size={8} />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Suggested Tags (AI Recommended) */}
                          {suggestedTagsList.length > 0 && (
                            <div className="mt-3 bg-industrial-950/40 border border-industrial-800/40 rounded-xl p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
                                <span className="flex items-center gap-1">
                                  <Sparkles size={10} className="text-industrial-accent" />
                                  AI Suggested Tags
                                </span>
                                <button
                                  onClick={() => handleApplyAllSuggestions(d.id, suggestedTagsList, d.tags || '')}
                                  className="text-industrial-accent hover:text-white transition-colors uppercase font-bold text-[8px]"
                                >
                                  Accept All
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {suggestedTagsList.map(tag => {
                                  const isAlreadyAdded = tagsList.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      onClick={() => handleToggleSuggestion(d.id, tag, tagsList)}
                                      disabled={isAlreadyAdded}
                                      className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded transition flex items-center gap-1 ${
                                        isAlreadyAdded
                                          ? 'bg-industrial-800/20 text-slate-500 border border-transparent line-through cursor-not-allowed'
                                          : 'bg-industrial-purple/10 text-industrial-purple border border-industrial-purple/20 hover:bg-industrial-purple hover:text-white cursor-pointer'
                                      }`}
                                      title={isAlreadyAdded ? 'Tag already added' : 'Click to add tag'}
                                    >
                                      <span>+</span>
                                      <span>{tag}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-industrial-800/60 pt-3 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium">ID: {d.id.slice(0, 8)}...</span>
                          <button
                            onClick={() => {
                              setSelectedQuickViewId(d.id)
                              setModalTab('preview')
                            }}
                            className="text-[9px] bg-industrial-900 hover:bg-industrial-850 text-slate-300 hover:text-industrial-accent px-2.5 py-1 rounded-lg border border-industrial-800 hover:border-industrial-700 font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={11} />
                            <span>Preview File</span>
                          </button>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${styling.border} ${styling.bg}`}>
                          {styling.icon}
                          <span>{styling.text}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Sticky/Floating Bulk Action Panel */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-20 md:bottom-6 left-1/2 bg-industrial-950/95 border border-industrial-accent/40 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] p-4 flex flex-col md:flex-row items-center gap-4 z-50 max-w-3xl w-[90%] backdrop-blur-md"
          >
            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <div className="bg-industrial-accent/10 p-2.5 rounded-xl border border-industrial-accent/20 text-industrial-accent">
                <CheckSquare size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {selectedIds.length} Document{selectedIds.length === 1 ? '' : 's'} Selected
                </h4>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] text-slate-400 hover:text-white font-mono underline block mt-0.5"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="hidden md:block h-8 w-px bg-industrial-800" />

            {/* Bulk Action Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full justify-between">
              {/* Tagging */}
              <div className="flex items-center gap-1.5 bg-industrial-900 border border-industrial-800 rounded-xl px-2.5 py-1.5 min-w-[140px] flex-1">
                <Tag size={13} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Bulk tags (comma sep)..."
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500"
                  disabled={isBulkProcessing}
                />
                <button
                  onClick={() => handleBulkAction('tag', bulkTagInput)}
                  className="text-[10px] font-bold text-industrial-accent hover:brightness-110 uppercase font-mono shrink-0 disabled:opacity-50"
                  disabled={isBulkProcessing || !bulkTagInput.trim()}
                >
                  Apply
                </button>
              </div>

              {/* Move to Folder */}
              <div className="flex items-center gap-1.5 bg-industrial-900 border border-industrial-800 rounded-xl px-2.5 py-1.5 min-w-[140px] flex-1">
                <Folder size={13} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Folder (e.g., /safety)..."
                  value={bulkFolderInput}
                  onChange={(e) => setBulkFolderInput(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500"
                  disabled={isBulkProcessing}
                />
                <button
                  onClick={() => handleBulkAction('move_folder', bulkFolderInput)}
                  className="text-[10px] font-bold text-industrial-accent hover:brightness-110 uppercase font-mono shrink-0 disabled:opacity-50"
                  disabled={isBulkProcessing || !bulkFolderInput.trim()}
                >
                  Move
                </button>
              </div>

              {/* Archive / Unarchive / Delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction(showArchived ? 'unarchive' : 'archive')}
                  disabled={isBulkProcessing}
                  title={showArchived ? "Unarchive Selected" : "Archive Selected"}
                  className="p-2 rounded-xl bg-industrial-900 hover:bg-industrial-800 border border-industrial-800 text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 text-xs font-semibold px-3 disabled:opacity-50"
                >
                  <Archive size={14} className="text-industrial-purple" />
                  <span>{showArchived ? 'Restore' : 'Archive'}</span>
                </button>
                
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected documents and their indexed chunks? This cannot be undone.`)) {
                      handleBulkAction('delete');
                    }
                  }}
                  disabled={isBulkProcessing}
                  title="Delete Selected"
                  className="p-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-800/50 text-red-400 hover:text-red-300 transition flex items-center justify-center gap-1.5 text-xs font-semibold px-3 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedQuickViewId && (
          <div 
            className="fixed inset-0 bg-industrial-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={handleCloseQuickView}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className={`quick-view-modal bg-industrial-950/95 border border-industrial-800 rounded-3xl ${modalTab === 'preview' ? 'max-w-5xl h-[85vh]' : 'max-w-2xl max-h-[85vh]'} w-full flex flex-col shadow-2xl relative overflow-hidden text-slate-100 transition-all duration-300`}
            >
              {/* Top Neon Border Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-industrial-accent via-industrial-purple to-industrial-accent/40" />

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseQuickView}
                className="absolute top-4 right-4 p-2 rounded-xl bg-industrial-900/50 hover:bg-industrial-900 border border-industrial-800 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
              >
                <X size={16} />
              </button>

              {loadingQuickView ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 px-6">
                  <div className="w-8 h-8 border-2 border-industrial-accent border-t-transparent rounded-full animate-spin" />
                  <p className="font-mono text-xs text-slate-400 uppercase tracking-widest animate-pulse">
                    Synthesizing Document Intelligence...
                  </p>
                </div>
              ) : quickViewError ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <XCircle size={36} className="text-red-500" />
                  <h4 className="text-sm font-bold text-slate-200">Error Loading Details</h4>
                  <p className="text-xs text-slate-400 max-w-sm">{quickViewError}</p>
                  <button
                    onClick={handleCloseQuickView}
                    className="mt-2 text-xs bg-industrial-900 px-4 py-2 rounded-xl border border-industrial-800 hover:bg-industrial-850 text-slate-200 font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              ) : quickViewDoc ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Modal Header */}
                  <div className="quick-view-header p-6 border-b border-industrial-850 bg-industrial-900/20">
                    <span className="text-[9px] font-mono font-bold text-industrial-accent bg-industrial-accent/10 border border-industrial-accent/20 px-2 py-1 rounded-md uppercase tracking-wider">
                      {quickViewDoc.doc_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-2 pr-10 line-clamp-2 leading-snug">
                      {quickViewDoc.filename}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-slate-500" />
                        <span>Uploaded: {new Date(quickViewDoc.upload_date).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Folder size={11} className="text-industrial-purple" />
                        <span>{quickViewDoc.folder_path || '/'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tactile Tab Selector Controls */}
                  <div className="flex border-b border-industrial-850 bg-industrial-900/10 p-1 px-6 gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalTab('insights')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        modalTab === 'insights'
                          ? 'bg-industrial-accent/15 border border-industrial-accent/30 text-industrial-accent shadow-[0_0_12px_rgba(0,240,255,0.1)]'
                          : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-industrial-900/30'
                      }`}
                    >
                      <Sparkles size={13} />
                      AI Insights &amp; Metadata
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('preview')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        modalTab === 'preview'
                          ? 'bg-industrial-purple/15 border border-industrial-purple/30 text-industrial-purple shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                          : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-industrial-900/30'
                      }`}
                    >
                      <BookOpen size={13} />
                      Inline Document Preview
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className={`flex-1 ${modalTab === 'preview' ? 'overflow-hidden flex flex-col p-6' : 'overflow-y-auto p-6 space-y-6'}`}>
                    {modalTab === 'preview' ? (
                      (() => {
                        const isPdf = quickViewDoc.filename.toLowerCase().endsWith('.pdf');
                        const scrollToChunk = (chunkIndex: number) => {
                          const element = document.getElementById(`preview-chunk-${chunkIndex}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        };

                        return (
                          <div className="flex flex-col md:flex-row gap-5 h-full overflow-hidden">
                            {/* Left Column: Outline / Chapters Sidebar (Only shown if document has multiple sections) */}
                            {quickViewDoc.chunks && quickViewDoc.chunks.length > 1 && (
                              <div className="w-full md:w-56 shrink-0 flex flex-col border border-industrial-850 bg-industrial-950/40 rounded-2xl p-3.5 space-y-2 overflow-y-auto h-[120px] md:h-full">
                                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">Document Outline</span>
                                <div className="flex flex-col gap-1 mt-1 font-mono">
                                  {quickViewDoc.chunks.map((chunk: any) => {
                                    const label = chunk.section_label || `Section ${chunk.chunk_index + 1}`
                                    const isActive = chunk.chunk_index === activeChunkIndex
                                    return (
                                      <button
                                        key={chunk.id}
                                        type="button"
                                        onClick={() => scrollToChunk(chunk.chunk_index)}
                                        className={`text-left text-xs font-medium p-2 rounded-xl transition-all border truncate cursor-pointer flex items-center gap-1.5 ${
                                          isActive
                                            ? 'bg-industrial-accent/10 border-industrial-accent/30 text-industrial-accent shadow-[0_0_8px_rgba(0,240,255,0.05)] font-bold'
                                            : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-industrial-900/40 hover:border-industrial-850'
                                        }`}
                                        title={label}
                                      >
                                        <span className={`${isActive ? 'text-industrial-accent' : 'text-industrial-purple'} font-bold`}>§</span>
                                        <span className="truncate">{label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Right Column: Main Reading Stage */}
                            <div className="flex-1 flex flex-col border border-industrial-850 bg-industrial-900/10 rounded-3xl overflow-hidden h-full">
                              {/* Viewer Control Bar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-b border-industrial-850 bg-industrial-950/50">
                                {/* Inner Document Search */}
                                <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-800 rounded-xl px-2.5 py-1.5 flex-1 max-w-xs">
                                  <Search size={12} className="text-slate-500" />
                                  <input
                                    type="text"
                                    placeholder="Search in file..."
                                    value={previewSearch}
                                    onChange={(e) => setPreviewSearch(e.target.value)}
                                    className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500 font-sans"
                                  />
                                  {previewSearch && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewSearch('')}
                                      className="text-slate-500 hover:text-white text-[10px] font-mono uppercase"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>

                                {/* Controls: Size & PDF/Text toggle */}
                                <div className="flex items-center gap-3 shrink-0">
                                  {/* Font Size Selector */}
                                  {previewMode === 'text' && (
                                    <div className="flex items-center bg-industrial-900 border border-industrial-800 rounded-xl p-1 gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFontSize('sm')}
                                        className={`text-[10px] font-mono px-2 py-1 rounded-lg transition ${
                                          previewFontSize === 'sm' ? 'bg-industrial-accent/20 text-industrial-accent font-bold' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Small Text"
                                      >
                                        A-
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFontSize('base')}
                                        className={`text-[10px] font-mono px-2 py-1 rounded-lg transition ${
                                          previewFontSize === 'base' ? 'bg-industrial-accent/20 text-industrial-accent font-bold' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Medium Text"
                                      >
                                        A
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFontSize('lg')}
                                        className={`text-[10px] font-mono px-2 py-1 rounded-lg transition ${
                                          previewFontSize === 'lg' ? 'bg-industrial-accent/20 text-industrial-accent font-bold' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Large Text"
                                      >
                                        A+
                                      </button>
                                    </div>
                                  )}

                                  {/* Original PDF Toggle if applicable */}
                                  {isPdf && (
                                    <div className="flex items-center bg-industrial-900 border border-industrial-800 rounded-xl p-1 gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewMode('text')}
                                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition ${
                                          previewMode === 'text' ? 'bg-industrial-purple/20 text-industrial-purple' : 'text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        Text
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewMode('pdf')}
                                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg transition ${
                                          previewMode === 'pdf' ? 'bg-industrial-purple/20 text-industrial-purple' : 'text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        PDF
                                      </button>
                                    </div>
                                  )}

                                  {/* Progress Badge */}
                                  <div className="flex items-center gap-1.5 bg-industrial-900 border border-industrial-800 rounded-xl px-2.5 py-2 text-[10px] font-mono font-bold text-slate-400 select-none">
                                    <BookOpen size={11} className={`${scrollProgress === 100 ? 'text-industrial-emerald' : 'text-industrial-accent animate-pulse'}`} />
                                    <span>{scrollProgress}% READ</span>
                                  </div>

                                  {/* Download Link */}
                                  <a
                                    href={`/api/documents/${quickViewDoc.id}/file`}
                                    download={quickViewDoc.filename}
                                    className="p-2 bg-industrial-900 hover:bg-industrial-850 text-slate-300 hover:text-white rounded-xl border border-industrial-800 transition flex items-center justify-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5"
                                    title="Download document to device"
                                  >
                                    <Download size={12} />
                                    <span>Save</span>
                                  </a>
                                </div>
                              </div>

                              {/* Interactive Thin Progress Bar */}
                              <div className="h-1 w-full bg-industrial-950 relative overflow-hidden shrink-0 border-b border-industrial-850/40">
                                <div 
                                  className="h-full bg-gradient-to-r from-industrial-accent via-industrial-purple to-industrial-accent transition-all duration-150 ease-out shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                  style={{ width: `${scrollProgress}%` }}
                                />
                              </div>

                              {/* Paper stage */}
                              <div 
                                ref={paperStageRef}
                                onScroll={handleScroll}
                                className="flex-1 p-5 overflow-y-auto bg-industrial-950/30 scrollbar-thin"
                              >
                                {previewMode === 'pdf' ? (
                                  <div className="w-full h-full min-h-[350px]">
                                    <iframe
                                      src={`/api/documents/${quickViewDoc.id}/file`}
                                      className="w-full h-full min-h-[350px] rounded-2xl border border-industrial-850 bg-industrial-950"
                                      title="Original Document PDF View"
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    {quickViewDoc.chunks && quickViewDoc.chunks.map((chunk: any) => {
                                      const textVal = chunk.content || ''
                                      const matchesFilter = !previewSearch || textVal.toLowerCase().includes(previewSearch.toLowerCase())
                                      
                                      if (previewSearch && !matchesFilter) return null;

                                      const sizeClass = 
                                        previewFontSize === 'sm' ? 'text-xs leading-relaxed' :
                                        previewFontSize === 'lg' ? 'text-base leading-loose' :
                                        'text-sm leading-relaxed'

                                      return (
                                        <div 
                                          key={chunk.id} 
                                          id={`preview-chunk-${chunk.chunk_index}`}
                                          className="p-5 bg-industrial-900/30 border border-industrial-850 hover:border-industrial-800/80 rounded-2xl transition-all relative group"
                                        >
                                          {/* Header of paper sheet segment */}
                                          <div className="flex items-center justify-between border-b border-industrial-850/50 pb-2 mb-3">
                                            <span className="text-[10px] font-mono font-bold text-industrial-accent tracking-wider uppercase">
                                              {chunk.section_label || `Section Paragraph #${chunk.chunk_index + 1}`}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold">Segment {chunk.chunk_index + 1}</span>
                                          </div>

                                          {/* Text block */}
                                          <p className={`${sizeClass} text-slate-200 whitespace-pre-wrap font-sans font-normal`}>
                                            {highlightText(textVal, previewSearch)}
                                          </p>
                                        </div>
                                      )
                                    })}

                                    {quickViewDoc.chunks && quickViewDoc.chunks.filter((c: any) => !previewSearch || c.content.toLowerCase().includes(previewSearch.toLowerCase())).length === 0 && (
                                      <div className="text-center py-12 text-slate-500 font-mono text-xs">
                                        No segments match your inside search query "{previewSearch}".
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <>
                        {/* Executive Summary Container */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Sparkles size={12} className="text-industrial-accent" />
                            Executive Summary
                          </h4>
                          <div className="quick-view-summary bg-gradient-to-br from-industrial-accent/5 to-industrial-purple/5 border border-industrial-800/80 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-industrial-accent/5 blur-xl rounded-full" />
                            <p className="text-sm text-slate-200 leading-relaxed font-normal">
                              {quickViewDoc.summary}
                            </p>
                          </div>
                        </div>

                        {/* Tags and AI Tag Suggestions */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Tag size={12} className="text-industrial-purple" />
                            Document Tags
                          </h4>
                          
                          <div className="bg-industrial-900/10 border border-industrial-850 rounded-2xl p-4.5 space-y-4">
                            {/* Currently Applied Tags */}
                            <div>
                              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-2">Applied Tags</span>
                              {quickViewDoc.tags ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {quickViewDoc.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                                    <span 
                                      key={tag} 
                                      className="text-[10px] font-mono font-semibold bg-industrial-accent/5 text-industrial-accent border border-industrial-accent/20 px-2.5 py-1 rounded-md flex items-center gap-1"
                                    >
                                      <Tag size={9} />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic block">No tags currently applied.</span>
                              )}
                            </div>

                            {/* AI Suggested Tags */}
                            {(() => {
                              const modalSuggestedList = parseSuggestedTags(quickViewDoc.suggested_tags)

                              if (modalSuggestedList.length === 0) return null;

                              const currentTagsList = quickViewDoc.tags ? quickViewDoc.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

                              return (
                                <div className="border-t border-industrial-850/50 pt-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                                      <Sparkles size={11} className="text-industrial-accent animate-pulse" />
                                      AI Suggested Recommendations
                                    </span>
                                    <button
                                      onClick={() => handleApplyAllSuggestions(quickViewDoc.id, modalSuggestedList, quickViewDoc.tags || '')}
                                      className="text-industrial-accent hover:text-white transition-colors uppercase font-bold text-[9px] font-mono"
                                    >
                                      Accept All
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {modalSuggestedList.map((tag: string) => {
                                      const isAlreadyAdded = currentTagsList.includes(tag);
                                      return (
                                        <button
                                          key={tag}
                                          onClick={() => handleToggleSuggestion(quickViewDoc.id, tag, currentTagsList)}
                                          disabled={isAlreadyAdded}
                                          className={`text-[10px] font-mono font-medium px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                                            isAlreadyAdded
                                              ? 'bg-industrial-800/10 text-slate-500 border border-transparent line-through cursor-not-allowed'
                                              : 'bg-industrial-purple/10 text-industrial-purple border border-industrial-purple/25 hover:bg-industrial-purple hover:text-white cursor-pointer'
                                          }`}
                                          title={isAlreadyAdded ? 'Tag already added' : 'Click to add tag'}
                                        >
                                          <span>+</span>
                                          <span>{tag}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Metadata & Entity Badges */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Cpu size={12} className="text-industrial-purple" />
                              Extracted Entities
                            </h4>
                            <div className="bg-industrial-900/30 border border-industrial-850 rounded-2xl p-4 space-y-3 min-h-[140px]">
                              {/* Equipment Tags */}
                              <div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1.5">Equipment Assets</span>
                                {quickViewDoc.entities?.equipment?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {quickViewDoc.entities.equipment.map((e: string) => (
                                      <span key={e} className="text-[10px] font-mono bg-industrial-900 px-2 py-0.5 rounded border border-industrial-800 text-industrial-accent">
                                        {e}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic block">No hardware equipment mapped.</span>
                                )}
                              </div>

                              {/* Related Procedures */}
                              <div className="border-t border-industrial-850/50 pt-2.5">
                                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1.5">Governed Procedures</span>
                                {quickViewDoc.entities?.procedures?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {quickViewDoc.entities.procedures.map((p: string) => (
                                      <span key={p} className="text-[10px] font-mono bg-industrial-900 px-2 py-0.5 rounded border border-industrial-800 text-industrial-purple">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic block">No procedures found.</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Layers size={12} className="text-slate-400" />
                              Index Specifications
                            </h4>
                            <div className="bg-industrial-900/30 border border-industrial-850 rounded-2xl p-4 space-y-3 text-xs font-mono min-h-[140px]">
                              <div className="flex items-center justify-between border-b border-industrial-850/40 pb-1.5">
                                <span className="text-slate-500">Document ID:</span>
                                <span className="text-slate-300 font-semibold">{quickViewDoc.id.slice(0, 16)}...</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-industrial-850/40 pb-1.5">
                                <span className="text-slate-500">Indexed Chunks:</span>
                                <span className="text-slate-300 font-semibold">{quickViewDoc.chunks.length} segments</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-industrial-850/40 pb-1.5">
                                <span className="text-slate-500">Search Tags:</span>
                                <span className="text-slate-300 font-semibold truncate max-w-[150px]">{quickViewDoc.tags || 'none'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Status:</span>
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  Indexed
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SOP Chunks list */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <FileText size={12} className="text-industrial-accent" />
                            Segmented Index Chunks ({quickViewDoc.chunks.length})
                          </h4>
                          <div className="border border-industrial-850 rounded-2xl divide-y divide-industrial-850 max-h-56 overflow-y-auto bg-industrial-950/50">
                            {quickViewDoc.chunks.map((chunk: any) => (
                              <div key={chunk.id} className="p-3.5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold text-industrial-purple uppercase tracking-wider">
                                    {chunk.section_label || `Chunk #${chunk.chunk_index + 1}`}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 font-bold">Segment {chunk.chunk_index + 1}</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal whitespace-pre-wrap">
                                  {chunk.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="quick-view-footer p-5 border-t border-industrial-850 bg-industrial-900/30 flex items-center justify-end gap-3">
                    <button
                      onClick={handleCloseQuickView}
                      className="text-xs bg-industrial-900 hover:bg-industrial-850 px-4 py-2 rounded-xl border border-industrial-800 text-slate-200 font-semibold transition"
                    >
                      Close Quick View
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
