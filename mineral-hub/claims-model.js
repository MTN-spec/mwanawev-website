/**
 * ============================================================================
 * THE NATIONAL MINERAL INTELLIGENCE HUB — CLAIMS & GEOLOGY SCHEMA MODEL
 * PostGIS Relational Entity Model & Geological Standards Specification
 * MTN-SPEC (Pvt) Ltd — Zimbabwe National Innovation Specification 2026
 * ============================================================================
 */

(function () {
    console.log("🏛️ [Cadastre Schema] Loading Geological Standard & Relational Attributes Model...");

    const GEOLOGICAL_STANDARDS = {
        PROVINCES: [
            "Great Dyke Layered Ultramafic Complex",
            "Mberengwa Archaean Greenstone Belt",
            "Midlands Archaean Greenstone Belt",
            "Harare-Bindura-Shamva Greenstone Belt",
            "Bikita Pegmatite Belt",
            "Gwanda Archaean Greenstone Belt",
            "Magondi Copper-Silver Basin",
            "Limpopo Mobile Belt"
        ],
        DEPOSIT_GENESIS: [
            "Orogenic Lode Gold (Shear-Hosted)",
            "Stratiform Magmatic Layered PGM-Cr Reef (MSZ Type)",
            "LCT Granitic Pegmatite (Spodumene/Petalite)",
            "Podiform Ultramafic Chromite",
            "Banded Iron Formation (BIF Hosted Au/Fe)",
            "Volcanogenic Massive Sulfide (VMS)",
            "Carbonatite Rare Earth Complex",
            "Kimberlitic Diamondiferous Placer"
        ],
        COMMODITIES: [
            { name: "Gold (Au)", code: "Au", unit: "g/t Au", defGrade: "4.50 g/t Au" },
            { name: "Platinum Group Metals (PGM)", code: "PGE", unit: "g/t 4E", defGrade: "3.85 g/t 4E" },
            { name: "Lithium (Spodumene/Petalite)", code: "Li", unit: "% Li2O", defGrade: "1.65% Li2O" },
            { name: "Chromite & PGM", code: "Cr", unit: "% Cr2O3", defGrade: "44.5% Cr2O3" },
            { name: "Copper & Base Metals", code: "Cu", unit: "% Cu", defGrade: "2.10% Cu" },
            { name: "Nickel", code: "Ni", unit: "% Ni", defGrade: "0.85% Ni" }
        ]
    };

    // Standardized Seed Claims Matching the Relational PostgreSQL Schema
    const RELATIONAL_SEED_CLAIMS = [
        {
            id: "ZIM-MBE-001",
            claim_id: "ZIM-MBE-001",
            name: "Matanga Mine - Simba",
            license_no: "MC-HAR-202609081",
            claim_type: "Precious Metals (Gold/Silver)",
            tenure_status: "Active Gazetted",
            mineral: "Gold (Au)",
            province: "Midlands",
            district: "Mberengwa",
            ward: "Ward 14 (Matanga)",
            area_hectares: 420.0,
            yield_rating: "High Yield",
            status: "Active",
            compliance_score: 96,
            lat: -20.7650,
            lng: 30.2000,
            // Owner Attributes for SQL Queries
            owner: {
                owner_id: "OWN-ZW-005",
                name: "Matanga - Simba Mining Syndicate",
                type: "Syndicate",
                registration_no: "SYND-MBE-2023-0199",
                tax_tin: "BP-4000331908",
                contact_person: "Simbarashe Zhou",
                phone: "+263 78 512 8844",
                email: "matanga.simba@mining.co.zw",
                beneficial_ownership_pct: 100.00
            },
            operator: "Matanga Artisanal Syndicate",
            // Geological Standard Attributes
            geology: {
                primary_commodity: "Gold (Au)",
                commodity_code: "Au",
                secondary_commodities: ["Silver", "Antimony"],
                metallogenic_province: "Mberengwa Archaean Greenstone Belt",
                formation: "Bulawayan Group Greenstones",
                host_rock: "Quartz-Carbonate Vein in Chlorite-Talc Schist",
                deposit_genesis: "Orogenic Lode Gold (Shear-Hosted)",
                mineralization_style: "Hydrothermal Quartz Shear Lode",
                structural_controls: "Brittle-Ductile Shear Zone abutting BIF contact",
                strike_length_m: 1450.0,
                average_thickness_m: 2.80,
                ore_grade: "4.85 g/t Au",
                cut_off_grade: "1.20 g/t Au",
                resource_tonnage_mt: 2.85,
                contained_metal: "444,000 oz Contained Gold",
                resource_category: "Measured & Indicated"
            },
            // Discovery Point (DP) & Survey Tie
            dp: {
                lat: -20.7650,
                lng: 30.2000,
                easting_arc1950: 312450.0,
                northing_arc1950: 7702800.0,
                tie_beacon: "B1",
                tie_bearing: "044° 12' 18\"",
                tie_distance_m: 245.8
            },
            bounds: [
                [-20.750, 30.180],
                [-20.750, 30.220],
                [-20.780, 30.220],
                [-20.780, 30.180]
            ]
        },
        {
            id: "ZIM-GD-001",
            claim_id: "ZIM-GD-001",
            name: "Selukwe Chrome Concession",
            license_no: "MC-SHU-2024-8841",
            claim_type: "Chrome & Iron Ore (Podiform/Stratiform)",
            tenure_status: "Active Gazetted",
            mineral: "Chromite & PGM",
            province: "Midlands",
            district: "Shurugwi, Midlands",
            ward: "Ward 3 (Peak Mine)",
            area_hectares: 340.5,
            yield_rating: "High Yield",
            status: "Active",
            compliance_score: 94,
            lat: -19.6700,
            lng: 30.0050,
            owner: {
                owner_id: "OWN-ZW-001",
                name: "ZIMASCO Artisanal Syndicate Limited",
                type: "Syndicate",
                registration_no: "SYND-SHU-2021-0044",
                tax_tin: "BP-2000881920",
                contact_person: "Kudzai Mpofu",
                phone: "+263 77 219 4410",
                email: "operations@zimasco-syndicate.co.zw",
                beneficial_ownership_pct: 100.00
            },
            operator: "ZIMASCO Surface Extraction Syndicate",
            geology: {
                primary_commodity: "Chromite & PGM",
                commodity_code: "Cr",
                secondary_commodities: ["Platinum", "Palladium", "Nickel"],
                metallogenic_province: "Great Dyke Layered Ultramafic Complex",
                formation: "Great Dyke Ultramafic Sequence",
                host_rock: "Chromitite Seam hosted in Dunite / Harzburgite",
                deposit_genesis: "Stratiform Magmatic Layered PGM-Cr Reef (MSZ Type)",
                mineralization_style: "Massive Seam & Podiform Chromitite",
                structural_controls: "Transverse Graben Synclinal Keel Faulting",
                strike_length_m: 2800.0,
                average_thickness_m: 1.40,
                ore_grade: "44.5% Cr2O3 (Cr:Fe 2.4:1)",
                cut_off_grade: "32.0% Cr2O3",
                resource_tonnage_mt: 8.20,
                contained_metal: "3.65 Million Tonnes Lump Chrome",
                resource_category: "Measured"
            },
            dp: {
                lat: -19.6700,
                lng: 30.0050,
                easting_arc1950: 290800.0,
                northing_arc1950: 7824100.0,
                tie_beacon: "B1",
                tie_bearing: "038° 45' 10\"",
                tie_distance_m: 310.2
            },
            bounds: [
                [-19.650, 29.985],
                [-19.650, 30.025],
                [-19.690, 30.025],
                [-19.690, 29.985]
            ]
        },
        {
            id: "ZIM-GD-002",
            claim_id: "ZIM-GD-002",
            name: "Hartley Complex PGM Block",
            license_no: "MC-CHE-2023-1092",
            claim_type: "Platinum Group Metals (PGM/MSZ)",
            tenure_status: "Active Gazetted",
            mineral: "Platinum Group Metals",
            province: "Mashonaland West",
            district: "Chegutu / Norton, Mash West",
            ward: "Ward 12 (Ngezi)",
            area_hectares: 850.0,
            yield_rating: "High Yield",
            status: "Active",
            compliance_score: 98,
            lat: -18.1500,
            lng: 30.2800,
            owner: {
                owner_id: "OWN-ZW-002",
                name: "Zimplats Hartley Joint Venture (Pvt) Ltd",
                type: "Private Ltd",
                registration_no: "CO-CHE-1998-1092",
                tax_tin: "BP-1000994411",
                contact_person: "Chipo Ndlovu",
                phone: "+263 71 288 3301",
                email: "hartley.mining@zimplats.co.zw",
                beneficial_ownership_pct: 51.00
            },
            operator: "Zimplats Hartley Syndicate",
            geology: {
                primary_commodity: "Platinum Group Metals (PGM)",
                commodity_code: "PGE",
                secondary_commodities: ["Palladium", "Rhodium", "Gold", "Nickel", "Copper"],
                metallogenic_province: "Great Dyke Layered Ultramafic Complex",
                formation: "Main Sulphide Zone (MSZ) Horizon",
                host_rock: "Bronzitite / Pyroxenite P1 Cumulate Layer",
                deposit_genesis: "Stratiform Magmatic Layered PGM-Cr Reef (MSZ Type)",
                mineralization_style: "Disseminated PGE-Cu-Ni Intercumulus Sulfides",
                structural_controls: "Axial Synclinal Trough Structure with Mild Shears",
                strike_length_m: 4200.0,
                average_thickness_m: 2.10,
                ore_grade: "3.92 g/t 4E (Pt+Pd+Rh+Au)",
                cut_off_grade: "1.80 g/t 4E",
                resource_tonnage_mt: 24.50,
                contained_metal: "3.08 Million Ounces 4E PGE",
                resource_category: "Measured"
            },
            dp: {
                lat: -18.1500,
                lng: 30.2800,
                easting_arc1950: 318200.0,
                northing_arc1950: 7992400.0,
                tie_beacon: "B1",
                tie_bearing: "045° 00' 00\"",
                tie_distance_m: 420.5
            },
            bounds: [
                [-18.130, 30.260],
                [-18.130, 30.300],
                [-18.170, 30.300],
                [-18.170, 30.260]
            ]
        },
        {
            id: "ZIM-GB-003",
            claim_id: "ZIM-GB-003",
            name: "Kadoma Central Gold Corridor",
            license_no: "MC-KAD-2025-0451",
            claim_type: "Precious Metals (Gold/Silver)",
            tenure_status: "Active Gazetted",
            mineral: "Gold (Au)",
            province: "Mashonaland West",
            district: "Kadoma, Mashonaland West",
            ward: "Ward 8 (Patchway)",
            area_hectares: 210.0,
            yield_rating: "High Yield",
            status: "Active",
            compliance_score: 82,
            lat: -18.3250,
            lng: 29.9050,
            owner: {
                owner_id: "OWN-ZW-003",
                name: "Kadoma Artisanal Gold Miners Cooperative",
                type: "Artisanal Cooperative",
                registration_no: "COOP-KAD-2019-082",
                tax_tin: "BP-3000771239",
                contact_person: "Farai Mutasa",
                phone: "+263 73 345 6789",
                email: "kadoma.miners@coop.co.zw",
                beneficial_ownership_pct: 100.00
            },
            operator: "Kadoma Artisanal Syndicate",
            geology: {
                primary_commodity: "Gold (Au)",
                commodity_code: "Au",
                secondary_commodities: ["Silver", "Copper"],
                metallogenic_province: "Midlands Archaean Greenstone Belt",
                formation: "Bulawayan Felsic Pyroclastics & Basalts",
                host_rock: "Quartz Lode in Metabasaltic Greenstone",
                deposit_genesis: "Orogenic Lode Gold (Shear-Hosted)",
                mineralization_style: "Crack-Seal Hydrothermal Quartz Lode",
                structural_controls: "Munyati River Shear Zone Splays",
                strike_length_m: 1100.0,
                average_thickness_m: 1.85,
                ore_grade: "5.40 g/t Au",
                cut_off_grade: "1.50 g/t Au",
                resource_tonnage_mt: 1.45,
                contained_metal: "251,700 oz Contained Gold",
                resource_category: "Indicated"
            },
            dp: {
                lat: -18.3250,
                lng: 29.9050,
                easting_arc1950: 278600.0,
                northing_arc1950: 7972800.0,
                tie_beacon: "B1",
                tie_bearing: "035° 20' 15\"",
                tie_distance_m: 180.4
            },
            bounds: [
                [-18.310, 29.890],
                [-18.310, 29.920],
                [-18.340, 29.920],
                [-18.340, 29.890]
            ]
        },
        {
            id: "ZIM-PEG-004",
            claim_id: "ZIM-PEG-004",
            name: "Bikita Pegmatite Lithium Zone",
            license_no: "MC-BIK-2024-3329",
            claim_type: "Strategic Minerals (Lithium/Rare Earths)",
            tenure_status: "Active Gazetted",
            mineral: "Lithium (Spodumene/Petalite)",
            province: "Masvingo",
            district: "Bikita, Masvingo",
            ward: "Ward 5 (Bikita Mine)",
            area_hectares: 620.0,
            yield_rating: "High Yield",
            status: "Active",
            compliance_score: 96,
            lat: -19.9700,
            lng: 31.4400,
            owner: {
                owner_id: "OWN-ZW-004",
                name: "Bikita Minerals Consortium (Pvt) Ltd",
                type: "Private Ltd",
                registration_no: "CO-MAS-1961-0012",
                tax_tin: "BP-1000552190",
                contact_person: "Tawanda Moyo",
                phone: "+263 77 455 1200",
                email: "geology@bikitaminerals.co.zw",
                beneficial_ownership_pct: 60.00
            },
            operator: "Bikita Minerals Extraction Syndicate",
            geology: {
                primary_commodity: "Lithium (Li)",
                commodity_code: "Li",
                secondary_commodities: ["Tantalum (Ta)", "Beryllium (Be)", "Cesium (Cs)"],
                metallogenic_province: "Bikita Pegmatite Belt",
                formation: "Archaean Victoria Greenstone Belt Border",
                host_rock: "Zoned LCT Granitic Pegmatite Intrusive",
                deposit_genesis: "LCT Granitic Pegmatite (Spodumene/Petalite)",
                mineralization_style: "Zoned Giant Complex Pegmatite Body",
                structural_controls: "Extensional Fracture System within Amphibolites",
                strike_length_m: 2400.0,
                average_thickness_m: 14.50,
                ore_grade: "1.68% Li2O",
                cut_off_grade: "0.50% Li2O",
                resource_tonnage_mt: 65.40,
                contained_metal: "1.09 Million Tonnes LCE",
                resource_category: "Measured & Indicated"
            },
            dp: {
                lat: -19.9700,
                lng: 31.4400,
                easting_arc1950: 441300.0,
                northing_arc1950: 7791800.0,
                tie_beacon: "B1",
                tie_bearing: "042° 10' 05\"",
                tie_distance_m: 340.0
            },
            bounds: [
                [-19.950, 31.420],
                [-19.950, 31.460],
                [-19.990, 31.460],
                [-19.990, 31.420]
            ]
        },
        {
            id: "ZIM-GB-005",
            claim_id: "ZIM-GB-005",
            name: "Gwanda Greenstone Belt Claims",
            license_no: "MC-GWA-2023-7714",
            claim_type: "Precious Metals (Gold/Silver)",
            tenure_status: "Active Gazetted",
            mineral: "Gold (Au)",
            province: "Matabeleland South",
            district: "Gwanda, Matabeleland South",
            ward: "Ward 4 (Colleen Bawn)",
            area_hectares: 180.0,
            yield_rating: "Moderate",
            status: "Warning",
            compliance_score: 78,
            lat: -20.9350,
            lng: 29.0150,
            owner: {
                owner_id: "OWN-ZW-006",
                name: "Gwanda South Gold Syndicate",
                type: "Syndicate",
                registration_no: "SYND-GWA-2020-0071",
                tax_tin: "BP-3000118823",
                contact_person: "Dumisani Sibanda",
                phone: "+263 77 699 0012",
                email: "gwanda.gold@syndicate.co.zw",
                beneficial_ownership_pct: 100.00
            },
            operator: "Gwanda Artisanal Syndicate",
            geology: {
                primary_commodity: "Gold (Au)",
                commodity_code: "Au",
                secondary_commodities: ["Silver", "Antimony"],
                metallogenic_province: "Gwanda Archaean Greenstone Belt",
                formation: "Lower Bulawayan Ultramafics & BIFs",
                host_rock: "Banded Iron Formation (BIF) Hosted Shear Veins",
                deposit_genesis: "Banded Iron Formation (BIF Hosted Au/Fe)",
                mineralization_style: "Sulfide Replacement in Magnetite BIF Layers",
                structural_controls: "Gwanda Anticlinal Flank Shear Splays",
                strike_length_m: 950.0,
                average_thickness_m: 2.20,
                ore_grade: "4.15 g/t Au",
                cut_off_grade: "1.30 g/t Au",
                resource_tonnage_mt: 0.92,
                contained_metal: "122,700 oz Contained Gold",
                resource_category: "Inferred"
            },
            dp: {
                lat: -20.9350,
                lng: 29.0150,
                easting_arc1950: 709400.0,
                northing_arc1950: 7683900.0,
                tie_beacon: "B1",
                tie_bearing: "036° 15' 00\"",
                tie_distance_m: 195.6
            },
            bounds: [
                [-20.920, 29.000],
                [-20.920, 29.030],
                [-20.950, 29.030],
                [-20.950, 29.000]
            ]
        }
    ];

    // Expose standards and seed claims to global window
    window.GEOLOGICAL_STANDARDS = GEOLOGICAL_STANDARDS;
    window.RELATIONAL_SEED_CLAIMS = RELATIONAL_SEED_CLAIMS;

    // Replace STATE.concessions with the complete relational standard claims
    if (window.STATE) {
        window.STATE.concessions = RELATIONAL_SEED_CLAIMS;
    }
})();
