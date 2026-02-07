select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='clients'
  and column_name in ('chatbot_id','chatbot_url')
order by column_name;
