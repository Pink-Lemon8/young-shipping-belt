import * as React from "react";
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
} from "@react-email/components";

type TwoFactorEnableEmailProps = {
  name: string;
  verificationCode: string;
  expiryTime: string;
  supportEmail: string;
  requestTime: string;
  ipAddress: string;
  deviceInfo: string;
};

const TwoFactorEnableEmail = ({
  name = "",
  verificationCode = "",
  expiryTime = "",
  supportEmail = "",
  requestTime = "",
  ipAddress = "",
  deviceInfo = "",
}: TwoFactorEnableEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your verification code for enabling two-factor authentication:{" "}
        {verificationCode}
      </Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans my-[32px] mx-auto">
          <Container className="bg-white border border-gray-200 rounded-lg p-[32px] max-w-[600px] mx-auto">
            <Section className="mb-[32px]">
              <Img
                src="https://picsum.photos/600/100"
                alt="Parkway Shipping"
                width="120"
                height="40"
                className="my-[16px] mx-auto"
              />
              <Heading className="text-gray-900 text-[24px] font-medium mb-[16px]">
                Verify Two-Factor Authentication Setup
              </Heading>
              <Text className="text-gray-700 mb-[24px]">Hello {name},</Text>
              <Text className="text-gray-700 mb-[24px]">
                We received a request to enable two-factor authentication (2FA)
                on your Parkway Shipping Application account. To verify your
                identity and complete this security setup, please use the
                verification code below:
              </Text>

              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[24px] text-center mb-[24px]">
                <Text className="text-[32px] font-bold tracking-[4px] text-gray-900">
                  {verificationCode}
                </Text>
              </Section>

              <Text className="text-gray-700 mb-[8px]">
                This code will expire in {expiryTime}.
              </Text>

              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[16px] mb-[24px] mt-[24px]">
                <Text className="text-gray-700 mb-[8px]">
                  <span className="font-medium">Request Details:</span>
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Date and Time: {requestTime}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • IP Address: {ipAddress}
                </Text>
                <Text className="text-gray-700 mb-[4px]">
                  • Device: {deviceInfo}
                </Text>
              </Section>

              <Text className="text-gray-700 mb-[24px]">
                Once verified, you'll need to set up an authenticator app on
                your mobile device to generate codes for future sign-ins. This
                adds an important layer of security to your account.
              </Text>

              <Text className="text-gray-700 mb-[24px]">
                <span className="font-medium text-red-600">Important:</span> If
                you did not request to enable two-factor authentication, please
                ignore this email and contact our support team immediately.
              </Text>

              <Text className="text-gray-700 mb-[8px]">Best regards,</Text>
              <Text className="text-gray-700 font-medium">
                The Parkway Shipping Application Security Team
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px] text-[12px] text-gray-500">
              <Text>
                If you need assistance, please contact our support team at{" "}
                <Link
                  href={`mailto:${supportEmail}`}
                  className="text-black underline"
                >
                  {supportEmail}
                </Link>
              </Text>
              <Text className="mt-[16px]">
                © {new Date().getFullYear()} Parkway Shipping Inc. All rights
                reserved.
              </Text>
              {/* <Text>123 Security Ave, Suite 200, San Francisco, CA 94103</Text> */}
              {/* <Text>
                <Link
                  href="https://limelight.com/privacy"
                  className="text-black underline"
                >
                  Privacy Policy
                </Link>{" "}
                •{" "}
                <Link
                  href="https://limelight.com/terms"
                  className="text-black underline"
                >
                  Terms of Service
                </Link>{" "}
                •{" "}
                <Link
                  href="https://limelight.com/unsubscribe"
                  className="text-black underline"
                >
                  Unsubscribe
                </Link>
              </Text> */}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TwoFactorEnableEmail;
