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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      listening_events: {
        Row: {
          event_type: string
          id: string
          playlist_id: string | null
          playlist_name: string | null
          timestamp: string | null
          track_id: string
          user_id: string
        }
        Insert: {
          event_type: string
          id?: string
          playlist_id?: string | null
          playlist_name?: string | null
          timestamp?: string | null
          track_id: string
          user_id: string
        }
        Update: {
          event_type?: string
          id?: string
          playlist_id?: string | null
          playlist_name?: string | null
          timestamp?: string | null
          track_id?: string
          user_id?: string
        }
        Relationships: []
      }
      music_library: {
        Row: {
          acousticness: number | null
          added_at: string | null
          album: string | null
          artist: string | null
          danceability: number | null
          energy: number | null
          id: string
          instrumentalness: number | null
          liveness: number | null
          name: string
          popularity: number | null
          release_date: string | null
          speechiness: number | null
          tempo: number | null
          track_id: string
          user_id: string
          valence: number | null
        }
        Insert: {
          acousticness?: number | null
          added_at?: string | null
          album?: string | null
          artist?: string | null
          danceability?: number | null
          energy?: number | null
          id?: string
          instrumentalness?: number | null
          liveness?: number | null
          name: string
          popularity?: number | null
          release_date?: string | null
          speechiness?: number | null
          tempo?: number | null
          track_id: string
          user_id: string
          valence?: number | null
        }
        Update: {
          acousticness?: number | null
          added_at?: string | null
          album?: string | null
          artist?: string | null
          danceability?: number | null
          energy?: number | null
          id?: string
          instrumentalness?: number | null
          liveness?: number | null
          name?: string
          popularity?: number | null
          release_date?: string | null
          speechiness?: number | null
          tempo?: number | null
          track_id?: string
          user_id?: string
          valence?: number | null
        }
        Relationships: []
      }
      taste_snapshots: {
        Row: {
          avg_bpm: number | null
          avg_danceability: number | null
          avg_energy: number | null
          avg_valence: number | null
          created_at: string | null
          id: string
          snapshot_date: string
          total_tracks: number | null
          underground_ratio: number | null
          user_id: string
        }
        Insert: {
          avg_bpm?: number | null
          avg_danceability?: number | null
          avg_energy?: number | null
          avg_valence?: number | null
          created_at?: string | null
          id?: string
          snapshot_date: string
          total_tracks?: number | null
          underground_ratio?: number | null
          user_id: string
        }
        Update: {
          avg_bpm?: number | null
          avg_danceability?: number | null
          avg_energy?: number | null
          avg_valence?: number | null
          created_at?: string | null
          id?: string
          snapshot_date?: string
          total_tracks?: number | null
          underground_ratio?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
