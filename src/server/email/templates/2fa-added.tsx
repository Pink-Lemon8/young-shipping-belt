import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

const TwoFactorActivatedEmail = ({
  name = 'Yuvraj',
  activationDate = 'March 6, 2025 at 12:07 PM CST',
  supportEmail = 'support@limelight.com',
  accountSettingsUrl = 'https://limelight.com/account/security'
}) => {
  return (
    <Html>
      <Head />
      <Preview>Two-Factor Authentication has been activated on your LimeLight account</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-[32px] mx-auto">
          <Container className="bg-white border border-gray-200 rounded-lg p-[32px] max-w-[600px] mx-auto">
            <Section className="mb-[32px]">
              <Img
                src="https://picsum.photos/600/100"
                alt="LimeLight"
                width="120"
                height="40"
                className="my-[16px] mx-auto"
              />
              <Heading className="text-gray-900 text-[24px] font-medium mb-[16px]">
                Two-Factor Authentication Activated
              </Heading>
              <Text className="text-gray-700 mb-[24px]">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-[24px]">
                This email confirms that two-factor authentication (2FA) has been successfully activated on your LimeLight account.
              </Text>

              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[24px] mb-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  <span className="font-medium">Activation Details:</span>
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Date and Time: {activationDate}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Method: Authenticator App
                </Text>
                <Text className="text-gray-700 mt-[16px] text-[13px]">
                  Your account is now protected with an additional layer of security. Each time you sign in, you'll need to provide a verification code from your authenticator app.
                </Text>
              </Section>

              <Text className="text-gray-700 mb-[16px]">
                <span className="font-medium">Important Security Tips:</span>
              </Text>
              <Text className="text-gray-700 mb-[8px]">
                • Keep your recovery codes in a safe place. You'll need them if you lose access to your authenticator app.
              </Text>
              <Text className="text-gray-700 mb-[8px]">
                • If you get a new device, remember to set up your authenticator app again.
              </Text>
              <Text className="text-gray-700 mb-[24px]">
                • Never share your 2FA codes with anyone, including LimeLight staff.
              </Text>

              <Text className="text-gray-700 mb-[24px]">
                You can manage your two-factor authentication settings at any time in your <Link href={accountSettingsUrl} className="text-black underline">account security settings</Link>.
              </Text>

              <Text className="text-gray-700 mb-[24px]">
                If you did not activate two-factor authentication on your account, please contact our support team immediately.
              </Text>

              <Text className="text-gray-700 mb-[8px]">
                Best regards,
              </Text>
              <Text className="text-gray-700 font-medium">
                The LimeLight Security Team
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px] text-[12px] text-gray-500">
              <Text>
                If you need assistance, please contact our support team at{' '}
                <Link href={`mailto:${supportEmail}`} className="text-black underline">
                  {supportEmail}
                </Link>
              </Text>
              <Text className="mt-[16px]">
                © {new Date().getFullYear()} LimeLight Inc. All rights reserved.
              </Text>
              <Text>
                123 Security Ave, Suite 200, San Francisco, CA 94103
              </Text>
              <Text>
                <Link href="https://limelight.com/privacy" className="text-black underline">
                  Privacy Policy
                </Link>{' '}
                •{' '}
                <Link href="https://limelight.com/terms" className="text-black underline">
                  Terms of Service
                </Link>{' '}
                •{' '}
                <Link href="https://limelight.com/unsubscribe" className="text-black underline">
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

TwoFactorActivatedEmail.PreviewProps = {
  name: 'Yuvraj',
  activationDate: 'March 6, 2025 at 12:07 PM CST',
  supportEmail: 'support@limelight.com',
  accountSettingsUrl: 'https://limelight.com/account/security'
};

export default TwoFactorActivatedEmail;