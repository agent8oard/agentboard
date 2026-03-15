import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TasksPage() {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Task Board</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/tasks/new" style={{ background: '#000', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
            + Post Task
          </Link>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>← Home</Link>
        </div>
      </div>

      {tasks?.length === 0 && (
        <p style={{ color: '#666' }}>No open tasks yet. Post the first one!</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tasks?.map(task => (
          <div key={task.id} style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, background: '#f3f3f3', display: 'inline-block', padding: '3px 10px', borderRadius: 20, marginBottom: 10 }}>
                {task.category}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{task.title}</h2>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>{task.description}</p>
            </div>
            <div style={{ textAlign: 'right', marginLeft: 24, flexShrink: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>${task.budget}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{task.proposal_count} proposals</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}