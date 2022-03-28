/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
  country: 'PERU',
  input: 'MINERIA-703-PERU-ANDES-CENTRO-1',
  output: 'MINERIA-703-PERU-ANDES-CENTRO-2',
  inputCollection: 'clasificacion',
  regionIds: [ 703 ],
  minConnectedPixels: 5,
  years: [
    1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
  ],
  yearsPreview: [2010],
  version: 2
};





// params
var country = param.country;
var regionIds = param.regionIds;
var input = param.input;
var output = param.output;
var inputCollection = param.inputCollection;

var yearsPreview = param.yearsPreview;
var optionalFilters = param.optionalFilters;
var min_connect_pixel = param.minConnectedPixels;
var eightConnected = true;
var years = param.years;
var version = param.version


// inputs
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification2');
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
var bandNames = ee.List(
  years.map(function (year) {
    return 'classification_' + String(year);
  })
);


var classif = ee.Image();
var bandnameReg = image.bandNames();
var bands = bandnameReg.getInfo();
if(bands[0] === 'constant') {
  bands = bands.slice(1);
}


bands.forEach(function (bandName) {
  var imagey = image.select(bandName);
  var band0 = imagey.updateMask(imagey.unmask().neq(0));
  classif = classif.addBands(band0.rename(bandName));
});

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
      newImage = newImage
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

var class4FT = allBandsImage;




// spatial filter
var imageFilledConnected = class4FT.addBands(
  class4FT
    .connectedPixelCount(100, eightConnected)
    .rename(bandNames.map(
      function (band) { return ee.String(band).cat('_connected') }
    ))
);


var class_outTotal = ee.Image(0).updateMask(regionsRaster);

years.forEach(function(year){  
  var image = imageFilledConnected.select('classification_' + year);
  var connected = imageFilledConnected.select('classification_' + year + '_connected');
  
  var moda = image
    .focal_mode(1, 'square', 'pixels')
    .mask(connected.lte(min_connect_pixel));
    
  var class_out = image.blend(moda);
  
  class_outTotal = class_outTotal.addBands(class_out);
  
  return class_outTotal;
});





// visualizations
Map.setOptions('SATELLITE');

class_outTotal = class_outTotal
  .select(bandNames)
  .updateMask(regionsRaster);

var reprojected = class_outTotal.reproject({
  crs: 'EPSG:4326',
  scale: 30
});

yearsPreview.forEach(function(year) {
  var selector = 'classification_' + year;
  
  var original = class4FT.select(selector);
  var filtered = reprojected.select(selector);
  var mos = mosaics.filterMetadata('year', 'equals', year).mosaic();

  original = original.mask(original.eq(30));
  filtered = filtered.mask(filtered.eq(30));

  mos = mos.mask(regionsRaster);
  
  Map.addLayer(
    mos, 
    {
      bands: ['swir1_median', 'nir_median', 'red_median'],
      gain: [0.08, 0.06, 0.2]
    }, 
    'MOSAICO ' + year,
    false
  );


  Map.addLayer(
    original,
    vis,
    'ORIGINAL ' + year,
    false
  );

  Map.addLayer(
    filtered,
    vis,
    'FILTERED ' + year,
    false
  );

});




// Exports
class_outTotal = class_outTotal.select(bandNames)
  .set({
    code_region: regionIds,
    pais: country,
    version: version,
    descripcion: 'filtro espacial',
    cover: 'mineria'
  });
  
print('INPUT: ' + input, image);
print('OUTPUT: ' + output, class_outTotal);

Export.image.toAsset({
  'image': class_outTotal,
  'description': output,
  'assetId': outputDir + output,
  'pyramidingPolicy': {
      '.default': 'mode'
  },
  'region': regions.geometry().bounds(),
  'scale': 30,
  'maxPixels': 1e13
});