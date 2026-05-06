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

interface OtpEmailProps {
  otp: string;
  name: string;
  expiryTime: string;
}

const OtpEmail = ({ otp = "", name = "", expiryTime = "" }: OtpEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your Parkway Shipping Application verification code is: {otp}
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
                Verify your identity
              </Heading>
              <Text className="text-gray-700 mb-[24px]">Hi {name},</Text>
              <Text className="text-gray-700 mb-[24px]">
                We received a request to access your Parkway Shipping
                Application account. Enter the following verification code to
                complete the authentication process:
              </Text>

              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[24px] text-center mb-[24px]">
                <Text className="text-[32px] font-bold tracking-[4px] text-gray-900">
                  {otp}
                </Text>
              </Section>

              <Text className="text-gray-700 mb-[8px]">
                This code will expire in {expiryTime}.
              </Text>

              <Text className="text-gray-700 mb-[24px]">
                If you didn't request this code, please ignore this email or
                contact our support team if you have concerns about your account
                security.
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px] text-[12px] text-gray-500">
              <Text>
                This is an automated message, please do not reply to this email.
              </Text>
              <Text>
                If you need assistance, please contact our support team at{" "}
                <Link
                  href="mailto:support@parkwayshipping.ca"
                  className="text-black underline"
                >
                  support@parkwayshipping.ca
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

export default OtpEmail;
