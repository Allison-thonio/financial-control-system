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
  // SALARY ADVANCE SPECIAL LOGIC:
  // If tenure is short (<= 3 months) and it's a "Salary Take" scenario, 
  // we allow up to 90% of the total paycheck over that period to be used.

  const isShortTermSalaryTake = targetTenure <= 3;
  const dtiLimit = isShortTermSalaryTake ? 0.90 : 0.40;

  const monthlyRepaymentLimit = monthlySalary * dtiLimit;

  // Total repayment buffer available over the target tenure
  const totalRepaymentBuffer = (monthlyRepaymentLimit * targetTenure) - currentOutstandingRepayment;
  const safeTotalRepayment = Math.max(0, totalRepaymentBuffer);

  const r = settings.interestRate;
  let maxPrincipal = 0;

  if (isShortTermSalaryTake) {
    // Salary advance has special interest: 0% month 1, 20% on remaining in month 2.
    // Let's approximate effective interest at 20% of roughly half the principal.
    // P + (P - Salary)*0.2 = TotalRepayment
    // P + 0.2P - 0.2Salary = TotalRepayment
    // 1.2P = TotalRepayment + 0.2Salary
    // P = (TotalRepayment + 0.2*monthlySalary) / 1.2
    maxPrincipal = (safeTotalRepayment + (0.2 * monthlySalary)) / 1.2;
  } else {
    // Standard Simple Interest: P = TotalRepayment / (1 + r * tenure)
    maxPrincipal = safeTotalRepayment / (1 + (r * targetTenure));
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
  settings: SystemSettings = DEFAULT_SETTINGS
): RepaymentStep[] {
  const schedule: RepaymentStep[] = [];
  let remainingPrincipal = principal;
  const r = settings.interestRate;

  // Check if we should use the "Salary Take" logic (common for short term high amount)
  const isSalaryTakeLogic = monthlySalary > 0 && principal > monthlySalary && tenureMonths <= 12;

  if (isSalaryTakeLogic) {
    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getUTCMonth() + i);

      let principalPaid = 0;
      let interestPaid = 0;

      if (i === 1) {
        // Month 1: Take ENTIRE salary as principal. Interest is 0.
        principalPaid = Math.min(monthlySalary, remainingPrincipal);
        interestPaid = 0;
      } else if (i === 2) {
        // Month 2: Charge 20% interest on what was left after Month 1
        // remainingPrincipal at this point is precisely what was left.
        interestPaid = remainingPrincipal * 0.20;

        // Take as much principal as possible, or all if it's the last month.
        if (i === tenureMonths) {
          principalPaid = remainingPrincipal;
        } else {
          principalPaid = Math.min(monthlySalary - interestPaid, remainingPrincipal);
        }
      } else {
        // Month 3 and beyond: Fallback to standard 10% interest
        interestPaid = remainingPrincipal * r;
        if (i === tenureMonths) {
          principalPaid = remainingPrincipal;
        } else {
          principalPaid = Math.min(monthlySalary - interestPaid, remainingPrincipal);
        }
      }

      // Final month safety
      if (i === tenureMonths) {
        principalPaid = remainingPrincipal;
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

