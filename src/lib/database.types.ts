export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          role: "admin" | "teacher" | "student" | "parent" | string;
          full_name: string | null;
          phone: string | null;
          username: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          role?: "admin" | "teacher" | "student" | "parent" | string;
          full_name?: string | null;
          phone?: string | null;
          username?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          role?: "admin" | "teacher" | "student" | "parent" | string;
          full_name?: string | null;
          phone?: string | null;
          username?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      consultations: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          type: "consultation" | "entrance_test" | null;
          preferred_start: string;
          preferred_end: string | null;
          timezone: string | null;
          status: "pending" | "confirmed" | "cancelled";
          notes: string | null;
          username: string | null;
          user_type: "admin" | "teacher" | "student" | "parent" | string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          type?: "consultation" | "entrance_test" | null;
          preferred_start: string;
          preferred_end?: string | null;
          timezone?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
          notes?: string | null;
          username?: string | null;
          user_type?: "admin" | "teacher" | "student" | "parent" | string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string | null;
          type?: "consultation" | "entrance_test" | null;
          preferred_start?: string;
          preferred_end?: string | null;
          timezone?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
          notes?: string | null;
          username?: string | null;
          user_type?: "admin" | "teacher" | "student" | "parent" | string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
