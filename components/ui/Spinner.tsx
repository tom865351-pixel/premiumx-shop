export default function Spinner({ size = 16, color = 'currentColor' }: { size?: number, color?: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes custom-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: 'custom-spin 1s linear infinite', display: 'inline-block', verticalAlign: 'middle' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
    </>
  )
}
