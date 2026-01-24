export interface LoanCapacity {
  maxPrincipal: number;
  totalRepaymentWithInterest: number;
  monthlyRepayment: number;
  remainingCapacity: number;
}

export const LOAN_INTEREST_RATE_PER_MONTH = 0.1; // 10%
export const LOAN_TERM_MONTHS = 3;
export const TOTAL_INTEREST_RATE = LOAN_INTEREST_RATE_PER_MONTH * LOAN_TERM_MONTHS; // 30%
export const SALARY_CAP_MONTHS = 3;

export function calculateLoanCapacity(monthlySalary: number, currentOutstandingRepayment: number = 0): LoanCapacity {
  // Rule: Total Repayment (Principal + Interest) <= 3 * Monthly Salary
  const totalCapacity = monthlySalary * SALARY_CAP_MONTHS;
  const availableRepaymentCapacity = Math.max(0, totalCapacity - currentOutstandingRepayment);
  
  // Principal * (1 + TOTAL_INTEREST_RATE) = availableRepaymentCapacity
  // Principal = availableRepaymentCapacity / (1 + TOTAL_INTEREST_RATE)
  const maxPrincipal = availableRepaymentCapacity / (1 + TOTAL_INTEREST_RATE);
  const totalRepaymentWithInterest = maxPrincipal * (1 + TOTAL_INTEREST_RATE);
  const monthlyRepayment = totalRepaymentWithInterest / LOAN_TERM_MONTHS;

  return {
    maxPrincipal: Math.floor(maxPrincipal),
    totalRepaymentWithInterest: Math.floor(totalRepaymentWithInterest),
    monthlyRepayment: Math.floor(monthlyRepayment),
    remainingCapacity: Math.floor(availableRepaymentCapacity),
  };
}

export function getRepaymentSchedule(principal: number, startDate: Date) {
  const schedule = [];
  const monthlyRepayment = (principal * (1 + TOTAL_INTEREST_RATE)) / LOAN_TERM_MONTHS;
  
  for (let i = 1; i <= LOAN_TERM_MONTHS; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);
    schedule.push({
      month: dueDate.getMonth(), // 0-based
      year: dueDate.getFullYear(),
      amount: Math.floor(monthlyRepayment),
    });
  }
  return schedule;
}
