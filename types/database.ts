export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: 'customer' | 'lender' | 'admin'
          is_verified: boolean
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'lender' | 'admin'
          is_verified?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'lender' | 'admin'
          is_verified?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lender_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          business_description: string | null
          stripe_account_id: string | null
          stripe_onboarding_completed: boolean
          stripe_charges_enabled: boolean
          stripe_payouts_enabled: boolean
          verification_status: string
          rating_avg: number
          rating_count: number
          total_bookings: number
          response_time_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          business_description?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          verification_status?: string
          rating_avg?: number
          rating_count?: number
          total_bookings?: number
          response_time_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          business_description?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          verification_status?: string
          rating_avg?: number
          rating_count?: number
          total_bookings?: number
          response_time_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          lender_id: string
          category_id: string | null
          title: string
          description: string
          condition: string | null
          replacement_value: number | null
          base_price: number
          pricing_type: 'hourly' | 'daily' | 'weekly'
          min_rental_duration: number
          max_rental_duration: number | null
          cancellation_policy: 'flexible' | 'moderate' | 'strict'
          status: 'draft' | 'pending_review' | 'active' | 'inactive' | 'suspended'
          quantity_available: number
          location_address_id: string | null
          featured: boolean
          views_count: number
          booking_count: number
          rating_avg: number
          rating_count: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          lender_id: string
          category_id?: string | null
          title: string
          description: string
          condition?: string | null
          replacement_value?: number | null
          base_price: number
          pricing_type?: 'hourly' | 'daily' | 'weekly'
          min_rental_duration?: number
          max_rental_duration?: number | null
          cancellation_policy?: 'flexible' | 'moderate' | 'strict'
          status?: 'draft' | 'pending_review' | 'active' | 'inactive' | 'suspended'
          quantity_available?: number
          location_address_id?: string | null
          featured?: boolean
          views_count?: number
          booking_count?: number
          rating_avg?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          lender_id?: string
          category_id?: string | null
          title?: string
          description?: string
          condition?: string | null
          replacement_value?: number | null
          base_price?: number
          pricing_type?: 'hourly' | 'daily' | 'weekly'
          min_rental_duration?: number
          max_rental_duration?: number | null
          cancellation_policy?: 'flexible' | 'moderate' | 'strict'
          status?: 'draft' | 'pending_review' | 'active' | 'inactive' | 'suspended'
          quantity_available?: number
          location_address_id?: string | null
          featured?: boolean
          views_count?: number
          booking_count?: number
          rating_avg?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          renter_id: string
          lender_id: string
          listing_id: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
          start_date: string
          end_date: string
          subtotal: number
          fees_total: number
          tax_total: number
          deposit_amount: number
          total_amount: number
          stripe_payment_intent_id: string | null
          stripe_deposit_hold_id: string | null
          deposit_released: boolean
          delivery_address_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          renter_id: string
          lender_id: string
          listing_id: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
          start_date: string
          end_date: string
          subtotal: number
          fees_total?: number
          tax_total?: number
          deposit_amount?: number
          total_amount: number
          stripe_payment_intent_id?: string | null
          stripe_deposit_hold_id?: string | null
          deposit_released?: boolean
          delivery_address_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          renter_id?: string
          lender_id?: string
          listing_id?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
          start_date?: string
          end_date?: string
          subtotal?: number
          fees_total?: number
          tax_total?: number
          deposit_amount?: number
          total_amount?: number
          stripe_payment_intent_id?: string | null
          stripe_deposit_hold_id?: string | null
          deposit_released?: boolean
          delivery_address_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'customer' | 'lender' | 'admin'
      listing_status: 'draft' | 'pending_review' | 'active' | 'inactive' | 'suspended'
      booking_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
      dispute_status: 'open' | 'under_review' | 'resolved' | 'closed'
      dispute_reason: 'damage' | 'missing_items' | 'late_return' | 'quality_issue' | 'not_as_described' | 'other'
      cancellation_policy: 'flexible' | 'moderate' | 'strict'
      delivery_type: 'pickup' | 'delivery' | 'setup'
      pricing_type: 'hourly' | 'daily' | 'weekly'
      notification_type: 'booking' | 'message' | 'review' | 'payout' | 'system'
    }
  }
}
