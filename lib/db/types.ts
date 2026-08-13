export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          source_url: string;
          title: string | null;
          duration_seconds: number | null;
          status: "pending" | "processing" | "ready" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_url: string;
          title?: string | null;
          duration_seconds?: number | null;
          status?: "pending" | "processing" | "ready" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_url?: string;
          title?: string | null;
          duration_seconds?: number | null;
          status?: "pending" | "processing" | "ready" | "failed";
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          project_id: string;
          type: "ingest" | "transcribe_chunk" | "analyze";
          status: "queued" | "running" | "done" | "failed";
          attempts: number;
          payload: Json;
          error: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: "ingest" | "transcribe_chunk" | "analyze";
          status?: "queued" | "running" | "done" | "failed";
          attempts?: number;
          payload?: Json;
          error?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          type?: "ingest" | "transcribe_chunk" | "analyze";
          status?: "queued" | "running" | "done" | "failed";
          attempts?: number;
          payload?: Json;
          error?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      transcript_segments: {
        Row: {
          id: string;
          project_id: string;
          start_seconds: number;
          end_seconds: number;
          speaker_label: string | null;
          text: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          start_seconds: number;
          end_seconds: number;
          speaker_label?: string | null;
          text: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          start_seconds?: number;
          end_seconds?: number;
          speaker_label?: string | null;
          text?: string;
        };
      };
      candidate_moments: {
        Row: {
          id: string;
          project_id: string;
          start_seconds: number;
          end_seconds: number;
          score: number;
          rationale: string;
          tag: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          start_seconds: number;
          end_seconds: number;
          score: number;
          rationale: string;
          tag?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          start_seconds?: number;
          end_seconds?: number;
          score?: number;
          rationale?: string;
          tag?: string | null;
          created_at?: string;
        };
      };
      moment_decisions: {
        Row: {
          id: string;
          candidate_moment_id: string;
          decision: "used" | "not_useful";
          actual_start_seconds: number | null;
          actual_end_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_moment_id: string;
          decision: "used" | "not_useful";
          actual_start_seconds?: number | null;
          actual_end_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_moment_id?: string;
          decision?: "used" | "not_useful";
          actual_start_seconds?: number | null;
          actual_end_seconds?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
