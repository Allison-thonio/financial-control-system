# Firebase Setup Guide

Complete step-by-step guide to set up Firebase for the Employee Loan Management System.

## 1. Create Firebase Project

### Step 1.1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it: `Employee Loan Management`
4. Accept the terms and click **"Create project"**
5. Wait for project creation to complete

### Step 1.2: Get Firebase Credentials
1. In Firebase Console, click the gear icon ⚙️ in the top left
2. Select **"Project settings"**
3. Go to the **"General"** tab
4. Scroll down to **"Your apps"** section
5. Click the **"</>"** (web) icon to add a web app
6. Name it: `Loan Management App`
7. Click **"Register app"**
8. Copy the Firebase config object - you'll need this for `.env.local`

### Step 1.3: Add Credentials to .env.local
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=your_appId
```

## 2. Enable Authentication

### Step 2.1: Enable Email/Password Authentication
1. In Firebase Console, go to **"Authentication"** (left sidebar)
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Enable the toggle for **"Email/Password"**
5. Click **"Save"**

### Step 2.2: Create Test Users
1. Go to **"Users"** tab in Authentication
2. Click **"Add user"** button
3. Create two test users:

**Test User 1 (Staff):**
- Email: `staff@example.com`
- Password: `Staff@123`

**Test User 2 (Manager):**
- Email: `manager@example.com`
- Password: `Manager@123`

Copy the **UID** of each user (you'll need it for the next step).

## 3. Setup Firestore Database

### Step 3.1: Create Firestore Database
1. Go to **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Select **"Production mode"**
4. Choose your preferred region (closest to your location)
5. Click **"Create"**
6. Wait for database initialization

### Step 3.2: Create Collections

#### Create "users" Collection
1. Click **"Start collection"**
2. Collection ID: `users`
3. Click **"Next"**
4. Add your first document:

**Document ID:** (paste the UID from staff@example.com test user)

**Fields:**
```
- userId: string = [the UID]
- email: string = "staff@example.com"
- name: string = "John Staff"
- department: string = "Sales"
- salary: number = 50000
- employeeId: string = "EMP001"
- role: string = "staff"
- createdAt: timestamp = current timestamp
```

5. Click **"Save"**

6. Add another document for manager:

**Document ID:** (paste the UID from manager@example.com test user)

**Fields:**
```
- userId: string = [the UID]
- email: string = "manager@example.com"
- name: string = "Jane Manager"
- department: string = "Management"
- salary: number = 100000
- employeeId: string = "MGR001"
- role: string = "manager"
- createdAt: timestamp = current timestamp
```

#### Create "loans" Collection
1. Click **"Start collection"**
2. Collection ID: `loans`
3. Click **"Next"**
4. You can skip adding a document - it will be created when staff applies for loans
5. Click **"Save"**

## 4. Configure Security Rules

### Step 4.1: Update Firestore Rules
1. Go to **"Firestore Database"** → **"Rules"** tab
2. Replace all content with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Loans collection
    match /loans/{loanId} {
      // Users can read their own loans
      allow read: if request.auth.uid == resource.data.userId;
      
      // Users can create loans (apply for loans)
      allow create: if request.auth.uid != null;
      
      // Managers can read all loans
      allow list, read: if exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
      
      // Managers can update loans (approve/reject)
      allow update: if exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
    }
  }
}
```

3. Click **"Publish"**

## 5. Verify Setup

### Step 5.1: Test Authentication
1. Run the development server: `npm run dev`
2. Visit `http://localhost:3000/login`
3. Try to login with test credentials:
   - Email: `staff@example.com`
   - Password: `Staff@123`

### Step 5.2: Test Data Access
1. After login, check if user information loads
2. Verify the salary information displays correctly
3. Try applying for a loan
4. Logout and login as manager to verify loan shows up

## Troubleshooting

### Error: "auth/invalid-email"
- Ensure email format is correct
- Check if user exists in Firebase Authentication

### Error: "Permission denied" in Firestore
- Check security rules are published
- Verify user role is set correctly in users collection
- Ensure UIDs match between authentication and Firestore

### Error: "app/invalid-api-key"
- Verify all environment variables in `.env.local` are correct
- Check for extra spaces or quotes in values
- Restart the development server after adding env vars

### Loans not showing in manager dashboard
- Verify loans collection exists in Firestore
- Check security rules allow manager to read all loans
- Ensure manager role is set correctly in users collection

## Document Structure Reference

### Users Collection Structure
```javascript
{
  userId: "firebase_auth_uid",        // String
  email: "user@example.com",          // String
  name: "User Name",                  // String
  department: "Department",           // String
  salary: 50000,                      // Number
  employeeId: "EMP001",              // String
  role: "staff" | "manager",         // String
  createdAt: Timestamp               // Timestamp
}
```

### Loans Collection Structure
```javascript
{
  userId: "firebase_auth_uid",        // String (user who applied)
  userName: "John Doe",               // String
  email: "john@example.com",          // String
  loanAmount: 100000,                 // Number
  loanReason: "...",                  // String
  loanTerm: 12,                       // Number (months)
  monthlyIncome: 50000,               // Number
  interestRate: 8,                    // Number (%)
  monthlyEMI: 8700,                   // Number (calculated)
  status: "pending" | "approved" | "rejected" | "disbursed",
  createdAt: Timestamp,               // Timestamp
  updatedAt: Timestamp,               // Timestamp
  approvedBy: "manager@email.com",    // String (optional)
  approvalDate: Timestamp,            // Timestamp (optional)
  rejectionReason: "..."              // String (optional)
}
```

## Next Steps

1. ✅ Create Firebase project
2. ✅ Enable authentication
3. ✅ Setup Firestore database
4. ✅ Configure security rules
5. Run the application
6. Test with staff and manager accounts
7. Deploy to production

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Database Guide](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)

---

Need help? Check the README.md or SETUP.md for more information.
