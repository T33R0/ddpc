export interface AppRoute {
  path: string
  name: string
  description?: string
  parameters?: string[]
  exposedIn?: string[] // Where this route is linked/used
  access: 'public' | 'authenticated' | 'admin'
}

export const APP_ROUTES: AppRoute[] = [
  // Public Routes
  {
    path: '/',
    name: 'Landing Page',
    description: 'Main entry point for the application',
    exposedIn: ['Navigation', 'Auth Redirects'],
    access: 'public',
  },
  {
    path: '/auth/signin',
    name: 'Sign In',
    description: 'User login page',
    exposedIn: ['Navigation', 'Protected Route Redirects'],
    access: 'public',
  },
  {
    path: '/auth/callback',
    name: 'Auth Callback',
    description: 'OAuth callback handler',
    access: 'public',
  },
  {
    path: '/legal/privacy',
    name: 'Privacy Policy',
    description: 'Legal privacy information',
    exposedIn: ['Footer'],
    access: 'public',
  },
  {
    path: '/legal/terms',
    name: 'Terms of Service',
    description: 'Legal terms of service',
    exposedIn: ['Footer'],
    access: 'public',
  },
  {
    path: '/u/[username]',
    name: 'Public User Profile',
    parameters: ['username'],
    description: 'Public view of a user profile',
    exposedIn: ['Search', 'Direct Link'],
    access: 'public',
  },
  
  // App Core (Authenticated)
  {
    path: '/garage',
    name: 'My Garage',
    description: 'Main dashboard for logged-in users showing their vehicles',
    exposedIn: ['Navigation', 'Post-Login Redirect'],
    access: 'authenticated',
  },
  {
    path: '/vehicle/[id]',
    name: 'Vehicle Dashboard',
    parameters: ['id'],
    description: 'Detailed view and management of a specific vehicle',
    exposedIn: ['Garage', 'Search'],
    access: 'authenticated',
  },
  {
    path: '/vehicle/[id]/service',
    name: 'Service Log',
    parameters: ['id'],
    description: 'Maintenance history and planner for a vehicle',
    exposedIn: ['Vehicle Dashboard'],
    access: 'authenticated',
  },
  {
    path: '/vehicle/[id]/mods',
    name: 'Modifications',
    parameters: ['id'],
    description: 'Modification log and build planner',
    exposedIn: ['Vehicle Dashboard'],
    access: 'authenticated',
  },
  {
    path: '/vehicle/[id]/fuel',
    name: 'Fuel Log',
    parameters: ['id'],
    description: 'Fuel tracking and efficiency stats',
    exposedIn: ['Vehicle Dashboard'],
    access: 'authenticated',
  },
  {
    path: '/vehicle/[id]/settings',
    name: 'Vehicle Settings',
    parameters: ['id'],
    description: 'Edit vehicle details and privacy settings',
    exposedIn: ['Vehicle Dashboard'],
    access: 'authenticated',
  },
  {
    path: '/account',
    name: 'Account Settings',
    description: 'User profile and account management',
    exposedIn: ['User Menu'],
    access: 'authenticated',
  },
  {
    path: '/discover',
    name: 'Discover',
    description: 'Explore community vehicles',
    exposedIn: ['Navigation'],
    access: 'authenticated',
  },

  // Admin Routes
  {
    path: '/admin',
    name: 'Admin Console',
    description: 'Administrator dashboard',
    exposedIn: ['Direct Link'],
    access: 'admin',
  },
  {
    path: '/admin/users',
    name: 'User Management',
    description: 'Manage users and roles',
    exposedIn: ['Admin Dashboard'],
    access: 'admin',
  },
  {
    path: '/admin/issues',
    name: 'Issues',
    description: 'Reported problems tracking',
    exposedIn: ['Admin Dashboard'],
    access: 'admin',
  },
  {
    path: '/admin/structure',
    name: 'App Structure',
    description: 'Documentation of app routes and pages',
    exposedIn: ['Admin Dashboard'],
    access: 'admin',
  }
]

