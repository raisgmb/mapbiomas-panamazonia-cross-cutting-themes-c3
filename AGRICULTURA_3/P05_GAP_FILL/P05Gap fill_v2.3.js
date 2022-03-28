/** 
                                P05 CLASIFICACION PRELIMINAR  GAPFILL
 Update  2018___   Marcos:  
 Update  20181008  EYTC: Adaptacion para col2
 Update  20181021  EYTC: actualizacion para años sin clasificacion en toda la region
 Update  20191030  João: otimização e image metadata
 Update  20201027  EYTC: Act para col3

 * @input
 * 
 * param: objeto de parámetros en formato JSON. Contiene:
 *    code_region: id de la región de clasificación.
 *    pais: nombre del país en letras mayúsculas.
 *    version_input: numero de la versión de clasificacion de entrada del paso P04.
 *    version_out: numero de la versión que se exportará el asset.
 *    veightConnected: tipo de coneccion true= ocho lados false= 4 lados .
 *    years: año para visualizacion de clasificacion.
 **/
 
/** 
 * User defined parameters
 */
var param = {
    code_region: 20601,  //Region de Clasificacion
    pais: 'BOLIVIA',
    eightConnected: true,
    year: 2017  // Solo visualizacion
};

//------------Versiones---------------------
// Ciclo I
    var version_input= 1
    var version_output= 2
//------------------------------------------


var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;
var assetCollection = paths.classificationTA;
var assetRegions = paths.regionVector
var assetOutput = paths.clasificacionFiltrosTA
var assetOutputMetadata = paths.filtrosMetadataTA

// var assetCollection = 'projects/mapbiomas-raisg/COLECCION2/P04_Clasificacion/clasificacion_RF';
// var assetRegions = 'projects/mapbiomas-raisg/COLECCION2/0_DATOS_AUXILIARES/VECTORES/ClassifRegiones_buffer240';
// var assetOutput = 'projects/mapbiomas-raisg/COLECCION2/P05_Gap_fill/clasificacion_RF_GFill';
// var assetOutputMetadata = 'projects/mapbiomas-raisg/COLECCION2/P05_Gap_fill/clasificacion_RF_GFill_metadata';

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

var palettes = require('users/mapbiomas/modules:Palettes.js');
var eePalettes = require('users/gena/packages:palettes');
/**
 * User defined functions
 */
var applyGapFill = function (image) {

    // apply the gap fill form t0 until tn
    var imageFilledt0tn = bandNames.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = image.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select([0]));

                return currentImage.addBands(previousImage);

            }, ee.Image(image.select([bandNames.get(0)]))
        );

    imageFilledt0tn = ee.Image(imageFilledt0tn);

    // apply the gap fill form tn until t0
    var bandNamesReversed = bandNames.reverse();

    var imageFilledtnt0 = bandNamesReversed.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = imageFilledt0tn.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select(previousImage.bandNames().length().subtract(1)));

                return previousImage.addBands(currentImage);

            }, ee.Image(imageFilledt0tn.select([bandNamesReversed.get(0)]))
        );


    imageFilledtnt0 = ee.Image(imageFilledtnt0).select(bandNames);

    return imageFilledtnt0;
};
/**
 * 
 */
var regions = ee.FeatureCollection(assetRegions)
    .filterMetadata('id_regionC', "equals", param.code_region);

var image = ee.ImageCollection(assetCollection)
    .filterMetadata('code_region', 'equals', param.code_region)
    .filterMetadata('version', 'equals', version_input)
    .min();


// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

//--- inserta pixel 0 para mask---
print('bandnameReg',image)
var classif = ee.Image();
var bandnameReg = image.bandNames();
bandnameReg.getInfo().forEach(
  function (bandName) {
    var imagey = image.select(bandName)
    var band0 = imagey.updateMask(imagey.unmask().neq(27))
    classif = classif.addBands(band0.rename(bandName))
  }
)

image =classif.select(bandnameReg);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

print(bandsOccurrence);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image.select(0))
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


// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);

// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);
var imageFilledYear = applyGapFill(imagePixelYear);

print(imageFilledtnt0);

// add connected pixels bands
var imageFilledConnected = imageFilledtnt0.addBands(
    imageFilledtnt0
        .connectedPixelCount(100, param.eightConnected)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_connected')
            }
        ))
);
//print(imageFilledConnected)
/**
* Export images to asset
*/
var imageName = param.pais + '-' + param.code_region + '-' + version_output;

Export.image.toAsset({
    'image': imageFilledConnected.select(bandNames)
        .set('code_region', param.code_region)
        .set('pais', param.pais)
        .set('version', version_output)
        .set('descripcion', 'gapfill')
        .set('paso', 'P05'),
    'description': imageName,
    'assetId': assetOutput + '/' + imageName,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});

var imageNameGapFill = param.pais + '-' + param.code_region + '-' + version_output + '-metadata';

Export.image.toAsset({
    'image': imageFilledYear
        .set('code_region', param.code_region)
        .set('pais', param.pais)
        .set('version', version_output)
        .set('descripcion', 'gapfill metadata')
        .set('paso', 'P05'),
    'description': imageNameGapFill,
    'assetId': assetOutputMetadata + '/' + imageNameGapFill,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': regions.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});
/**
* Layers
*/

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
    'bands': ['classification_' + param.year],
    'min': 0,
    'max': 34,
    'palette': PALETTE2,//palettes.get('classification2'),
    'format': 'png'
};


Map.addLayer(
    image,
    vis,
    'clasificacion original ' + param.year);

Map.addLayer(
    imageFilledConnected.select(bandNames),
    vis,
    'clasificacion gap fill ' + param.year);

Map.addLayer(imageFilledYear,
    {
        'bands': ['classification_' + param.year],
        'min': 1985,
        'max': 2020,
        'palette': eePalettes.colorbrewer.YlOrBr[9],
        'format': 'png'
    },
    'image metadata',false
);
print('image',image)
print('imageFilledConnected',imageFilledConnected)
print('imageFilledYear',imageFilledYear)

Map.addLayer(
    regions.style({
        "color": "ff0000",
        "fillColor": "ff000000"
    }),
    {
        "format": "png"
    },
    'Region ' + param.code_region,
    false);