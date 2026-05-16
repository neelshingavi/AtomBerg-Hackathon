import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

export default function EscalationAlert({
  recipientName,
  employeeName,
  triggerLabel,
  cycleName,
  daysThreshold,
  portalUrl,
}: {
  recipientName: string;
  employeeName: string;
  triggerLabel: string;
  cycleName: string;
  daysThreshold: number;
  portalUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Inter, sans-serif", background: "#f8fafc" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
          <Heading style={{ color: "#dc2626", fontSize: 24 }}>Escalation alert</Heading>
          <Text>Hi {recipientName},</Text>
          <Text>
            <strong>{employeeName}</strong> has exceeded the {daysThreshold}-day threshold for{" "}
            <strong>{triggerLabel}</strong> in cycle <strong>{cycleName}</strong>.
          </Text>
          <Section style={{ textAlign: "center", marginTop: 32 }}>
            <Button
              href={portalUrl}
              style={{
                background: "#dc2626",
                color: "white",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Open portal
            </Button>
          </Section>
          <Hr />
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"} — automated escalation
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
