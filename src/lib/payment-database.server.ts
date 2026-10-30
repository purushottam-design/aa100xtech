import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@/lib/backend/request-context.server";

type Bookings = Database["public"]["Tables"]["consultation_bookings"];
type PaymentFields = {
  customer_id: string | null;
  payment_gateway: "razorpay" | "icici";
  gateway_order_id: string | null;
  gateway_transaction_id: string | null;
  paid_at: string | null;
};
type PaymentDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Omit<Database["public"]["Tables"], "consultation_bookings"> & {
      consultation_bookings: Omit<Bookings, "Row" | "Insert" | "Update"> & {
        Row: Bookings["Row"] & PaymentFields;
        Insert: Bookings["Insert"] & Partial<PaymentFields>;
        Update: Bookings["Update"] & Partial<PaymentFields>;
      };
    };
  };
};
export const paymentAdmin = supabaseAdmin as unknown as SupabaseClient<PaymentDatabase>;

/** Account association is verified from the existing session, never form input.
 * Guest bookings remain valid, including on deployments predating the migration. */
export async function associatePaymentCustomer(bookingId: string) {
  const authorization = getRequestHeader("authorization");
  if (!authorization?.startsWith("Bearer ")) return;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(authorization.slice(7));
    if (error || !data.user) return;
    const { error: updateError } = await paymentAdmin
      .from("consultation_bookings")
      .update({ customer_id: data.user.id })
      .eq("booking_id", bookingId);
    if (updateError) console.error("Payment customer association unavailable; booking retained.");
  } catch {
    console.error("Payment customer association unavailable; booking retained.");
  }
}
