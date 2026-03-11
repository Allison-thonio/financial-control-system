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
 * Supports Standard (Monthly interest) and Salary Offset (Interest deferred to end).
 */
export function calculateTotalRepayment(
  principal: number,
  tenureMonths: number,
  monthlySalary: number = 0,
  settings: SystemSettings = DEFAULT_SETTINGS,
  isSalaryOffset: boolean = false
) {
  const r = settings.interestRate;

  // Total interest is always flat 10% per month of the original principal
  const totalInterest = principal * r * tenureMonths;
  const totalRepayment = principal + totalInterest;

  return {
    total: totalRepayment,
    interest: totalInterest,
    isReducing: false,
    monthlyPayment: totalRepayment / tenureMonths, // Helpful for Standard, varies for Offset
    isSalaryOffset
  };
}

export function calculateLoanCapacity(
  monthlySalary: number,
  currentOutstandingRepayment: number = 0,
  targetTenure: number = 3,
  settings: SystemSettings = DEFAULT_SETTINGS
): LoanCapacity {
  // Define DTI limits
  const isShortTermSalaryTake = targetTenure <= 3;
  const dtiLimit = isShortTermSalaryTake ? 1.0 : 0.40;

  const monthlyRepaymentLimit = monthlySalary * dtiLimit;
  const totalRepaymentBuffer = (monthlyRepaymentLimit * targetTenure) - currentOutstandingRepayment;
  const safeTotalBudget = Math.max(0, totalRepaymentBuffer);

  // Helper to check if a principal amounts fits within the budget
  const canAfford = (principal: number): boolean => {
    const { total } = calculateTotalRepayment(principal, targetTenure, monthlySalary, settings);
    return total <= safeTotalBudget;
  };

  // Binary Search for precise Max Principal
  // Lower bound 0, Upper bound: Budget (since Principal <= Total Repayment)
  // We can optimize upper bound: Total ~ Principal * (1 + rate), so Principal ~ Total / 1.0.
  // We use safeTotalBudget as a safe loose upper bound.
  let low = 0;
  let high = safeTotalBudget;
  let maxPrincipal = 0;

  // Search iterations (log2(10,000,000) is ~24 steps, so 30 is plenty for Naira values)
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    if (canAfford(mid)) {
      maxPrincipal = mid;
      low = mid;
    } else {
      high = mid;
    }
    if (high - low < 10) break; // Precision to nearest 10 Naira
  }

  // Also respect the hard Salary Cap Multiplier as a ceiling
  const capCeiling = monthlySalary * settings.salaryCapMultiplier;
  maxPrincipal = Math.min(maxPrincipal, capCeiling);

  const calculation = calculateTotalRepayment(maxPrincipal, targetTenure, monthlySalary, settings);

  return {
    maxPrincipal: Math.floor(maxPrincipal),
    totalRepaymentWithInterest: Math.floor(calculation.total),
    monthlyRepayment: Math.floor(calculation.total / targetTenure),
    remainingCapacity: Math.floor(monthlyRepaymentLimit),
  };
}

export function getDetailedRepaymentSchedule(
  principal: number,
  tenureMonths: number,
  startDate: Date,
  monthlySalary: number = 0,
  settings: SystemSettings = DEFAULT_SETTINGS,
  isSalaryOffset: boolean = false
): RepaymentStep[] {
  const schedule: RepaymentStep[] = [];
  const r = settings.interestRate;
  const totalInterest = principal * r * tenureMonths;

  let remainingPrincipal = principal;

  if (isSalaryOffset && monthlySalary > 0) {
    // Salary Offset Logic: Take full salary until the last month
    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);

      let principalPaid = 0;
      let interestPaid = 0;

      if (i < tenureMonths) {
        // Months 1 to (n-1): Pay full salary towards principal. 0 Interest.
        principalPaid = Math.min(monthlySalary, remainingPrincipal);
        interestPaid = 0;
      } else {
        // Final Month: Pay remaining principal + ALL accumulated interest.
        principalPaid = remainingPrincipal;
        interestPaid = totalInterest;
      }

      remainingPrincipal -= principalPaid;

      schedule.push({
        month: dueDate.getMonth(),
        year: dueDate.getFullYear(),
        principal: Math.round(principalPaid),
        interest: Math.round(interestPaid),
        total: Math.round(principalPaid + interestPaid),
        remainingBalance: Math.max(0, Math.round(remainingPrincipal))
      });
    }
  } else {
    // Standard Flat Logic
    const monthlyPrincipal = principal / tenureMonths;
    const monthlyInterest = principal * r;
    const monthlyTotal = monthlyPrincipal + monthlyInterest;

    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);

      remainingPrincipal -= monthlyPrincipal;
      if (i === tenureMonths) remainingPrincipal = 0;

      schedule.push({
        month: dueDate.getMonth(),
        year: dueDate.getFullYear(),
        principal: Math.round(monthlyPrincipal),
        interest: Math.round(monthlyInterest),
        total: Math.round(monthlyTotal),
        remainingBalance: Math.max(0, Math.round(remainingPrincipal))
      });
    }
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

