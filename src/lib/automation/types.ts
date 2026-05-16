import type { AutomationTrigger } from "@prisma/client";

export type AutomationAction =
  | { type: "notify"; config: { userId?: string; role?: string; title: string; message: string; link?: string } }
  | { type: "email"; config: { template: string; toRole?: string } }
  | { type: "escalate"; config: { trigger: string } }
  | { type: "teams"; config: { title: string; message: string; link?: string } }
  | { type: "audit"; config: { action: string; entityType: string } }
  | { type: "lock_sheet"; config: Record<string, never> };

export type AutomationContext = {
  goalSheetId?: string;
  employeeId?: string;
  managerId?: string;
  cycleId?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
};

export type AutomationRuleInput = {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: Record<string, unknown>;
  actions: AutomationAction[];
  delayMinutes?: number;
  isActive?: boolean;
};
