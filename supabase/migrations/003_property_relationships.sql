-- ==========================================================
-- PROPERTY CONTACTS & COMMISSIONS
-- ==========================================================


-- ==========================================================
-- PROPERTY CONTACT RELATIONSHIPS
-- Owner / Developer / MOU Holder / Broker
-- ==========================================================


create table property_contacts (

    id uuid primary key default gen_random_uuid(),


    property_id uuid not null
        references properties(id)
        on delete cascade,


    contact_id uuid not null
        references contacts(id)
        on delete cascade,


    relationship_type text not null
        check (
            relationship_type in (
                'owner',
                'developer',
                'mou_holder',
                'broker'
            )
        ),


    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),


    unique(
        property_id,
        contact_id,
        relationship_type
    )

);



create index property_contacts_property_id_idx
on property_contacts(property_id);


create index property_contacts_contact_id_idx
on property_contacts(contact_id);






-- ==========================================================
-- PROPERTY COMMISSION RULES
-- ==========================================================


create table property_commissions (

    id uuid primary key default gen_random_uuid(),


    property_id uuid not null
        references properties(id)
        on delete cascade,


    contact_id uuid
        references contacts(id)
        on delete set null,


    transaction_type text not null
        check (
            transaction_type in (
                'Sale',
                'Rental'
            )
        ),



    source_type text not null
        check (
            source_type in (
                'owner',
                'client',
                'developer',
                'mou_holder',
                'broker'
            )
        ),



    commission_type text not null
        check (
            commission_type in (
                'percentage',
                'fixed',
                'monthly_rent'
            )
        ),



    percentage numeric(5,2),


    amount numeric(14,2),



    notes text,


    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);



create index property_commissions_property_id_idx
on property_commissions(property_id);



create index property_commissions_contact_id_idx
on property_commissions(contact_id);







-- ==========================================================
-- UPDATED TIMESTAMP TRIGGERS
-- ==========================================================


create trigger update_property_contacts_updated_at

before update on property_contacts

for each row

execute function update_updated_at_column();



create trigger update_property_commissions_updated_at

before update on property_commissions

for each row

execute function update_updated_at_column();