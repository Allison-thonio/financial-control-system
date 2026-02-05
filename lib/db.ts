'use client';

import { db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { z } from 'zod';

// Zod schema for server-side validation
export const loanSchema = z.object({
  borrowerName: z.string().min(2),
  staffEmail: z.string().email(),
  loanAmount: z.number().positive(),
  monthlyIncome: z.number().positive(),
  loanTenure: z.number().int().min(1).max(60),
  monthlyEMI: z.number().positive(),
  status: z.enum(['pending', 'approved', 'rejected', 'disbursed']),
  repaymentType: z.enum(['default', 'custom', 'salary_advance']),
  nin: z.string().optional(),
});

export interface LoanApp {
  id?: string;
  userId: string;
  userName: string;
  email: string;
  borrowerName?: string; // Legacy field
  staffEmail?: string; // Legacy field
  loanAmount: number;
  loanReason: string;
  loanTerm: number;
  monthlyIncome: number;
  interestRate: number;
  monthlyEMI: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  approvalReason?: string;
  createdAt: string | Timestamp | any;
  updatedAt?: Timestamp | any;
  repaymentType?: 'default' | 'custom' | 'salary_advance';
  customRepayments?: number[];
  appointmentLetter?: string;
  passportPhoto?: string;
  nin?: string;
}

export interface MonthlyBudget {
  id?: string;
  month: number; // 0-11
  year: number;
  expectedAmount: number;
  actualAmount: number;
  updatedAt: Timestamp;
}

export interface UserProfile {
  id?: string;
  userId: string;
  email: string;
  name: string;
  role: 'staff' | 'manager';
  createdAt: Timestamp;
}

export interface SystemSettings {
  interestRate: number;
  maxTenure: number;
  salaryCapMultiplier: number;
  updatedAt: Timestamp;
}

export interface AuditLog {
  id?: string;
  action: string;
  user: string;
  details: string;
  timestamp: Timestamp;
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
    const q = query(loansRef, where('email', '==', staffEmail));
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString().split('T')[0] : data.createdAt,
      } as LoanApp;
    });

    // In-memory sort to avoid composite index requirement
    return results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
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
    const q = query(loansRef);
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString().split('T')[0] : data.createdAt,
      } as LoanApp;
    });

    // In-memory sort to avoid composite index requirement
    return results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
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

    await runTransaction(db, async (transaction) => {
      const loanDoc = await transaction.get(loanRef);
      if (!loanDoc.exists()) throw new Error("Loan document does not exist!");

      // Prevent re-approval of already disbursed loans
      const currentData = loanDoc.data();
      if (currentData.status === 'disbursed' && status !== 'disbursed') {
        throw new Error("Cannot change status of a disbursed loan");
      }

      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (approvalReason) {
        updateData.approvalReason = approvalReason;
      }

      transaction.update(loanRef, updateData);
    });
  } catch (error) {
    console.error('Error updating loan status:', error);
    throw error;
  }
}

// System Settings Operations
export async function getSystemSettings(): Promise<SystemSettings | null> {
  if (!db) return null;
  try {
    const settingsRef = doc(db, 'config', 'system_settings');
    const docSnap = await getDoc(settingsRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as SystemSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

export async function updateSystemSettings(settings: Omit<SystemSettings, 'updatedAt'>) {
  if (!db) throw new Error('Firebase not initialized');
  try {
    const settingsRef = doc(db, 'config', 'system_settings');
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// Audit Log Operations
export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  if (!db) throw new Error('Firebase not initialized');
  try {
    const logsRef = collection(db, 'auditLogs');
    await addDoc(logsRef, {
      ...log,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export async function getAuditLogs(limitCount = 100): Promise<AuditLog[]> {
  if (!db) return [];
  try {
    const logsRef = collection(db, 'auditLogs');
    const q = query(logsRef);
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));

    // Sort in memory by timestamp desc
    return results.sort((a, b) => {
      const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return timeB - timeA;
    }).slice(0, limitCount);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}

// Monthly Budget Operations
export async function setMonthlyBudget(month: number, year: number, expectedAmount: number) {
  if (!db) throw new Error('Firebase not initialized');
  try {
    const budgetRef = collection(db, 'monthlyBudgets');
    const q = query(budgetRef, where('month', '==', month), where('year', '==', year));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(budgetRef, {
        month,
        year,
        expectedAmount,
        actualAmount: 0,
        updatedAt: Timestamp.now(),
      });
    } else {
      const docRef = doc(db, 'monthlyBudgets', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        expectedAmount,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error setting monthly budget:', error);
    throw error;
  }
}

export async function getMonthlyBudget(month: number, year: number): Promise<MonthlyBudget | null> {
  if (!db) return null;
  try {
    const budgetRef = collection(db, 'monthlyBudgets');
    const q = query(budgetRef, where('month', '==', month), where('year', '==', year));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;
    const data = querySnapshot.docs[0].data();
    return { id: querySnapshot.docs[0].id, ...data } as MonthlyBudget;
  } catch (error) {
    console.error('Error getting monthly budget:', error);
    return null;
  }
}

export async function getAllMonthlyBudgets(): Promise<MonthlyBudget[]> {
  if (!db) return [];
  try {
    const budgetRef = collection(db, 'monthlyBudgets');
    const q = query(budgetRef, orderBy('year', 'desc'), orderBy('month', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyBudget));
  } catch (error) {
    console.error('Error getting all monthly budgets:', error);
    return [];
  }
}


export async function calculateMonthlyActualDisbursement(month: number, year: number): Promise<number> {
  if (!db) return 0;
  try {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('status', '==', 'disbursed'));
    const querySnapshot = await getDocs(q);

    let total = 0;
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const disbursedDate = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date();
      if (disbursedDate.getMonth() === month && disbursedDate.getFullYear() === year) {
        total += data.loanAmount || 0;
      }
    });

    // Also update the budget record's actualAmount
    const budget = await getMonthlyBudget(month, year);
    if (budget && budget.id) {
      const budgetDocRef = doc(db, 'monthlyBudgets', budget.id);
      await updateDoc(budgetDocRef, {
        actualAmount: total,
        updatedAt: Timestamp.now(),
      });
    }

    return total;
  } catch (error) {
    console.error('Error calculating monthly disbursement:', error);
    return 0;
  }
}

// Storage operations
export async function uploadFile(file: File, path: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage not initialized');
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('UPLOAD_TIMEOUT: The connection to Firebase Storage timed out. This usually happens if your internet is unstable or if Firebase Storage is not yet activated in your console.');
    }
    if (error.code === 'storage/unauthorized') {
      throw new Error('UPLOAD_UNAUTHORIZED: Your Firebase Storage rules are preventing the document upload. Please check your security rules.');
    }
    throw new Error(`UPLOAD_ERROR: ${error.message || 'An unknown error occurred during upload.'}`);
  }
}

