-- The existing entity_kind and parent_company_id columns remain for migration
-- compatibility. provider_kind is authoritative for standalone AI units.
ALTER TABLE companies ADD COLUMN provider_kind TEXT NOT NULL DEFAULT 'company'
    CHECK (provider_kind IN ('company', 'ai_unit'));
