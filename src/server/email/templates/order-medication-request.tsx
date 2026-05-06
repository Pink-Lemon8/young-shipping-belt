import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderMedicationRequestEmailProps {
  orderId: string;
  requestedBy: string;
  requestedByRole: string;
}

export const OrderMedicationRequestEmail = ({
  orderId,
  requestedBy,
  requestedByRole,
}: OrderMedicationRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>{`Add Drugs for Order #${orderId}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Add Drugs for Order</Heading>
        <Text style={text}>
          Please add drugs for the following order in Limelight system.
        </Text>

        <Section style={section}>
          <Text style={label}>Order ID:</Text>
          <Text style={value}>{`#${orderId}`}</Text>
        </Section>

        <Section style={section}>
          <Text style={label}>Requested By:</Text>
          <Text style={value}>
            {requestedBy} ({requestedByRole})
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrderMedicationRequestEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const section = {
  padding: "0 40px",
  marginTop: "20px",
};

const label = {
  color: "#666",
  fontSize: "14px",
  fontWeight: "bold",
  marginBottom: "4px",
};

const value = {
  color: "#333",
  fontSize: "16px",
  marginTop: "4px",
};
