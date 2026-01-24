// Demo credentials for testing
export const DEMO_CREDENTIALS = {
  staff: {
    email: 'thinkerricker@gmail.com',
    password: 'ggsnigga',
    role: 'staff' as const,
  },
  manager: {
    email: 'allisonfezyy@gmail.com',
    password: 'ggs',
    role: 'manager' as const,
  },
};

export function validateDemoCredentials(
  email: string,
  password: string
): { valid: boolean; role?: 'staff' | 'manager' } {
  if (email === DEMO_CREDENTIALS.staff.email && password === DEMO_CREDENTIALS.staff.password) {
    return { valid: true, role: 'staff' };
  }
  if (email === DEMO_CREDENTIALS.manager.email && password === DEMO_CREDENTIALS.manager.password) {
    return { valid: true, role: 'manager' };
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
