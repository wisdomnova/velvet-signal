// ./types/database.ts

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name?: string
  phone?: string
  plan_type: 'starter' | 'professional' | 'enterprise' 
  role: 'user' | 'admin'; // Add this line
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  avatar_url?: string 
  timezone: string
  notification_preferences: {
    email: boolean
    sms: boolean
  }
  twilio_account_sid?: string
  twilio_auth_token?: string
  created_at: string
  updated_at: string
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName?: string
  phone?: string
  planType?: 'starter' | 'professional' | 'enterprise'
}