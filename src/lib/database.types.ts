export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          role?: 'admin' | 'user'
        }
      }
      debts: {
        Row: {
          id: string
          code: string
          description: string
          product: string | null
          amount: number
          interest_rate: number
          months: number
          monthly_payment: number
          total_interest: number
          total_amount: number
          start_date: string
          status: 'active' | 'completed' | 'overdue'
          interest_description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['debts']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['debts']['Row'], 'id' | 'created_at'>>
      }
      debt_members: {
        Row: {
          id: string
          debt_id: string
          user_id: string
          share: number
        }
        Insert: Omit<Database['public']['Tables']['debt_members']['Row'], 'id'>
        Update: Partial<Omit<Database['public']['Tables']['debt_members']['Row'], 'id'>>
      }
      payments: {
        Row: {
          id: string
          debt_id: string
          user_id: string
          amount: number
          date: string
          receipt_number: string
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>>
      }
      rentals: {
        Row: {
          id: string
          code: string
          name: string
          vehicle_type: 'car' | 'motorcycle' | 'other'
          plate: string | null
          description: string | null
          reference_rate: number | null
          rate_period: 'daily' | 'weekly' | 'monthly'
          assigned_to: string | null
          status: 'active' | 'inactive'
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rentals']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['rentals']['Row'], 'id' | 'created_at'>>
      }
      rental_payments: {
        Row: {
          id: string
          rental_id: string
          user_id: string
          amount: number
          date: string
          period_label: string | null
          receipt_number: string
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rental_payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['rental_payments']['Row'], 'id' | 'created_at'>>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Debt = Database['public']['Tables']['debts']['Row']
export type DebtMember = Database['public']['Tables']['debt_members']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Rental = Database['public']['Tables']['rentals']['Row']
export type RentalPayment = Database['public']['Tables']['rental_payments']['Row']

export interface DebtWithMembers extends Debt {
  debt_members: (DebtMember & { profile: Profile })[]
}

export interface RentalWithDetails extends Rental {
  assigned_profile: Profile | null
}

export interface RentalPaymentWithDetails extends RentalPayment {
  profile: Profile
}
