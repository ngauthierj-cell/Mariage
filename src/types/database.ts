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
      partner_invitations: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          revoked_at: string | null;
          token_hash: string;
          used_at: string | null;
          used_by: string | null;
          wedding_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          token_hash: string;
          used_at?: string | null;
          used_by?: string | null;
          wedding_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          token_hash?: string;
          used_at?: string | null;
          used_by?: string | null;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_invitations_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_categories: {
        Row: {
          code: string;
          label: string;
          sort: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          label: string;
          sort?: number;
        };
        Update: {
          code?: string;
          label?: string;
          sort?: number;
        };
        Relationships: [];
      };
      wedding_members: {
        Row: {
          joined_at: string;
          side: Database["public"]["Enums"]["wedding_side"];
          user_id: string;
          wedding_id: string;
        };
        ComputedFields: never;
        Insert: {
          joined_at?: string;
          side: Database["public"]["Enums"]["wedding_side"];
          user_id: string;
          wedding_id: string;
        };
        Update: {
          joined_at?: string;
          side?: Database["public"]["Enums"]["wedding_side"];
          user_id?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wedding_members_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      wedding_vendor_needs: {
        Row: {
          category_code: string;
          created_at: string;
          wedding_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_code: string;
          created_at?: string;
          wedding_id: string;
        };
        Update: {
          category_code?: string;
          created_at?: string;
          wedding_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wedding_vendor_needs_category_code_fkey";
            columns: ["category_code"];
            isOneToOne: false;
            referencedRelation: "vendor_categories";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "wedding_vendor_needs_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
        ];
      };
      weddings: {
        Row: {
          ceremony_types: Database["public"]["Enums"]["ceremony_type"][];
          created_at: string;
          created_by: string | null;
          date_precision: Database["public"]["Enums"]["date_precision"];
          estimated_guests: number | null;
          has_bachelor_parties: boolean;
          has_honeymoon: boolean;
          has_registry: boolean;
          has_stationery: boolean;
          id: string;
          is_abroad: boolean;
          partner_a_name: string;
          partner_b_name: string;
          rsvp_deadline: string | null;
          rsvp_enabled: boolean;
          rsvp_token: string;
          total_budget_cents: number | null;
          updated_at: string;
          venue_city: string | null;
          venue_name: string | null;
          wedding_date: string | null;
        };
        ComputedFields: never;
        Insert: {
          ceremony_types?: Database["public"]["Enums"]["ceremony_type"][];
          created_at?: string;
          created_by?: string | null;
          date_precision?: Database["public"]["Enums"]["date_precision"];
          estimated_guests?: number | null;
          has_bachelor_parties?: boolean;
          has_honeymoon?: boolean;
          has_registry?: boolean;
          has_stationery?: boolean;
          id?: string;
          is_abroad?: boolean;
          partner_a_name: string;
          partner_b_name: string;
          rsvp_deadline?: string | null;
          rsvp_enabled?: boolean;
          rsvp_token?: string;
          total_budget_cents?: number | null;
          updated_at?: string;
          venue_city?: string | null;
          venue_name?: string | null;
          wedding_date?: string | null;
        };
        Update: {
          ceremony_types?: Database["public"]["Enums"]["ceremony_type"][];
          created_at?: string;
          created_by?: string | null;
          date_precision?: Database["public"]["Enums"]["date_precision"];
          estimated_guests?: number | null;
          has_bachelor_parties?: boolean;
          has_honeymoon?: boolean;
          has_registry?: boolean;
          has_stationery?: boolean;
          id?: string;
          is_abroad?: boolean;
          partner_a_name?: string;
          partner_b_name?: string;
          rsvp_deadline?: string | null;
          rsvp_enabled?: boolean;
          rsvp_token?: string;
          total_budget_cents?: number | null;
          updated_at?: string;
          venue_city?: string | null;
          venue_name?: string | null;
          wedding_date?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_partner_invitation: { Args: { p_token: string }; Returns: string };
      create_partner_invitation: {
        Args: Record<PropertyKey, never>;
        Returns: {
          expires_at: string;
          token: string;
        }[];
      };
      create_wedding: {
        Args: {
          p_ceremony_types?: Database["public"]["Enums"]["ceremony_type"][];
          p_date_precision?: Database["public"]["Enums"]["date_precision"];
          p_estimated_guests?: number;
          p_has_bachelor_parties?: boolean;
          p_has_honeymoon?: boolean;
          p_has_registry?: boolean;
          p_has_stationery?: boolean;
          p_is_abroad?: boolean;
          p_partner_a_name: string;
          p_partner_b_name: string;
          p_total_budget_cents?: number;
          p_vendor_codes?: string[];
          p_venue_city?: string;
          p_venue_name?: string;
          p_wedding_date?: string;
        };
        Returns: string;
      };
      current_wedding_id: { Args: Record<PropertyKey, never>; Returns: string };
      generate_token: { Args: Record<PropertyKey, never>; Returns: string };
      hash_token: { Args: { p_token: string }; Returns: string };
      is_wedding_member: {
        Args: { target_wedding_id: string };
        Returns: boolean;
      };
      preview_partner_invitation: {
        Args: { p_token: string };
        Returns: {
          partner_a_name: string;
          partner_b_name: string;
          status: string;
        }[];
      };
      revoke_partner_invitation: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      ceremony_type: "civile" | "religieuse" | "laique";
      date_precision: "day" | "month" | "unknown";
      wedding_side: "A" | "B";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      ceremony_type: ["civile", "religieuse", "laique"],
      date_precision: ["day", "month", "unknown"],
      wedding_side: ["A", "B"],
    },
  },
} as const;
