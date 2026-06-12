'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TicketReplyForm({ ticketId, isAdmin }: { ticketId: string, isAdmin: boolean }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [closeTicket, setCloseTicket] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    await fetch(`/api/support/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, close: closeTicket }),
    })
    setMessage('')
    setCloseTicket(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        {isAdmin ? '👑 Reply as Support Team' : '💬 Add Reply'}
      </h3>
      <textarea
        className="input"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message here..."
        rows={4}
        required
        style={{ resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {isAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={closeTicket} onChange={e => setCloseTicket(e.target.checked)} />
            Close ticket after replying
          </label>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-gold" type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Sending...' : '📨 Send Reply'}
        </button>
      </div>
    </form>
  )
}
