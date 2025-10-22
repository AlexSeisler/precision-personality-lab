export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_summaries: {
        Row: {
          calibration_id: string | null
          created_at: string
          id: string
          metrics_summary: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          calibration_id?: string | null
          created_at?: string
          id?: string
          metrics_summary: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          calibration_id?: string | null
          created_at?: string
          id?: string
          metrics_summary?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_summaries_calibration_id_fkey"
            columns: ["calibration_id"]
            isOneToOne: false
            referencedRelation: "calibrations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          source: string | null
          user_id: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          source?: string | null
          user_id: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calibrations: {
        Row: {
          answers: Json
          created_at: string | null
          frequency_penalty_max: number
          frequency_penalty_min: number
          id: string
          insights: Json
          max_tokens_max: number
          max_tokens_min: number
          mode: string
          temperature_max: number
          temperature_min: number
          top_p_max: number
          top_p_min: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string | null
          frequency_penalty_max?: number
          frequency_penalty_min?: number
          id?: string
          insights?: Json
          max_tokens_max?: number
          max_tokens_min?: number
          mode?: string
          temperature_max?: number
          temperature_min?: number
          top_p_max?: number
          top_p_min?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          frequency_penalty_max?: number
          frequency_penalty_min?: number
          id?: string
          insights?: Json
          max_tokens_max?: number
          max_tokens_min?: number
          mode?: string
          temperature_max?: number
          temperature_min?: number
          top_p_max?: number
          top_p_min?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experiment_exports: {
        Row: {
          created_at: string
          file_format: string
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_format: string
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_format?: string
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      experiments: {
        Row: {
          calibration_id: string | null
          created_at: string | null
          discarded: boolean | null
          id: string
          latency_ms: number | null
          parameters: Json
          prompt: string
          responses: Json
          saved: boolean | null
          user_id: string
        }
        Insert: {
          calibration_id?: string | null
          created_at?: string | null
          discarded?: boolean | null
          id?: string
          latency_ms?: number | null
          parameters: Json
          prompt: string
          responses?: Json
          saved?: boolean | null
          user_id: string
        }
        Update: {
          calibration_id?: string | null
          created_at?: string | null
          discarded?: boolean | null
          id?: string
          latency_ms?: number | null
          parameters?: Json
          prompt?: string
          responses?: Json
          saved?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_calibration_id_fkey"
            columns: ["calibration_id"]
            isOneToOne: false
            referencedRelation: "calibrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_audit_event: {
        Args: { p_event_data?: Json; p_event_type: string; p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
