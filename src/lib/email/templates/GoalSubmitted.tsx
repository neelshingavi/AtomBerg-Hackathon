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

export default function GoalSubmitted({
  managerName,
  employeeName,
  reviewUrl,
}: {
  managerName: string;
  employeeName: string;
  reviewUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Inter, sans-serif", background: "#f8fafc" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
          <Heading style={{ color: "#1e293b", fontSize: 24 }}>
            Goal sheet submitted for review
          </Heading>
          <Text>Hi {managerName},</Text>
          <Text>
            <strong>{employeeName}</strong> has submitted their goal sheet for your review.
            Please respond within 5 working days.
          </Text>
          <Section style={{ textAlign: "center", marginTop: 32 }}>
            <Button
              href={reviewUrl}
              style={{
                background: "#4f6ef7",
                color: "white",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Review goal sheet
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
