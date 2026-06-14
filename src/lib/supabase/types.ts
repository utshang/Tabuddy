export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      trips: {
        Row: {
          id: string
          title: string
          start_date: string | null
          end_date: string | null
          owner_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          start_date?: string | null
          end_date?: string | null
          owner_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          start_date?: string | null
          end_date?: string | null
          owner_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      trip_members: {
        Row: {
          trip_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string | null
        }
        Insert: {
          trip_id: string
          user_id: string
          role?: 'owner' | 'member'
          joined_at?: string | null
        }
        Update: {
          trip_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string | null
        }
      }
      days: {
        Row: {
          id: string
          trip_id: string
          date: string
          order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          date: string
          order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          date?: string
          order?: number
          created_at?: string | null
        }
      }
      activities: {
        Row: {
          id: string
          day_id: string
          title: string
          place: string | null
          start_time: string | null
          note: string | null
          order: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          day_id: string
          title: string
          place?: string | null
          start_time?: string | null
          note?: string | null
          order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          day_id?: string
          title?: string
          place?: string | null
          start_time?: string | null
          note?: string | null
          order?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          payer_id: string
          amount: number
          currency: string
          description: string
          split_type: 'equal' | 'amount' | 'percent'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          payer_id: string
          amount: number
          currency?: string
          description: string
          split_type?: 'equal' | 'amount' | 'percent'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          payer_id?: string
          amount?: number
          currency?: string
          description?: string
          split_type?: 'equal' | 'amount' | 'percent'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      expense_splits: {
        Row: {
          expense_id: string
          user_id: string
          share: number
        }
        Insert: {
          expense_id: string
          user_id: string
          share: number
        }
        Update: {
          expense_id?: string
          user_id?: string
          share?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      is_trip_member: {
        Args: { p_trip_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
