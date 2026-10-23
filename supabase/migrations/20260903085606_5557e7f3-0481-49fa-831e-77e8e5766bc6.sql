CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL DEFAULT 'service', name text NOT NULL,
  slug text NOT NULL UNIQUE, category text, description text, landing_url text NOT NULL,
  default_commission_type text NOT NULL DEFAULT 'percent', default_commission_value numeric NOT NULL DEFAULT 10,
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb, recurring boolean NOT NULL DEFAULT false,
  cookie_duration_days integer NOT NULL DEFAULT 30, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalog_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_items TO service_role;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active catalog items" ON public.catalog_items FOR SELECT TO anon, authenticated USING (active OR private.has_role(auth.uid(), 'supreme_admin'));
CREATE POLICY "Supreme admin manages catalog" ON public.catalog_items FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin')) WITH CHECK (private.has_role(auth.uid(), 'supreme_admin'));
CREATE TRIGGER catalog_items_set_updated_at BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE, affiliate_code text NOT NULL UNIQUE,
  entity_type text NOT NULL DEFAULT 'individual', full_name text NOT NULL, company_name text, email text NOT NULL,
  phone text, country text, audience_note text, kyc_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb, payout_method text, status text NOT NULL DEFAULT 'pending',
  tier text NOT NULL DEFAULT 'bronze', custom_commission_type text, custom_commission_value numeric,
  min_payout_threshold numeric NOT NULL DEFAULT 1000, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own record" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'supreme_admin'));
CREATE POLICY "Affiliates create own record" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Affiliates update own record" ON public.affiliates FOR UPDATE TO authenticated USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'supreme_admin')) WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'supreme_admin'));
CREATE TRIGGER affiliates_set_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referral_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
 catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE, unique_slug text NOT NULL UNIQUE,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (affiliate_id, catalog_item_id)
);
GRANT SELECT ON public.referral_links TO authenticated;
GRANT ALL ON public.referral_links TO service_role;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own links" ON public.referral_links FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE TABLE public.coupon_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
 catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE CASCADE, code text NOT NULL UNIQUE,
 discount_type text NOT NULL DEFAULT 'percent', discount_value numeric NOT NULL DEFAULT 10,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_codes TO authenticated;
GRANT ALL ON public.coupon_codes TO service_role;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own coupons" ON public.coupon_codes FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE TABLE public.affiliate_clicks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
 catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE CASCADE, referral_link_id uuid REFERENCES public.referral_links(id) ON DELETE SET NULL,
 coupon_code_id uuid REFERENCES public.coupon_codes(id) ON DELETE SET NULL, ip_hash text, device text, source text,
 is_duplicate boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own clicks" ON public.affiliate_clicks FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE TABLE public.conversions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
 catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE SET NULL, coupon_code_id uuid REFERENCES public.coupon_codes(id) ON DELETE SET NULL,
 event_type text NOT NULL DEFAULT 'sale', order_id text NOT NULL, order_value numeric NOT NULL DEFAULT 0,
 currency text NOT NULL DEFAULT 'INR', commission_earned numeric NOT NULL DEFAULT 0, is_recurring boolean NOT NULL DEFAULT false,
 attribution text NOT NULL DEFAULT 'link', status text NOT NULL DEFAULT 'pending', payout_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (order_id, catalog_item_id, is_recurring, created_at)
);
GRANT SELECT ON public.conversions TO authenticated;
GRANT ALL ON public.conversions TO service_role;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own conversions" ON public.conversions FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE TRIGGER conversions_set_updated_at BEFORE UPDATE ON public.conversions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payouts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
 amount numeric NOT NULL, currency text NOT NULL DEFAULT 'INR', method text, reference text, note text,
 status text NOT NULL DEFAULT 'requested', requested_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own payouts" ON public.payouts FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Affiliates request own payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE TRIGGER payouts_set_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_conversions_affiliate ON public.conversions(affiliate_id, created_at DESC);
CREATE INDEX idx_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at DESC);