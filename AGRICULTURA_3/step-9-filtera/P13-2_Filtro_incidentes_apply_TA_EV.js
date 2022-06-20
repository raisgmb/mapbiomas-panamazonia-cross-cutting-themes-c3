/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #98ff00 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Filtro incidentes apply Transvesal Agricultura 
var param = {
    code_region: 20601,  //Region de Clasificacion
    pais: 'BOLIVIA',
    year: 2000,  // Solo visualizacion
    Max_connect:22, // Maximo numero de pixeles agrupados para ser considerado en el filtro
    Min_incidence: 8, // Numero minimo de incidencias o cambios en toda la serie temporal
    // ciclo: 'ciclo-1',
    version_input_class:7, //  Clasificacion de entrada (ojo no es el paso 13-1)
    version_input_inc:8, //  Incidencia (Resultados del paso 13-1)
    version_output:9, //    Salida 
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    }
};

var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var dirinput = paths.clasificacionFiltrosTA
var dirout  = paths.clasificacionFiltrosTA
var regionesclass = paths.regionVector
var regionesclassRaster = paths.regionCRaster
var AssetMosaic= paths.mosaics_c3_v2
/**
 * Funcion para asignar una versión por ciclo
 * 
 */
// var getVersion = function (cicle) { 
//   var version = {
//     'ciclo-1': {
//       // Ciclo I
//         version_input_class:7,
//         version_input_inc:8,
//         version_output:9
//     },
//     'ciclo-2': {
//       // Ciclo II
//         version_input_class:14,
//         version_input_inc:15,
//         version_output:16
//     }
//   };
  
//   return version[cicle];
// };

// Obtiene la version de salida en base al ciclo
// var version = getVersion(param.ciclo);
var version_inputclas = param.version_input_class;
var version_inputinc = param.version_input_inc;
var version_output = param.version_output;

var prefixo_out = param.pais+ '-' + param.code_region + '-' + version_output;

// /**
// * Visualizaciones
// */
// // añadimos el mosaico
// var GF = require('users/raisgmb01/MapBiomas_C2_Amaz:MODULES/GlobalFunctions').GlobalFunct;

// var CodMosaico = String(param.code_region).slice(0, 3);

// GF.AddMosaico(param.code_region,CodMosaico,param.year,param.pais);
// // --

var regions = ee.FeatureCollection(regionesclass)
    .filterMetadata('id_regionC', "equals", param.code_region);
var regionRaster = ee.Image(regionesclassRaster).eq(param.code_region).selfMask();

var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median']);
            
var class4FF = ee.ImageCollection(dirinput)
    .filterMetadata('code_region', 'equals', param.code_region)
    .filterMetadata('version', 'equals', version_inputclas)
    // .filterMetadata('paso', 'equals', 'P12')
    .min(); 
    
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_'+param.year,
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
    
Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year)
                   .mosaic()
                   .updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year, false);
  
Map.addLayer(class4FF, vis, 'class_FF_Original'+param.year);

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]

var image_incidence = ee.ImageCollection(dirinput)
    .filterMetadata('code_region', 'equals', param.code_region)
    .filterMetadata('version', 'equals', version_inputinc)
    .filterMetadata('paso', 'equals', 'P13-1')
    .min();
    
Map.addLayer(image_incidence, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FF

print(image_incidence)

var maskIncid_borda = image_incidence.select('connect').lte(param.Max_connect)
              .and(image_incidence.select('incidence').gt(param.Min_incidence))

maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borde') 
var corrige_borda = image_incidence.select('mode').mask(maskIncid_borda)

class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)

Map.addLayer(class4FT_corrigida, vis, 'class_FF_corrigida'+param.year);

class4FT_corrigida =class4FT_corrigida
        .set('code_region', param.code_region)
        .set('pais', param.pais)
        .set('version', version_output)
        .set('descripcion', 'filtro incidentes apply')
        .set('paso', 'P13-2'),

print(class4FT_corrigida)


Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': prefixo_out,
    'assetId': dirout+'/'+prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});


// Exportar a Google Drive
  if(param.exportOpcion.exportClasifToDrive){
    Export.image.toDrive({
      image: class4FT_corrigida.toInt8(),
      description: prefixo_out + '-DRIVE-'+version_output,
      folder: param.exportOpcion.DriveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: regions.geometry().bounds()
    });
  }
  
  /**
 * Función para generar las estadísticas de cobertura por año y clase
 */
function getAreas(image, region) {

  var pixelArea = ee.Image.pixelArea();
  
  var reducer = {
    reducer: ee.Reducer.sum(),
    geometry: region.geometry(),
    scale: 30,
    maxPixels: 1e13
  };
  
  var bandNames = image.bandNames();
  
  var classIds = ee.List.sequence(0, 34);
  
  
  bandNames.evaluate( function(bands, error) {
    
    if(error) print(error.message);
    
    var yearsAreas = [];
  
  
    bands.forEach(function(band) {
    
      var year = ee.String(band).split('_').get(1),
          yearImage = image.select([band]);
  
      
      // Calcular áreas para cada clase cobertura
      var covers = classIds.map(function(classId) {
  
        classId = ee.Number(classId).int8();
      
        var yearCoverImage = yearImage.eq(classId),
            coverArea = yearCoverImage.multiply(pixelArea).divide(1e6);
        
        return coverArea.reduceRegion(reducer).get(band);
  
      }).add(year);
  
    
      // Generar la lista de keys para el diccionario
      var keys = classIds.map(function(item) {
  
        item = ee.Number(item).int8();
        
        var stringItem = ee.String(item);
        
        stringItem = ee.Algorithms.If(
          item.lt(10),
          ee.String('ID0').cat(stringItem),
          ee.String('ID').cat(stringItem)
        );
        
        return ee.String(stringItem);
        
      }).add('year');
  
      
      // Crear la lista de features para cada año, sin geometrías
      var dict = ee.Dictionary.fromLists(keys, covers);
  
      yearsAreas.push( ee.Feature(null, dict) );
      
    });
    
    
    yearsAreas = ee.FeatureCollection(yearsAreas);
  
    
    Export.table.toDrive({
      collection: yearsAreas,
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out+version_output,
      fileFormat: 'CSV',
      folder: 'P13-FiltroIndicident-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(class4FT_corrigida, regions)
}
  