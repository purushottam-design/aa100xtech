import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { InfluencerApplication, InfluencerProfile } from "./influencers";

type ApplicationRow = Database["public"]["Tables"]["partner_applications"]["Row"] &
  Omit<InfluencerApplication, "profile"> & {
    is_influencer: boolean;
    consent_recorded_at: string | null;
  };
export type InfluencerDatabase = {
  public: {
    Tables: {
      partner_applications: {
        Row: ApplicationRow;
        Insert: Partial<ApplicationRow> & { full_name: string; email: string };
        Update: Partial<ApplicationRow>;
        Relationships: [];
      };
      influencer_profiles: {
        Row: InfluencerProfile;
        Insert: Omit<InfluencerProfile, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<InfluencerProfile>;
        Relationships: [
          {
            foreignKeyName: "influencer_profiles_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: true;
            referencedRelation: "partner_applications";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      take_influencer_submission_slot: { Args: { rate_key: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
// Keep migration-local types separate from the generated project schema.
export const influencerAdmin = supabaseAdmin as unknown as SupabaseClient<InfluencerDatabase>;
