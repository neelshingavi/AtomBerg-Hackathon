export interface WeightageValidationResult {
  isValid: boolean;
  errors: string[];
  totalWeightage: number;
  remaining: number;
}

export function validateWeightage(
  goals: Array<{ weightage: number; title: string }>
): WeightageValidationResult {
  const errors: string[] = [];
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const remaining = 100 - totalWeightage;

  if (goals.length > 8) {
    errors.push(`Maximum 8 goals allowed. You have ${goals.length}.`);
  }

  const underweighted = goals.filter((g) => g.weightage < 10);
  underweighted.forEach((g) => {
    errors.push(`Goal "${g.title}" has ${g.weightage}% weightage. Minimum is 10%.`);
  });

  const overweighted = goals.filter((g) => g.weightage > 100);
  overweighted.forEach((g) => {
    errors.push(`Goal "${g.title}" cannot have more than 100% weightage.`);
  });

  return {
    isValid: errors.length === 0,
    errors,
    totalWeightage,
    remaining,
  };
}

export function validateSubmission(
  goals: Array<{ weightage: number; title: string }>
): WeightageValidationResult {
  const base = validateWeightage(goals);
  const errors = [...base.errors];

  if (goals.length === 0) {
    errors.push("You must add at least 1 goal before submitting.");
  }

  if (Math.abs(base.totalWeightage - 100) > 0.01) {
    errors.push(
      `Total weightage must be exactly 100%. Currently: ${base.totalWeightage.toFixed(1)}%.`
    );
  }

  return { ...base, isValid: errors.length === 0, errors };
}
