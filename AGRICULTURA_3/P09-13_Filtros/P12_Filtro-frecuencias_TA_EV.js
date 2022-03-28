// Este Filtro por clases

var param = {
    code_region: 20601,  //Region de Clasificacion
    pais: 'BOLIVIA',
    year: 2000,  // Solo visualizacion
    clases:[1], //Clases a considerar para vegetacion nativa 
    native_vegetation : 90, // % vegetación nativa minima para que sea considerado el filtro de frecuencia
    perc_majority: 80,       // % porcentaje mayoritario para que prevalezca una clase
    // ciclo: 'ciclo-1',
    version_input:6, //
    version_output:7,
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    },
    exclusion:{  // Indicar en la lista las clases y años a excluir en el filtro
      clases : [],  //lista de clases a excluir en todos los años
      years  : [],  //lista de años a excluir con todas la clases
    },
    ExcluFirstLastYear : true   // Para no aplicar filtro en los primeros y ultimos años con clases continuas
};
 
/**
 * Funcion para asignar una versión por ciclo
 * 
 */
// var getVersion = function (cicle) { 
//   var version = {
//     'ciclo-1': {
//       // Ciclo I
//         version_input:6,
//         version_output:7
//     },
//     'ciclo-2': {
//       // Ciclo II
//         version_input:13,
//         version_output:14
//     }
//   };
  
//   return version[cicle];
// }

// Obtiene la version de salida en base al ciclo
// var version = getVersion(param.ciclo);
var version_input = param.version_input;
var version_output = param.version_output;
  
var prefixo_out = param.pais+ '-' + param.code_region + '-' + version_output

var palettes = require('users/mapbiomas/modules:Palettes.js');
var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var assetClasif = paths.classificationTA;
var assetFiltros = paths.clasificacionFiltrosTA
var dirout  = paths.clasificacionFiltrosTA
var regionesclass = paths.regionVector
var regionesclassRaster = paths.regionCRaster
var AssetMosaic='projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'

var region = ee.FeatureCollection(regionesclass).filterMetadata('id_regionC', 'equals', param.code_region)
var regionRaster = ee.Image(regionesclassRaster).eq(param.code_region).selfMask()
var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median'])
            .filterMetadata('year', 'equals', param.year);

////*************************************************************
// Do not Change from these lines
////*************************************************************
var Classif_Input
if(param.version_input == 1 || param.version_input == 3){ 
    var assetPath = assetClasif + '/' + param.pais + '-' + param.code_region;
    Classif_Input = ee.Image(assetPath  + '-' + version_input);
   } else {
    Classif_Input = ee.ImageCollection(assetFiltros)
              .filterMetadata('code_region', 'equals', param.code_region)
              .filterMetadata('version', 'equals', version_input)
              .min();
   }


print(Classif_Input)

// get band names list 

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
    
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

var bandNamesExclude = ee.List(
    param.exclusion.years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);


// Add bands mask
  // generate a histogram dictionary of [bandNames, image.bandNames()]
  var bandsOccurrence = ee.Dictionary(
      bandNames.cat(Classif_Input.bandNames()).reduce(ee.Reducer.frequencyHistogram())
  );
  
  // print(bandsOccurrence);
  
  // insert a masked band 
  var bandsDictionary = bandsOccurrence.map(
      function (key, value) {
          return ee.Image(
              ee.Algorithms.If(
                  ee.Number(value).eq(2),
                  Classif_Input.select([key]).byte(),
                  ee.Image(27).rename([key]).byte().updateMask(Classif_Input.select(0))
              )
          );
      }
  );
  // convert dictionary to image
  var imageAllBands = ee.Image(
      bandNames.iterate(
          function (band, image) {
              return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
          },
          ee.Image().select()
      )
  );
  Classif_Input = imageAllBands



Classif_Input =Classif_Input.select(bandNames)


//print(Classif_Input)
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
function PALETTE() {
  return [
    'ffffff', 'FF0000', 'e2c539', '006400', '00ff00', '687537', '76a5af',
    '29eee4', '77a605', '935132', 'bbfcac', '45c2a5', 'b8af4f', 'f1c232', 
    'ffffb2', 'ffd966', 'f6b26b', 'f99f40', 'e974ed', 'd5a6bd', 'c27ba0',
    'fff3bf', 'ea9999', 'dd7e6b', 'aa0000', 'ff99ff', '0000ff', 'd5d5e5',
    'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff'
  ];
}
var PALETTE2 = PALETTE();
var vis = {
      bands: 'classification_'+param.year,
      min:0,
      max:34,
      palette: PALETTE2,
      format: 'png'
    };

var filtrofreq = function(mapbiomas){
  ////////Calculando frequencias
  // General rule
  var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
      '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+b(33)+b(34)+b(35))/36 )';
  
  // get frequency
  var frequency = ee.Image(0)
  param.clases.forEach(function(clas){
    var frecClas = mapbiomas.eq(clas).expression(exp).rename('class'+clas);
    frequency = frequency.addBands(frecClas)
  })
  
  //Máscara de clases seleccionadas (freq >%)
  var vegMask = frequency.reduce('sum');
  vegMask = ee.Image(0).where(vegMask.gt(param.native_vegetation), 1)
  
  // Remap
  var vegMap = ee.Image(0)
  param.clases.forEach(function(clas){
        vegMap = vegMap.where(vegMask.eq(1).and(frequency.select('class'+clas).gt(param.perc_majority)), clas)
  })

  vegMap = vegMap.updateMask(vegMap.neq(0))
  var Clasif_Filtro_Frec = mapbiomas.where(vegMap, vegMap)
  
  return Clasif_Filtro_Frec;
}

var Clasif_Filtro_Frec = filtrofreq(Classif_Input)


var class_col2 = Classif_Input

// SELECT THE CLASS OF THE FIRST YEAR TO BE REPEATED NEXT YEAR
var FirstYear_Select = bandNames
        .iterate(
            function (bandName, previousImage) {

                var currentImage = class_col2.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);
                
                currentImage = currentImage.eq(previousImage.select(0))
                                           .multiply(currentImage)//.selfMask();

                return ee.Image(previousImage).addBands(currentImage);

            }, ee.Image(class_col2.select([bandNames.get(0)]))
        );
        
FirstYear_Select = ee.Image(FirstYear_Select).select(bandNames);

var t0 = 1985;
var t1 = 2020;
//print(FirstYear_Select)

function FirstYearContinuityClass (year, previousImage2) {

                var currentImage = FirstYear_Select.select(ee.Number(year).subtract(t0));
                    previousImage2 = ee.Image(previousImage2)
                var num = ee.Number(year).subtract(t0)
                    currentImage = currentImage.where(previousImage2.select(num).eq(0), 0)//.selfMask()
                
                return ee.Image(previousImage2).addBands(currentImage);

            }

var firstYear = ee.Image(ee.List.sequence(t0, t1)
                      .iterate(FirstYearContinuityClass,FirstYear_Select.select(0)))
                      .select(bandNames)

// SELECT THE CLASS OF THE LAST YEAR TO BE REPEATED NEXT YEAR
var LastYear_Select = bandNames
        .iterate(
            function (bandName, previousImage) {

                var currentImage = class_col2.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);
                
                currentImage = currentImage.eq(previousImage.select(0))
                                           .multiply(currentImage)//.selfMask();

                return ee.Image(previousImage).addBands(currentImage);

            }, ee.Image(class_col2.select([bandNames.get(35)]))
        );
        
LastYear_Select = ee.Image(LastYear_Select).select(bandNames);
// Map.addLayer(LastYear_Select, {}, 'LastYear_Select', false)

var LastYear_Select_rev= LastYear_Select.select(bandNames.reverse())
function LastYearContinuityClass (year, previousImage2) {

                var currentImage = LastYear_Select_rev.select(ee.Number(year).subtract(t0));
                    previousImage2 = ee.Image(previousImage2)
                var num = ee.Number(year).subtract(t0)
                    currentImage = currentImage.where(previousImage2.select(num).eq(0), 0)//.selfMask()
                
                return ee.Image(previousImage2).addBands(currentImage);

            }

var lastYear = ee.Image(ee.List.sequence(t0, t1)
                      .iterate(LastYearContinuityClass,LastYear_Select_rev.select(0)))
                      .select(bandNames)
// print(lastYear)
// Map.addLayer(lastYear, {}, 'lastYear_identifi', false)

// Joint Band continuity class in first and last year
var continuityFisrtLastYear = firstYear.selfMask().unmask(lastYear.selfMask())
//Map.addLayer(continuityFisrtLastYear, {}, 'continuityFisrtLastYear', false)
if (param.ExcluFirstLastYear){
    Clasif_Filtro_Frec = Clasif_Filtro_Frec.blend(continuityFisrtLastYear)
   }

var Class_Original = Classif_Input;
var Class_Filtrada = Clasif_Filtro_Frec;

//Excluir clase y años 
// Classes Exclude
  if(param.exclusion.clases.length>0){
     var clasifi = ee.List([])
        
        param.exclusion.clases.forEach(function(clase){
          var clasif_code =Class_Original.eq(clase).selfMask()
          clasifi = clasifi.add(Class_Original.updateMask(clasif_code).selfMask())
        })
        
        clasifi = ee.ImageCollection(clasifi)
        clasifi = clasifi.max()
        Map.addLayer(clasifi,{},'clasific exclu_classe',false)
        Class_Filtrada = Class_Filtrada.blend(clasifi)
        print('Clases excluidos en el Filtro temporal', param.exclusion.clases);
  }

// Year Exclude
  if(param.exclusion.years.length>0){
    var yearExlud = Class_Original.select(bandNamesExclude);  //addbands
    Class_Filtrada =  Class_Filtrada.addBands(yearExlud,null,true); // Remplaza las clases a no modificar
    print('Años excluidos en el Filtro temporal', param.exclusion.years);
  }
  
Clasif_Filtro_Frec =Class_Filtrada.select(bandNames)
                    .updateMask(regionRaster);

Clasif_Filtro_Frec = Clasif_Filtro_Frec
          .set('code_region', param.code_region)
          .set('pais', param.pais)
          .set('version', version_output)
          .set('descripcion', 'filtro frecuencia TA')
          .set('paso', 'P12');

print(Classif_Input)
print(Clasif_Filtro_Frec)


Map.addLayer(region,{},'region',false)
Map.addLayer(mosaic.mosaic().updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year, false);
  
Map.addLayer(Classif_Input, vis, 'image-'+param.year);

Map.addLayer(Clasif_Filtro_Frec, vis, 'filtered-'+param.year);


Export.image.toAsset({
    'image': Clasif_Filtro_Frec,
    'description': prefixo_out,
    'assetId': dirout+'/'+prefixo_out,
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
      image: Clasif_Filtro_Frec.toInt8(),
      description: prefixo_out + '-DRIVE-'+version_output,
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
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out+version_output,
      fileFormat: 'CSV',
      folder: 'P12-FiltroFrecuencia-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(Clasif_Filtro_Frec, region)
}
  