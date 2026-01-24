'use client';

import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  getDoc,
} from 'firebase/firestore';

export interface LoanApplication {
  id?: string;
  userId: string;
  userName: string;
  email: string;
  loanAmount: number;
  loanReason: string;
  loanTerm: number;
  monthlyIncome: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  interestRate: number;
  monthlyEMI: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedBy?: string;
  approvalDate?: Timestamp;
  rejectionReason?: string;
}

export interface UserProfile {
  id?: string;
  userId: string;
  email: string;
  name: string;
  department: string;
  salary: number;
  employeeId: string;
  role: 'staff' | 'manager';
  createdAt: Timestamp;
}

// User operations
export async function createUserProfile(userData: Omit<UserProfile, 'id' | 'createdAt'>) {
  try {
    const userRef = collection(db, 'users');
    const docRef = await addDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Loan operations
export async function createLoanApplication(
  loanData: Omit<LoanApplication, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    const loansRef = collection(db, 'loans');
    const monthlyRate = loanData.interestRate / 100 / 12;
    const emi = calculateEMI(loanData.loanAmount, monthlyRate, loanData.loanTerm);

    const docRef = await addDoc(loansRef, {
      ...loanData,
      monthlyEMI: emi,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating loan application:', error);
    throw error;
  }
}

export async function getLoansByUserId(userId: string): Promise<LoanApplication[]> {
  try {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as LoanApplication));
  } catch (error) {
    console.error('Error getting loans:', error);
    return [];
  }
}

export async function getAllLoans(): Promise<LoanApplication[]> {
  try {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as LoanApplication));
  } catch (error) {
    console.error('Error getting all loans:', error);
    return [];
  }
}

export async function getLoanById(loanId: string): Promise<LoanApplication | null> {
  try {
    const loanDoc = await getDoc(doc(db, 'loans', loanId));
    if (!loanDoc.exists()) return null;
    return {
      id: loanDoc.id,
      ...loanDoc.data(),
    } as LoanApplication;
  } catch (error) {
    console.error('Error getting loan:', error);
    return null;
  }
}

export async function updateLoanStatus(
  loanId: string,
  status: LoanApplication['status'],
  approvedBy?: string,
  rejectionReason?: string
) {
  try {
    const loanRef = doc(db, 'loans', loanId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvalDate = Timestamp.now();
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await updateDoc(loanRef, updateData);
  } catch (error) {
    console.error('Error updating loan status:', error);
    throw error;
  }
}

// Helper function to calculate EMI
function calculateEMI(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export function calculateRepaymentSchedule(
  principal: number,
  monthlyRate: number,
  months: number
): Array<{ month: number; emi: number; principal: number; interest: number; balance: number }> {
  const emi = calculateEMI(principal, monthlyRate, months);
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= months; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month: i,
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return schedule;
}
