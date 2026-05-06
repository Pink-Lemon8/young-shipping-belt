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

const PasskeyAddedEmail = ({ 
  name = 'Yuvraj', 
  addedDate = 'March 6, 2025 at 12:30 PM CST',
  supportEmail = 'support@limelight.com',
  accountSettingsUrl = 'https://limelight.com/account/security',
  deviceName = 'MacBook Pro',
  ipAddress = '192.168.1.1',
  browserInfo = 'Chrome 120 on macOS'
}) => {
  return (
    <Html>
      <Head />
      <Preview>Passkey successfully added to your LimeLight account</Preview>
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
                Passkey Added Successfully
              </Heading>
              <Text className="text-gray-700 mb-[24px]">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-[24px]">
                A new passkey has been successfully added to your LimeLight account. You can now use this passkey to sign in securely without entering your password.
              </Text>
              
              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[24px] mb-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  <span className="font-medium">Passkey Details:</span>
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Date Added: {addedDate}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Device: {deviceName}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Browser: {browserInfo}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • IP Address: {ipAddress}
                </Text>
              </Section>
              
              <Text className="text-gray-700 mb-[24px]">
                Passkeys provide a more secure and convenient way to sign in to your account. Instead of typing a password, you can use biometrics (like fingerprint or face recognition) or a device PIN to authenticate.
              </Text>
              
              <Text className="text-gray-700 mb-[24px]">
                <span className="font-medium">Benefits of using passkeys:</span>
              </Text>
              <Text className="text-gray-700 mb-[8px]">
                • Stronger security than traditional passwords
              </Text>
              <Text className="text-gray-700 mb-[8px]">
                • Protection against phishing attacks
              </Text>
              <Text className="text-gray-700 mb-[8px]">
                • Convenient sign-in across your devices
              </Text>
              <Text className="text-gray-700 mb-[24px]">
                • No passwords to remember
              </Text>
              
              <Button
                className="bg-black text-white rounded-lg py-[12px] px-[24px] text-[14px] font-medium no-underline text-center box-border"
                href={accountSettingsUrl}
              >
                Manage Your Passkeys
              </Button>
              
              <Text className="text-gray-700 mt-[24px] mb-[24px]">
                If you did not add this passkey to your account, please contact our support team immediately.
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

PasskeyAddedEmail.PreviewProps = {
  name: 'Yuvraj',
  addedDate: 'March 6, 2025 at 12:30 PM CST',
  supportEmail: 'support@limelight.com',
  accountSettingsUrl: 'https://limelight.com/account/security',
  deviceName: 'MacBook Pro',
  ipAddress: '192.168.1.1',
  browserInfo: 'Chrome 120 on macOS'
};

export default PasskeyAddedEmail;