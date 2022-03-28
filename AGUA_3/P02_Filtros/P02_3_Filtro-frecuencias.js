/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Este Filtro es clases Water_Area_Perc
 
var param = {
    code_region: 70304,  //Region de Clasificacion
    pais: 'PERU',
    year: 2015,  // Solo visualizacion
    Water_Area_Perc : 70, // % Agua minima para que sea considerado el filtro de frecuencia
    perc_majority: 70,       // % porcentaje mayoritario para que prevalezca una clase
    version_input: '3',
    version_output: '4',
    metodo: 'DT', // RF o DT
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    }
}; 

// Obtiene la version de salida en base al ciclo
var version_input = param.version_input;
var version_output = param.version_output;
  
var prefixo_out = param.pais+ '-' + param.code_region + '-'+ param.metodo + '-' + version_output

var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var dirinput = "projects/mapbiomas-raisg/TRANSVERSALES/AGUA_3/clasificacion-ft";
var dirout  =   "projects/mapbiomas-raisg/TRANSVERSALES/AGUA_3/clasificacion-ft";
var AssetMosaic='projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'
var regionesclass = paths.regionVector
var regionesclassRaster = paths.regionCRaster

var regionRaster = ee.Image(regionesclassRaster).eq(param.code_region).selfMask()
var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median'])
            .filterMetadata('year', 'equals', param.year);

////*************************************************************
// Do not Change from these lines
////*************************************************************
var regions = ee.FeatureCollection(regionesclass)
    .filterMetadata('id_regionC', "equals", param.code_region);
    
Map.addLayer(regions,{},'region',true)

var palettes = require('users/mapbiomas/modules:Palettes.js');

//var class4 = ee.Image(dirout+prefixo_out+vesion_in)

var class4 = ee.ImageCollection(dirinput)
              .filterMetadata('code_region', 'equals', param.code_region)
              .filterMetadata('version', 'equals', version_input)
              .filterMetadata('paso', 'equals', 'P02-2')
              .filterMetadata('metodo', 'equals', param.metodo)
              .min();


print(class4)

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


class4 =class4.select(bandNames)


//print(class4)
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_'+param.year,
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };

var filtrofreq = function(mapbiomas){
  ////////Calculando frequencias
  // General rule
  var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
      '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+b(33)+b(34)+b(35))/36 )';
  
  // get frequency
  var water = mapbiomas.eq(33).expression(exp);
  // var florFreq = mapbiomas.eq(3).expression(exp);
  // var florInundFreq = mapbiomas.eq(6).expression(exp);
  // var grassFreq = mapbiomas.eq(12).expression(exp);
  // var naoFlorFreq = mapbiomas.eq(13).expression(exp);

  //////Máscara de vegetacao nativa e agua (freq >95%)
  var vegMask = ee.Image(0)
                          .where(water.gt(param.Water_Area_Perc), 1);
  
  /////Mapa base: 
  var  vegMap = ee.Image(0)
                          .where(vegMask.eq(1).and(water.gt(param.perc_majority)), 33)
                          // .where(vegMask.eq(1).and(florFreq.gt(param.perc_majority)), 3)
                          // .where(vegMask.eq(1).and(grassFreq.gt(param.perc_majority)), 12)
                          // .where(vegMask.eq(1).and(naoFlorFreq.gt(param.perc_majority)), 13)
                          // .where(vegMask.eq(1).and(florInundFreq.gt(param.perc_majority)), 6)
                          
  
  vegMap = vegMap.updateMask(vegMap.neq(0))//.clip(BiomaPA)
  var Clasif_Filtro_Frec = mapbiomas.where(vegMap, vegMap)
  
  return Clasif_Filtro_Frec;
}


var Clasif_Filtro_Frec = filtrofreq(class4);



var class_col2 = class4

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
// Map.addLayer(FirstYear_Select, {}, 'FirstYear_Select', false)


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
// print(firstYear)
// Map.addLayer(firstYear, {}, 'firstYear_identifi', false)

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

Clasif_Filtro_Frec = Clasif_Filtro_Frec.blend(continuityFisrtLastYear)


Clasif_Filtro_Frec = Clasif_Filtro_Frec
          .set('code_region', param.code_region)
          .set('pais', param.pais)
          .set('version', version_output)
          .set('descripcion', 'filtro frecuencia')
          .set('metodo', param.metodo)
          .set('paso', 'P02-3');

print(class4)
print(Clasif_Filtro_Frec)

Map.addLayer(mosaic.mosaic().updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year, false);
  
Map.addLayer(class4, vis, 'Clasif_Orig-'+param.year);

Map.addLayer(Clasif_Filtro_Frec, vis, 'filtered_Frec-'+param.year);


Export.image.toAsset({
    'image': Clasif_Filtro_Frec,
    'description': prefixo_out,
    'assetId': dirout+'/'+prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry().bounds(),
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
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out,
      fileFormat: 'CSV',
      folder: 'P12-FiltroFrecuencia-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(Clasif_Filtro_Frec, regions)
}
  