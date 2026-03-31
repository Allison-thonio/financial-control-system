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
  isSalaryOffset: boolean = false,
  isUnofficial: boolean = false
) {
  let r = settings.interestRate;

  // Penalty for Unofficial emails: 10x Interest Rate (100% per month)
  if (isUnofficial) {
    r = r * 10; 
  }

  // Total interest is always flat based on the adjusted rate
  const totalInterest = principal * r * tenureMonths;
  const totalRepayment = principal + totalInterest;

  return {
    total: totalRepayment,
    interest: totalInterest,
    isReducing: false,
    monthlyPayment: totalRepayment / tenureMonths,
    isSalaryOffset,
    isUnofficial,
    appliedRate: r
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
  isSalaryOffset: boolean = false,
  isUnofficial: boolean = false
): RepaymentStep[] {
  const schedule: RepaymentStep[] = [];
  let r = settings.interestRate;
  if (isUnofficial) r = r * 10;
  
  const totalInterest = principal * r * tenureMonths;
  let remainingPrincipal = principal;

  if (isSalaryOffset && monthlySalary > 0) {
    // Salary Wipe Logic: Take full salary until the TOTAL balance (Principal + Interest) is zero.
    let remainingTotal = principal + totalInterest;
    let monthIdx = 1;

    while (remainingTotal > 0 && monthIdx <= tenureMonths * 2) { // Guard against infinite loop
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + monthIdx);

      const payment = Math.min(monthlySalary, remainingTotal);
      
      // Split the payment between interest and principal for accounting
      // We prioritize interest first (Standard practice) or principal first (as requested previously)?
      // User said "taking the whole salary... until the debt is cleared that is plus interest"
      // Let's just calculate how much of the payment goes to interest vs principal.
      // Since it's a flat interest, we can just deduct from the pool.
      
      const interestPortion = Math.min(payment, Math.max(0, totalInterest - schedule.reduce((sum, s) => sum + s.interest, 0)));
      const principalPortion = payment - interestPortion;

      remainingTotal -= payment;

      schedule.push({
        month: dueDate.getMonth(),
        year: dueDate.getFullYear(),
        principal: Math.round(principalPortion),
        interest: Math.round(interestPortion),
        total: Math.round(payment),
        remainingBalance: Math.max(0, Math.round(remainingTotal))
      });

      monthIdx++;
      if (monthIdx > tenureMonths && remainingTotal <= 0) break; 
    }
  } else {
    // Standard Flat EMI Logic: Fixed monthly deduction
    const monthlyTotal = (principal + totalInterest) / tenureMonths;
    const monthlyInterest = totalInterest / tenureMonths;
    const monthlyPrincipal = principal / tenureMonths;

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
        remainingBalance: Math.max(0, Math.round(remainingPrincipal * (1 + r))) // Showing remaining total balance with interest
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

