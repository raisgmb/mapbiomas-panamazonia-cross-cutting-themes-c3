// Filtro Incidentes Prepare
var param = {
    code_region: 20601,  //Region de Clasificacion
    pais: 'BOLIVIA',
    year: 1995,   // Solo visualizacion
    Min_incidencia:6,
    // ciclo: 'ciclo-1',
    version_input:7, // 
    version_output:8,// 
};

//editar os parametros
var anos = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', 
            '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', 
            '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
            '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', 
            '2017', '2018', '2019', '2020']
            
var classeIds =    [1,2]
var newClasseIds = [1,2]

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
//         version_input:7,
//         version_output:8
//     },
//     'ciclo-2': {
//       // Ciclo II
//         version_input:14,
//         version_output:15
//     }
//   };
  
//   return version[cicle];
// }

// Obtiene la version de salida en base al ciclo
// var version = getVersion(param.ciclo);
var version_input = param.version_input;
var version_output = param.version_output;
var prefixo_out = param.pais+ '-' + param.code_region + '-' + version_output

var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median']);

var regions = ee.FeatureCollection(regionesclass)
                .filterMetadata('id_regionC', "equals", param.code_region);
                
var regionRaster = ee.Image(regionesclassRaster).eq(param.code_region).selfMask();

var palettes = require('users/mapbiomas/modules:Palettes.js');

var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};
print(dirinput)
var imc_carta2 = ee.ImageCollection(dirinput)

imc_carta2 = imc_carta2.filterMetadata('code_region', 'equals', param.code_region)
                  .filterMetadata('version', 'equals', version_input)
                  // .filterMetadata('paso', 'equals', 'P12')
                  .min();


Map.addLayer(mosaic.filterMetadata('year', 'equals', param.year)
                   .mosaic()
                   .updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08]
      //'gamma': 0.65
  }, 'mosaic-'+param.year, false);
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
Map.addLayer(imc_carta2, {
    'bands': 'classification_' + param.year,
    'min': 0,
    'max': 34,
    'palette': PALETTE2,//palettes.get('classification2')
}, 'Clasificacion_Original'+ param.year);

var colList = ee.List([])
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  var colList = colList.add(imc_carta2.select(['classification_'+ano],['classification']))
}
var imc_carta = ee.ImageCollection(colList)

var img1 =  ee.Image(imc_carta.first());

var image_moda = imc_carta2.reduce(ee.Reducer.mode());

// ******* incidence **********
var imagefirst = img1.addBands(ee.Image(0)).rename(["classification", "incidence"]);

var incidence = function(imgActual, imgPrevious){
  
  imgActual = ee.Image(imgActual);
  imgPrevious = ee.Image(imgPrevious);
  
  var imgincidence = imgPrevious.select(["incidence"]);
  
  var classification0 = imgPrevious.select(["classification"]);
  var classification1 = imgActual.select(["classification"]);
  
  
  var change  = ee.Image(0);
  change = change.where(classification0.neq(classification1), 1);
  imgincidence = imgincidence.where(change.eq(1), imgincidence.add(1));
  
  return imgActual.addBands(imgincidence);
  
};

var imc_carta4 = imc_carta.map(function(image) {
    image = image.remap(classeIds, newClasseIds, 21)
    image = image.mask(image.neq(27));
    return image.rename('classification');
});
print(imc_carta4)
// Map.addLayer(imc_carta4, vis, 'imc_carta4');

var image_incidence = ee.Image(imc_carta4.iterate(incidence, imagefirst)).select(["incidence"]);

image_incidence = image_incidence.mask(image_incidence.gt(param.Min_incidencia))

image_incidence = image_incidence.addBands(image_incidence.where(image_incidence.gt(param.Min_incidencia),1).rename('valor1'))
image_incidence = image_incidence.addBands(image_incidence.select('valor1').connectedPixelCount(100,false).rename('connect'))
image_incidence = image_incidence.addBands(image_moda)


Map.addLayer(image_incidence.select('incidence'), {min:5, max:12, palette:['f0ff0c','ffd60c','ffa114','ff7f12','ff0606']}, "incidents");
Map.addLayer(image_incidence.select('mode'), {'min': 0,
                                              'max': 34,
                                              'palette': palettes.get('classification2')}, "temporal mode");

image_incidence =image_incidence
        .set('code_region', param.code_region)
        .set('pais', param.pais)
        .set('version', version_output)
        .set('descripcion', 'filtro incidentes preparado')
        .set('paso', 'P13-1');
        
print(image_incidence)

Export.image.toAsset({
    'image': image_incidence,
    'description': prefixo_out,
    'assetId': dirout+'/'+ prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});