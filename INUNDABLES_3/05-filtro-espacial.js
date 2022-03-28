/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
  country: 'PERU',
  regionIds: [
    70209
  ],
  cover: 'flooded',
  minConnectedPixels: 50,
  years: [
    1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
  ],
  yearsPreview: [1985, 1986, 1987],
  inputVersion: 1,
  outputVersion: 2,
};





// params
var country = param.country;
var regionIds = param.regionIds;
var cover = param.cover;
var inputVersion = param.inputVersion;
var outputVersion = param.outputVersion;
var yearsPreview = param.yearsPreview;
var optionalFilters = param.optionalFilters;
var min_connect_pixel = param.minConnectedPixels;
var eightConnected = true;
var years = param.years;


// inputs
var path;
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification2');
palette[1] = palette[6];
var vis = { min: 0, max: 34, palette: palette, format: 'png'};
var outputDir = 'projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion-ft/';
var regionsPath = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3';
var inputDir = "projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion";
var fullRegion = cover.toUpperCase() + '-' + regionIds.join('-') + '-' + country;

if(inputVersion === 1) path = inputDir + '/' + fullRegion;
else path = inputDir + '-ft/' + fullRegion + '-' + inputVersion;

var image = ee.Image(path);

var regions = ee.FeatureCollection(regionsPath)
  .filter(
    ee.Filter.inList('id_regionC', regionIds)
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
      var newImage = ee.Image(bandsDictionary.get(ee.String(band)))
        .remap([0, 1], [27, 1], 27)
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

  Map.addLayer(
    class4FT.select(selector),
    vis,
    'ORIGINAL ' + year,
    false
  );

  Map.addLayer(
    reprojected.select(selector),
    vis,
    'FILTERED ' + year,
    false
  );

});




// Exports
var imageName = fullRegion + '-' + outputVersion;

class_outTotal = class_outTotal.select(bandNames)
  .set({
    code_region: regionIds,
    pais: country,
    version: outputVersion,
    descripcion: 'filtro espacial',
    cover: cover
  });
  
print('INPUT: ' + fullRegion + '-' + inputVersion, image);
print('OUTPUT: ' + imageName, class_outTotal);

Export.image.toAsset({
  'image': class_outTotal,
  'description': imageName,
  'assetId': outputDir + imageName,
  'pyramidingPolicy': {
      '.default': 'mode'
  },
  'region': regions.geometry().bounds(),
  'scale': 30,
  'maxPixels': 1e13
});