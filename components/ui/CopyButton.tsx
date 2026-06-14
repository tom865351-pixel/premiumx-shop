'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <button
      type="button"
      className={`btn ${copied ? 'btn-gold' : 'btn-outline'}`}
      style={{ whiteSpace: 'nowrap' }}
      onClick={handleCopy}
    >
      {copied ? 'Copied' : 'Copy Link'}
    </button>
  )
}
