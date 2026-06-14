import type { CSSProperties } from 'react'

type CategoryLogoProps = {
  icon?: string | null
  name?: string | null
  color?: string | null
  size?: number
  radius?: number
  className?: string
  style?: CSSProperties
}

function fallbackText(name?: string | null, icon?: string | null) {
  const label = icon && !isImageIcon(icon) ? icon : name
  return String(label || 'PX').trim().slice(0, 3).toUpperCase()
}

export function isImageIcon(icon?: string | null) {
  const value = String(icon || '').trim()
  return value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
}

export default function CategoryLogo({ icon, name, color, size = 44, radius = 10, className, style }: CategoryLogoProps) {
  const common: CSSProperties = {
    width: size,
    minWidth: size,
    height: size,
    borderRadius: radius,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    ...style,
  }

  if (isImageIcon(icon)) {
    return (
      <span className={className} style={common}>
        <img
          src={String(icon)}
          alt={`${name || 'Category'} logo`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </span>
    )
  }

  return (
    <span
      className={className}
      style={{
        ...common,
        background: color || 'linear-gradient(135deg,#0ea5e9,#9333ea)',
        color: '#fff',
        fontWeight: 900,
        fontSize: Math.max(11, Math.round(size * 0.34)),
      }}
    >
      {fallbackText(name, icon)}
    </span>
  )
}
