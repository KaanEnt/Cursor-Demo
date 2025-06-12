import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          file_path: string
          file_size: number
          file_type: string
          status: 'uploading' | 'processing' | 'completed' | 'failed'
          extracted_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          file_path: string
          file_size: number
          file_type: string
          status?: 'uploading' | 'processing' | 'completed' | 'failed'
          extracted_data?: any
        }
        Update: {
          status?: 'uploading' | 'processing' | 'completed' | 'failed'
          extracted_data?: any
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          plan: 'starter' | 'professional' | 'enterprise'
          documents_processed: number
          monthly_limit: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          plan?: 'starter' | 'professional' | 'enterprise'
          documents_processed?: number
          monthly_limit?: number
        }
        Update: {
          plan?: 'starter' | 'professional' | 'enterprise'
          documents_processed?: number
          monthly_limit?: number
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          document_id: string
          action: string
          metadata: any
          created_at: string
        }
        Insert: {
          user_id: string
          document_id: string
          action: string
          metadata?: any
        }
        Update: {}
      }
    }
  }
} 