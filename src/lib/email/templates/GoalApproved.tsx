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

export default function GoalApproved({
  employeeName,
  managerName,
  cycleName,
  goalsUrl,
}: {
  employeeName: string;
  managerName: string;
  cycleName: string;
  goalsUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Inter, sans-serif", background: "#f8fafc" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
          <Heading style={{ color: "#1e293b", fontSize: 24 }}>Goals approved</Heading>
          <Text>Hi {employeeName},</Text>
          <Text>
            <strong>{managerName}</strong> has approved your goal sheet for <strong>{cycleName}</strong>.
            Your goals are now locked. You can log quarterly achievements during each check-in window.
          </Text>
          <Section style={{ textAlign: "center", marginTop: 32 }}>
            <Button
              href={goalsUrl}
              style={{
                background: "#10b981",
                color: "white",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              View my goals
            </Button>
          </Section>
          <Hr />
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"} — automated notification
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
