import * as React from "react";
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
} from "@react-email/components";

interface ResetPasswordEmailProps {
  name: string;
  resetToken: string;
  expiryTime: string;
}

const ResetPasswordEmail = ({
  name = "",
  resetToken = "",
  expiryTime = "",
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Parkway Pharmacy reset password link is ready</Preview>
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
                Reset your Parkway Shipping Application password
              </Heading>
              <Text className="text-gray-700 mb-[24px]">Hi {name},</Text>
              <Text className="text-gray-700 mb-[24px]">
                We received a request to reset the password for your Parkway
                Shipping Application account. Click the button below to securely
                reset your password:
              </Text>

              <Button
                className="bg-black text-white rounded-lg py-[12px] text-[14px] font-medium no-underline text-center box-border w-full"
                href={`${process.env.APP_URL}/forgot-password/${resetToken}`}
              >
                Reset your password
              </Button>

              <Text className="text-gray-700 mt-[24px] mb-[8px]">
                This link will expire in {expiryTime} and can only be used once.
              </Text>

              <Text className="text-gray-700 mb-[16px]">
                If the button doesn't work, you can copy and paste this URL into
                your browser:
              </Text>

              <Section className="bg-gray-50 rounded-lg border border-gray-200 p-[16px] mb-[24px]">
                <Text className="text-gray-700 text-[12px] break-all">
                  {`${process.env.APP_URL}/forgot-password/${resetToken}`}
                </Text>
              </Section>

              <Text className="text-gray-700 mb-[24px]">
                If you didn't request this link, please ignore this email or
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
                  href="https://parkwayshipping.ca/privacy"
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

export default ResetPasswordEmail;
