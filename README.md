# Employee Loan Management System

A modern, full-stack employee loan management application built with Next.js, React, Firebase, and Tailwind CSS. Features dual user interfaces for employees (staff) and management (managers/CEOs) to streamline the loan application and approval process.

## 🎯 Features

### For Staff/Employees
- **Loan Applications**: Apply for loans with detailed information
- **Income Verification**: Automatic calculation of loan affordability based on salary
- **EMI Calculator**: Real-time monthly EMI calculation with different interest rates
- **Application Tracking**: Monitor the status of all loan applications
- **Detailed Information**: View complete loan details with repayment schedules
- **Dashboard**: Overview of loan statistics and quick access to applications

### For Managers/CEOs
- **Application Review**: View all pending loan applications
- **Approval Workflow**: Approve or reject applications with detailed feedback
- **Analytics**: Dashboard with comprehensive statistics and analytics
- **Status Management**: Track loan status across the organization
- **Filtering**: Filter applications by status (pending, approved, rejected)
- **Detailed Review**: View applicant details, income verification, and loan calculations

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Authentication**: Firebase Auth (Email/Password)
- **Database**: Firebase Firestore (Real-time NoSQL)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **State Management**: React hooks with Context API

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project (free tier available)
- Environment variables setup

## 🚀 Getting Started

### 1. Clone and Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Get your Firebase credentials from Project Settings
3. Add credentials to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Setup Firestore

Create these collections in Firestore:

**Collection: `users`**
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

**Collection: `loans`**
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

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 User Roles

### Staff Role
- View personal dashboard with salary information
- Apply for new loans
- Track application status
- View detailed loan information with repayment schedules
- Check rejection reasons if applicable

### Manager Role
- View all loan applications
- Filter by status (pending, approved, rejected)
- Review application details
- Approve loans with manager information
- Reject loans with detailed reasons
- View analytics and statistics

## 🔐 Security Features

- Firebase Authentication with email/password
- Firestore security rules for data protection
- Role-based access control
- Secure session management
- Input validation and sanitization
- Protected routes with authentication checks

## 💰 Loan Calculation

### EMI (Equated Monthly Installment)
The system uses the standard EMI formula:

```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)

Where:
P = Principal loan amount
r = Monthly interest rate (annual rate / 12 / 100)
n = Number of months
```

### Loan Validation
- **Maximum Loan Amount**: 20x monthly income
- **EMI to Income Ratio**: Maximum 50% of monthly income

## 📊 Dashboard Analytics

### Staff Dashboard
- Total applications count
- Pending applications
- Approved loans count
- Rejected applications
- Total amount borrowed

### Manager Dashboard
- Total loan applications
- Pending applications count
- Approved loans count
- Rejected applications
- Total disbursed amount

## 🗂️ Project Structure

```
├── app/
│   ├── page.tsx                 # Home/redirect page
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── manager/
│   │   └── page.tsx             # Manager dashboard page
│   ├── staff/
│   │   └── page.tsx             # Staff dashboard page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
│
├── components/
│   ├── LoanApplicationForm.tsx   # Loan application form
│   ├── LoanApprovalModal.tsx    # Manager approval modal
│   ├── LoanDetailsModal.tsx     # Loan details view
│   ├── ProtectedRoute.tsx       # Protected route wrapper
│   ├── StatusBadge.tsx          # Status display component
│   ├── manager/
│   │   └── ManagerDashboard.tsx # Manager dashboard component
│   └── staff/
│       └── StaffDashboard.tsx   # Staff dashboard component
│
├── contexts/
│   └── AuthContext.tsx          # Authentication context
│
├── lib/
│   ├── firebase.ts              # Firebase configuration
│   ├── db.ts                    # Database operations
│   ├── constants.ts             # Configuration constants
│   └── utils.ts                 # Utility functions
│
├── public/                       # Static assets
├── SETUP.md                     # Setup guide
└── README.md                    # This file
```

## 🔄 User Flow

### Staff Workflow
1. **Login/Signup**: Create account or login
2. **View Dashboard**: See salary info and loan statistics
3. **Apply for Loan**: Fill out application form with loan details
4. **Track Status**: Monitor application status in real-time
5. **View Details**: Check detailed loan information and repayment schedule
6. **Receive Decision**: Get approval or rejection with feedback

### Manager Workflow
1. **Login**: Access manager dashboard
2. **View Applications**: See all pending applications
3. **Review Details**: Click to view complete application details
4. **Make Decision**: Approve or reject with comments
5. **Track Status**: View application history and statistics
6. **Analytics**: Monitor overall loan statistics

## 🧪 Testing

### Test Accounts (Create in Firebase)
- **Staff**: staff@example.com / Staff@123
- **Manager**: manager@example.com / Manager@123

### Test Loan Application
- Loan Amount: ₹50,000 - ₹1,000,000
- Term: 6-60 months
- Interest Rate: 5-15%

## 🛡️ Error Handling

The application includes comprehensive error handling for:
- Authentication failures
- Firestore operations
- Invalid loan amounts
- EMI calculation errors
- Network issues

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel project settings.

## 📈 Performance Optimizations

- Server-side rendering with Next.js
- Optimized database queries
- Component lazy loading
- Image optimization
- Caching strategies

## 🐛 Troubleshooting

### Login Issues
- Ensure Firebase Authentication is enabled
- Check email/password in Firebase Console
- Verify environment variables

### Data Not Loading
- Check Firestore collections exist
- Verify security rules allow access
- Check browser console for errors

### EMI Calculation Issues
- Verify loan amount and term
- Check interest rate input
- Ensure monthly income is set

## 📝 Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## 📞 Support

For issues or questions:
1. Check the SETUP.md guide
2. Review Firebase documentation
3. Check Firestore security rules
4. Verify environment variables

## 📄 License

This project is provided as-is for educational and commercial use.

## 🎨 UI Design

- Modern, polished design with gradients and shadows
- Responsive layout (mobile, tablet, desktop)
- Accessible color scheme with proper contrast
- Smooth transitions and hover effects
- Clean typography with consistent spacing

## ✨ Key Components

- **LoanApplicationForm**: Handles loan applications with validation
- **LoanApprovalModal**: Manager approval/rejection interface
- **LoanDetailsModal**: View complete loan details and repayment schedule
- **StatusBadge**: Visual status indicator
- **ManagerDashboard**: Complete manager interface
- **StaffDashboard**: Complete staff interface

---

Built with ❤️ using Next.js and Firebase
