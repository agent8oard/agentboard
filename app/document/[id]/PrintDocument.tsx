'use client'

export default function PrintDocument({ doc }: { doc: Record<string, unknown> }) {
  const agent = doc.business_agents as Record<string, unknown>
  const metadata = doc.metadata as Record<string, unknown>

  const print = () => window.print()

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .document { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
        body { background: #f5f5f5; font-family: 'Georgia', serif; }
      `}</style>

      <div className="no-print" style={{ background: '#1a1a1a', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontFamily: 'sans-serif', fontSize: 14 }}>
          {agent?.business_name as string} — {doc.type as string}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.history.back()} style={{ background: 'transparent', border: '1px solid #444', color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 13 }}>← Back</button>
          <button onClick={print} style={{ background: '#c8f135', border: 'none', color: '#1a1a1a', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600 }}>Print / Save PDF</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px 80px' }}>
        <div className="document" style={{
          background: '#fff', padding: '60px 60px', boxShadow: '0 4px 40px rgba(0,0,0,0.1)',
          minHeight: '1000px', position: 'relative'
        }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, paddingBottom: 24, borderBottom: '2px solid #1a1a1a' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, marginBottom: 4 }}>{agent?.business_name as string}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{agent?.industry as string}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', letterSpacing: -1 }}>{doc.type as string}</div>
              {metadata?.invoiceNumber && (
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}># {metadata.invoiceNumber as string}</div>
              )}
            </div>
          </div>

          {/* Metadata row */}
          {(metadata?.date || metadata?.dueDate || metadata?.billTo) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
              {metadata?.billTo && (
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Bill To</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{metadata.billTo as string}</div>
                </div>
              )}
              {metadata?.date && (
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Date</div>
                  <div style={{ fontSize: 14 }}>{metadata.date as string}</div>
                </div>
              )}
              {metadata?.dueDate && (
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Due Date</div>
                  <div style={{ fontSize: 14 }}>{metadata.dueDate as string}</div>
                </div>
              )}
            </div>
          )}

          {/* Line items table */}
          {metadata?.lineItems && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '10px 0', fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '10px 0', fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '10px 0', fontSize: 11, fontFamily: 'sans-serif', color: '#999', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(metadata.lineItems as Record<string, unknown>[]).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '14px 0', fontSize: 14 }}>{item.description as string}</td>
                    <td style={{ padding: '14px 0', fontSize: 14, textAlign: 'center' }}>{item.qty as string}</td>
                    <td style={{ padding: '14px 0', fontSize: 14, textAlign: 'right' }}>${item.rate as string}</td>
                    <td style={{ padding: '14px 0', fontSize: 14, textAlign: 'right', fontWeight: 500 }}>${item.amount as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          {metadata?.total && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
              <div style={{ width: 260 }}>
                {metadata?.subtotal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                    <span style={{ color: '#666' }}>Subtotal</span>
                    <span>${metadata.subtotal as string}</span>
                  </div>
                )}
                {metadata?.tax && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                    <span style={{ color: '#666' }}>Tax</span>
                    <span>${metadata.tax as string}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 18, fontWeight: 700, borderTop: '2px solid #1a1a1a', marginTop: 8 }}>
                  <span>Total Due</span>
                  <span>${metadata.total as string}</span>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#333' }}>
            {doc.content as string}
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: 40, left: 60, right: 60, borderTop: '1px solid #eee', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#999', fontFamily: 'sans-serif' }}>{agent?.business_name as string}</span>
            <span style={{ fontSize: 12, color: '#999', fontFamily: 'sans-serif' }}>Generated by {agent?.agent_name as string}</span>
          </div>
        </div>
      </div>
    </>
  )
}