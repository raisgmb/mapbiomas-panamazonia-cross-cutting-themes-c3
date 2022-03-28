var param = {  
    regionId: 70304,  //Region de Clasificacion  
    pais: 'PERU', 
    version_input: 5,//
    metodo: 'DT', //RF or  DT
};
 

var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var dirinput = 'projects/mapbiomas-raisg/TRANSVERSALES/AGUA_3/clasificacion-ft'

var AssetRegions = paths.regionVector
var AssetRegionsRaster = paths.regionCRaster

var prefixo_out = param.pais+ '-' + param.regionId + '-' + param.version_input

var region = ee.FeatureCollection(AssetRegions).filterMetadata('id_regionC', 'equals', param.regionId)
var regionRaster = ee.Image(AssetRegionsRaster).eq(param.regionId).selfMask()
print(region)

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// var class4FT = ee.ImageCollection(dirinput)
//                       .filterMetadata('code_region', 'equals', param.regionId)  //
//                       .filterMetadata('version', 'equals', param.version_input)
//                       .first()
                      
var assetPath = dirinput + '/' + param.pais + '-' + param.regionId + '-' + param.metodo;
var class4FT = ee.Image(assetPath  + '-' + param.version_input);

print(class4FT)


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
      description: 'ESTADISTICAS-PASO8-'+prefixo_out,
      fileFormat: 'CSV',
      folder: 'ESTADISTICAS-PASO8'
    });
      
  });
  
}

// Generar estadísticas de cobertura
getAreas(class4FT, region)
