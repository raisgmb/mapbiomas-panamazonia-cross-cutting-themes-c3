/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var inclusion_general = 
    /* color: #3614d6 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.16738394928453, -13.330389227101309],
                  [-72.16789893341539, -13.340912282207197],
                  [-72.16755561066148, -13.34625715057548],
                  [-72.15880088043687, -13.345589048497326],
                  [-72.15983084869859, -13.333228826783868]]]),
            {
              "value": 1,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.16189078522203, -13.277600016134029],
                  [-72.17390708160875, -13.271585326192126],
                  [-72.17854193878648, -13.271251172383568],
                  [-72.17837027740953, -13.27576221001186],
                  [-72.16618231964586, -13.283948693877877]]]),
            {
              "value": 1,
              "system:index": "1"
            })]),
    exclusion_general = 
    /* color: #ff0000 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.13648490143296, -13.325545127154076],
                  [-72.13682822418687, -13.316357774620604],
                  [-72.13837317657945, -13.309174692473293],
                  [-72.14575461578843, -13.3075041777167],
                  [-72.15021781158921, -13.308172385001853],
                  [-72.14815787506578, -13.323206561423362],
                  [-72.14678458405015, -13.329387007486623],
                  [-72.14060477447984, -13.336068393113083]]]),
            {
              "value": 1,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.10369757843492, -13.281943866213252],
                  [-72.11056403351304, -13.282445074681968],
                  [-72.13356665802476, -13.291466650095856],
                  [-72.1078174514818, -13.294139645045616]]]),
            {
              "value": 1,
              "system:index": "1"
            })]),
    Inclusion2018 = /* color: #0218d6 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-71.9595881160305, -13.506940708316156],
                  [-71.95529658160667, -13.507441448301886],
                  [-71.95272166095238, -13.505605396548404],
                  [-71.96199137530785, -13.503268582969575]]]),
            {
              "value": 1,
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Tema transversal INFRAESTRUCTURA URBANA
// PASO 01 

var param = {
    code_region: 40602,  //Region de Clasificacion
    version:'1',
    };

var tree = {
  snow_median:20, //menor o igual
  soil_median:15, //mayor o igual
  nuaci:140, //mayor o igual
  slopes:15, //menor o igual
  
  water: 30,  //mayor o igual
  uNTL : 7
}

var years_geom = [//year,      inclusion,         exclusion
                  [ 1985, inclusion_general,  exclusion_general],
                  [ 1986, inclusion_general,  exclusion_general],
                  [ 1987, inclusion_general,  exclusion_general],
                  [ 1988, inclusion_general,  exclusion_general],
                  [ 1989, inclusion_general,  exclusion_general],
                  [ 1990, inclusion_general,  exclusion_general],
                  [ 1991, inclusion_general,  exclusion_general],
                  [ 1992, inclusion_general,  exclusion_general],
                  [ 1993, inclusion_general,  exclusion_general],
                  [ 1994, inclusion_general,  exclusion_general],
                  [ 1995, inclusion_general,  exclusion_general],
                  [ 1996, inclusion_general,  exclusion_general],
                  [ 1997, inclusion_general,  exclusion_general],
                  [ 1998, inclusion_general,  exclusion_general],
                  [ 1999, inclusion_general,  exclusion_general],
                  [ 2000, inclusion_general,  exclusion_general],
                  [ 2001, inclusion_general,  exclusion_general],
                  [ 2002, inclusion_general,  exclusion_general],
                  [ 2003, inclusion_general,  exclusion_general],
                  [ 2004, inclusion_general,  exclusion_general],
                  [ 2005, inclusion_general,  exclusion_general],
                  [ 2006, inclusion_general,  exclusion_general],
                  [ 2007, inclusion_general,  exclusion_general],
                  [ 2008, inclusion_general,  exclusion_general],
                  [ 2009, inclusion_general,  exclusion_general],
                  [ 2010, inclusion_general,  exclusion_general],
                  [ 2011, inclusion_general,  exclusion_general],
                  [ 2012, inclusion_general,  exclusion_general],
                  [ 2013, inclusion_general,  exclusion_general],
                  [ 2014, inclusion_general,  exclusion_general],
                  [ 2015, inclusion_general,  exclusion_general],
                  [ 2016, inclusion_general,  exclusion_general],
                  [ 2017, inclusion_general,  exclusion_general],
                  [ 2018, inclusion_general,  exclusion_general],
                  [ 2019, inclusion_general,  exclusion_general],
                  [ 2020, inclusion_general,  exclusion_general],
       ]


var assetClassif ='projects/mapbiomas-raisg/SUBPRODUCTOS/MOORE/classification/mapbiomas-raisg-collection20-integration-v8';
var assetMosaics = 'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2';
var assetRegions ='projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3'
var AssetRegionsRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-3';
var assetcartas= 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/cartas-RAISG-regiones-2'

/**
 * Años a procesar
 */
// var years = [
//     1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
//     1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 
//     2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
//     2018, 2019, 
//     2020
//   ]
  
// get band names list 
var bandNames = ee.List(
    years_geom.map(
        function (year) {
            return 'classification_' + String(year[0]);
        }
    )
);

// print(bandNames)
//------------------------------------------------------------------
// Packages
//------------------------------------------------------------------
var palettes = require('users/mapbiomas/modules:Palettes.js');

// Region de Clasificacion
var limite = ee.FeatureCollection(assetRegions)
                          .filterMetadata('id_regionC', 'equals', param.code_region);
var regionRaster = ee.Image(AssetRegionsRaster).eq(param.code_region).selfMask()

//------------------------------------------------------------------
// NUACI
//------------------------------------------------------------------
var imageDMSP = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182013')
                .select('stable_lights')
                .updateMask(regionRaster.eq(1));
                
var imageDMSP2 = imageDMSP.resample('bilinear').byte()//.reproject({ crs: 'EPSG:4326', scale: 30}).byte();

var uNTL_orig =ee.Image(1).updateMask(imageDMSP2.gte(tree.uNTL)).rename('uNTL');

function inclus_exclu (uNTL, inclu, exclu){
         var inclusionRegions=  ee.FeatureCollection(inclu).reduceToImage(['value'], ee.Reducer.first())
                       .eq(1)
         var exclusionRegions=  ee.FeatureCollection(exclu).reduceToImage(['value'], ee.Reducer.first())
                       .eq(1)
         uNTL = uNTL.where(exclusionRegions.eq(1), 0).selfMask()        
         uNTL = ee.Image(0).where(uNTL.eq(1), 1)
                           .where(inclusionRegions.eq(1), 1).selfMask()
                           
  return uNTL
}

// uNTL = inclus_exclu(uNTL,param.inclusion,param.exclusion)


var nuaci = function (image, uNTL) {
        
        var ndvi = image.expression(
            'float(nir - red)/(nir + red)', {
                'nir': image.select('nir_median'),
                'red': image.select('red_median'),
            });

        var ndwi = image.expression(
            'float(swir1 - green)/(swir1 + green)', {
                'swir1': image.select('swir1_median'),
                'green': image.select('green_median'),
            });

        var ndbi = image.expression(
          'float(swir1 - nir)/(swir1 + nir)', {
            'nir': image.select('nir_median'),
            'swir1': image.select('swir1_median')
           });
        var nuaci = image.expression(
          'float(uNTL) * (1.0 - sqrt(pow((NDWI + 0.05), 2) + (pow((NDVI + 0.1), 2) + (pow((NDBI + 0.1), 2)))))', 
          {
            'uNTL': uNTL,
            'NDVI': ndvi,
            'NDBI': ndbi,
            'NDWI': ndwi
          }).multiply(100).add(100).byte().rename(["nuaci"]);

        return image.addBands(nuaci.select([0], ['nuaci']));
    };

var terrain = ee.Image('JAXA/ALOS/AW3D30_V1_1');  
var slope = ee.Terrain.slope(terrain.select("AVE")).rename('slope');
var water = ee.Image("JRC/GSW1_2/GlobalSurfaceWater")
              .select('occurrence')
              .gte(tree.water)

var setGeometries = function (feature) {
    var lng = feature.get('longitude');
    var lat = feature.get('latitude');

    var geometry = ee.Geometry.Point([lng, lat]);

    return feature.setGeometry(geometry);
};

var clasificacionTree = ee.Image()

years_geom.forEach(function(data){

    var mosaic = ee.ImageCollection(assetMosaics)
                  .filterMetadata('region_code', 'equals', param.code_region.toString().slice(0, 3))
                  .filterMetadata('year', 'equals',data[0])
                  .filterBounds(limite)
                  .mosaic();
                  
    var uNTL = inclus_exclu(uNTL_orig,data[1],data[2]);
    mosaic = nuaci(mosaic,uNTL).addBands(slope)

    Map.addLayer(mosaic.updateMask(regionRaster.eq(1)), {
    'bands': ['swir1_median', 'nir_median', 'red_median'],
    'gain': [0.08, 0.06, 0.08],
    'gamma': 0.65
    }, 'mosaic-'+data[0], false);
    
    
    var classif =      mosaic.select('snow_median').lte(tree.snow_median)
                  .and(mosaic.select('soil_median').gte(tree.soil_median))
                  .and(mosaic.select('nuaci').gte(tree.nuaci))
                  .and(mosaic.select('slope').lte(tree.slopes))
                  .multiply(22);
                  
    classif = classif.where(water.eq(1), 27).updateMask(regionRaster.eq(1))
    
    clasificacionTree = clasificacionTree.addBands(classif.rename('classification_'+data[0]))         
    Map.addLayer(classif, {
    'palette':palettes.get('classification2'),
    'min': 0,
    'max': 34,
    'format': 'png'
    }, 'Classified tree-'+data[0], false);

})

clasificacionTree = clasificacionTree.select(bandNames)//.updateMask(regionRaster.eq(1))
//print(clasificacionTree.bandNames())

Map.addLayer(water,{min:0, max:1,"bands":["occurrence"],"palette":['23ffe1','142cd6']},'water',false)
Map.addLayer(imageDMSP2.selfMask(),{min:0, max:70,"palette":['ffe31f','d60c0c']},'DMSP-OLS',false)
Map.addLayer(uNTL_orig.selfMask(),{"palette":['d60c0c']},'uNTL',false)


Map.addLayer(limite,{},'limite',false)

Export.image.toAsset({
  image: clasificacionTree.toInt8().set('region', param.code_region)
                                   .set('version', param.version)
                                   .set('metodo', 'Arbol-Empirico'),
  description:'URBANA-'+param.code_region + '-'+ param.version,
  assetId:'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion/'+ 'URBANA-'+param.code_region + '-'+ param.version,
  scale: 30,
  pyramidingPolicy: {
    '.default': 'mode'
  },
  maxPixels: 1e13,
  region: limite.geometry().bounds()
});
  
  