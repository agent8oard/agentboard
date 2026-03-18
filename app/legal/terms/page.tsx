import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using AgentBoard ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. These terms apply to all users, including individuals and businesses.',
    },
    {
      title: '2. Description of Service',
      content: 'AgentBoard provides an AI-powered business automation platform that allows users to create and manage AI agents for customer communication, document generation, scheduling, and related business tasks. The Service is provided "as is" and we reserve the right to modify or discontinue features at any time.',
    },
    {
      title: '3. Account Registration',
      content: 'You must create an account to use AgentBoard. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must provide accurate and current information when registering. You must be at least 18 years old to use the Service.',
    },
    {
      title: '4. Acceptable Use',
      content: 'You agree not to use the Service to: (a) violate any applicable laws or regulations; (b) send spam or unsolicited communications; (c) impersonate any person or entity; (d) transmit harmful, offensive, or illegal content; (e) interfere with or disrupt the Service; (f) attempt to gain unauthorized access to any systems or data. We reserve the right to suspend accounts that violate these terms.',
    },
    {
      title: '5. AI-Generated Content',
      content: 'AgentBoard uses artificial intelligence to generate responses and documents. AI-generated content may contain errors or inaccuracies. You are solely responsible for reviewing, verifying, and using any AI-generated content. We make no warranty regarding the accuracy, completeness, or suitability of AI-generated content for any particular purpose.',
    },
    {
      title: '6. Data and Privacy',
      content: 'Your use of the Service is subject to our Privacy Policy. You retain ownership of all data you input into AgentBoard, including contacts, knowledge base content, and documents. By using the Service, you grant us a limited license to process your data solely for the purpose of providing the Service.',
    },
    {
      title: '7. Payment and Billing',
      content: 'AgentBoard currently offers a free tier. Any future paid plans will be governed by additional billing terms presented at the time of upgrade. All fees are non-refundable unless otherwise specified by applicable consumer protection law.',
    },
    {
      title: '8. Intellectual Property',
      content: 'AgentBoard and its underlying technology, design, and software are the exclusive property of AgentBoard and are protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service without express written permission.',
    },
    {
      title: '9. Limitation of Liability',
      content: 'To the maximum extent permitted by law, AgentBoard shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability for any claim arising from the Service shall not exceed the amount you paid us in the twelve months preceding the claim.',
    },
    {
      title: '10. Termination',
      content: 'You may terminate your account at any time through the Settings page. We may suspend or terminate your account for violation of these terms. Upon termination, your data will be deleted according to our data retention policy.',
    },
    {
      title: '11. Changes to Terms',
      content: 'We may update these Terms of Service from time to time. We will notify you of material changes by email or by posting a notice on the platform. Continued use of the Service after changes take effect constitutes acceptance of the updated terms.',
    },
    {
      title: '12. Governing Law',
      content: 'These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.',
    },
  ]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 400, marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Last updated: March 2025</p>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 40, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
          Please read these Terms of Service carefully before using AgentBoard. These terms constitute a legally binding agreement between you and AgentBoard.
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
          <Link href="/legal/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy →</Link>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </>
  )
}
