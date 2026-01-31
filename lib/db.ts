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

export interface LoanApp {
  id?: string;
  borrowerName: string;
  staffEmail: string;
  loanAmount: number;
  monthlyIncome: number;
  loanTenure: number;
  monthlyEMI: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  approvalReason?: string;
  createdAt: string | Timestamp;
  updatedAt?: Timestamp;
  repaymentType: 'default' | 'custom' | 'salary_advance';
  customRepayments?: number[];
  appointmentLetter?: string;
  passportPhoto?: string;
  nin?: string;
}

export interface UserProfile {
  id?: string;
  userId: string;
  email: string;
  name: string;
  role: 'staff' | 'manager';
  createdAt: Timestamp;
}

// User operations
export async function createUserProfile(userData: Omit<UserProfile, 'id' | 'createdAt'>) {
  if (!db) throw new Error('Firebase not initialized');
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
  if (!db) return null;
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Loan operations
export async function createLoanApplication(loanData: Omit<LoanApp, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!db) throw new Error('Firebase not initialized');
  try {
    const loansRef = collection(db, 'loans');
    const docRef = await addDoc(loansRef, {
      ...loanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating loan application:', error);
    throw error;
  }
}

export async function getLoansByStaff(staffEmail: string): Promise<LoanApp[]> {
  if (!db) return [];
  try {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('staffEmail', '==', staffEmail), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString().split('T')[0] : data.createdAt,
      } as LoanApp;
    });
  } catch (error) {
    console.error('Error getting staff loans:', error);
    return [];
  }
}

export async function getAllLoans(): Promise<LoanApp[]> {
  if (!db) return [];
  try {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString().split('T')[0] : data.createdAt,
      } as LoanApp;
    });
  } catch (error) {
    console.error('Error getting all loans:', error);
    return [];
  }
}

export async function updateLoanStatus(
  loanId: string,
  status: LoanApp['status'],
  approvalReason?: string
) {
  if (!db) throw new Error('Firebase not initialized');
  try {
    const loanRef = doc(db, 'loans', loanId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (approvalReason) {
      updateData.approvalReason = approvalReason;
    }

    await updateDoc(loanRef, updateData);
  } catch (error) {
    console.error('Error updating loan status:', error);
    throw error;
  }
}
