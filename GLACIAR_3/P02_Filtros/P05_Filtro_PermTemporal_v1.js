var param = { 
    regionGlacier: 2061,  //Region de Clasificacion
    pais: 'BOLIVIA', 
    year: [2020],  // Solo visualizacion
    version_input: 6,
    version_output: 7,
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    },
};
 
var YearBase= 1985;

//--------------------------------------------

var dirinput =  "projects/mapbiomas-raisg/TRANSVERSALES/GLACIAR_3/clasificacion-ft";
var dirout  =   "projects/mapbiomas-raisg/TRANSVERSALES/GLACIAR_3/clasificacion-ft";
var AssetMosaic='projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'

var AssetRegions = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-glacier-3';
var AssetRegionsRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-glacier-3';

var region = ee.FeatureCollection(AssetRegions).filterMetadata('id_regionC', 'equals', param.regionGlacier)
var regionRaster = ee.Image(AssetRegionsRaster).eq(param.regionGlacier).selfMask()

var prefixo_out = param.pais+ '-' + param.regionGlacier + '-' 
////*************************************************************
// Do not Change from these lines
////*************************************************************

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var mosaicRegion = param.regionGlacier.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median']);
            
var Clasificacion_TD = ee.ImageCollection(dirinput)
                      .filterMetadata('code_region', 'equals', param.regionGlacier)
                      .filterMetadata('version', 'equals', param.version_input)
                      .mosaic()
                      
print(Clasificacion_TD)
//-----
var years = [
    1985, 1986, 1987, 1988,
    1989, 1990, 1991, 1992,
    1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020];

// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

print(bandNames)


var baselineGlacier = Clasificacion_TD.select('classification_'+YearBase);
var integrated = Clasificacion_TD.updateMask(baselineGlacier.eq(34)).select(bandNames);

print(integrated)

// var year = 1986
// var yearANT = year-1
// var deforestaionYear = integrated.slice(1).select('classification_'+ year)
//                       .where(baselineGlacier.select('classification_'+ yearANT).eq(25), 25);
// print(deforestaionYear)
// print(ee.List(years).slice(1))

// var remapClass = function (year, image) {
//       print(deforestaionYear)
//       var deforestaionYear = integrated.select(ee.Number(year).subtract(1985))
//                             .where(ee.Image(image).select(ee.Image(image).bandNames().length().subtract(1)).eq(25), 25);
      
//       return ee.Image(image).addBands(deforestaionYear);
//   };
  
// var Fifper = ee.List(years).slice(1).iterate(remapClass, baselineGlacier)
// Fifper = ee.Image(Fifper);

// print('Fifper',Fifper) 
// Map.addLayer(Fifper,{},'Fifper')

var yearsAPPLY = years
print(yearsAPPLY)
var Filperv2 = Clasificacion_TD.select('classification_1985')
for(var i = 1;i<yearsAPPLY.length;i++){
  var clasyear = Clasificacion_TD.select('classification_'+yearsAPPLY[i])
  clasyear = Clasificacion_TD.select('classification_'+yearsAPPLY[i])
                             .where(Filperv2.select('classification_'+yearsAPPLY[i-1]).eq(25),25)
  Filperv2 = Filperv2.addBands(clasyear.rename('classification_'+yearsAPPLY[i]))
  //print(yearsAPPLY[i-1])
}

print(Filperv2)
                    
var classIds = [25];
var t0 = 1985;
var t1 = 2020;

function DeglaciacionCalc (integrated,classIds,t0,t1) {

  // rename the classIds pixels to the corresponding year
  var remapClass = function (year, image) {
  
      var deforestaionYear = integrated
          .select(ee.Number(year).subtract(t0))
          .remap(classIds, ee.List.repeat(year, classIds.length));
  
      return ee.Image(image).addBands(deforestaionYear);
  };
  
  // Get deforestation
  var deforestation = ee.Image(ee.List.sequence(t0, t1)
      .iterate(remapClass, ee.Image().select()))
      .reduce(ee.Reducer.min())
      .rename('year');
  
  
  deforestation = deforestation.mask(deforestation.neq(t0)).selfMask()

return deforestation
}

var Deglaciacion = DeglaciacionCalc(integrated,classIds,t0,t1)


//----
for(var y = 0; y<param.year.length;y++) {

    var vis = {
        'bands': 'classification_'+param.year[y],
        'min': 0,
        'max': 34,
        'palette': palettes.get('classification2')
    };
    
    Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year[y])
                      .mosaic().updateMask(regionRaster), {
          'bands': ['swir1_median', 'nir_median', 'red_median'],
          'gain': [0.08, 0.06, 0.08],
          'gamma': 0.65
      }, 'mosaic-'+param.year[y], false);
    
    Map.addLayer(Clasificacion_TD, vis, 'original'+param.year[y]);
    //Map.addLayer(Fifper, vis, 'Fifper'+param.year[y]);
    Map.addLayer(Filperv2, vis, 'Filperv2-'+param.year[y]);
    //Map.addLayer(filtered, vis, 'filtered'+param.year[y]);
}

var visdeglac = {
    'palette': 'ffff00,ff0000',
    'min': 1985,
    'max': 2020,
    'format': 'PNG'
    };
Map.addLayer(Deglaciacion, visdeglac, 'Deglaciacion', false);



var filtered = Filperv2
          .set('code_region', param.regionGlacier)
          .set('pais', param.pais)
          .set('version', param.version_output)
          .set('descripcion', 'filtro Permtemporal')
          .set('paso', 'P05')
          
print(filtered)

// EXPORTS 
  Export.image.toAsset({
      'image': filtered,
      'description': prefixo_out+param.version_output,
      'assetId': dirout+'/' +prefixo_out+param.version_output,
      'pyramidingPolicy': {
          '.default': 'mode'
      },
      'region': region.geometry().bounds(),
      'scale': 30,
      'maxPixels': 1e13
  });
  
  // Exportar a Google Drive
  if(param.exportOpcion.exportClasifToDrive){
    Export.image.toDrive({
      image: filtered.toInt8(),
      description: prefixo_out + 'DRIVE-'+param.version_output,
      folder: param.exportOpcion.DriveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: region.geometry().bounds()
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
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out+param.version_output,
      fileFormat: 'CSV',
      folder: 'P10-FiltroTempor-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(filtered, region)
}
  