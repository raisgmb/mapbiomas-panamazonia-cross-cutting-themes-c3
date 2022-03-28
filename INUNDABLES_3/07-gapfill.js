var param = {
  regionIds: [40201],
  country: 'ECUADOR',
  cover: 'flooded',
  year: 1990,
  inputVersion: 1,
  outputVersion: 2
};

// params
var regionIds = param.regionIds;
var country = param.country;
var cover = param.cover;
var year = param.year;
var inputVersion = param.inputVersion;
var outputVersion = param.outputVersion;






/**
 * Imports
 */

// colors
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification2');
palette[1] = palette[6];



// regions
var regionsLayer = ee.FeatureCollection('projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3')
  .filter(
    ee.Filter.inList('id_regionC', regionIds)
  )
  .map(function(item) { return item.set('version', 1) });

var regionsRaster = regionsLayer
  .reduceToImage(['version'], ee.Reducer.first());



// input collection
var path;

var fullRegion = cover.toUpperCase() + '-' + regionIds.join('-') + '-' + country;

var inputDir = "projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion";
if(inputVersion === 1) path = inputDir + '/' + fullRegion;
else path = inputDir + '-ft/' + fullRegion + '-' + inputVersion; 

var classification = ee.Image(path);



// mosaics
var mosaicRegions = regionIds.map(function(id) {
  return ee.String(ee.Number(id)).slice(0, 3);
});

var mosaics = ee.ImageCollection('projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2')
  .filter(
    ee.Filter.inList('region_code', mosaicRegions)
  )
  .select(['swir1_median', 'nir_median', 'red_median']);
            
var mosaic = mosaics
  .filterMetadata('year', 'equals', year);


var years = [
  1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 
  1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 
  2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
];





/**
 * functions: applyGapFill
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

var image = classification;





/**
 * Setup masked bands to original image
 */
var bandnameReg = image.bandNames();
var bands = bandnameReg.getInfo();
var classif = ee.Image(0);

var bandNames = ee.List(
  years.map(function (year) {
    return 'classification_' + String(year);
  })
);

if(bands[0] === 'constant') bands = bands.slice(1);

bands.forEach(
  function (bandName) {
    var year = parseInt(bandName.split('_')[1], 10);
    
    var nodata = ee.Image(27);
    
    var mosaic =  mosaics
      .filterMetadata('year', 'equals', year);
    
    var mosaicBand = mosaic
      .select('swir1_median')
      .mosaic()
      .updateMask(regionsRaster);
    
    nodata = nodata.updateMask(mosaicBand);

    var newImage = ee.Image(0)
      .updateMask(regionsRaster)
      .where(nodata.eq(27), 27)
      .where(
        image.select(bandName).eq(1), 1
      );
    
    var band0 = newImage.updateMask(newImage.unmask().neq(0));

    classif = classif.addBands(band0.rename(bandName));
  }
);

image = classif.select(bandnameReg);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// insert a masked band 
var bandsDictionary = bandsOccurrence
  .map( function (key, value) {
    return ee.Image(
      ee.Algorithms.If(
        ee.Number(value).eq(2),
        image.select([key]).byte(),
        ee.Image().rename([key]).byte().updateMask(image.select(0))
      )
  )}
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

// apply the gap fill
var imageFilled = applyGapFill(imageAllBands);






/**
 * visualizations
 */
Map.setOptions('SATELLITE');

var vis = {
  'bands': ['classification_' + year],
  'min': 0,
  'max': 34,
  'palette': palette,
  'format': 'png'
};

if(mosaic.size().getInfo() !== 0) {
  Map.addLayer(
    mosaic
      .filterMetadata('year', 'equals', year)
      .mosaic()
      .updateMask(regionsRaster), 
      {
        'bands': ['swir1_median', 'nir_median', 'red_median'],
        'gain': [0.08, 0.06, 0.08],
        'gamma': 0.65
      },
    'MOSAIC ' + year, false
  );
}

Map.addLayer(
  imageAllBands,
  vis,
  'ORIGINAL ' + year,
  false
);

Map.addLayer(
  imageFilled,
  vis,
  'GAP FILL ' + year,
  false
);

Map.addLayer(
  regionsLayer.style({
      "color": "ffffff",
      "fillColor": "ff000000"
  }),
  {},
  'EXPORT REGION'
);





/**
  * Export images to asset
  */
var outputAsset = 'projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion-ft/';
var imageName = fullRegion + '-' + outputVersion;

imageFilled = imageFilled.select(bandNames)
  .set({
    code_region: regionIds,
    pais: country,
    version: outputVersion,
    descripcion: 'gapfill',
    cover: cover
  });
  
print('INPUT: ' + fullRegion, classification);
print('OUTPUT: ' + imageName, imageFilled);

Export.image.toAsset({
  image: imageFilled,
  description: imageName,
  assetId:  outputAsset + imageName,
  pyramidingPolicy: { '.default': 'mode' },
  region: regionsLayer.geometry().bounds(),
  scale: 30,
  maxPixels: 1e13
});

