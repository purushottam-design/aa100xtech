CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in staff can read settings"
ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value) VALUES
  ('website', jsonb_build_object(
     'siteName','AA100XTech',
     'legalName','Absolute Advancement 100X Tech',
     'tagline','Premium digital & IT engineering studio',
     'domain','www.aa100xtech.com',
     'supportEmail','customer.care@aa100xtech.com',
     'phone','+91 90318 38342',
     'address','101 City Plaza, Kidwaipuri, Patna, Bihar - 800001, India',
     'hours','Mon – Sat: 10:00 AM – 7:00 PM',
     'gstin','10ABCCA6080A1ZH',
     'maintenanceMode', false,
     'announcement',''
   )),
  ('general', jsonb_build_object(
     'defaultCurrency','INR',
     'timezone','Asia/Kolkata',
     'allowSignups', true,
     'requireApproval', true,
     'bookingsEnabled', true,
     'affiliateProgramEnabled', true,
     'careersEnabled', true,
     'minPayoutThreshold', 1000
   )),
  ('email', jsonb_build_object(
     'fromName','AA100XTech',
     'fromEmail','customer.care@aa100xtech.com',
     'replyTo','customer.care@aa100xtech.com',
     'notifyBookings', true,
     'notifyAccessRequests', true,
     'notifyPartnerApplications', true,
     'notifyCandidates', true,
     'signature','Team AA100XTech'
   ))
ON CONFLICT (key) DO NOTHING;