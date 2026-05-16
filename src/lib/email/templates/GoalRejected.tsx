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

export default function GoalRejected({
  employeeName,
  managerName,
  managerNote,
  reworkUrl,
}: {
  employeeName: string;
  managerName: string;
  managerNote: string;
  reworkUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Inter, sans-serif", background: "#f8fafc" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
          <Heading style={{ color: "#1e293b", fontSize: 24 }}>Goals returned for rework</Heading>
          <Text>Hi {employeeName},</Text>
          <Text>
            <strong>{managerName}</strong> has returned your goal sheet for rework with the following
            note:
          </Text>
          <Text
            style={{
              background: "#fff7ed",
              borderLeft: "4px solid #f97316",
              padding: "12px 16px",
              color: "#9a3412",
            }}
          >
            {managerNote}
          </Text>
          <Section style={{ textAlign: "center", marginTop: 32 }}>
            <Button
              href={reworkUrl}
              style={{
                background: "#4f6ef7",
                color: "white",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Edit goal sheet
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
