alter table public.clients
  add column if not exists chatbot_key text;

alter table public.clients
  add column if not exists chatbot_url text;

create index if not exists clients_chatbot_key_idx
  on public.clients (chatbot_key);
