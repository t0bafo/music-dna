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
      crate_tracks: {
        Row: {
          added_at: string
          crate_id: string
          id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          crate_id: string
          id?: string
          position?: number
          track_id: string
        }
        Update: {
          added_at?: string
          crate_id?: string
          id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crate_tracks_crate_id_fkey"
            columns: ["crate_id"]
            isOneToOne: false
            referencedRelation: "crates"
            referencedColumns: ["id"]
          },
        ]
      }
      crates: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          last_synced_at: string | null
          name: string
          spotify_playlist_id: string | null
          sync_enabled: boolean | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
          vibe_keywords: string[] | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          spotify_playlist_id?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
          vibe_keywords?: string[] | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          spotify_playlist_id?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
          vibe_keywords?: string[] | null
        }
        Relationships: []
      }
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
          album_art_url: string | null
          artist: string | null
          artist_genres: string[] | null
          artist_id: string | null
          danceability: number | null
          duration_ms: number | null
          energy: number | null
          id: string
          instrumentalness: number | null
          liveness: number | null
          name: string
          popularity: number | null
          preview_url: string | null
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
          album_art_url?: string | null
          artist?: string | null
          artist_genres?: string[] | null
          artist_id?: string | null
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          id?: string
          instrumentalness?: number | null
          liveness?: number | null
          name: string
          popularity?: number | null
          preview_url?: string | null
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
          album_art_url?: string | null
          artist?: string | null
          artist_genres?: string[] | null
          artist_id?: string | null
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          id?: string
          instrumentalness?: number | null
          liveness?: number | null
          name?: string
          popularity?: number | null
          preview_url?: string | null
          release_date?: string | null
          speechiness?: number | null
          tempo?: number | null
          track_id?: string
          user_id?: string
          valence?: number | null
        }
        Relationships: []
      }
      tag_assignments: {
        Row: {
          approved: boolean | null
          confidence: number | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          source: string
          tag_id: string
        }
        Insert: {
          approved?: boolean | null
          confidence?: number | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          source?: string
          tag_id: string
        }
        Update: {
          approved?: boolean | null
          confidence?: number | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "vibe_tags"
            referencedColumns: ["id"]
          },
        ]
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
      track_cache: {
        Row: {
          album_art_url: string | null
          album_name: string | null
          artist_genres: string[] | null
          artist_id: string | null
          artist_name: string | null
          bpm: number | null
          danceability: number | null
          duration_ms: number | null
          energy: number | null
          fetched_at: string
          name: string
          popularity: number | null
          preview_url: string | null
          track_id: string
          valence: number | null
        }
        Insert: {
          album_art_url?: string | null
          album_name?: string | null
          artist_genres?: string[] | null
          artist_id?: string | null
          artist_name?: string | null
          bpm?: number | null
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          fetched_at?: string
          name: string
          popularity?: number | null
          preview_url?: string | null
          track_id: string
          valence?: number | null
        }
        Update: {
          album_art_url?: string | null
          album_name?: string | null
          artist_genres?: string[] | null
          artist_id?: string | null
          artist_name?: string | null
          bpm?: number | null
          danceability?: number | null
          duration_ms?: number | null
          energy?: number | null
          fetched_at?: string
          name?: string
          popularity?: number | null
          preview_url?: string | null
          track_id?: string
          valence?: number | null
        }
        Relationships: []
      }
      vibe_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          tag_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tag_type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tag_type?: string
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
