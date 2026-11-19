# Authorized Partners Admin bootstrap

This is a manual, privileged procedure for the **candidate foundation schema**. It is not a public registration flow. No step below was executed against a live database during implementation.

Prerequisites: the owner confirms the deployed master project; DNS and Auth work; the original source and live schemas have been reconciled; an operator has reviewed/approved the additive workspace migration; a staging rehearsal passes. `supabase/partner-workspace/001_workspace_candidate.sql` is outside automatic migrations intentionally. It is a 20-table foundation, not the source's complete 56-table schema. Do not run it over existing `cm365_` objects.

1. In the **confirmed master** Supabase dashboard, open Authentication → Users. Identify the existing, confirmed, unbanned AA Super Admin by UUID. Never create a replacement identity or copy password hashes.
2. Verify that UUID has `public.user_roles.role = 'supreme_admin'`. A display name, configured email or client-editable metadata does not qualify.
3. Obtain explicit operator authorization for granting this same person Partners Admin membership. Record the operator identity and change ticket in the reason below.
4. In that project's privileged SQL editor, review the complete transaction below, replace only the placeholders, and execute it once. The transaction refuses an existing conflicting Partners role or disabled/pending membership; changing those requires a separate reviewed account-lifecycle procedure.
5. Log out/in through the ordinary `/auth`, open `/partner-workspace`, and check the approved membership, active canonical account, overview and authorized API behavior. Preserve the audit entry and change ticket.

```sql
BEGIN;
-- Existing, verified AA Super Admin. No passwords or secret keys here.
SELECT set_config('cm365.bootstrap_user', 'REPLACE_WITH_EXISTING_AUTH_UUID', true);
SELECT set_config('cm365.bootstrap_reason', 'REPLACE_WITH_OPERATOR_ID_AND_CHANGE_TICKET', true);
DO $$
DECLARE
  target uuid := current_setting('cm365.bootstrap_user')::uuid;
  reason text := current_setting('cm365.bootstrap_reason');
  display_name text;
BEGIN
  IF length(reason) < 15 OR reason LIKE 'REPLACE_%' THEN
    RAISE EXCEPTION 'A meaningful operator identity and approved change ticket are required';
  END IF;
  SELECT coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Partner Admin')
    INTO display_name FROM auth.users
    WHERE id=target AND email_confirmed_at IS NOT NULL
      AND (banned_until IS NULL OR banned_until < now()) FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=target AND role='supreme_admin'
  ) THEN
    RAISE EXCEPTION 'An existing confirmed active database Super Admin is required';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cm365_memberships WHERE user_id=target
    AND (role<>'admin' OR status<>'approved')) THEN
    RAISE EXCEPTION 'Existing workspace membership requires a separate reviewed role/status change';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cm365_team_accounts WHERE user_id=target AND NOT active) THEN
    RAISE EXCEPTION 'Existing disabled team account requires a separate reviewed reactivation';
  END IF;
  INSERT INTO public.cm365_team_accounts(user_id,name,active)
    VALUES(target,display_name,true) ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.cm365_memberships(user_id,role,status)
    VALUES(target,'admin','approved') ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.cm365_activity_logs(actor,action,entity,entity_id,details)
    VALUES(target,'membership.operator_bootstrap','membership',target,
      jsonb_build_object('reason',reason,'execution','privileged SQL operator',
        'database_role',current_user,'granted_role','admin','status','approved'));
END $$;
COMMIT;
```

The audit actor identifies the verified beneficiary; `details.reason` must identify the human operator and approval ticket. This is operator attribution, not a claim that a browser session performed the SQL action. Failed transactions must be rolled back completely. Application users have no direct membership write grants, and no bootstrap HTTP endpoint exists.

For revocation, an authorized operator should disable the **Partners membership** in a separately audited transaction. Do not ban/delete the shared `auth.users` identity or remove AA roles. Runtime RLS and every workspace operation recheck membership; the next protected operation is denied. Normal staff/creator provisioning, last-admin safeguards, account role changes and creator issuance still require the original source workflow integration.
