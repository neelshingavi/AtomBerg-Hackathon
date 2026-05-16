/** Human-readable validation copy for forms */

export function weightageMessage(current: number, target = 100): string {
  const diff = target - current;
  if (diff === 0) {
    return "Total weightage is exactly 100%. You're ready to submit.";
  }
  if (diff > 0) {
    return `Total goal weightage must equal exactly ${target}%. You currently have ${current}% — add ${diff}% more across your goals.`;
  }
  return `Total goal weightage must equal exactly ${target}%. You currently have ${current}% — reduce by ${Math.abs(diff)}% to balance your sheet.`;
}

export function minGoalsMessage(count: number, min = 1): string {
  if (count >= min) return "";
  return `Add at least ${min} goal${min === 1 ? "" : "s"} before submitting. You have ${count} right now.`;
}

export function fieldRequired(label: string): string {
  return `${label} is required — please fill it in to continue.`;
}
