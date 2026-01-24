// Loan Configuration Constants

export const LOAN_CONFIG = {
  // Loan amount validation
  MIN_LOAN_AMOUNT: 10000,
  MAX_LOAN_MULTIPLIER: 20, // Max loan = monthly income * 20

  // EMI configuration
  DEFAULT_INTEREST_RATE: 8, // Default interest rate (%)
  MIN_INTEREST_RATE: 0,
  MAX_INTEREST_RATE: 25,

  // Loan term in months
  MIN_LOAN_TERM: 6,
  MAX_LOAN_TERM: 60,
  DEFAULT_LOAN_TERM: 12,

  // EMI affordability
  MAX_EMI_TO_INCOME_RATIO: 0.5, // Max 50% of monthly income as EMI
};

export const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISBURSED: 'disbursed',
} as const;

export const USER_ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  LOANS: 'loans',
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
  },
  disbursed: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
} as const;
