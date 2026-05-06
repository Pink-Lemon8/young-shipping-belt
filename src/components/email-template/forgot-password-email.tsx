import { BaseEmailTemplate } from './base-email-template'

interface EmailTemplateProps {
  data: any;
}

export const ForgotPasswordEmail: React.FC<Readonly<EmailTemplateProps>> = ({
  data,
}) => {
  return <BaseEmailTemplate title="Reset Your Meds Canada Password" patientName={data.name}>
    <p style={{ marginBottom: '16px' }}>
      We received a request to reset the password for your Meds Canada account. Your security is important to us, and we want to ensure that only you have access to your personal health information.
    </p>
    <p style={{ marginBottom: '16px' }}>
      To reset your password, please click the secure link below:
    </p>
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      <a href={`${process.env.APP_URL}/forgot-password/${data.code}`} style={{
        backgroundColor: '#163300',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        display: 'inline-block'
      }}>
        Reset Password
      </a>
    </div>
    <p style={{ marginBottom: '16px' }}>
      For your security, this link will expire in 24 hours. If you did not request a password reset, please disregard this email or contact our support team immediately.
    </p>
    <p style={{ marginBottom: '16px' }}>
      As a reminder, to keep your account secure:
    </p>
    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '16px' }}>
      <li>Use a strong, unique password</li>
      <li>Never share your login credentials</li>
      <li>Be cautious of phishing attempts</li>
    </ul>
    <p style={{ marginBottom: '16px' }}>
      If you need any assistance or have concerns about your account security, our dedicated support team is available to help you.
    </p>
  </BaseEmailTemplate>
}