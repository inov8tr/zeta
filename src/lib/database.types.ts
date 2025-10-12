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
          total_score: number | null;
          assigned_at: string | null;
          seed_start: Json | null;
          time_limit_seconds: number;
          weighted_level: number | null;
          started_at: string | null;
          last_seen_at: string | null;
          elapsed_ms: number;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          type: string;
          status?: string;
          total_score?: number | null;
          assigned_at?: string | null;
          seed_start?: Json | null;
          time_limit_seconds?: number;
          weighted_level?: number | null;
          started_at?: string | null;
          last_seen_at?: string | null;
          elapsed_ms?: number;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          type?: string;
          status?: string;
          total_score?: number | null;
          assigned_at?: string | null;
          seed_start?: Json | null;
          time_limit_seconds?: number;
          weighted_level?: number | null;
          started_at?: string | null;
          last_seen_at?: string | null;
          elapsed_ms?: number;
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
      question_passages: {
        Row: {
          id: string;
          section: string;
          level: number;
          sublevel: string;
          title: string;
          body: string;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          section: string;
          level: number;
          sublevel: string;
          title: string;
          body: string;
          tags?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          section?: string;
          level?: number;
          sublevel?: string;
          title?: string;
          body?: string;
          tags?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          section: string;
          level: number;
          sublevel: string;
          passage_id: string | null;
          stem: string;
          options: string[];
          answer_index: number;
          skill_tags: string[] | null;
          media_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          section: string;
          level: number;
          sublevel: string;
          passage_id?: string | null;
          stem: string;
          options: string[];
          answer_index: number;
          skill_tags?: string[] | null;
          media_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          section?: string;
          level?: number;
          sublevel?: string;
          passage_id?: string | null;
          stem?: string;
          options?: string[];
          answer_index?: number;
          skill_tags?: string[] | null;
          media_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_passage_id_fkey";
            columns: ["passage_id"];
            referencedRelation: "question_passages";
            referencedColumns: ["id"];
          }
        ];
      };
      test_sections: {
        Row: {
          id: string;
          test_id: string;
          section: string;
          current_level: number;
          current_sublevel: string;
          questions_served: number;
          correct_count: number;
          incorrect_count: number;
          streak_up: number;
          streak_down: number;
          completed: boolean;
          score: number | null;
          final_level: number | null;
          created_at: string;
          current_passage_id: string | null;
          current_passage_question_count: number;
        };
        Insert: {
          id?: string;
          test_id: string;
          section: string;
          current_level: number;
          current_sublevel: string;
          questions_served?: number;
          correct_count?: number;
          incorrect_count?: number;
          streak_up?: number;
          streak_down?: number;
          completed?: boolean;
          score?: number | null;
          final_level?: number | null;
          created_at?: string;
          current_passage_id?: string | null;
          current_passage_question_count?: number;
        };
        Update: {
          id?: string;
          test_id?: string;
          section?: string;
          current_level?: number;
          current_sublevel?: string;
          questions_served?: number;
          correct_count?: number;
          incorrect_count?: number;
          streak_up?: number;
          streak_down?: number;
          completed?: boolean;
          score?: number | null;
          final_level?: number | null;
          created_at?: string;
          current_passage_id?: string | null;
          current_passage_question_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "test_sections_test_id_fkey";
            columns: ["test_id"];
            referencedRelation: "tests";
            referencedColumns: ["id"];
          }
        ];
      };
      responses: {
        Row: {
          id: string;
          test_id: string;
          section: string;
          question_id: string;
          selected_index: number;
          correct: boolean;
          time_spent_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          section: string;
          question_id: string;
          selected_index: number;
          correct: boolean;
          time_spent_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          section?: string;
          question_id?: string;
          selected_index?: number;
          correct?: boolean;
          time_spent_ms?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_test_id_fkey";
            columns: ["test_id"];
            referencedRelation: "tests";
            referencedColumns: ["id"];
          }
        ];
      };
      entrance_survey: {
        Row: {
          id: string;
          student_id: string;
          answers: Json;
          score: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          answers: Json;
          score?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          answers?: Json;
          score?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entrance_survey_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      analytics_settings: {
        Row: {
          id: string;
          weights: Json;
          caps: Json;
          streak_rules: Json;
          section_max_questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          weights: Json;
          caps: Json;
          streak_rules: Json;
          section_max_questions: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          weights?: Json;
          caps?: Json;
          streak_rules?: Json;
          section_max_questions?: Json;
          created_at?: string;
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
