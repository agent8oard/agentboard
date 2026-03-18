import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: 'We collect information you provide directly, including: account information (name, email, business name) when you register; content you add to your agents such as knowledge base entries, contacts, and documents; messages sent to and from your AI agent; and payment information if you subscribe to a paid plan. We also automatically collect usage data such as pages visited, features used, and IP address.',
    },
    {
      title: '2. How We Use Your Information',
      content: 'We use your information to: provide and operate the AgentBoard platform; process and respond to your messages and requests; send service-related communications such as account confirmations and notifications; improve and develop new features; ensure the security of our platform; and comply with legal obligations. We do not sell your personal data to third parties.',
    },
    {
      title: '3. Data You Own',
      content: 'You retain full ownership of all data you input into AgentBoard, including your contacts, knowledge base content, conversation history, documents, and agent configurations. We process this data only to provide the Service. You can export or delete your data at any time through your account settings.',
    },
    {
      title: '4. AI Processing',
      content: 'Messages sent to your AI agent are processed by Anthropic\'s Claude AI to generate responses. Anthropic does not use your data to train their models under our API agreement. Your messages are transmitted securely to Anthropic\'s API and are not stored by Anthropic beyond the processing of each request. You can review Anthropic\'s privacy policy at anthropic.com.',
    },
    {
      title: '5. Email Communications',
      content: 'Emails are sent via Resend, our email delivery provider. Your email content is processed only for the purpose of delivery. We send transactional emails (account confirmations, notifications) and, with your consent, product updates. You can unsubscribe from marketing emails at any time.',
    },
    {
      title: '6. Data Storage and Security',
      content: 'All data is stored in Supabase (PostgreSQL) with row-level security policies that ensure only you can access your data. We use industry-standard encryption in transit (TLS/HTTPS) and at rest. Access to production systems is strictly limited and logged. Despite our security measures, no system is 100% secure — we encourage you to use a strong, unique password.',
    },
    {
      title: '7. Third-Party Services',
      content: 'We use the following third-party services: Supabase (database and authentication), Anthropic (AI processing), Resend (email delivery), and Vercel (hosting). Each of these services has its own privacy policy. We choose providers that meet high standards for data protection.',
    },
    {
      title: '8. Cookies and Tracking',
      content: 'AgentBoard uses cookies and similar technologies to maintain your authentication session and remember your preferences. We do not use advertising cookies or sell browsing data. You can disable cookies in your browser settings, though this may affect your ability to use the Service.',
    },
    {
      title: '9. Data Retention',
      content: 'We retain your data for as long as your account is active. When you delete your account, all associated data is permanently deleted within 30 days, except where retention is required by law. Some anonymized aggregate usage data may be retained for analytics purposes.',
    },
    {
      title: '10. Your Rights',
      content: 'Depending on your location, you may have rights including: access to your personal data; correction of inaccurate data; deletion of your data ("right to be forgotten"); portability of your data; and objection to certain processing. To exercise these rights, use the data export and account deletion features in Settings, or contact us directly.',
    },
    {
      title: '11. Children\'s Privacy',
      content: 'AgentBoard is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe we have collected data from a minor, please contact us immediately.',
    },
    {
      title: '12. Changes to This Policy',
      content: 'We may update this Privacy Policy periodically. We will notify you of material changes by email or through the platform. Your continued use of AgentBoard after changes take effect constitutes acceptance of the updated policy.',
    },
    {
      title: '13. Contact Us',
      content: 'If you have questions about this Privacy Policy or how we handle your data, please contact us through your account dashboard or reach out to our support team. We aim to respond to all privacy inquiries within 5 business days.',
    },
  ]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 400, marginBottom: 12 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Last updated: March 2025</p>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 40, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
          Your privacy matters to us. AgentBoard is built on the principle that your data belongs to you. This policy explains what data we collect, how we use it, and how you can control it.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map(s => (
            <div key={s.title}>
              <h2 style={{ fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{s.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>{s.content}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 48, paddingTop: 32, display: 'flex', gap: 20, fontSize: 13 }}>
          <Link href="/legal/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms of Service →</Link>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </>
  )
}
