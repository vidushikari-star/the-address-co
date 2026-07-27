create table property_documents (

  id uuid primary key default gen_random_uuid(),

  property_id uuid not null references properties(id) on delete cascade,

  name text not null,

  category text not null default 'other',

  file_url text not null,

  file_type text,

  created_at timestamp with time zone default now()

);


create index property_documents_property_id_idx
on property_documents(property_id);