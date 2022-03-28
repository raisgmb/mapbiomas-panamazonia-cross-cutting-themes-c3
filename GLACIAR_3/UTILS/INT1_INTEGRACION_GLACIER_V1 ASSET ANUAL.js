/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var Area_trabajo = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Feature(
        ee.Geometry.Polygon(
            [[[-78.02089627611248, 0.05804874476756476],
              [-78.02089627611248, -0.007525891276110162],
              [-77.95652325975506, -0.007525891276110162],
              [-77.95652325975506, 0.05804874476756476]]], null, false),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Animacion de clasificacion con texto de año y crea gif 
// Por Pais
// By : Efrain Yury Turpo Cayo 
// IBC-PERU  
// solo dibujar el area de interes Area_trabajo

var params = { 
    Tema: 'GLACIAR',
    ID_pais: 7,
    pais: 'BOLIVIA', //
    years: [1985, 1990, 2020],  // Lista de años Solo para visualizacion
    version_output:'1',
    source:'Fundación amigos de la naturaleza (FAN)'
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

var palettes = require('users/mapbiomas/modules:Palettes.js');
var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var assetmosaics= paths.mosaics_c3_v2
var regionesMosaicRaster = paths.regionMosRaster
var dirout = 'projects/mapbiomas-raisg/TRANSVERSALES/GLACIAR_3/INTEGRACION/GLACIAR3'
var assetCountries = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-2';
var assetCountriesRaster = "projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/paises-3";
var dirinput = 'projects/mapbiomas-raisg/TRANSVERSALES/GLACIAR_3/clasificacion-ft';
//var assetPath = dirinput + '/' +  params.pais +'-CLASES-GENERALES-'+ params.version_input;

var collection = ee.ImageCollection(dirinput)
                .filterMetadata('pais', 'equals', params.pais)
                //.filterMetadata('code_region', 'equals', param.regionGlacier)
                .filterMetadata('version', 'equals', 7)
                .mosaic()

var regionMosaicRaster = ee.Image(regionesMosaicRaster)

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
                  .filterMetadata('name', 'equals', NamecountryCase(params.pais));
                  
var countryraster = ee.Image(assetCountriesRaster).eq(params.ID_pais).selfMask()
print(countryraster)

var integracionGlacier = collection.updateMask(collection.eq(34))
                                   .updateMask(countryraster)

var MosaicoCollection = ee.ImageCollection(assetmosaics)
    .filter(ee.Filter.inList('year',params.years))
    //.filterMetadata('country', 'equals', param.pais)
    .select(['swir1_median', 'nir_median', 'red_median'])
    .map(
        function (image) {
            return image.updateMask(
                regionMosaicRaster.eq(ee.Number.parse(image.get('region_code')).toInt16()));
        }
    );



for (var yearI=0;yearI<params.years.length;yearI++) {
var vis = {
    'bands': 'classification_'+params.years[yearI],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

Map.addLayer(MosaicoCollection.filterMetadata('year', 'equals', params.years[yearI]),{
  "bands":["swir1_median","nir_median","red_median"],
  "min":407,"max":3381}, 'Mosaic' + params.years[yearI],false)
Map.addLayer(integracionGlacier, vis, 'classification_export'+params.years[yearI],false);
}

for(var year=1985; year<=2020;year++){
  var prefixo_out = params.pais + '-' + year + '-' + params.version_output
  var integracionyear = integracionGlacier.select('classification_'+year)
                          .rename('classification')
                          .set('country', params.pais)
                          .set('theme', 'GLACIER')
                          .set('year', year)
                          .set('version', params.version_output)
                          .set('collection', '3.0')
                          .set('source', params.source);
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

