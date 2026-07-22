import { auth } from './firebase'

const API_BASE = '/api'

export interface Citation {
  document_id: string
  document_name: string
  section: string | null
  excerpt: string
}

export interface RelatedEntity {
  id: string
  type: string
  name: string
}

export interface QueryResponse {
  answer: string
  citations: Citation[]
  confidence: number
  confidence_reason: string
  related_entities: RelatedEntity[]
  intent: string
  retrieval_debug: { vector_hits: number; graph_hits: number; keyword_hits: number }
}

export interface DocumentSummary {
  id: string
  filename: string
  doc_type: string
  ingest_status: string
  upload_date: string
  tags?: string | null
  suggested_tags?: string | null
  is_archived?: number | null
  folder_path?: string | null
}

export interface SearchChunkResult {
  id: string
  document_id: string
  content: string
  section_label: string | null
  chunk_index: number
  filename: string
  doc_type: string
  score?: number
}

export interface RAGStatusResponse {
  connected: boolean
  database_connected: boolean
  gemini_connected: boolean
  total_documents: number
  indexed_documents: number
  failed_documents: number
  processing_documents: number
  total_chunks: number
  entity_index_size: number
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken()
      return { 'Authorization': `Bearer ${token}` }
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e)
    }
  }
  return {}
}

async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeader()
  const headers = {
    ...options.headers,
    ...authHeaders,
  }
  return fetch(url, { ...options, headers })
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }
  return res.json()
}

export interface RCACause {
  cause: string
  probability: number
  evidence: string
}

export interface RCACitation {
  document_name: string
  excerpt: string
}

export interface RCAResponse {
  equipment_tag: string
  symptom: string
  mtbf_days: number
  failure_rate_annual: number
  criticality: string
  root_causes: RCACause[]
  recommended_action: string
  next_inspection_date: string
  citations: RCACitation[]
}

export interface ComplianceReg {
  id: string
  name: string
  clause: string
  source: string
  severity: string
  status: string
  assets_mapped: number
}

export interface ComplianceGap {
  id: string
  regulation_name: string
  mapped_entity: string
  entity_type: string
  status: string
  severity: string
  action_required: string
}

export interface ComplianceDashboardResponse {
  compliance_rate: number
  total_regulations: number
  mapped_assets_count: number
  regulations: ComplianceReg[]
  gaps: ComplianceGap[]
}

export interface LessonAlert {
  type: string
  severity: string
  title: string
  description: string
  linked_incidents: string[]
}

export interface WorkOrderCreateResponse {
  status: string
  work_order: {
    id: string
    wo_number: string
    equipment_tag: string
    date: string
    type: string
    description: string
    technician_id: string
    status: string
  }
  warning_banner: {
    severity: string
    title: string
    message: string
  } | null
}

export const api = {
  health: () => customFetch(`${API_BASE}/health`).then((r) => handle<{ status: string }>(r)),

  ragStatus: () => customFetch(`${API_BASE}/rag-status`).then((r) => handle<RAGStatusResponse>(r)),

  listDocuments: () => customFetch(`${API_BASE}/documents`).then((r) => handle<DocumentSummary[]>(r)),

  getDocumentDetails: (id: string) =>
    customFetch(`${API_BASE}/documents/${encodeURIComponent(id)}`).then((r) =>
      handle<DocumentSummary & {
        summary: string
        suggested_tags: string
        chunks: { id: string; content: string; section_label: string | null; chunk_index: number }[]
        entities: { equipment: string[]; procedures: string[]; regulations: string[] }
      }>(r)
    ),

  applyTags: (id: string, tags: string[]) =>
    customFetch(`${API_BASE}/documents/${encodeURIComponent(id)}/apply-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    }).then((r) => handle<{ success: boolean; tags: string }>(r)),

  bulkAction: (documentIds: string[], action: 'tag' | 'archive' | 'unarchive' | 'move_folder' | 'delete', value?: string) =>
    customFetch(`${API_BASE}/documents/bulk-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds, action, value }),
    }).then((r) => handle<{ success: boolean; message: string }>(r)),

  searchDocuments: (q: string) =>
    customFetch(`${API_BASE}/documents/search?q=${encodeURIComponent(q)}`).then((r) =>
      handle<SearchChunkResult[]>(r)
    ),

  uploadDocument: (file: File, docType: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('doc_type', docType)
    return customFetch(`${API_BASE}/documents/upload`, { method: 'POST', body: form }).then((r) =>
      handle<{ document_id: string; filename: string; status: string; chunks_created?: number; error?: string }>(r),
    )
  },

  query: (queryText: string) =>
    customFetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_text: queryText }),
    }).then((r) => handle<QueryResponse>(r)),

  entityNeighbors: (nodeId: string, hops = 1) =>
    customFetch(`${API_BASE}/graph/entity/${encodeURIComponent(nodeId)}?hops=${hops}`).then((r) =>
      handle<{ nodes: any[]; edges: any[] }>(r),
    ),

  searchGraph: (q: string) =>
    customFetch(`${API_BASE}/graph/search?q=${encodeURIComponent(q)}`).then((r) => handle<any[]>(r)),

  listEquipment: () => customFetch(`${API_BASE}/graph/equipment`).then((r) => handle<string[]>(r)),

  getRCADetails: (equipmentTag: string, symptom: string) =>
    customFetch(`${API_BASE}/maintenance/rca?equipment_tag=${encodeURIComponent(equipmentTag)}&symptom=${encodeURIComponent(symptom)}`).then((r) =>
      handle<RCAResponse>(r)
    ),

  getComplianceDashboard: () =>
    customFetch(`${API_BASE}/compliance/dashboard`).then((r) =>
      handle<ComplianceDashboardResponse>(r)
    ),

  generateCompliancePackage: (regulationIds: string[]) =>
    customFetch(`${API_BASE}/compliance/generate_package`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regulation_ids: regulationIds })
    }).then((r) =>
      handle<{ report_markdown: string }>(r)
    ),

  getLessonsAlerts: () =>
    customFetch(`${API_BASE}/lessons/alerts`).then((r) =>
      handle<{ alerts: LessonAlert[] }>(r)
    ),

  createWorkOrder: (wo: { equipment_tag: string; description: string; type: string; technician_id: string; date: string }) =>
    customFetch(`${API_BASE}/work_orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wo)
    }).then((r) =>
      handle<WorkOrderCreateResponse>(r)
    ),

  getKnowledgeInsights: () =>
    customFetch(`${API_BASE}/insights/summary`).then((r) =>
      handle<{
        is_live: boolean
        document_types: { doc_type: string; count: number }[]
        topics: { topic: string; count: number }[]
        total_chunks: number
        indexed_documents: number
        entity_index_size: number
      }>(r)
    ),

  seedDocuments: () =>
    customFetch(`${API_BASE}/documents/seed`, {
      method: 'POST',
    }).then((r) => handle<{ success: boolean; seeded_count: number }>(r)),

  summarizeSession: (messages: any[]) =>
    customFetch(`${API_BASE}/query/summarize-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    }).then((r) => handle<{ summary: string }>(r)),
}
