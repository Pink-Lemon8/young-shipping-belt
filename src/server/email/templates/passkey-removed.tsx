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

const PasskeyRemovedEmail = ({ 
  name = 'Yuvraj', 
  removedDate = 'March 6, 2025 at 12:45 PM CST',
  supportEmail = 'support@limelight.com',
  accountSettingsUrl = 'https://limelight.com/account/security',
  deviceName = 'MacBook Pro',
  ipAddress = '192.168.1.1',
  browserInfo = 'Chrome 120 on macOS'
}) => {
  return (
    <Html>
      <Head />
      <Preview>Security Alert: Passkey removed from your LimeLight account</Preview>
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
                Passkey Removed
              </Heading>
              <Text className="text-gray-700 mb-[24px]">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-[24px]">
                This is a notification that a passkey has been removed from your LimeLight account.
              </Text>
              
              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[24px] mb-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  <span className="font-medium">Removal Details:</span>
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Date Removed: {removedDate}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Device Used: {deviceName}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Browser: {browserInfo}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • IP Address: {ipAddress}
                </Text>
              </Section>
              
              <Text className="text-gray-700 mb-[24px]">
                If you still have other passkeys registered, you can continue to use them to sign in to your account. If you've removed your last passkey, you'll need to use your password to sign in.
              </Text>
              
              <Text className="text-gray-700 mb-[24px]">
                <span className="font-medium text-red-600">Important:</span> If you did not remove this passkey from your account, please take immediate action:
              </Text>
              
              <Section className="mb-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  1. Review all passkeys and security settings
                </Text>
                <Text className="text-gray-700 mb-[8px]">
                  2. Change your password immediately
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
                We recommend maintaining at least one passkey for your account to ensure secure and convenient access.
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

PasskeyRemovedEmail.PreviewProps = {
  name: 'Yuvraj',
  removedDate: 'March 6, 2025 at 12:45 PM CST',
  supportEmail: 'support@limelight.com',
  accountSettingsUrl: 'https://limelight.com/account/security',
  deviceName: 'MacBook Pro',
  ipAddress: '192.168.1.1',
  browserInfo: 'Chrome 120 on macOS'
};

export default PasskeyRemovedEmail;