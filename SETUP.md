# Employee Loan Management System - Setup Guide

## Overview

This is a dual-interface employee loan management system with:
- **Manager/CEO Dashboard**: Approve/reject loan applications, view analytics
- **Staff Dashboard**: Apply for loans, track application status
- **Firebase Integration**: Real-time database and authentication

## Environment Variables

Add these Firebase credentials to your `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Setup

### 1. Create a New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Name it "Employee Loan Management"
4. Enable Google Analytics (optional)

### 2. Configure Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **Production mode**
4. Select your preferred region
5. Create the following collections:

#### Collection: `users`
Document structure:
```json
{
  "userId": "firebase_user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "department": "Sales",
  "salary": 50000,
  "employeeId": "EMP001",
  "role": "staff",
  "createdAt": "timestamp"
}
```

#### Collection: `loans`
Document structure:
```json
{
  "userId": "firebase_user_id",
  "userName": "John Doe",
  "email": "user@example.com",
  "loanAmount": 100000,
  "loanReason": "Personal emergency",
  "loanTerm": 12,
  "monthlyIncome": 50000,
  "status": "pending",
  "interestRate": 8,
  "monthlyEMI": 8700,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "approvedBy": "manager@example.com",
  "approvalDate": "timestamp",
  "rejectionReason": ""
}
```

### 3. Enable Authentication

1. Go to **Authentication**
2. Click **Get started**
3. Enable **Email/Password** authentication

### 4. Set Firestore Security Rules

Replace the default rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Loans collection
    match /loans/{loanId} {
      // Users can read their own loans
      allow read: if request.auth.uid == resource.data.userId;
      // Users can create loans
      allow create: if request.auth.uid != null;
      // Managers can read all loans
      allow read: if request.auth.token.role == 'manager';
      // Managers can update loans
      allow update: if request.auth.token.role == 'manager';
    }
  }
}
```

## User Roles

### Staff
- Apply for new loans
- View their own loan applications
- Track application status
- View detailed loan information with repayment schedule

### Manager/CEO
- View all loan applications
- Approve or reject applications
- Provide rejection reasons
- View detailed analytics
- Filter applications by status

## Default Login Credentials

For testing, create these test accounts in Firebase Authentication:

**Manager Account:**
- Email: `manager@example.com`
- Password: `Manager@123`

**Staff Account:**
- Email: `staff@example.com`
- Password: `Staff@123`

After creating accounts, add corresponding user documents in Firestore with `role: "manager"` or `role: "staff"`.

## Key Features

### Loan Application
- Loan amount validation (max 20x monthly income)
- EMI calculation with interest
- Monthly income verification
- Detailed loan reason

### Approval Workflow
- Pending applications review
- Approval with manager details
- Rejection with reason documentation
- Status tracking in real-time

### Repayment Schedule
- Automatic EMI calculation
- Month-by-month breakdown
- Principal and interest split
- Running balance calculation

### Salary Tracking
- Employee salary information
- Loan-to-income ratio calculation
- EMI affordability assessment

## Database Relationships

```
Users (1)
  └── Loans (Many)
    ├── status: pending/approved/rejected/disbursed
    ├── createdAt
    ├── updatedAt
    └── approvalDetails (if approved/rejected)
```

## Testing the Application

1. **As Staff:**
   - Log in with staff credentials
   - Fill in user profile
   - Apply for a new loan
   - View application status
   - Check detailed information

2. **As Manager:**
   - Log in with manager credentials
   - View all pending applications
   - Approve/reject applications
   - Add feedback on decisions
   - View analytics dashboard

## Troubleshooting

- **Login not working**: Check Firebase authentication is enabled
- **Applications not saving**: Verify Firestore rules and collections exist
- **Missing user data**: Ensure user documents are created in Firestore
- **EMI calculation incorrect**: Check interest rate and loan term inputs

## File Structure

```
app/
  ├── page.tsx          # Home/redirect
  ├── login/            # Login page
  ├── manager/          # Manager dashboard
  ├── staff/            # Staff dashboard
  └── layout.tsx        # Root layout

components/
  ├── LoanApplicationForm.tsx
  ├── LoanApprovalModal.tsx
  ├── LoanDetailsModal.tsx
  ├── StatusBadge.tsx
  ├── ProtectedRoute.tsx
  ├── manager/
  │   └── ManagerDashboard.tsx
  └── staff/
      └── StaffDashboard.tsx

contexts/
  └── AuthContext.tsx   # Authentication state

lib/
  ├── firebase.ts       # Firebase config
  └── db.ts            # Database operations
```

## Next Steps

1. Set up Firebase project and get credentials
2. Add environment variables
3. Create Firestore collections
4. Set up security rules
5. Create test user accounts
6. Test both user interfaces
7. Deploy to production
