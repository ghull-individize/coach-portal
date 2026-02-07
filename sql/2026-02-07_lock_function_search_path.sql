-- Replace ARG_SIGNATURE below with the exact argument signature from pg_get_function_identity_arguments()

-- Example:
-- alter function public.handle_new_user() set search_path = public, pg_temp;

alter function public.set_updated_at(ARG_SIGNATURE) set search_path = public, pg_temp;
alter function public.handle_new_user(ARG_SIGNATURE) set search_path = public, pg_temp;
alter function public.generate_coach_key(ARG_SIGNATURE) set search_path = public, pg_temp;
