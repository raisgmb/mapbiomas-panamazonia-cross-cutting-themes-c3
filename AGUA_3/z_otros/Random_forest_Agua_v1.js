/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var excluir = 
    /* color: #ff7319 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-77.0949551082254, -2.267070939118402],
          [-77.09066357380158, -2.2718736876108467],
          [-77.08688702350861, -2.277877100762568],
          [-77.09238018757111, -2.3084083561984854],
          [-77.0862003780008, -2.310809663189443],
          [-77.05770458942658, -2.2933143338153554],
          [-77.06010784870392, -2.2799354080864838],
          [-77.0700642085672, -2.2564362250734695],
          [-77.09650006061798, -2.2622681746881725]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Tema transversal AGUA

var param = {
    carta : 'SA-18-V-C',
    code_region: 40205,  //Region de Clasificacion
    year: 2015,
    RFtrees: 30,    // # de arboles
    nSamples: 1000, // # de muestras
    version:'1'
    };

var featureSpace = [
  "blue_median",
  // "green_dry",
  "green_median",
  // "green_min",
  // "red_dry",
  "red_median",
  // "red_min",
  // "red_wet",
  // "nir_dry",
  "nir_median",
  // "nir_min",
  // "nir_stdDev",
  // "nir_wet",
  // "swir1_dry",
  "swir1_median",
  // "swir1_min",
  // "swir1_wet",
  // "swir2_dry",
  "swir2_median",
  // "swir2_min",
  // "swir2_wet",
  // "ndfi_amp",
  // "ndfi_dry",
  // "ndfi_median",
  // "ndfi_stdDev",
  // "ndfi_wet",
  // "ndfib_amp",
  // "ndfib_median",
  // "gv_amp",
  "gv_median",
  // "gv_stdDev",
  // "gvs_dry",
  // "gvs_median",
  // "gvs_stdDev",
  // "gvs_wet",
  // "npv_median",
  // "npv_stdDev",
  "shade_median",
  "snow_median",
  // "snow_min",
  // "soil_amp",
  "soil_median",
  // "soil_stdDev",
  // "fns_dry",
  // "fns_stdDev",
  // "gcvi_dry",
  // "gcvi_median",
  // "gcvi_wet",
  // "pri_dry",
  // "pri_median",
  // "evi2_amp",
  // "evi2_dry",
  // "evi2_median",
  // "evi2_stdDev",
  // "evi2_wet",
  // "ndvi_amp",
  // "ndvi_dry",
  "ndvi_median",
  // "ndvi_stdDev",
  // "ndvi_wet",
  "ndsi_median",
  // "ndsi_min",
  // "ndwi_gao_amp",
  // "ndwi_gao_dry",
  // "ndwi_gao_median",
  // "ndwi_gao_wet",
  // "ndwi_mcfeeters_amp",
  "ndwi_mcfeeters_median",
  // "savi_dry",
  // "savi_median",
  // "savi_stdDev",
  // "savi_wet",
  // "sefi_dry",
  // "sefi_median",
  // "sefi_stdDev",
  // "wefi_amp",
  // "wefi_stdDev",
  // "wefi_wet",
  // "nuaci_median",
  // "hallcover_median",
  // "textG_median"
];

var assetClassif ='projects/mapbiomas-raisg/SUBPRODUCTOS/MOORE/classification/mapbiomas-raisg-collection20-integration-v8';
var assetMosaics = 'projects/mapbiomas-raisg/MOSAICOS/workspace-c2-v2';
var assetRegions ='projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-2'
var assetcartas= 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/cartas-RAISG-regiones-2'
//------------------------------------------------------------------
// Packages
//------------------------------------------------------------------
var palettes = require('users/mapbiomas/modules:Palettes.js');

//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------

var setGeometries = function (feature) {
    var lng = feature.get('longitude');
    var lat = feature.get('latitude');

    var geometry = ee.Geometry.Point([lng, lat]);

    return feature.setGeometry(geometry);
};

var limite = ee.FeatureCollection(assetcartas)
                          .filterMetadata('name', "equals", param.carta);
// Map.centerObject(limite,12)
var classif = ee.Image(assetClassif).clip(limite);
var regionCode = String(param.code_region).slice(0,3);
var mosaic = ee.ImageCollection(assetMosaics)
              .filterMetadata('region_code', 'equals', regionCode)
              .filterMetadata('year', 'equals',param.year)
              .filterBounds(limite)
              .mosaic()

// Reference Map
var exp =
    'b(0) +b(1) +b(2)+ b(3)+ b(4)+ b(5)+ b(6)+ b(7)+ b(8)+ b(9)+ b(10)+' +
    'b(11)+b(12)+b(13)+b(14)+b(15)+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+' +
    'b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+' +
    'b(33)';

var water = classif.eq(33).expression(exp).gte(34).multiply(33);
var otros = classif.neq(33).expression(exp).gte(34).multiply(27);


var referenceMap = water     
                  .where(otros.eq(27), 27)
                  .rename('reference');

referenceMap = referenceMap.mask(referenceMap.neq(0));

var samples = referenceMap
    .addBands(ee.Image.pixelLonLat())
    .addBands(mosaic.select(featureSpace))
    .stratifiedSample({
        'numPoints': param.nSamples,
        'classBand': 'reference',
        'region': limite,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'tileScale':4
    });

samples = samples.map(setGeometries);


/**
* Classification
*/

var classifier = ee.Classifier.smileRandomForest(param.RFtrees)
    .train(samples, 'reference', featureSpace);

var classified = mosaic.classify(classifier);

// Layers
var eeColors = ee.List(palettes.get('classification2'));

samples = samples.map(
    function (feature) {

        var c = feature.get("reference");

        return feature.set({
            "style": {
                "color": eeColors.get(c),
                "pointSize": 4
            }
        });
    }
);

Map.addLayer(mosaic.clip(limite), {
    'bands': ['swir1_median', 'nir_median', 'red_median'],
    'gain': [0.08, 0.06, 0.08],
    'gamma': 0.65
}, 'mosaic-'+param.year, false);

Map.addLayer(classif.where(classif.eq(33), 33)
                    .where(classif.neq(33), 27)
                    .clip(limite), {
    'bands': ['classification_'+param.year],
    'palette': palettes.get('classification2'),
    'min': 0,
    'max': 34,
    'format': 'png'
}, 'Classified Collection 2-'+param.year, false);

Map.addLayer(classified.clip(limite), {
    'palette':palettes.get('classification2'),
    'min': 0,
    'max': 34,
    'format': 'png'
}, 'Classified RF-'+param.year, false);

Map.addLayer(referenceMap, {
    'bands': ['reference'],
    'palette': palettes.get('classification2'),
    'min': 0,
    'max': 34,
    'format': 'png'
}, 'Pixel Estable Agua', false);

Map.addLayer(samples.style({
    "styleProperty": "style"
}), {}, 'points',false);