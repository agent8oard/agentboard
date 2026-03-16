'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  in_progress: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
}

export default function OrdersClient({ agent, orders }: {
  agent: Record<string, unknown>
  orders: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [allOrders, setAllOrders] = useState(orders)
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [updating, setUpdating] = useState(false)

  const statuses = ['ALL', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
  const filtered = filter === 'ALL' ? allOrders : allOrders.filter(o => o.status === filter)

  const totalRevenue = allOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.total as number), 0)

  const pendingValue = allOrders
    .filter(o => ['pending', 'confirmed', 'in_progress'].includes(o.status as string))
    .reduce((sum, o) => sum + (o.total as number), 0)

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setAllOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    setUpdating(false)
  }

  const deleteOrder = async (id: string) => {
    await supabase.from('orders').delete().eq('id', id)
    setAllOrders(prev => prev.filter(o => o.id !== id))
    setSelected(null)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="app-layout">
      <Sidebar />

      {selected && (
        <div className="modal-overlay">
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 16, width: '100%', maxWidth: 600,
            maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  {selected.order_number as string}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                  {formatDate(selected.created_at as string)}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-outline btn-sm">Close</button>
            </div>

            <div style={{ padding: '24px' }}>

              {/* Client */}
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Client</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--sidebar-font)', marginBottom: 4 }}>
                  {selected.client_name as string}
                </div>
                {selected.client_email && (
                  <div style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>{selected.client_email as string}</div>
                )}
                {selected.client_phone && (
                  <div style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>{selected.client_phone as string}</div>
                )}
              </div>

              {/* Status */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id as string, s)} disabled={updating}
                      style={{
                        fontFamily: 'var(--sidebar-font)', fontSize: 12, padding: '6px 14px',
                        borderRadius: 6, border: `1px solid ${STATUS_COLORS[s]}44`,
                        background: selected.status === s ? `${STATUS_COLORS[s]}22` : 'transparent',
                        color: selected.status === s ? STATUS_COLORS[s] : 'var(--fg3)',
                        cursor: 'pointer', fontWeight: selected.status === s ? 700 : 400,
                        transition: 'all 0.1s',
                      }}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Items</div>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px', padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg4)' }}>
                    {['Description', 'Qty', 'Price', 'Total'].map(h => (
                      <div key={h} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
                    ))}
                  </div>
                  {((selected.items as any[]) || []).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px', padding: '10px 16px', borderBottom: i < (selected.items as any[]).length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)', fontWeight: 500 }}>{item.description}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--mono)' }}>{item.quantity}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--mono)' }}>{formatCurrency(item.unit_price)}</div>
                      <div style={{ fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 600 }}>{formatCurrency(item.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                {[
                  { label: 'Subtotal', value: selected.subtotal as number },
                  ...(selected.delivery as number > 0 ? [{ label: 'Delivery', value: selected.delivery as number }] : []),
                  ...(selected.discount as number > 0 ? [{ label: 'Discount', value: -(selected.discount as number) }] : []),
                  ...(selected.tax as number > 0 ? [{ label: 'Tax', value: selected.tax as number }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>
                    <span>{row.label}</span>
                    <span style={{ fontFamily: 'var(--mono)' }}>{formatCurrency(row.value)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 8, borderTop: '1px solid var(--border)', fontSize: 18, fontWeight: 700, fontFamily: 'var(--sidebar-font)' }}>
                  <span>Total</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{formatCurrency(selected.total as number)}</span>
                </div>
              </div>

              {selected.due_date && (
                <div style={{ padding: '10px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20, fontFamily: 'var(--sidebar-font)', fontSize: 13, color: 'var(--fg3)' }}>
                  Due: <strong style={{ color: 'var(--fg)' }}>{formatDate(selected.due_date as string)}</strong>
                </div>
              )}

              {selected.notes && (
                <div style={{ padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--fg2)', fontFamily: 'var(--sidebar-font)', lineHeight: 1.6 }}>
                  {selected.notes as string}
                </div>
              )}

              <button onClick={() => deleteOrder(selected.id as string)} className="btn btn-danger" style={{ width: '100%', fontFamily: 'var(--sidebar-font)', fontWeight: 600 }}>
                Delete order
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <div className="app-header">
          <button onClick={() => router.push(`/agent/${agent.id as string}`)} className="btn btn-ghost btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border2)' }} />
          <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 14, fontWeight: 600 }}>Orders</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{agent.business_name as string}</span>
        </div>

        <div style={{ width: '100%', padding: '40px 48px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total orders', value: allOrders.length, color: 'var(--accent)' },
              { label: 'Completed revenue', value: formatCurrency(totalRevenue), color: 'var(--green)' },
              { label: 'Pipeline value', value: formatCurrency(pendingValue), color: 'var(--blue)' },
              { label: 'Pending', value: allOrders.filter(o => o.status === 'pending').length, color: 'var(--yellow)' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', marginBottom: 8, fontWeight: 500 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: 'var(--sidebar-font)' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  fontFamily: 'var(--sidebar-font)', fontSize: 12, padding: '6px 14px',
                  borderRadius: 6, border: '1px solid var(--border2)', cursor: 'pointer',
                  background: filter === s ? 'var(--fg)' : 'transparent',
                  color: filter === s ? 'var(--bg)' : 'var(--fg3)',
                  fontWeight: filter === s ? 600 : 400, transition: 'all 0.1s',
                }}>
                {s === 'ALL'
                  ? `All (${allOrders.length})`
                  : `${s.replace('_', ' ')} (${allOrders.filter(o => o.status === s).length})`}
              </button>
            ))}
          </div>

          {/* Orders table */}
          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <div className="empty-state-title" style={{ fontFamily: 'var(--sidebar-font)' }}>No orders yet</div>
                <div className="empty-state-desc" style={{ fontFamily: 'var(--sidebar-font)' }}>
                  Ask your agent to create an order record and it will appear here.
                </div>
                <button
                  onClick={() => router.push(`/agent/${agent.id as string}`)}
                  className="btn btn-accent"
                  style={{ fontFamily: 'var(--sidebar-font)', fontWeight: 600 }}>
                  Go to agent →
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Order</th>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Client</th>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Status</th>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Items</th>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Total</th>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Due</th>
                    <th style={{ fontFamily: 'var(--sidebar-font)' }}>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.id as string} style={{ cursor: 'pointer' }} onClick={() => setSelected(order)}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>
                          {order.order_number as string}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--sidebar-font)', color: 'var(--fg)' }}>
                          {order.client_name as string}
                        </div>
                        {order.client_email && (
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                            {order.client_email as string}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--sidebar-font)', fontSize: 11, padding: '3px 10px',
                          borderRadius: 20, fontWeight: 600,
                          background: `${STATUS_COLORS[order.status as string] || '#6b7280'}18`,
                          color: STATUS_COLORS[order.status as string] || '#6b7280',
                          border: `1px solid ${STATUS_COLORS[order.status as string] || '#6b7280'}33`,
                        }}>
                          {(order.status as string).replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)' }}>
                        {((order.items as any[]) || []).length} item{((order.items as any[]) || []).length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCurrency(order.total as number)}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                        {order.due_date ? formatDate(order.due_date as string) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)', whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at as string)}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(order)} className="btn btn-outline btn-sm" style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11 }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}