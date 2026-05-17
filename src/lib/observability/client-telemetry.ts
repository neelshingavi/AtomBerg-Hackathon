type TelemetryEvent = {
  name: string;
  path?: string;
  metadata?: Record<string, unknown>;
  ts: string;
};

const buffer: TelemetryEvent[] = [];
const MAX = 50;

export function trackClientEvent(
  name: string,
  metadata?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  buffer.push({
    name,
    path: window.location.pathname,
    metadata,
    ts: new Date().toISOString(),
  });
  if (buffer.length > MAX) buffer.shift();
}

export function getClientTelemetryBuffer() {
  return [...buffer];
}
