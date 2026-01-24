# Quick Start Guide - Employee Loan Management System

Get your Employee Loan Management System running in 10 minutes! 🚀

## Prerequisites
- Node.js 18+ installed
- Firebase account (free tier is fine)
- Code editor (VS Code recommended)

## Step 1: Project Setup (2 minutes)

```bash
# Clone or download the project
cd employee-loan-management

# Install dependencies
npm install
```

## Step 2: Firebase Configuration (5 minutes)

### 2a. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name: `Employee Loan Management`
4. Click **"Create project"** and wait

### 2b. Get Firebase Credentials
1. Click the gear ⚙️ icon → **"Project settings"**
2. Scroll to **"Your apps"** section
3. Click **"</>"** to add a web app
4. Name: `Loan App`
5. Click **"Register app"**
6. Copy the config object

### 2c. Add to Environment Variables
1. Create `.env.local` in the root folder
2. Copy `.env.example` and fill with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_VALUE
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_VALUE
```

## Step 3: Firebase Database Setup (2 minutes)

### 3a. Enable Authentication
1. In Firebase Console, go to **"Authentication"**
2. Click **"Get started"**
3. Enable **"Email/Password"**
4. Create 2 test users:
   - `staff@example.com` / `Staff@123`
   - `manager@example.com` / `Manager@123`

### 3b. Create Firestore Database
1. Go to **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Production mode"**
4. Select nearest region
5. Click **"Create"**

### 3c. Create Collections
1. Start collection → `users` → Create
2. Start collection → `loans` → Create

### 3d. Add Sample User Data
For the `users` collection, add 2 documents:

**Document 1 (Staff):**
```
Document ID: [Copy UID from staff@example.com user]
- userId: [same as ID]
- email: "staff@example.com"
- name: "John Staff"
- department: "Sales"
- salary: 50000
- employeeId: "EMP001"
- role: "staff"
- createdAt: [set current timestamp]
```

**Document 2 (Manager):**
```
Document ID: [Copy UID from manager@example.com user]
- userId: [same as ID]
- email: "manager@example.com"
- name: "Jane Manager"
- department: "Management"
- salary: 100000
- employeeId: "MGR001"
- role: "manager"
- createdAt: [set current timestamp]
```

## Step 4: Run the Application (1 minute)

```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## Step 5: Test the System

### Test as Staff:
1. Go to `http://localhost:3000`
2. Login with: `staff@example.com` / `Staff@123`
3. Click **"Apply for New Loan"**
4. Fill in:
   - Loan Amount: 100000
   - Loan Term: 12 months
   - Interest Rate: 8%
   - Reason: "Personal emergency"
5. Click **"Submit Application"**
6. View application in dashboard

### Test as Manager:
1. Login with: `manager@example.com` / `Manager@123`
2. You should see the staff application
3. Click **"Review"** on the application
4. Click **"Approve"** or **"Reject"**
5. Application status updates immediately

## Key Features Checklist

✅ **Dual Dashboards**
- Staff dashboard for employees
- Manager dashboard for approval

✅ **Loan Management**
- Apply for loans with details
- Auto EMI calculation
- Approval/rejection workflow

✅ **User Profiles**
- Salary tracking
- Department management
- Employee ID verification

✅ **Real-time Updates**
- Firestore sync
- Status updates
- Instant notifications

## Troubleshooting Quick Fixes

### "Firebase credentials not found"
- Check `.env.local` file exists
- Copy values exactly from Firebase Console
- Restart development server

### "Permission denied" error
- Create both user documents in `users` collection
- Use correct UIDs from Authentication
- Firestore rules are auto-configured

### "Collections not found"
- Ensure `users` and `loans` collections exist
- Start with capital 'C' (Collections)
- Refresh Firestore after creating

### Login not working
- Create test users in Authentication first
- Ensure email/password are correct
- Check if user document exists in `users` collection

## Next Steps

After testing:
1. ✅ Read [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) for architecture
2. ✅ Check [README.md](README.md) for complete documentation
3. ✅ Review [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for details
4. ✅ Customize for your organization
5. ✅ Deploy to [Vercel](https://vercel.com)

## File Reference

| File | Purpose |
|------|---------|
| `.env.local` | Firebase credentials |
| `lib/firebase.ts` | Firebase config |
| `lib/db.ts` | Database operations |
| `contexts/AuthContext.tsx` | Authentication |
| `components/manager/ManagerDashboard.tsx` | Manager interface |
| `components/staff/StaffDashboard.tsx` | Staff interface |
| `app/login/page.tsx` | Login page |

## Common Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Format code
npm run format
```

## Environment Variables Explained

| Variable | Where to Find | Example |
|----------|---------------|---------|
| API_KEY | Firebase Console > Settings | `AIzaSy...` |
| AUTH_DOMAIN | Firebase Console > Settings | `project.firebaseapp.com` |
| PROJECT_ID | Firebase Console > Settings | `my-project-id` |
| STORAGE_BUCKET | Firebase Console > Settings | `my-project.appspot.com` |
| MESSAGING_SENDER_ID | Firebase Console > Settings | `123456789` |
| APP_ID | Firebase Console > Settings | `1:123456789:web:abc123...` |

## User Roles

### Staff
- Can apply for loans
- Can view their own applications
- Can track status
- Can see repayment schedule

### Manager
- Can view all applications
- Can approve/reject
- Can add rejection reasons
- Can see analytics

## Support Resources

1. **Firebase Issues**
   - [Firebase Documentation](https://firebase.google.com/docs)
   - [Firestore Guide](https://firebase.google.com/docs/firestore)

2. **Next.js Issues**
   - [Next.js Documentation](https://nextjs.org/docs)
   - [Next.js Community](https://github.com/vercel/next.js)

3. **Project Issues**
   - Check SETUP.md for detailed setup
   - Check README.md for features
   - Check SYSTEM_OVERVIEW.md for architecture

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Then your app is live!
```

## What's Included

✨ **Complete System**
- User authentication
- Dual dashboards
- Loan management
- EMI calculator
- Real-time sync
- Modern UI design
- Security rules
- Error handling

📱 **Responsive Design**
- Mobile-friendly
- Tablet-optimized
- Desktop-perfect
- Modern aesthetics

🔒 **Security**
- Firebase Auth
- Firestore rules
- Input validation
- Role-based access

---

**That's it!** You now have a fully functional Employee Loan Management System. 

For detailed information, check the documentation files:
- 📖 README.md - Complete guide
- 🚀 SETUP.md - Detailed setup
- 🔥 FIREBASE_SETUP.md - Firebase instructions
- 🏗️ SYSTEM_OVERVIEW.md - Architecture details

Happy coding! 🎉
