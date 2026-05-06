import * as React from 'react';
import {
  Body,
  Button,
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

const TwoFactorRemovedEmail = ({ 
  name = 'Yuvraj', 
  removalDate = 'March 6, 2025 at 12:15 PM CST',
  supportEmail = 'support@limelight.com',
  accountSettingsUrl = 'https://limelight.com/account/security',
  ipAddress = '192.168.1.1',
  deviceInfo = 'Chrome on macOS'
}) => {
  return (
    <Html>
      <Head />
      <Preview>Security Alert: Two-Factor Authentication has been removed from your LimeLight account</Preview>
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
                Two-Factor Authentication Removed
              </Heading>
              <Text className="text-gray-700 mb-[24px]">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-[24px]">
                This is a notification that two-factor authentication (2FA) has been removed from your LimeLight account. Your account is now secured by your password only.
              </Text>
              
              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[24px] mb-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  <span className="font-medium">Removal Details:</span>
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Date and Time: {removalDate}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • IP Address: {ipAddress}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Device: {deviceInfo}
                </Text>
              </Section>
              
              <Text className="text-gray-700 mb-[24px]">
                <span className="font-medium text-red-600">Important:</span> If you did not remove two-factor authentication from your account, please take immediate action:
              </Text>
              
              <Section className="mb-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  1. Change your password immediately
                </Text>
                <Text className="text-gray-700 mb-[8px]">
                  2. Re-enable two-factor authentication
                </Text>
                <Text className="text-gray-700 mb-[8px]">
                  3. Contact our support team
                </Text>
              </Section>
              
              <Button
                className="bg-black text-white rounded-lg py-[12px] px-[24px] text-[14px] font-medium no-underline text-center box-border"
                href={accountSettingsUrl}
              >
                Review Account Security
              </Button>
              
              <Text className="text-gray-700 mt-[24px] mb-[24px]">
                We strongly recommend re-enabling two-factor authentication to maintain the highest level of security for your account.
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

TwoFactorRemovedEmail.PreviewProps = {
  name: 'Yuvraj',
  removalDate: 'March 6, 2025 at 12:15 PM CST',
  supportEmail: 'support@limelight.com',
  accountSettingsUrl: 'https://limelight.com/account/security',
  ipAddress: '192.168.1.1',
  deviceInfo: 'Chrome on macOS'
};

export default TwoFactorRemovedEmail;