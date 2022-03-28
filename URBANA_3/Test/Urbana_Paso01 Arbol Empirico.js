// Tema transversal INFRAESTRUCTURA URBANA
// PASO 01

var param = {
    code_region: 70309,  //Region de Clasificacion
    version:'1'
    };

var tree = {
  snow_median:20, //menor o igual
  soil_median:15, //mayor o igual
  nuaci:140, //mayor o igual
  slopes:15, //menor o igual
  
  water: 30,  //mayor o igual
  uNTL : 7
}

var assetClassif ='projects/mapbiomas-raisg/SUBPRODUCTOS/MOORE/classification/mapbiomas-raisg-collection20-integration-v8';
var assetMosaics = 'projects/mapbiomas-raisg/MOSAICOS/workspace-c2-v2';
var assetRegions ='projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3'
var AssetRegionsRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-3';
var assetcartas= 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/cartas-RAISG-regiones-2'

/**
 * Años a procesar
 */
var years = [
    1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
    1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 
    2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
    2018, 2019, 2020
  ]
  
// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

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
                
var imageDMSP2 = imageDMSP.resample('bilinear').reproject({ crs: 'EPSG:4326', scale: 60}).byte();
var uNTL =ee.Image(1).updateMask(imageDMSP2.gte(tree.uNTL)).rename('uNTL');

var nuaci = function (image) {

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

years.forEach(function(year){

    var mosaic = ee.ImageCollection(assetMosaics)
                  .filterMetadata('region_code', 'equals', param.code_region.toString().slice(0, 3))
                  .filterMetadata('year', 'equals',year)
                  .filterBounds(limite)
                  .mosaic()
    mosaic = nuaci(mosaic).addBands(slope)

    Map.addLayer(mosaic.updateMask(regionRaster.eq(1)), {
    'bands': ['swir1_median', 'nir_median', 'red_median'],
    'gain': [0.08, 0.06, 0.08],
    'gamma': 0.65
    }, 'mosaic-'+year, false);
    
    
    var classif =      mosaic.select('snow_median').lte(tree.snow_median)
                  .and(mosaic.select('soil_median').gte(tree.soil_median))
                  .and(mosaic.select('nuaci').gte(tree.nuaci))
                  .and(mosaic.select('slope').lte(tree.slopes))
                  .multiply(22);
                  
    classif = classif.where(water.eq(1), 27).updateMask(regionRaster.eq(1))
    
    clasificacionTree = clasificacionTree.addBands(classif.rename('classification_'+year))         
    Map.addLayer(classif, {
    'palette':palettes.get('classification2'),
    'min': 0,
    'max': 34,
    'format': 'png'
    }, 'Classified tree-'+year, false);

})

clasificacionTree = clasificacionTree.select(bandNames)//.updateMask(regionRaster.eq(1))
print(clasificacionTree.bandNames())

Map.addLayer(water,{min:0, max:1,"bands":["occurrence"],"palette":['23ffe1','142cd6']},'water',false)
Map.addLayer(imageDMSP2.selfMask(),{min:0, max:70,"palette":['ffe31f','d60c0c']},'DMSP-OLS',false)
Map.addLayer(uNTL.selfMask(),{"palette":['d60c0c']},'uNTL',false)
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
  
  