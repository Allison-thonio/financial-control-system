export interface LoanCapacity {
  maxPrincipal: number;
  totalRepaymentWithInterest: number;
  monthlyRepayment: number;
  remainingCapacity: number;
}

export interface RepaymentStep {
  month: number;
  year: number;
  principal: number;
  interest: number;
  total: number;
  remainingBalance: number;
}

export interface SystemSettings {
  interestRate: number;
  maxTenure: number;
  salaryCapMultiplier: number;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  interestRate: 0.1, // 10%
  maxTenure: 24,
  salaryCapMultiplier: 3
};

/**
 * Calculates the total repayment for a loan based on principal and tenure.
 */
export function calculateTotalRepayment(principal: number, tenureMonths: number, settings: SystemSettings = DEFAULT_SETTINGS) {
  const r = settings.interestRate;
  if (tenureMonths <= 12) {
    const interest = principal * r * tenureMonths;
    return {
      total: principal + interest,
      interest: interest,
      isReducing: false
    };
  } else {
    // Reducing Balance Calculation (Amortization)
    const n = tenureMonths;
    const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = monthlyPayment * n;
    return {
      total: total,
      interest: total - principal,
      isReducing: true,
      monthlyPayment: monthlyPayment
    };
  }
}

export function calculateLoanCapacity(
  monthlySalary: number,
  currentOutstandingRepayment: number = 0,
  targetTenure: number = 3,
  settings: SystemSettings = DEFAULT_SETTINGS
): LoanCapacity {
  const totalCapacity = monthlySalary * settings.salaryCapMultiplier;
  const availableRepaymentCapacity = Math.max(0, totalCapacity - currentOutstandingRepayment);

  const r = settings.interestRate;
  let maxPrincipal = 0;
  if (targetTenure <= 12) {
    maxPrincipal = availableRepaymentCapacity / (1 + (r * targetTenure));
  } else {
    const n = targetTenure;
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * n;
    maxPrincipal = availableRepaymentCapacity / factor;
  }

  const calculation = calculateTotalRepayment(maxPrincipal, targetTenure, settings);

  return {
    maxPrincipal: Math.floor(maxPrincipal),
    totalRepaymentWithInterest: Math.floor(calculation.total),
    monthlyRepayment: Math.floor(calculation.total / targetTenure),
    remainingCapacity: Math.floor(availableRepaymentCapacity),
  };
}

export function getDetailedRepaymentSchedule(
  principal: number,
  tenureMonths: number,
  startDate: Date,
  settings: SystemSettings = DEFAULT_SETTINGS
): RepaymentStep[] {
  const schedule: RepaymentStep[] = [];
  let remainingPrincipal = principal;
  const r = settings.interestRate;

  const { total, isReducing } = calculateTotalRepayment(principal, tenureMonths, settings);
  const monthlyTotal = total / tenureMonths;

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);

    let interest = 0;
    let principalPaid = 0;

    if (!isReducing) {
      interest = (principal * r);
      principalPaid = principal / tenureMonths;
    } else {
      interest = remainingPrincipal * r;
      principalPaid = monthlyTotal - interest;
    }

    remainingPrincipal -= principalPaid;
    if (i === tenureMonths) remainingPrincipal = 0;

    schedule.push({
      month: dueDate.getMonth(),
      year: dueDate.getFullYear(),
      principal: Math.round(principalPaid),
      interest: Math.round(interest),
      total: Math.round(monthlyTotal),
      remainingBalance: Math.max(0, Math.round(remainingPrincipal))
    });
  }

  return schedule;
}
