ALTER TABLE companies ADD COLUMN entity_kind TEXT NOT NULL DEFAULT 'company'
    CHECK (entity_kind IN ('company', 'ai_unit'));

ALTER TABLE companies ADD COLUMN parent_company_id INTEGER REFERENCES companies(id)
    CHECK (
        (entity_kind = 'company' AND parent_company_id IS NULL)
        OR (entity_kind = 'ai_unit' AND parent_company_id IS NOT NULL)
    );

ALTER TABLE companies ADD COLUMN established_basis TEXT NOT NULL DEFAULT 'source'
    CHECK (established_basis IN ('source', 'user_attested'));

ALTER TABLE companies ADD COLUMN established_attestation_ref TEXT;

ALTER TABLE companies ADD COLUMN established_attested_at TEXT
    CHECK (
        (established_basis = 'source'
            AND established_attestation_ref IS NULL
            AND established_attested_at IS NULL)
        OR (established_basis = 'user_attested'
            AND established_at IS NOT NULL
            AND established_attestation_ref IS NOT NULL
            AND established_attested_at IS NOT NULL)
    );
