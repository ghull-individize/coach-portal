alter table public.clients
  add column if not exists chatbot_id text;

alter table public.clients
  add column if not exists chatbot_url text;

create index if not exists clients_chatbot_id_idx
  on public.clients (chatbot_id);
