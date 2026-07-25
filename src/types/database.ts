/**
 * Typed representation of the Supabase Postgres schema.
 *
 * Kept in sync manually with `supabase/migrations`. In a larger project this
 * file would be generated via `supabase gen types typescript`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OnboardingStatus = "pending" | "in_progress" | "completed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          company: string | null;
          role: string | null;
          team_size: string | null;
          primary_goal: string | null;
          onboarding_status: OnboardingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          company?: string | null;
          role?: string | null;
          team_size?: string | null;
          primary_goal?: string | null;
          onboarding_status?: OnboardingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          company?: string | null;
          role?: string | null;
          team_size?: string | null;
          primary_goal?: string | null;
          onboarding_status?: OnboardingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          user_id: string;
          answers: Json;
          score: number | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers?: Json;
          score?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          answers?: Json;
          score?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      summaries: {
        Row: {
          id: string;
          user_id: string;
          assessment_id: string;
          content: string;
          model: string | null;
          highlights: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          assessment_id: string;
          content: string;
          model?: string | null;
          highlights?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assessment_id?: string;
          content?: string;
          model?: string | null;
          highlights?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "summaries_assessment_id_fkey";
            columns: ["assessment_id"];
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      onboarding_status: OnboardingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
export type Summary = Database["public"]["Tables"]["summaries"]["Row"];
