import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
export type NotificationStatus = "pending" | "sent" | "failed" | "not_configured";
export type WebsiteRequestRow = {
  id: string;
  kind: string;
  payload: Record<string, string | null>;
  payload_hash: string;
  email_hash: string;
  recipient: string;
  notification_status: NotificationStatus;
  created_at: string;
};
type WebsiteDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      website_requests: {
        Row: WebsiteRequestRow;
        Insert: WebsiteRequestRow;
        Update: Partial<WebsiteRequestRow>;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      submit_website_request: {
        Args: {
          request_id: string;
          request_kind: string;
          request_payload: Record<string, string | null>;
          request_hash: string;
          sender_hash: string;
          destination: string;
        };
        Returns: boolean;
      };
    };
  };
};
export const websiteAdmin = supabaseAdmin as unknown as SupabaseClient<WebsiteDatabase>;
