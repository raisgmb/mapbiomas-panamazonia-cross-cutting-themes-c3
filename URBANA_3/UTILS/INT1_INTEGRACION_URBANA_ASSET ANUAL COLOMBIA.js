/** 
 *  Preintegracion Tema Transversal Urbano
 * by: EYTC
 */
 
var param = {
    Tema: 'URBANA',
    ID_pais: 3,
    pais: 'COLOMBIA', //
    years: [2020],  // Lista de años Solo para visualizacion
    version_output:'1',
    source:'Fundacion Gaia Amazonas'
     }; 
     
/*
    PERU : 8
    GUIANA_FRANCESA: 9
    VENEZUELA : 1
    GUYANA : 2
    COLOMBIA: 3
    BRASIL: 4
    ECUADOR: 5
    SURINAME: 6
    BOLIVIA: 7
*/

// CODIGO DE REGION Y VERSION A INTEGRAR
var codesAndVersions = [
  // COLOMBIA
    [30201,	'5'],
    [30202,	'5'],
    [30203,	'5'],
    [30204,	'5'],
    [30205,	'5'],
    [30206,	'5'],
    [30207,	'5'],
    [30208,	'5'],
    [30209,	'5'],
    [30210,	'5'],
    [30211,	'10'],
    [30212,	'10'],
    [30213,	'5'],
    [30214,	'5'],
    [30215,	'5'],
    [30216,	'5'],
    [30217,	'5'],
    [30218,	'10'],
    [30219,	'5'],
    [30220,	'5'],
    [30101,	'5'],
    [30102,	'5'],
    [30103,	'5'],
    [30104,	'5'],
    [30105,	'5'],
    [30106,	'5'],
    [30107,	'5'],
    [30108,	'5'],
    [30221,	'5'],
    [30222,	'5'],
    [30223,	'5'],
    [30224,	'5'],
    [30225,	'5'],
    [30226,	'5'],
    [30227,	'5'],

  // // BOLIVIA
  // [20201,	'5'],
  // [20202,	'5'],
  // [20203,	'5'],
  // [20204,	'5'],
  // [20101,	'5'],
  // [21001,	'5'],
  // [21002,	'5'],
  // [21201,	'5'],
  // [20601,	'5'],

  // // ECUADOR
      // [40101,'5'],
      // [40102,'5'],
      // [40103,'5'],
      // [40104,'5'],
      // [40105,'5'],
      // [40201,'5'],
      // [40202,'5'],
      // [40203,'5'],
      // [40204,'5'],
      // [40205,'5'],
      // [40601,'5'],
      // [40602,'5'],

  // // GUYANAS
  // [50201,	'5'],
  // [50202,	'5'],
  // [50203,	'5'],
  // [50204,	'5'],
  // [50205,	'5'],
  // [50903,	'5'],
  // [50904,	'5'],
  // [60208,	'5'],
  // [60209,	'5'],
  // [80206,	'5'],
  // [80207,	'5'],

  // PERÚ
  // [70101,	'5'],
  // [70102,	'5'],
  // [70103,	'5'],
  // [70105,	'5'],
  // [70106,	'5'],
  // [70108,	'5'],
  // [70111,	'5'],
  // [70112,	'5'],
  // [70113,	'5'],
  // [70115,	'5'],
  // [70201,	'5'],
  // [70202,	'5'],
  // [70203,	'5'],
  // [70204,	'5'],
  // [70205,	'5'],
  // [70207,	'5'],
  // [70208,	'5'],
  // [70209,	'5'],
  // [70210,	'5'],
  // [70211,	'5'],
  // [70301,	'5'],
  // [70302,	'5'],
  // [70303,	'5'],
  // [70304,	'5'],
  // [70305,	'5'],
  // [70306,	'5'],
  // [70307,	'5'],
  // [70308,	'5'],
  // [70309,	'5'],
  // [70310,	'5'],
  // [70311,	'5'],
  // [70312,	'5'],
  // [70313,	'5'],

  // VENEZUELA
  
  // [90201,	10],
  // [90202,	'10'],
  // [90203,	'10'],
  // [90204,	'10'],
  // [90205,	'10'],
  // [90206,	'10'],
  // [90207,	'10'],
  // [90208,	'10'],
  // [90209,	'10'],
  // [90210,	'10'],
  // [90211,	'10'],
  // [90212,	'10'],
  // [90213,	'10'],
  // [90214,	'10'],
  // [90215,	'10'],
  // [90216,	'10'],
  // [90217,	'10'],
  // [90218,	'10'],
  // [90219,	'10'],
  // [90220,	'10'],
  // [90221,	'10'],
  // [90222,	'10'],
  // [90223,	'10'],
  // [90224,	'10'],
  // [90225,	'10'],
  // [90226,	'10'],
  // [90227,	'10'],
  // [90501,	'10'],
  // [90502,	'10'],
  // [90503,	'10'],
  // [90504,	'10'],
  // [90505,	'10'],
  // [90506,	'10'],
  // [90301,	'10'],
  // [90302,	'10'],
  // [90303,	'10'],

];
        
        
// Assets
//---------------------------------
var palettes = require('users/mapbiomas/modules:Palettes.js');
var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var dirinput = 'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion-ft'
var dirout = 'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/INTEGRACION/URBANO3'
var assetCountries = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-2';
var assetCountriesRaster = "projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/paises-3";
var regionesclass = paths.regionVector
var regionesclassRaster = paths.regionCRaster
var regionesMosaicRaster = paths.regionMosRaster
var assetmosaics= paths.mosaics_c3_v2

//---------------------------------

var collection = ee.ImageCollection(dirinput);

print(collection)
//
// convert vector to raster
//

function NamecountryCase (name){
          var paisLowerCase =''
          switch (name) {
            case "PERU":
                paisLowerCase = 'Perú';
                break;
            case "GUIANA_FRANCESA":
                paisLowerCase = 'Guiana Francesa';
                break;
            case "VENEZUELA":
                paisLowerCase = 'Venezuela';
                break;
            case "GUYANA":
                paisLowerCase = 'Guyana';
                break;
            case "COLOMBIA":
                paisLowerCase = 'Colombia';
                break;
            case "BRASIL":
                paisLowerCase = 'Brasil';
                break;
            case "ECUADOR":
                paisLowerCase = 'Ecuador';
                break;
            case "SURINAME":
                paisLowerCase = 'Suriname';
                break;
            case "BOLIVIA":
                paisLowerCase = 'Bolivia'
            }
  return paisLowerCase
}

var country = ee.FeatureCollection(assetCountries)
                .filterMetadata('name', 'equals', NamecountryCase(param.pais));
                  
Map.addLayer(country, {}, 'country', false)   

var countryraster = ee.Image(assetCountriesRaster).eq(param.ID_pais).selfMask()

var regionsRaster = ee.Image(regionesclassRaster)
var regionMosaicRaster = ee.Image(regionesMosaicRaster)
//
// Integrate
//

var collectionsByRegion = codesAndVersions
    .map(
        function (codeAndVersion) {
            var images = collection
                .filterMetadata('code_region', 'equals', codeAndVersion[0])
                .filterMetadata('version', 'equals', codeAndVersion[1])
                .map(
                    function (image) {
                        return image.mask(regionsRaster.eq(codeAndVersion[0]));
                    }
                );
            //print(codeAndVersion[0], codeAndVersion[1])
            return images.mosaic().byte();
        }
    );

var allRegionsClassification = ee.ImageCollection.fromImages(ee.List(collectionsByRegion));
var integracion_v0 = allRegionsClassification.mosaic()

var bandnamelist = integracion_v0.bandNames().getInfo();                            
print(bandnamelist)
var integracion_v0_24 = ee.Image()
bandnamelist.forEach(function(bandname){
       var integracion_year = ee.Image(27).where(integracion_v0.select(bandname).eq(24), 24)
       integracion_v0_24 = integracion_v0_24.addBands(integracion_year.rename(bandname))
  })


integracion_v0_24 = integracion_v0_24.select(bandnamelist).toInt8().updateMask(countryraster)

var MosaicoCollection = ee.ImageCollection(assetmosaics)
    .filter(ee.Filter.inList('year',param.years))
    //.filterMetadata('country', 'equals', param.pais)
    .select(['swir1_median', 'nir_median', 'red_median'])
    .map(
        function (image) {
            return image.updateMask(
                regionMosaicRaster.eq(ee.Number.parse(image.get('region_code')).toInt16()));
        }
    );

// Layer add

for (var yearI=0;yearI<param.years.length;yearI++) {
var vis = {
    'bands': 'classification_'+param.years[yearI],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

Map.addLayer(MosaicoCollection.filterMetadata('year', 'equals', param.years[yearI]),{
  "bands":["swir1_median","nir_median","red_median"],
  "min":407,"max":3381}, 'Mosaic' + param.years[yearI],false)
Map.addLayer(integracion_v0, vis, 'classification_'+param.years[yearI],false);
Map.addLayer(integracion_v0_24, vis, 'classification_export'+param.years[yearI],false);
}

// integracion_v0_24 = integracion_v0_24
//         //.set('ID_pais', param.ID_pais)
//         //.set('pais', param.pais)
//         .set('tema', param.Tema)
//         .set('version', param.version_output)
//         .set('descripcion', 'integracion v0');
        
print(integracion_v0_24)  


//PAIS-AÑO-VERSIÓN
// - country (string) [para mapa general y para temas transversales] Ej: BOLIVIA
// - theme (string) [solo para temas transversales] Ej: WATER
// - year (number - integer) Ej: 2010
// - version (string) - use números en formato de string. Debe ser la misma versión que está en el nombre del asset Ej: 1
// - collection (number - float). Ejemplo: 3.0
// - source (string) - Ejemplo: imazon, solved, Instituto del Bien Común (IBC), Fundacion Ecociencia...

for(var year=1985; year<=2020;year++){
  var prefixo_out = param.pais + '-' + year + '-' + param.version_output
  var integracionyear = integracion_v0_24.select('classification_'+year)
                          .rename('classification')
                          .set('country', param.pais)
                          .set('theme', 'URBAN')
                          .set('year', year)
                          .set('version', param.version_output)
                          .set('collection', '3.0')
                          .set('source', param.source);
    print(year, integracionyear);
    
    Export.image.toAsset({
        'image':integracionyear,
        'description': prefixo_out,
        'assetId': dirout+'/' +prefixo_out,
        'pyramidingPolicy': {
            '.default': 'mode'
        },
        'region': country.geometry().bounds(),
        'scale': 30,
        'maxPixels': 1e13
    });
}