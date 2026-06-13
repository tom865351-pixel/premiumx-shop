export default function NoticeBoard() {
  const notices = [
    'PremiumX wallet, submissions, withdrawals, and live sessions are now in one clean flow.',
    'Sellers can submit Instagram, Facebook, Gmail, TikTok and other stock for admin review.',
    'Live classes and support sessions appear in the Live page with direct join links.',
    'Wallet add money requests, pending holds, and withdrawal history are visible from one screen.',
    'Admin verifies every account and payout before balance changes are completed.',
  ]

  const text = notices.join('  -  ')

  return (
    <div className="notice-board">
      <div className="notice-board-inner">
        {text}
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {text}
      </div>
    </div>
  )
}
