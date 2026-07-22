// ============================================================
// Figure 3.4: Comparison of Spectral Indices for a Maize Field Parcel
// Location: Chinhoyi, Zimbabwe
// Period: January 2026
// ============================================================
// INSTRUCTIONS: Draw a geometry polygon over a maize field parcel
// in the GEE Code Editor. Name it 'geometry'.
// The script will use your drawn geometry automatically.
// ============================================================

// Define the time period
var startDate = '2026-01-01';
var endDate = '2026-01-31';

// Center map on Chinhoyi, Zimbabwe
Map.setCenter(30.2, -17.37, 13);

// Load Sentinel-2 Surface Reflectance (Level 2A)
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate(startDate, endDate)
  .filterBounds(geometry)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(function(image) {
    // Scale the bands (Sentinel-2 SR values are scaled by 10000)
    var scaled = image.select(['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12'])
      .divide(10000);
    return scaled.copyProperties(image, image.propertyNames());
  });

print('Number of images found:', s2.size());

// Create a median composite for January 2026
var composite = s2.median().clip(geometry);

// ============================================================
// COMPUTE SPECTRAL INDICES
// ============================================================

// 1. NDVI (Normalized Difference Vegetation Index)
//    NDVI = (NIR - Red) / (NIR + Red)
var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');

// 2. EVI (Enhanced Vegetation Index)
//    EVI = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
var evi = composite.expression(
  '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
    'NIR': composite.select('B8'),
    'RED': composite.select('B4'),
    'BLUE': composite.select('B2')
  }).rename('EVI');

// 3. SAVI (Soil Adjusted Vegetation Index)
//    SAVI = ((NIR - Red) / (NIR + Red + L)) * (1 + L), where L = 0.5
var savi = composite.expression(
  '((NIR - RED) / (NIR + RED + 0.5)) * 1.5', {
    'NIR': composite.select('B8'),
    'RED': composite.select('B4')
  }).rename('SAVI');

// 4. NDWI (Normalized Difference Water Index)
//    NDWI = (Green - NIR) / (Green + NIR)
var ndwi = composite.normalizedDifference(['B3', 'B8']).rename('NDWI');

// 5. NDMI (Normalized Difference Moisture Index)
//    NDMI = (NIR - SWIR1) / (NIR + SWIR1)
var ndmi = composite.normalizedDifference(['B8', 'B11']).rename('NDMI');

// ============================================================
// VISUALIZATION PARAMETERS
// ============================================================

var ndviVis = {min: -0.2, max: 1, palette: ['d73027','fc8d59','fee08b','d9ef8b','91cf60','1a9850']};
var eviVis  = {min: -0.2, max: 0.8, palette: ['ffffd9','edf8b1','c7e9b4','7fcdbb','41b6c4','1d91c0','225ea8']};
var saviVis = {min: -0.2, max: 0.8, palette: ['8c510a','d8b365','f6e8c3','c7eae5','5ab4ac','01665e']};
var ndwiVis = {min: -0.8, max: 0.4, palette: ['b35806','f1a340','fee0b6','d8daeb','998ec3','542788']};
var ndmiVis = {min: -0.5, max: 0.8, palette: ['d53e4f','fc8d59','fee08b','e6f598','99d594','3288bd']};

// ============================================================
// ADD LAYERS TO MAP
// ============================================================

Map.addLayer(composite.select(['B8','B4','B3']), {min: 0, max: 0.4}, 'False Color (NIR/R/G)', false);
Map.addLayer(ndvi, ndviVis, 'NDVI');
Map.addLayer(evi, eviVis, 'EVI', false);
Map.addLayer(savi, saviVis, 'SAVI', false);
Map.addLayer(ndwi, ndwiVis, 'NDWI', false);
Map.addLayer(ndmi, ndmiVis, 'NDMI', false);

// ============================================================
// GENERATE CHART: Spectral Index Comparison
// This is Figure 3.4
// ============================================================

// Stack all indices into one image
var allIndices = ndvi.addBands(evi).addBands(savi).addBands(ndwi).addBands(ndmi);

// Option A: Bar chart comparing mean index values across the parcel
var meanValues = allIndices.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9
});

print('Mean Spectral Index Values:', meanValues);

// Create a bar/column chart of mean values
var chart1 = ui.Chart.array.values({
  array: ee.Array([
    meanValues.get('NDVI'),
    meanValues.get('EVI'),
    meanValues.get('SAVI'),
    meanValues.get('NDWI'),
    meanValues.get('NDMI')
  ]),
  axis: 0,
  xLabels: ['NDVI', 'EVI', 'SAVI', 'NDWI', 'NDMI']
}).setChartType('ColumnChart')
  .setOptions({
    title: 'Figure 3.4: Comparison of Spectral Indices for a Maize Field Parcel\nChinhoyi, Zimbabwe | January 2026',
    hAxis: {title: 'Spectral Index', titleTextStyle: {italic: false, bold: true}},
    vAxis: {title: 'Mean Index Value', titleTextStyle: {italic: false, bold: true}},
    colors: ['#1a9850', '#225ea8', '#01665e', '#542788', '#3288bd'],
    legend: {position: 'none'},
    bar: {groupWidth: '60%'},
    chartArea: {width: '75%', height: '70%'}
  });

print(chart1);

// Option B: Histogram showing pixel value distributions for each index
var chart2 = ui.Chart.image.histogram({
  image: allIndices,
  region: geometry,
  scale: 10,
  maxPixels: 1e9
}).setOptions({
  title: 'Distribution of Spectral Index Values Across Maize Parcel\nChinhoyi, Zimbabwe | January 2026',
  hAxis: {title: 'Index Value', titleTextStyle: {italic: false, bold: true}},
  vAxis: {title: 'Frequency (Pixel Count)', titleTextStyle: {italic: false, bold: true}},
  colors: ['#1a9850', '#225ea8', '#01665e', '#542788', '#3288bd'],
  chartArea: {width: '75%', height: '70%'},
  legend: {position: 'top'}
});

print(chart2);

// Option C: Transect/profile across the parcel (if parcel is large enough)
// This shows spatial variation of each index along a cross-section

// ============================================================
// STATISTICS TABLE
// ============================================================

// Compute min, max, mean, std dev for each index
var stats = allIndices.reduceRegion({
  reducer: ee.Reducer.mean()
    .combine(ee.Reducer.minMax(), '', true)
    .combine(ee.Reducer.stdDev(), '', true),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9
});

print('Detailed Statistics (min, max, mean, stdDev):', stats);

// ============================================================
// LEGEND (as a UI panel)
// ============================================================

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

legend.add(ui.Label({
  value: 'Spectral Indices',
  style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px 0'}
}));

var indices = ['NDVI', 'EVI', 'SAVI', 'NDWI', 'NDMI'];
var descriptions = [
  'Vegetation greenness',
  'Enhanced vegetation (atmospheric corrected)',
  'Soil-adjusted vegetation',
  'Water content (leaf)',
  'Moisture stress indicator'
];
var colors = ['#1a9850', '#225ea8', '#01665e', '#542788', '#3288bd'];

for (var i = 0; i < indices.length; i++) {
  var row = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {margin: '2px 0'}
  });
  row.add(ui.Label({
    value: '■',
    style: {color: colors[i], fontSize: '16px', margin: '0 6px 0 0'}
  }));
  row.add(ui.Label({
    value: indices[i] + ': ' + descriptions[i],
    style: {fontSize: '11px'}
  }));
  legend.add(row);
}

Map.add(legend);

// ============================================================
// EXPORT (Optional: Export charts as images to Drive)
// ============================================================

// Export the composite for offline analysis
Export.image.toDrive({
  image: allIndices,
  description: 'Spectral_Indices_Chinhoyi_Jan2026',
  folder: 'GEE_Exports',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});
