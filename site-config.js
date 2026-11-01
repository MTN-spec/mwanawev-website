/* ==========================================================================
   MTN-SPEC Easy Website Media & Team Configuration (site-config.js)
   --------------------------------------------------------------------------
   Manage this visually at: http://localhost:8080/studio.html
   Or drop .mp4 videos / .jpg/.png images into showcase/ and list below.
   ========================================================================== */

window.MTNSPEC_CONFIG = {
    showcaseVentures: [
        {
            key: "nmih",
            tabLabel: "Mineral Hub",
            tabIcon: "fas fa-gem",
            sector: "Geospatial Decision Support System",
            domainText: "nationalmineralintelligencehub.co.zw • mtnspec.co.zw/mineral-hub",
            launchHref: "mineral-hub/index.html",
            external: false,
            detailsHref: "#platform-nmih",
            title: "The National Mineral Intelligence Hub",
            desc: "Maps Iron Oxide, Hydrothermal Clay, and Gossan mineral alteration zones at 10m–20m Sentinel-2 resolution with GPS ground-truthing.",
            metrics: [
                { val: "10m–20m", lbl: "Spatial Scale" },
                { val: "5 Ratios", lbl: "Spectral Bands" },
                { val: "GDSS", lbl: "Target Mapping" }
            ],
            media: [
                {
                    type: "image",
                    src: "bg/bg-satellite-earth.jpg",
                    caption: "Copernicus Sentinel-2 Orbital Mineral Targeting (10m–20m)"
                },
                {
                    type: "image",
                    src: "bg/bg-satellite-deployer.jpg",
                    caption: "Multi-Ratio Iron Oxide, SWIR Clay & Gossan Alteration GDSS"
                }
            ]
        },
        {
            key: "agrishield",
            tabLabel: "AgriShield",
            tabIcon: "fas fa-seedling",
            sector: "Remote Sensing & Deep-Learning Crop Monitoring",
            domainText: "agrishield.co.zw",
            launchHref: "https://agrishield.co.zw",
            external: true,
            detailsHref: "#platform-agrishield",
            title: "AgriShield Crop & Drought Intelligence",
            desc: "Monitors parcel-level crop vigour, root-zone soil moisture, and drought stress across 12+ satellite indices with Deep Learning & automated payouts.",
            metrics: [
                { val: "12+ Indices", lbl: "Multi-Sensor EO" },
                { val: "Deep Learning", lbl: "Stress Detection" },
                { val: "Parametric", lbl: "Risk Triggers" }
            ],
            media: [
                {
                    type: "image",
                    src: "bg/bg-dji-mavic3.jpg",
                    caption: "DJI Aerial Survey & Multi-Sensor Crop Health Telemetry"
                },
                {
                    type: "image",
                    src: "showcase/dji-matrice300-rtk-survey.jpg",
                    caption: "Enterprise UAV LiDAR, Thermal & Deep-Learning Diagnostics"
                }
            ]
        },
        {
            key: "changeit",
            tabLabel: "Change It",
            tabIcon: "fas fa-qrcode",
            sector: "Urban Spatial Mobility & FinTech",
            domainText: "changeit.co.zw • mtnspec.co.zw/changeit",
            launchHref: "changeit.html",
            external: false,
            detailsHref: "#platform-changeit",
            title: "Change It Urban Transit & Digital Change",
            desc: "Analyzes urban commuter corridors while powering sub-second QR fare micro-payments that permanently eliminate cash change shortages.",
            metrics: [
                { val: "Sub-Second", lbl: "QR Checkout" },
                { val: "Corridors", lbl: "Urban Analytics" },
                { val: "Zero Cash", lbl: "Digital Change" }
            ],
            media: [
                {
                    type: "video",
                    src: "hero_video.mp4",
                    poster: "hero_transport.png",
                    caption: "Cashless Urban Mobility & Instant P2P Digital Change"
                },
                {
                    type: "image",
                    src: "bg/bg-cosmos-night-earth.jpg",
                    caption: "Urban Commuter Corridor & Terminus Spatial Demand Analytics"
                }
            ]
        }
    ],

    founder: {
        initials: "MTN",
        photo: "",
        rolePill: "Founder • Chief Technology Officer & Lead Systems Architect",
        name: "Takunda Nigel Mhandu",
        qualification: "Geospatial & Software Engineer | BSc (Hons) Geospatial Sciences & Remote Sensing — NUST",
        bio: "Architects MTN-SPEC's full-stack spatial platforms, cloud Earth observation pipelines, and digital payment infrastructure. Combines Python (FastAPI, Streamlit), JavaScript, and PostgreSQL/PostGIS with Sentinel-2/Landsat-9 spectral processing, drone LiDAR workflows, Deep Learning & Random Forest triggers, and EcoCash & HMAC QR gateways across AgriShield, Change It, and The National Mineral Intelligence Hub.",
        phone: "+263 77 977 0395",
        email: "mhandutakunda@gmail.com",
        github: "https://github.com/MTN-spec/MTN---Spec-",
        address: "3620 Mutiti Rd, Rusike Park, Marondera"
    },

    teamMembers: [
        {
            initials: "PPC",
            photo: "",
            name: "Priviledge Pamela Chikobvu",
            role: "Data Science & Machine Learning Specialist",
            bio: "Specializes in statistical computing, predictive modeling, and multi-sensor Earth observation analytics—calibrating Deep Learning and Random Forest crop-stress classifiers, multi-index drought risk models, and automated parametric crop insurance triggers."
        },
        {
            initials: "TBM",
            photo: "",
            name: "Tadiwanashe Blessings Mbavarira",
            role: "Hydrology & Environmental Modeling Specialist",
            bio: "Leads hydrological spatial modeling, soil-water retention profiling, and remote sensing water indices—integrating NASA SMAP, CHIRPS, and Sentinel-2 moisture telemetry for drought and precision irrigation intelligence."
        }
    ]
};

