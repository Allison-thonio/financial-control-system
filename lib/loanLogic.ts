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
  maxTenure: 12, // User requested limit it at a year
  salaryCapMultiplier: 3
};

/**
 * Calculates the total repayment for a loan based on principal and tenure.
 */
export function calculateTotalRepayment(
  principal: number,
  tenureMonths: number,
  monthlySalary: number = 0,
  settings: SystemSettings = DEFAULT_SETTINGS
) {
  const r = settings.interestRate;

  // Custom logic for "Salary Advance" style requested by user
  // If principal > salary and tenure is flexible
  // First month: deduct entire salary, 0 interest.
  // Second month: 20% interest (10% from M1 + 10% from M2).

  // For standard calculations up to 12 months (simple interest)
  if (tenureMonths <= 12) {
    const interest = principal * r * tenureMonths;
    return {
      total: principal + interest,
      interest: interest,
      isReducing: false
    };
  } else {
    // Amortized for longer periods (though user said limit to 1 yr)
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

  const calculation = calculateTotalRepayment(maxPrincipal, targetTenure, monthlySalary, settings);

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
  monthlySalary: number = 0,
  settings: SystemSettings = DEFAULT_SETTINGS
): RepaymentStep[] {
  const schedule: RepaymentStep[] = [];
  let remainingPrincipal = principal;
  const r = settings.interestRate;

  // Check if we should use the "Salary Take" logic (common for short term high amount)
  const isSalaryTakeLogic = monthlySalary > 0 && principal > monthlySalary && tenureMonths <= 12;

  if (isSalaryTakeLogic) {
    let accumulatedInterest = 0;

    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);

      let principalPaid = 0;
      let interestPaid = 0;

      if (i === 1) {
        // Month 1: Take entire salary as principal
        principalPaid = Math.min(monthlySalary, remainingPrincipal);
        interestPaid = 0;
        accumulatedInterest += principal * r; // Interest for month 1 rolls over
      } else if (i === 2) {
        // Month 2: Take 20% interest + remaining or installment
        interestPaid = accumulatedInterest + (principal * r);
        accumulatedInterest = 0;
        // Remaining principal divided by remaining tenure
        principalPaid = remainingPrincipal / (tenureMonths - 1);
      } else {
        // Subsequent months: 10% interest + principal installment
        interestPaid = principal * r;
        principalPaid = remainingPrincipal / (tenureMonths - (i - 1));
      }

      remainingPrincipal -= principalPaid;
      if (i === tenureMonths) remainingPrincipal = 0;

      schedule.push({
        month: dueDate.getMonth(),
        year: dueDate.getFullYear(),
        principal: Math.round(principalPaid),
        interest: Math.round(interestPaid),
        total: Math.round(principalPaid + interestPaid),
        remainingBalance: Math.max(0, Math.round(remainingPrincipal))
      });
    }
    return schedule;
  }

  // Fallback to standard logic
  const { total, isReducing } = calculateTotalRepayment(principal, tenureMonths, monthlySalary, settings);
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

export function calculateProfit(loans: Array<{ amount: number, interest: number, status: string }>) {
  const disbursed = loans.reduce((sum, l) => sum + l.amount, 0);
  const expectedInterest = loans.reduce((sum, l) => sum + l.interest, 0);
  return {
    disbursed,
    expectedInterest,
    totalExpected: disbursed + expectedInterest
  };
}

