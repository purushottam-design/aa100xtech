import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { InfluencerApplication, InfluencerProfile } from "./influencers";
import type { PartnerReferral, PartnerStats, PartnerTestimonial } from "./influencer-program";

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
      influencer_client_referrals: {
        Row: PartnerReferral & {
          confirmed_by: string | null;
          updated_by: string;
          updated_at: string;
        };
        Insert: Partial<PartnerReferral> & {
          profile_id: string;
          client_reference: string;
          updated_by: string;
          confirmed_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<PartnerReferral> & {
          confirmed_by?: string | null;
          updated_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      influencer_testimonials: {
        Row: PartnerTestimonial & {
          publication_status: string;
          consent_confirmed: boolean;
          approved_by: string;
          updated_at: string;
        };
        Insert: Partial<PartnerTestimonial> & {
          profile_id: string;
          quote: string;
          publication_status: string;
          consent_confirmed: boolean;
          approved_by: string;
          updated_at?: string;
        };
        Update: Partial<PartnerTestimonial> & {
          publication_status?: string;
          consent_confirmed?: boolean;
          approved_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      take_influencer_submission_slot: { Args: { rate_key: string }; Returns: boolean };
      get_influencer_partner_stats: { Args: Record<string, never>; Returns: PartnerStats[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
// Keep migration-local types separate from the generated project schema.
export const influencerAdmin = supabaseAdmin as unknown as SupabaseClient<InfluencerDatabase>;
