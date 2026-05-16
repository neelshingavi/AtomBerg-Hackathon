import { Resend } from "resend";
import { render } from "@react-email/render";
import GoalSubmitted from "./templates/GoalSubmitted";
import GoalApproved from "./templates/GoalApproved";
import GoalRejected from "./templates/GoalRejected";
import CheckinReminder from "./templates/CheckinReminder";
import EscalationAlert from "./templates/EscalationAlert";

const FROM = process.env.EMAIL_FROM ?? "AtomGoal <noreply@localhost>";

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getClient();
  if (!resend) {
    console.info("[email] Skipped (RESEND_API_KEY not set):", params.subject, "→", params.to);
    return { skipped: true as const };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("[email] Send failed:", error);
    throw new Error(error.message);
  }

  return { id: data?.id, skipped: false as const };
}

const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendGoalSubmittedEmail(params: {
  managerEmail: string;
  managerName: string;
  employeeName: string;
  sheetId: string;
}) {
  const html = await render(
    GoalSubmitted({
      managerName: params.managerName,
      employeeName: params.employeeName,
      reviewUrl: `${appUrl()}/manager/approvals/${params.sheetId}`,
    })
  );
  return sendEmail({
    to: params.managerEmail,
    subject: `[Action Required] ${params.employeeName} submitted goals for review`,
    html,
  });
}

export async function sendGoalApprovedEmail(params: {
  employeeEmail: string;
  employeeName: string;
  managerName: string;
  cycleName: string;
  sheetId: string;
}) {
  const html = await render(
    GoalApproved({
      employeeName: params.employeeName,
      managerName: params.managerName,
      cycleName: params.cycleName,
      goalsUrl: `${appUrl()}/employee/goals/${params.sheetId}`,
    })
  );
  return sendEmail({
    to: params.employeeEmail,
    subject: "Your goals have been approved and locked",
    html,
  });
}

export async function sendGoalRejectedEmail(params: {
  employeeEmail: string;
  employeeName: string;
  managerName: string;
  managerNote: string;
  sheetId: string;
}) {
  const html = await render(
    GoalRejected({
      employeeName: params.employeeName,
      managerName: params.managerName,
      managerNote: params.managerNote,
      reworkUrl: `${appUrl()}/employee/goals/${params.sheetId}`,
    })
  );
  return sendEmail({
    to: params.employeeEmail,
    subject: "Your goals were returned for rework",
    html,
  });
}

export async function sendCheckInReminderEmail(params: {
  employeeEmail: string;
  employeeName: string;
  quarter: string;
  cycleName: string;
}) {
  const html = await render(
    CheckinReminder({
      employeeName: params.employeeName,
      quarter: params.quarter,
      cycleName: params.cycleName,
      checkinUrl: `${appUrl()}/employee/goals`,
    })
  );
  return sendEmail({
    to: params.employeeEmail,
    subject: `${params.quarter} check-in reminder — ${params.cycleName}`,
    html,
  });
}

export async function sendEscalationAlertEmail(params: {
  to: string;
  recipientName: string;
  employeeName: string;
  triggerLabel: string;
  cycleName: string;
  daysThreshold: number;
}) {
  const html = await render(
    EscalationAlert({
      recipientName: params.recipientName,
      employeeName: params.employeeName,
      triggerLabel: params.triggerLabel,
      cycleName: params.cycleName,
      daysThreshold: params.daysThreshold,
      portalUrl: appUrl(),
    })
  );
  return sendEmail({
    to: params.to,
    subject: `Escalation: ${params.triggerLabel} — ${params.employeeName}`,
    html,
  });
}
