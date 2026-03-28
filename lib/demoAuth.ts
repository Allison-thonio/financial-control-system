// Internal Company Credentials (Mock/Demo)
export const INTERNAL_ACCOUNTS = [
  {
    email: 'allison@finance.com',
    password: 'ggskicker',
    role: 'manager' as const,
    name: 'Allison (Lead)'
  },
  {
    email: 'tony@finance.com',
    password: 'tonysecure',
    role: 'manager' as const,
    name: 'Tony (Manager)'
  },
  {
    email: 'staff@allison.com',
    password: 'laptop',
    role: 'staff' as const,
    name: 'Allison Staff'
  },
  {
    email: 'staff@ricker.com',
    password: 'phone',
    role: 'staff' as const,
    name: 'Ricker Staff'
  },
  {
    email: 'staff@smith.com',
    password: 'keyboard',
    role: 'staff' as const,
    name: 'Smith Staff'
  },
  {
    email: 'staff@kelly.com',
    password: 'monitor',
    role: 'staff' as const,
    name: 'Kelly Staff'
  }
];

export const DEMO_CREDENTIALS = {
    staff: { email: 'staff@allison.com', password: 'laptop', role: 'staff' as const },
    manager: { email: 'allison@finance.com', password: 'ggskicker', role: 'manager' as const }
};

export function validateDemoCredentials(
  email: string,
  password: string
): { valid: boolean; role?: 'staff' | 'manager'; name?: string; isUnofficial?: boolean } {
  const cleanEmail = email.toLowerCase().trim();
  
  // 1. Check for exact matches in our curated list (OFFICIAL)
  const account = INTERNAL_ACCOUNTS.find(a => a.email.toLowerCase() === cleanEmail && a.password === password);
  if (account) {
    return { valid: true, role: account.role, name: account.name, isUnofficial: false };
  }

  // 2. Dynamic Pattern Matching for UNOFFICIAL testing
  if (cleanEmail.startsWith('staff@')) {
    const namePart = cleanEmail.split('@')[0].replace('staff', '').replace(/[^a-zA-Z]/g, '');
    const displayName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : 'Staff User';
    return { 
        valid: true, 
        role: 'staff', 
        name: `${displayName} (Unofficial)`,
        isUnofficial: true 
    };
  }

  if (cleanEmail.startsWith('manager@') || cleanEmail === 'allison@finance.com') {
    return { valid: true, role: 'manager', name: 'Test Manager', isUnofficial: false };
  }

  return { valid: false };
}

export function setDemoAuth(email: string, role: 'staff' | 'manager') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('demoAuth', JSON.stringify({ email, role, timestamp: Date.now() }));
  }
}

export function getDemoAuth() {
  if (typeof window !== 'undefined') {
    const auth = sessionStorage.getItem('demoAuth');
    return auth ? JSON.parse(auth) : null;
  }
  return null;
}

export function clearDemoAuth() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('demoAuth');
  }
}
