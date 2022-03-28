var param = {
  country: 'PERU',
  input: 'MINERIA-703-PERU-ANDES-NORTE-2',
  output: 'MINERIA-703-PERU-ANDES-NORTE-3',
  inputCollection: 'clasificacion-ft',
  regionIds: [ 703 ],
  years: [
    1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
  ],
  yearPreview: 2019,
  version: 2
};





// params
var country = param.country;
var regionIds = param.regionIds;
var input = param.input;
var output = param.output;
var inputCollection = param.inputCollection;

var yearPreview = param.yearPreview;
var optionalFilters = param.optionalFilters;
var years = param.years;
var version = param.version


// inputs
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification2');
palette[1] = palette[6];
var vis = { min: 0, max: 34, palette: palette, format: 'png'};
var outputDir = 'projects/mapbiomas-raisg/TRANSVERSALES/MINERIA_3/clasificacion-ft/';
var regionsPath = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3';
var inputDir = "projects/mapbiomas-raisg/TRANSVERSALES/MINERIA_3/clasificacion";


var image = ee.Image('projects/mapbiomas-raisg/TRANSVERSALES/MINERIA_3/' + inputCollection + '/' + input);

var regionCodes = regionIds.map(function(item){ return item.toString() });
var mosaics = ee.ImageCollection('projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2')
  .filter(
    ee.Filter.or(
      ee.Filter.inList('region_code', regionCodes)
    )
  )
  .select(['swir1_median', 'nir_median', 'red_median']);


var regions = ee.FeatureCollection(regionsPath)
  .filter(
    ee.Filter.or(
      ee.Filter.inList('id_region', regionIds),
      ee.Filter.inList('id_regionC', regionIds)
    )
  );
  
var regionsRaster = regions
  .map(function(item) { return item.set('version', 1) })
  .reduceToImage(['version'], ee.Reducer.first());


// get band names list 
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
    
    var selected = image.select(bandName);

    var newImage = ee.Image(0)
      .updateMask(regionsRaster)
      .where(nodata.eq(27), 27)
      .where(selected.eq(30).or(selected.eq(1)), 1);
    
    var band0 = newImage.updateMask(newImage.unmask().neq(0));

    classif = classif.addBands(band0.rename(bandName));
  }
);


image = classif.select(bands).unmask().updateMask(regionsRaster);


// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames
      .cat(image.bandNames())
      .reduce(ee.Reducer.frequencyHistogram())
);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(function (key, value) {
  var output = ee.Image(
    ee.Algorithms.If(
      ee.Number(value).eq(2),
      image.select([key]),
      ee.Image(27).rename([key])
    )
  );
  
  return output.byte();
});


// convert dictionary to image
var allBandsImage = ee.Image(
  bandNames.iterate(
    function (band, image) {
      var newImage = ee.Image(bandsDictionary.get(ee.String(band)));
      
      newImage = newImage.updateMask(newImage.neq(0))
        .where(newImage.eq(0), 27)
        .where(newImage.eq(1), 30)
        .rename(ee.String(band));
      return ee.Image(image)
        .addBands(newImage)
        .updateMask(regionsRaster);
    },
    ee.Image().select()
  )
);




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




// apply the gap fill
var imageFilled = applyGapFill(allBandsImage);






/**
 * visualizations
 */
Map.setOptions('SATELLITE');

var vis = {
  'min': 0,
  'max': 34,
  'palette': palette,
  'format': 'png'
};

var selector = 'classification_' + yearPreview;

var original = allBandsImage.select(selector);
var filtered = imageFilled.select(selector);
var mos = mosaics.filterMetadata('year', 'equals', yearPreview).mosaic();

original = original.mask(original.eq(30));
filtered = filtered.mask(filtered.eq(30));
mos = mos.mask(regionsRaster);

Map.addLayer(
  mos, 
  {
    bands: ['swir1_median', 'nir_median', 'red_median'],
    gain: [0.08, 0.06, 0.2]
  }, 
  'MOSAICO ' + yearPreview,
  false
);

Map.addLayer(
  original,
  vis,
  'ORIGINAL ' + yearPreview,
  false
);

Map.addLayer(
  filtered,
  vis,
  'GAP FILL ' + yearPreview
);





/**
  * Export images to asset
  */
imageFilled = imageFilled.select(bandNames)
  .set({
    code_region: regionIds,
    pais: country,
    version: version,
    descripcion: 'gapfill',
    cover: 'MINERIA'
  });
  
print('INPUT: ' + input, image);
print('OUTPUT: ' + output, imageFilled);

Export.image.toAsset({
  image: imageFilled,
  description: output,
  assetId:  outputDir + output,
  pyramidingPolicy: { '.default': 'mode' },
  region: regions.geometry().bounds(),
  scale: 30,
  maxPixels: 1e13
});

