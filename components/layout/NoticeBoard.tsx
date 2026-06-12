export default function NoticeBoard() {
  const notices = [
    '📢 Welcome to PremiumX Shop — The #1 Digital Account Marketplace in Bangladesh!',
    '🎉 New accounts added daily! Browse our latest Netflix, Instagram, Facebook listings!',
    '💳 Add balance via bKash, Nagad, or Rocket — instant approval!',
    '🛡️ 100% secure transactions with admin verification on every account.',
    '🔥 Sellers: Upload bulk accounts via Excel and get paid instantly upon approval!',
    '⚡ Support 24/7 — open a ticket anytime from your dashboard.',
  ]

  const text = notices.join('  •  ')

  return (
    <div className="notice-board">
      <div className="notice-board-inner">
        {text}
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {text}
      </div>
    </div>
  )
}
