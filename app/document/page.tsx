'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'

export default function DocumentPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [preview, setPreview] = useState<{ html: string; type: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: agents } = await supabase.from('business_agents').select('id').eq('user_id', user.id)
      if (!agents?.length) { setLoading(false); return }
      const agentIds = agents.map((a: any) => a.id)
      const { data: docs } = await supabase
        .from('documents')
        .select('*, business_agents(agent_name, business_name)')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
      setDocuments(docs || [])
      setLoading(false)
    }
    load()
  }, [])

  const types = ['ALL', ...Array.from(new Set(documents.map((d: any) => d.type)))]
  const filtered = filter === 'ALL' ? documents : documents.filter((d: any) => d.type === filter)

  const typeColors: Record<string, string> = {
    INVOICE: '#10b981', CONTRACT: '#3b82f6', PROPOSAL: '#8b5cf6',
    REPORT: '#f59e0b', 'MEETING AGENDA': '#ec4899', 'JOB LISTING': '#6b7280',
  }

  const viewDoc = (doc: any) => {
    const html = doc.metadata?.invoiceHTML || doc.content
    if (html?.trim().startsWith('<!DOCTYPE') || html?.trim().startsWith('<html')) {
      setPreview({ html, type: doc.type })
    }
  }

  const printDoc = (doc: any) => {
    const html = doc.metadata?.invoiceHTML || doc.content
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)' }}>Loading...</span>
        </div>
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />

      {preview && (
        <div className="modal-overlay">
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 740, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{preview.type}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { const win = window.open('', '_blank'); if (win) { win.document.write(preview.html); win.document.close(); win.print() } }} className="btn btn-accent btn-sm">Print / PDF</button>
                <button onClick={() => setPreview(null)} className="btn btn-outline btn-sm">Close</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <iframe srcDoc={preview.html} style={{ width: '100%', height: '600px', border: 'none' }} title="Document" />
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <div className="app-header">
          <span className="page-title">Documents</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
            {documents.length} total
          </span>
        </div>

        <div className="app-content">

          {documents.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {types.map(type => (
                <button key={type} onClick={() => setFilter(type)}
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border2)', cursor: 'pointer', background: filter === type ? 'var(--fg)' : 'transparent', color: filter === type ? 'var(--bg)' : 'var(--fg3)', transition: 'all 0.1s' }}>
                  {type} ({type === 'ALL' ? documents.length : documents.filter((d: any) => d.type === type).length})
                </button>
              ))}
            </div>
          )}

          {/* Mobile responsive styles */}
          <style>{`
            @media (max-width: 768px) {
              .app-content { padding: 16px !important; }
              .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            }
          `}</style>

          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                </div>
                <div className="empty-state-title">No documents yet</div>
                <div className="empty-state-desc">Documents generated through your agents will appear here.</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Agent</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc: any) => (
                    <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => viewDoc(doc)}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--fg)', fontSize: 13 }}>
                          {doc.metadata?.clientName || doc.metadata?.title || doc.metadata?.party2 || 'Document'}
                        </div>
                        {doc.metadata?.invoiceNumber && (
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)', marginTop: 2 }}>
                            {doc.metadata.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${typeColors[doc.type] || '#6b7280'}18`, color: typeColors[doc.type] || '#6b7280', border: `1px solid ${typeColors[doc.type] || '#6b7280'}33` }}>
                          {doc.type}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                        {doc.business_agents?.agent_name || '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)', whiteSpace: 'nowrap' }}>
                        {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg2)' }}>
                        {doc.metadata?.total ? `$${doc.metadata.total}` : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => viewDoc(doc)} className="btn btn-outline btn-sm">View</button>
                          <button onClick={() => printDoc(doc)} className="btn btn-ghost btn-sm">Print</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}