// src/lib/supabase.types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          role: "admin" | "teacher" | "student" | "parent" | string;
        };
      };
    };
  };
};
