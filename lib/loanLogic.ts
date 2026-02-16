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
  const isSalaryTakeLogic = monthlySalary > 0 && principal > monthlySalary && tenureMonths <= 12;

  if (isSalaryTakeLogic) {
    let remainingPrincipal = principal;
    let totalInterest = 0;

    // Simulate the schedule to get accurate total
    for (let i = 1; i <= tenureMonths; i++) {
      let interest = 0;
      let principalPaid = 0;

      if (i === 1) {
        // Month 1: deduct entire salary (up to principal), 0 interest.
        principalPaid = Math.min(monthlySalary, remainingPrincipal);
        interest = 0;
      } else if (i === 2) {
        // Month 2: 20% interest on remaining
        interest = remainingPrincipal * 0.20;
        // Assume we pay as much as possible
        const paymentTowardsPrincipal = Math.max(0, monthlySalary - interest);
        principalPaid = Math.min(paymentTowardsPrincipal, remainingPrincipal);
      } else {
        // Month 3+: Standard logical fallback
        interest = remainingPrincipal * r;
        const paymentTowardsPrincipal = Math.max(0, monthlySalary - interest);
        principalPaid = Math.min(paymentTowardsPrincipal, remainingPrincipal);
      }

      totalInterest += interest;
      remainingPrincipal -= principalPaid;

      if (remainingPrincipal <= 0) break;
    }

    // If there's still balance after tenure (if salary was too low), 
    // strictly speaking the loan failed the parameters, but we just return cost here.
    const total = principal + totalInterest;

    return {
      total: total,
      interest: totalInterest,
      isReducing: true,
      monthlyPayment: total / tenureMonths
    };

  } else if (tenureMonths <= 12) {
    // Standard Simple Interest
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
  settings: SystemSettings = DEFAULT_SETTINGS
): RepaymentStep[] {
  const schedule: RepaymentStep[] = [];
  let remainingPrincipal = principal;
  const r = settings.interestRate;

  // Check if we should use the "Salary Take" logic
  const isSalaryTakeLogic = monthlySalary > 0 && principal > monthlySalary && tenureMonths <= 12;

  if (isSalaryTakeLogic) {
    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i);

      let principalPaid = 0;
      let interestPaid = 0;

      if (i === 1) {
        // Month 1: Take ENTIRE salary as principal. Interest is 0.
        principalPaid = Math.min(monthlySalary, remainingPrincipal);
        interestPaid = 0;
      } else if (i === 2) {
        // Month 2: Charge 20% interest on what was left after Month 1
        interestPaid = remainingPrincipal * 0.20;

        // We prioritize paying interest, then principal
        const amountAvailable = monthlySalary;
        // If salary can't cover interest, we have a problem (negative amort), but logic assumes validity.
        const paymentTowardsPrincipal = Math.max(0, amountAvailable - interestPaid);

        if (i === tenureMonths) {
          principalPaid = remainingPrincipal; // Force close (or show arrears if > payment)
        } else {
          // Pay as much as possible
          principalPaid = Math.min(paymentTowardsPrincipal, remainingPrincipal);
        }

      } else {
        // Month 3+: Standard logical fallback
        interestPaid = remainingPrincipal * r;
        const amountAvailable = monthlySalary;
        const paymentTowardsPrincipal = Math.max(0, amountAvailable - interestPaid);

        if (i === tenureMonths) {
          principalPaid = remainingPrincipal;
        } else {
          principalPaid = Math.min(paymentTowardsPrincipal, remainingPrincipal);
        }
      }

      // Final month safety clamp
      if (i === tenureMonths) {
        // If this is the last month, the calculation says we must clear it.
        // We set principalPaid to remaining.
        // NOTE: This might exceed monthlySalary if the loan was badly planned.
        // But for a schedule view, we show what IS DUE.
        principalPaid = remainingPrincipal;
      }

      const totalDue = principalPaid + interestPaid;
      remainingPrincipal -= principalPaid;

      // Accounting correctness: Round components, then sum for Total
      const roundedPrincipal = Math.round(principalPaid);
      const roundedInterest = Math.round(interestPaid);

      schedule.push({
        month: dueDate.getMonth(),
        year: dueDate.getFullYear(),
        principal: roundedPrincipal,
        interest: roundedInterest,
        total: roundedPrincipal + roundedInterest,
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

    const roundedPrincipal = Math.round(principalPaid);
    const roundedInterest = Math.round(interest);

    schedule.push({
      month: dueDate.getMonth(),
      year: dueDate.getFullYear(),
      principal: roundedPrincipal,
      interest: roundedInterest,
      total: roundedPrincipal + roundedInterest,
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

