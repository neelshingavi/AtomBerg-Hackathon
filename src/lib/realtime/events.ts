import { prisma } from "@/lib/prisma";

const VERSION_KEY = "realtime_version";
const LAST_EVENT_KEY = "realtime_last_event";

/** Bump global realtime cursor so clients invalidate caches. */
export async function bumpRealtimeVersion(event?: string) {
  const existing = await prisma.systemConfig.findUnique({
    where: { key: VERSION_KEY },
  });
  const next = String(Number(existing?.value ?? "0") + 1);

  await prisma.$transaction([
    prisma.systemConfig.upsert({
      where: { key: VERSION_KEY },
      create: {
        key: VERSION_KEY,
        value: next,
        description: "Realtime invalidation cursor",
      },
      update: { value: next },
    }),
    ...(event
      ? [
          prisma.systemConfig.upsert({
            where: { key: LAST_EVENT_KEY },
            create: { key: LAST_EVENT_KEY, value: event },
            update: { value: event },
          }),
        ]
      : []),
  ]);

  return next;
}

export async function getRealtimeVersion() {
  const row = await prisma.systemConfig.findUnique({
    where: { key: VERSION_KEY },
  });
  return row?.value ?? "0";
}
