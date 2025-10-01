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
        };
        Insert: {
          user_id: string;
          role: "admin" | "teacher" | "student" | "parent" | string;
        };
        Update: {
          user_id?: string;
          role?: "admin" | "teacher" | "student" | "parent" | string;
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
