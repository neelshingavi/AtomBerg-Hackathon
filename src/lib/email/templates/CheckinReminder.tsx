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

export default function CheckinReminder({
  employeeName,
  quarter,
  cycleName,
  checkinUrl,
}: {
  employeeName: string;
  quarter: string;
  cycleName: string;
  checkinUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Inter, sans-serif", background: "#f8fafc" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
          <Heading style={{ color: "#1e293b", fontSize: 24 }}>
            {quarter} check-in reminder
          </Heading>
          <Text>Hi {employeeName},</Text>
          <Text>
            The <strong>{quarter}</strong> achievement window for <strong>{cycleName}</strong> is
            open. Please log your progress before the window closes.
          </Text>
          <Section style={{ textAlign: "center", marginTop: 32 }}>
            <Button
              href={checkinUrl}
              style={{
                background: "#4f6ef7",
                color: "white",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Update achievements
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
