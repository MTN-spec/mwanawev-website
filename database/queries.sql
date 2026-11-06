-- ============================================================================
-- THE NATIONAL MINERAL INTELLIGENCE HUB (NMIH) — CADASTRAL SQL QUERY SUITE
-- Pre-Built Queries for Owner Searches, Geological Filters & Spatial Intersections
-- ============================================================================

-- 1. SEARCH CLAIMS BY OWNER NAME, REGISTRATION NUMBER OR TAX TIN
-- Example: Query all claims owned by a specific syndicate or company
SELECT 
    c.claim_id,
    c.license_number,
    c.claim_name,
    c.tenure_status,
    o.entity_name AS owner_name,
    o.registration_number AS owner_reg_no,
    o.tax_tin_number,
    o.contact_phone,
    o.contact_email,
    c.area_hectares,
    g.primary_commodity,
    g.average_ore_grade,
    c.compliance_score
FROM mining_claims c
JOIN claim_owners o ON c.owner_id = o.owner_id
JOIN claim_geology g ON c.claim_id = g.claim_id
WHERE o.entity_name ILIKE '%Simba%' 
   OR o.registration_number ILIKE '%2023%'
ORDER BY c.area_hectares DESC;

-- 2. LOOKUP SPECIFIC CLAIM BY PRIMARY KEY (claim_id) WITH FULL GEOLOGY & OWNER DETAILS
SELECT 
    c.claim_id,
    c.license_number,
    c.claim_name,
    c.province,
    c.mining_district,
    c.area_hectares,
    c.perimeter_meters,
    c.projected_crs,
    
    -- Owner Details
    o.entity_name AS owner_name,
    o.entity_type AS owner_type,
    o.registration_number AS owner_reg,
    o.contact_person,
    o.contact_phone,
    o.beneficial_ownership_pct,
    
    -- Statutory Discovery Point (DP)
    c.dp_easting_arc1950,
    c.dp_northing_arc1950,
    c.dp_tie_bearing_str AS dp_tie_bearing,
    c.dp_tie_distance_meters AS dp_tie_distance_m,
    
    -- Geological Standard Attributes
    g.primary_commodity,
    g.metallogenic_province,
    g.geological_formation,
    g.host_rock,
    g.deposit_genesis,
    g.mineralization_style,
    g.structural_controls,
    g.average_ore_grade,
    g.estimated_resource_tonnage_mt,
    g.contained_metal_content,
    g.resource_category,
    
    -- Compliance & Environment
    c.compliance_score,
    c.ema_eia_certificate_no,
    c.zimparks_status
FROM mining_claims c
JOIN claim_owners o ON c.owner_id = o.owner_id
JOIN claim_geology g ON c.claim_id = g.claim_id
WHERE c.claim_id = 'ZIM-MBE-001';

-- 3. FILTER CLAIMS BY GEOLOGICAL CRITERIA (e.g. All Shear-Hosted Gold Claims in Archaean Belts)
SELECT 
    c.claim_id,
    c.claim_name,
    c.mining_district,
    g.primary_commodity,
    g.geological_formation,
    g.host_rock,
    g.deposit_genesis,
    g.average_ore_grade,
    g.estimated_resource_tonnage_mt,
    o.entity_name AS owner_name
FROM mining_claims c
JOIN claim_geology g ON c.claim_id = g.claim_id
JOIN claim_owners o ON c.owner_id = o.owner_id
WHERE g.primary_commodity ILIKE '%Gold%'
  AND g.deposit_genesis = 'Orogenic Lode Gold (Shear-Hosted)'
ORDER BY g.estimated_resource_tonnage_mt DESC NULLS LAST;

-- 4. SPATIAL BUFFER & OVERLAP CHECK (POSTGIS SQL)
-- Query all claims within a 15km radius of a specific exploration point (using Arc 1950 UTM Zone 36S metric coordinates)
SELECT 
    c.claim_id,
    c.claim_name,
    c.mining_district,
    o.entity_name AS owner_name,
    g.primary_commodity,
    ROUND(ST_Distance(c.geom_arc1950, ST_SetSRID(ST_Point(300000, 7820000), 20936)) / 1000.0, 2) AS distance_km
FROM mining_claims c
JOIN claim_owners o ON c.owner_id = o.owner_id
JOIN claim_geology g ON c.claim_id = g.claim_id
WHERE ST_DWithin(c.geom_arc1950, ST_SetSRID(ST_Point(300000, 7820000), 20936), 15000)
ORDER BY distance_km ASC;

-- 5. TOTAL RESOURCE INVENTORY BY PROVINCE & COMMODITY
SELECT 
    c.province,
    g.primary_commodity,
    COUNT(c.claim_id) AS total_claims,
    ROUND(SUM(c.area_hectares), 2) AS total_hectares,
    ROUND(SUM(g.estimated_resource_tonnage_mt), 3) AS total_resource_tonnage_mt
FROM mining_claims c
JOIN claim_geology g ON c.claim_id = g.claim_id
GROUP BY c.province, g.primary_commodity
ORDER BY c.province, total_resource_tonnage_mt DESC NULLS LAST;
