-- Supports the exact benchmark and company name arms of global search.
-- Model names, Registry Nos., and aliases are already covered by 0001 indexes.
CREATE INDEX idx_benchmarks_normalized_name ON benchmarks(normalized_name);
CREATE INDEX idx_companies_normalized_name ON companies(normalized_name);
