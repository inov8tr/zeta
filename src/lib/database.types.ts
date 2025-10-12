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
          class_id: string | null;
          test_status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          role?: "admin" | "teacher" | "student" | "parent" | string;
          full_name?: string | null;
          phone?: string | null;
          username?: string | null;
          class_id?: string | null;
          test_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          role?: "admin" | "teacher" | "student" | "parent" | string;
          full_name?: string | null;
          phone?: string | null;
          username?: string | null;
          class_id?: string | null;
          test_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_class_id_fkey";
            columns: ["class_id"];
            referencedRelation: "classes";
            referencedColumns: ["id"];
          }
        ];
      };
      consultations: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string | null;
          name: string | null;
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
          message: string | null;
          slot_id: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          name?: string | null;
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
          message?: string | null;
          slot_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          name?: string | null;
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
          message?: string | null;
          slot_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consultations_slot_id_fkey";
            columns: ["slot_id"];
            referencedRelation: "consultation_slots";
            referencedColumns: ["id"];
          }
        ];
      };
      consultation_slots: {
        Row: {
          id: string;
          slot_date: string;
          start_time: string;
          end_time: string;
          is_booked: boolean;
          booked_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slot_date: string;
          start_time: string;
          end_time: string;
          is_booked?: boolean;
          booked_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slot_date?: string;
          start_time?: string;
          end_time?: string;
          is_booked?: boolean;
          booked_by?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consultation_slots_booked_by_fkey";
            columns: ["booked_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consultation_slots_booked_by_fkey";
            columns: ["booked_by"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          teacher_id: string | null;
          level: string | null;
          schedule: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          teacher_id?: string | null;
          level?: string | null;
          schedule?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          teacher_id?: string | null;
          level?: string | null;
          schedule?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      tests: {
        Row: {
          id: string;
          student_id: string | null;
          type: string;
          status: string;
          score: number | null;
          assigned_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          type: string;
          status?: string;
          score?: number | null;
          assigned_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          type?: string;
          status?: string;
          score?: number | null;
          assigned_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tests_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tests_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
