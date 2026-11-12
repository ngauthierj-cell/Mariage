// Types de la base, au format `supabase gen types typescript`.
// Écrits à la main tant qu'aucun projet Supabase n'est relié :
// une fois le projet lié, régénérer avec `npm run db:types`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      weddings: {
        Row: {
          id: string;
          partner_a_name: string;
          partner_b_name: string;
          date_precision: Database["public"]["Enums"]["date_precision"];
          wedding_date: string | null;
          venue_name: string | null;
          venue_city: string | null;
          is_abroad: boolean;
          ceremony_types: Database["public"]["Enums"]["ceremony_type"][];
          estimated_guests: number | null;
          total_budget_cents: number | null;
          has_bachelor_parties: boolean;
          has_stationery: boolean;
          has_registry: boolean;
          has_honeymoon: boolean;
          rsvp_token: string;
          rsvp_enabled: boolean;
          rsvp_deadline: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_a_name: string;
          partner_b_name: string;
          date_precision?: Database["public"]["Enums"]["date_precision"];
          wedding_date?: string | null;
          venue_name?: string | null;
          venue_city?: string | null;
          is_abroad?: boolean;
          ceremony_types?: Database["public"]["Enums"]["ceremony_type"][];
          estimated_guests?: number | null;
          total_budget_cents?: number | null;
          has_bachelor_parties?: boolean;
          has_stationery?: boolean;
          has_registry?: boolean;
          has_honeymoon?: boolean;
          rsvp_token?: string;
          rsvp_enabled?: boolean;
          rsvp_deadline?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weddings"]["Insert"]>;
        Relationships: [];
      };
      wedding_members: {
        Row: {
          wedding_id: string;
          user_id: string;
          side: Database["public"]["Enums"]["wedding_side"];
          joined_at: string;
        };
        Insert: {
          wedding_id: string;
          user_id: string;
          side: Database["public"]["Enums"]["wedding_side"];
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wedding_members"]["Insert"]>;
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
      partner_invitations: {
        Row: {
          id: string;
          wedding_id: string;
          token_hash: string;
          created_by: string | null;
          created_at: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          token_hash: string;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["partner_invitations"]["Insert"]>;
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
      vendor_categories: {
        Row: { code: string; label: string; sort: number };
        Insert: { code: string; label: string; sort?: number };
        Update: { code?: string; label?: string; sort?: number };
        Relationships: [];
      };
      wedding_vendor_needs: {
        Row: { wedding_id: string; category_code: string; created_at: string };
        Insert: { wedding_id: string; category_code: string; created_at?: string };
        Update: { wedding_id?: string; category_code?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "wedding_vendor_needs_wedding_id_fkey";
            columns: ["wedding_id"];
            isOneToOne: false;
            referencedRelation: "weddings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wedding_vendor_needs_category_code_fkey";
            columns: ["category_code"];
            isOneToOne: false;
            referencedRelation: "vendor_categories";
            referencedColumns: ["code"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_wedding_member: { Args: { target_wedding_id: string }; Returns: boolean };
      current_wedding_id: { Args: Record<PropertyKey, never>; Returns: string | null };
    };
    Enums: {
      ceremony_type: "civile" | "religieuse" | "laique";
      date_precision: "day" | "month" | "unknown";
      wedding_side: "A" | "B";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
