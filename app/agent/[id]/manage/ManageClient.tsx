'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

export default function ManageClient({
  agent, knowledge, contacts, memories, team
}: {
  agent: Record<string, unknown>
  knowledge: Record<string, unknown>[]
  contacts: Record<string, unknown>[]
  memories: Record<string, unknown>[]
  team: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'knowledge' | 'contacts' | 'memory' | 'team' | 'portal'>('knowledge')
  const [kb, setKb] = useState(knowledge)
  const [cts, setCts] = useState(contacts)
  const [mem, setMem] = useState(memories)
  const [tm, setTm] = useState(team)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kbFileRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [newKb, setNewKb] = useState({ title: '', content: '', type: 'general' })
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', company: '', notes: '' })
  const [newTeam, setNewTeam] = useState({ email: '', role: 'member' })
  const [portalSettings, setPortalSettings] = useState({
    portal_enabled: agent.portal_enabled !== false,
    portal_color: (agent.portal_color as string) || '#c8f135',
    portal_tagline: (agent.portal_tagline as string) || '',
    portal_greeting: (agent.portal_greeting as string) || '',
    portal_avatar_url: (agent.portal_avatar_url as string) || '',
  })
  const [saving, setSaving] = useState(false)
  const [savingPortal, setSavingPortal] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const [csvAllRows, setCsvAllRows] = useState<Record<string, string>[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'var(--sidebar-font)', fontSize: 13, background: 'var(--bg3)', color: 'var(--fg)', outline: 'none' }

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const headers = results.meta.fields || []
        setCsvHeaders(headers); setCsvPreview(rows.slice(0, 5)); setCsvAllRows(rows)
        const autoMap: Record<string, string> = {}
        headers.forEach(h => {
          const lower = h.toLowerCase()
          if (lower.includes('name') || lower.includes('full')) autoMap[h] = 'name'
          else if (lower.includes('email') || lower.includes('mail')) autoMap[h] = 'email'
          else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) autoMap[h] = 'phone'
          else if (lower.includes('company') || lower.includes('business') || lower.includes('org')) autoMap[h] = 'company'
          else if (lower.includes('note') || lower.includes('comment') || lower.includes('remark')) autoMap[h] = 'notes'
          else autoMap[h] = 'skip'
        })
        setColumnMap(autoMap); setShowPreview(true)
      },
      error: () => showMsg('Failed to read file.', 'error')
    })
    e.target.value = ''
  }

  const importContacts = async () => {
    if (!csvAllRows.length) return
    setImporting(true)
    const contactsToInsert = csvAllRows.map(row => {
      const contact: Record<string, string> = { name: '', email: '', phone: '', company: '', notes: '' }
      Object.entries(columnMap).forEach(([col, field]) => {
        if (field !== 'skip' && row[col]) contact[field] = contact[field] ? `${contact[field]} ${row[col]}` : row[col]
      })
      return { business_agent_id: agent.id as string, name: contact.name || 'Unknown', email: contact.email || '', phone: contact.phone || '', company: contact.company || '', notes: contact.notes || '' }
    }).filter(c => c.name !== 'Unknown' || c.email)
    const { data, error } = await supabase.from('contacts').insert(contactsToInsert).select()
    if (error) showMsg(`Import failed: ${error.message}`, 'error')
    else { setCts(prev => [...(data || []), ...prev]); setShowPreview(false); setCsvPreview([]); setCsvAllRows([]); showMsg(`Imported ${data?.length || 0} contacts!`) }
    setImporting(false)
  }

  const handleKbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setNewKb(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, ''), content: content.slice(0, 5000) }))
      showMsg('File loaded! Review and save.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const saveKb = async () => {
    if (!newKb.title || !newKb.content) { showMsg('Please fill in title and content.', 'error'); return }
    setSaving(true)
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_agent_id: agent.id, title: newKb.title.trim(), content: newKb.content.trim(), type: newKb.type }),
    })
    const json = await res.json()
    if (json.error) showMsg(`Failed to save: ${json.error}`, 'error')
    else if (json.data) { setKb(prev => [json.data, ...prev]); setNewKb({ title: '', content: '', type: 'general' }); showMsg('Knowledge saved!') }
    setSaving(false)
  }

  const deleteKb = async (id: string) => {
    const res = await fetch('/api/knowledge', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (json.error) showMsg(`Failed to delete: ${json.error}`, 'error')
    else setKb(prev => prev.filter(k => k.id !== id))
  }

  const saveContact = async () => {
    if (!newContact.name) { showMsg('Name is required.', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from('contacts').insert({ business_agent_id: agent.id, ...newContact }).select().single()
    if (error) showMsg(`Failed: ${error.message}`, 'error')
    else if (data) { setCts(prev => [data, ...prev]); setNewContact({ name: '', email: '', phone: '', company: '', notes: '' }); showMsg('Contact saved!') }
    setSaving(false)
  }

  const deleteContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    setCts(prev => prev.filter(c => c.id !== id))
  }

  const deleteMemory = async (id: string) => {
    await supabase.from('agent_memory').delete().eq('id', id)
    setMem(prev => prev.filter(m => m.id !== id))
  }

  const inviteTeam = async () => {
    if (!newTeam.email) return
    setSaving(true)
    const { data, error } = await supabase.from('team_members').insert({ business_agent_id: agent.id, email: newTeam.email, role: newTeam.role }).select().single()
    if (error) showMsg(`Failed: ${error.message}`, 'error')
    else if (data) { setTm(prev => [data, ...prev]); setNewTeam({ email: '', role: 'member' }); showMsg('Team member invited!') }
    setSaving(false)
  }

  const removeTeam = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    setTm(prev => prev.filter(t => t.id !== id))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const fileName = `${agent.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (uploadError) { showMsg(`Upload failed: ${uploadError.message}`, 'error'); setUploadingAvatar(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setPortalSettings(prev => ({ ...prev, portal_avatar_url: urlData.publicUrl }))
    showMsg('Avatar uploaded! Save settings to apply.')
    setUploadingAvatar(false)
    e.target.value = ''
  }

  const savePortalSettings = async () => {
    setSavingPortal(true)
    const res = await fetch('/api/portal-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id, ...portalSettings }),
    })
    const json = await res.json()
    if (json.error) showMsg(`Failed: ${json.error}`, 'error')
    else showMsg('Portal settings saved!')
    setSavingPortal(false)
  }

  const contactFields = ['name', 'email', 'phone', 'company', 'notes', 'skip']

  const PRESET_COLORS = [
    '#c8f135', '#3b82f6', '#8b5cf6', '#ef4444',
    '#f59e0b', '#10b981', '#ec4899', '#0a0a0a',
    '#1e3a5f', '#7c3aed', '#dc2626', '#059669',
  ]

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-header">
          <button onClick={() => router.push(`/agent/${agent.id as string}`)} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border2)' }} />
          <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 14, fontWeight: 600 }}>Manage</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{agent.business_name as string}</span>
        </div>

        <div className="manage-content" style={{ width: '100%', padding: '40px 48px' }}>

          {msg && (
            <div style={{ background: msgType === 'success' ? '#0d2e14' : '#2a0a0a', border: `1px solid ${msgType === 'success' ? '#1a4a24' : '#4a1a1a'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontFamily: 'var(--sidebar-font)', fontSize: 13, color: msgType === 'success' ? '#4ade80' : '#f87171' }}>
              {msgType === 'success' ? '✓ ' : '✗ '}{msg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: 'var(--bg2)', padding: 6, borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {[
              { key: 'knowledge', label: `Knowledge Base (${kb.length})` },
              { key: 'contacts', label: `Contacts (${cts.length})` },
              { key: 'memory', label: `Memory (${mem.length})` },
              { key: 'team', label: `Team (${tm.length})` },
              { key: 'portal', label: 'Portal Settings' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, padding: '8px 18px', borderRadius: 8, cursor: 'pointer', border: 'none', background: activeTab === tab.key ? 'var(--fg)' : 'transparent', color: activeTab === tab.key ? 'var(--bg)' : 'var(--fg3)', transition: 'all 0.15s', fontWeight: activeTab === tab.key ? 600 : 400 }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'knowledge' && (
            <div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Add knowledge</div>
                <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 16, fontFamily: 'var(--sidebar-font)' }}>Add pricing, FAQs, policies, services — anything your agent should know about your business.</p>
                <div style={{ background: 'var(--bg3)', border: '2px dashed var(--border2)', borderRadius: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, fontFamily: 'var(--sidebar-font)' }}>Upload a file</div>
                    <div style={{ fontSize: 12, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>TXT, CSV, or any text file</div>
                  </div>
                  <button onClick={() => kbFileRef.current?.click()} className="btn btn-outline" style={{ fontSize: 12, fontFamily: 'var(--sidebar-font)' }}>Choose file</button>
                  <input ref={kbFileRef} type="file" accept=".txt,.csv,.md" onChange={handleKbFileUpload} style={{ display: 'none' }} />
                </div>
                <div className="manage-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="label">Title *</label>
                    <input style={inputStyle} placeholder="e.g. Consultation Fee" value={newKb.title} onChange={e => setNewKb({ ...newKb, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select style={inputStyle} value={newKb.type} onChange={e => setNewKb({ ...newKb, type: e.target.value })}>
                      <option value="general">General</option>
                      <option value="pricing">Pricing</option>
                      <option value="faq">FAQ</option>
                      <option value="policy">Policy</option>
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Content *</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                    placeholder="e.g. Initial consultation is $250 for 30 minutes..."
                    value={newKb.content} onChange={e => setNewKb({ ...newKb, content: e.target.value })} />
                </div>
                <button onClick={saveKb} disabled={saving || !newKb.title || !newKb.content} className="btn btn-accent"
                  style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)', fontWeight: 600, opacity: (!newKb.title || !newKb.content) ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Add to Knowledge Base →'}
                </button>
              </div>

              {kb.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div className="empty-state-title" style={{ fontFamily: 'var(--sidebar-font)' }}>No knowledge added yet</div>
                  <div className="empty-state-desc" style={{ fontFamily: 'var(--sidebar-font)' }}>Add your pricing, services, and FAQs so your agent can answer customer questions accurately.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kb.map(k => (
                    <div key={k.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <span className="tag">{k.type as string}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--sidebar-font)' }}>{k.title as string}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.6, fontFamily: 'var(--sidebar-font)' }}>
                          {(k.content as string)?.slice(0, 120)}{(k.content as string)?.length > 120 ? '...' : ''}
                        </p>
                      </div>
                      <button onClick={() => deleteKb(k.id as string)} className="btn btn-danger btn-sm" style={{ flexShrink: 0, fontFamily: 'var(--sidebar-font)' }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Import from CSV</div>
                <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 16, fontFamily: 'var(--sidebar-font)' }}>Upload a CSV from your existing CRM or spreadsheet.</p>
                <div style={{ background: 'var(--bg3)', border: '2px dashed var(--border2)', borderRadius: 10, padding: '28px', textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, fontFamily: 'var(--sidebar-font)' }}>Upload your customer CSV file</div>
                  <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 20, fontFamily: 'var(--sidebar-font)' }}>Works with exports from any CRM, Google Sheets, or Excel</div>
                  <button onClick={() => fileInputRef.current?.click()} className="btn btn-accent" style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>Choose CSV file →</button>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
                </div>
              </div>

              {showPreview && csvPreview.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Map columns</div>
                  <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 20, fontFamily: 'var(--sidebar-font)' }}>Detected {csvHeaders.length} columns and {csvAllRows.length} rows.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {csvHeaders.map(header => (
                      <div key={header}>
                        <label className="label">{header}</label>
                        <select style={inputStyle} value={columnMap[header] || 'skip'} onChange={e => setColumnMap(prev => ({ ...prev, [header]: e.target.value }))}>
                          {contactFields.map(f => <option key={f} value={f}>{f === 'skip' ? '— Skip —' : f}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={importContacts} disabled={importing} className="btn btn-accent" style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>
                      {importing ? 'Importing...' : `Import all ${csvAllRows.length} contacts →`}
                    </button>
                    <button onClick={() => { setShowPreview(false); setCsvPreview([]); setCsvAllRows([]) }} className="btn btn-outline" style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add contact manually</div>
                <div className="manage-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="label">Name *</label><input style={inputStyle} placeholder="John Smith" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} /></div>
                  <div><label className="label">Email</label><input style={inputStyle} placeholder="john@example.com" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} /></div>
                  <div><label className="label">Phone</label><input style={inputStyle} placeholder="+1 234 567 8900" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} /></div>
                  <div><label className="label">Company</label><input style={inputStyle} placeholder="ABC Corp" value={newContact.company} onChange={e => setNewContact({ ...newContact, company: e.target.value })} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><label className="label">Notes</label><input style={inputStyle} placeholder="VIP client, prefers email..." value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} /></div>
                <button onClick={saveContact} disabled={saving} className="btn btn-accent" style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>{saving ? 'Saving...' : 'Add Contact →'}</button>
              </div>

              {cts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title" style={{ fontFamily: 'var(--sidebar-font)' }}>No contacts yet</div>
                  <div className="empty-state-desc" style={{ fontFamily: 'var(--sidebar-font)' }}>Import a CSV or add contacts manually above.</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', marginBottom: 12 }}>{cts.length} contacts · your agent knows all of them</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {cts.map(c => (
                      <div key={c.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sidebar-font)', fontSize: 16, fontWeight: 700, color: 'var(--fg2)' }}>{(c.name as string)?.[0]}</div>
                          <button onClick={() => deleteContact(c.id as string)} className="btn btn-danger btn-sm" style={{ fontSize: 10 }}>Remove</button>
                        </div>
                        <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{c.name as string}</div>
                        {c.company && <div style={{ fontSize: 12, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>{c.company as string}</div>}
                        {c.email && <div style={{ fontSize: 12, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>{c.email as string}</div>}
                        {c.phone && <div style={{ fontSize: 12, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>{c.phone as string}</div>}
                        {c.notes && <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 6, fontStyle: 'italic', fontFamily: 'var(--sidebar-font)' }}>{c.notes as string}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'memory' && (
            <div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.7, fontFamily: 'var(--sidebar-font)' }}>
                  These are facts your agent has learned automatically from conversations. It uses this memory in every response. Delete any that are incorrect.
                </p>
              </div>
              {mem.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title" style={{ fontFamily: 'var(--sidebar-font)' }}>No memories yet</div>
                  <div className="empty-state-desc" style={{ fontFamily: 'var(--sidebar-font)' }}>Chat with your agent and it will start remembering key information automatically.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mem.map(m => (
                    <div key={m.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <span className="tag" style={{ marginRight: 8 }}>{m.category as string}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--sidebar-font)' }}>{m.key as string}:</span>
                        <span style={{ fontSize: 13, color: 'var(--fg3)', marginLeft: 6, fontFamily: 'var(--sidebar-font)' }}>{m.value as string}</span>
                      </div>
                      <button onClick={() => deleteMemory(m.id as string)} className="btn btn-danger btn-sm" style={{ flexShrink: 0, fontSize: 11, fontFamily: 'var(--sidebar-font)' }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Invite team member</div>
                <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 16, fontFamily: 'var(--sidebar-font)' }}>Invite staff to use this agent. They can chat and run automations.</p>
                <div className="manage-team-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
                  <div><label className="label">Email address</label><input style={inputStyle} placeholder="staff@yourbusiness.com" value={newTeam.email} onChange={e => setNewTeam({ ...newTeam, email: e.target.value })} /></div>
                  <div><label className="label">Role</label><select style={{ ...inputStyle, width: 'auto' }} value={newTeam.role} onChange={e => setNewTeam({ ...newTeam, role: e.target.value })}><option value="member">Member</option><option value="admin">Admin</option></select></div>
                  <button onClick={inviteTeam} disabled={saving} className="btn btn-accent" style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>{saving ? 'Inviting...' : 'Invite →'}</button>
                </div>
              </div>
              {tm.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title" style={{ fontFamily: 'var(--sidebar-font)' }}>No team members yet</div>
                  <div className="empty-state-desc" style={{ fontFamily: 'var(--sidebar-font)' }}>Invite your staff above.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tm.map(t => (
                    <div key={t.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sidebar-font)', fontSize: 14, fontWeight: 700, color: 'var(--fg2)' }}>{(t.email as string)?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--sidebar-font)' }}>{t.email as string}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{t.role as string} · {t.status as string}</div>
                        </div>
                      </div>
                      <button onClick={() => removeTeam(t.id as string)} className="btn btn-danger btn-sm" style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'portal' && (
            <div>
              {/* Live preview */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Live preview</div>
                <div style={{ background: '#f9fafb', borderRadius: 12, padding: '32px 24px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: portalSettings.portal_color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', overflow: 'hidden', boxShadow: `0 8px 24px ${portalSettings.portal_color}44` }}>
                    {portalSettings.portal_avatar_url ? (
                      <img src={portalSettings.portal_avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: 32, color: '#0a0a0a' }}>{(agent.agent_name as string)?.[0]}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 22, color: '#111', marginBottom: 8 }}>
                    {portalSettings.portal_tagline || `Welcome to ${agent.business_name as string}`}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                    {portalSettings.portal_greeting || `Hi! I'm ${agent.agent_name as string}, the AI assistant for ${agent.business_name as string}.`}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: portalSettings.portal_color, borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>
                    Start chatting →
                  </div>
                </div>
              </div>

              {/* Avatar upload */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Agent avatar</div>
                <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 16, fontFamily: 'var(--sidebar-font)' }}>Upload a logo or photo to show on your customer portal instead of the letter icon.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: portalSettings.portal_color, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: `0 4px 12px ${portalSettings.portal_color}44` }}>
                    {portalSettings.portal_avatar_url ? (
                      <img src={portalSettings.portal_avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: 28, color: '#0a0a0a' }}>{(agent.agent_name as string)?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="btn btn-outline" style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)', marginBottom: 6 }}>
                      {uploadingAvatar ? 'Uploading...' : 'Upload image'}
                    </button>
                    <div style={{ fontSize: 12, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>PNG, JPG or GIF. Square images work best.</div>
                    {portalSettings.portal_avatar_url && (
                      <button onClick={() => setPortalSettings(prev => ({ ...prev, portal_avatar_url: '' }))} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--sidebar-font)', padding: 0, marginTop: 4 }}>
                        Remove avatar
                      </button>
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </div>
              </div>

              {/* Brand color */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Brand color</div>
                <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 16, fontFamily: 'var(--sidebar-font)' }}>This color is used for buttons, accents, and the avatar background on your portal.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {PRESET_COLORS.map(color => (
                    <button key={color} onClick={() => setPortalSettings(prev => ({ ...prev, portal_color: color }))}
                      style={{ width: 32, height: 32, borderRadius: 8, background: color, border: portalSettings.portal_color === color ? '3px solid var(--fg)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.1s' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={portalSettings.portal_color} onChange={e => setPortalSettings(prev => ({ ...prev, portal_color: e.target.value }))}
                    style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border2)', cursor: 'pointer', padding: 2, background: 'var(--bg3)' }} />
                  <input style={{ ...inputStyle, width: 140, fontFamily: 'var(--mono)' }} value={portalSettings.portal_color} onChange={e => setPortalSettings(prev => ({ ...prev, portal_color: e.target.value }))} placeholder="#c8f135" />
                </div>
              </div>

              {/* Tagline and greeting */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Portal text</div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Tagline</label>
                  <input style={inputStyle} placeholder={`Welcome to ${agent.business_name as string}`} value={portalSettings.portal_tagline} onChange={e => setPortalSettings(prev => ({ ...prev, portal_tagline: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)', marginTop: 4 }}>The headline customers see on your portal homepage.</div>
                </div>
                <div>
                  <label className="label">Greeting message</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                    placeholder={`Hi! I'm ${agent.agent_name as string}, the AI assistant for ${agent.business_name as string}. How can I help you today?`}
                    value={portalSettings.portal_greeting} onChange={e => setPortalSettings(prev => ({ ...prev, portal_greeting: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)', marginTop: 4 }}>The first message customers see when they open the chat.</div>
                </div>
              </div>

              {/* Enable/disable */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Portal status</div>
                    <div style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>
                      {portalSettings.portal_enabled ? 'Your portal is live and accessible to customers.' : 'Your portal is disabled. Customers cannot access it.'}
                    </div>
                  </div>
                  <button onClick={() => setPortalSettings(prev => ({ ...prev, portal_enabled: !prev.portal_enabled }))}
                    style={{ width: 48, height: 26, borderRadius: 13, background: portalSettings.portal_enabled ? portalSettings.portal_color : 'var(--bg4)', border: '1px solid var(--border2)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: portalSettings.portal_enabled ? 26 : 4, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
              </div>

              <button onClick={savePortalSettings} disabled={savingPortal} className="btn btn-accent"
                style={{ fontSize: 14, height: 44, padding: '0 32px', fontFamily: 'var(--sidebar-font)', fontWeight: 600 }}>
                {savingPortal ? 'Saving...' : 'Save portal settings →'}
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .manage-content { padding: 16px !important; }
          .manage-form-grid { grid-template-columns: 1fr !important; }
          .manage-team-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}