var param = {
  regionIds: [40201],
  country: 'ECUADOR',
  cover: 'flooded',
  year: 2000,
  coverPercent: 50,
  majorityPercent: 50,
  inputVersion: 2,
  outputVersion: 3
};

// params
var regionIds = param.regionIds;
var country = param.country;
var cover = param.cover;
var year = param.year;
var coverPercent = param.coverPercent;
var majorityPercent = param.majorityPercent;
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

var image = classification;



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
    
    if(inputVersion === 1) nodata = nodata.updateMask(mosaicBand);

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




var frequencyFilter = function(mapbiomas){
  var bands = mapbiomas.bandNames();
  
  var inputImage = bands.map(function(band) {
    var selected = mapbiomas.select([band]);
    
    var unmasked = ee.Image(0)
      .where(selected.eq(1), 1)
      .updateMask(regionsRaster);
    
    return unmasked;
  });
  
  inputImage = ee.ImageCollection(inputImage)
    .toBands().rename(bands);
  
  var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
      '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+b(33)+b(34)+b(35))/36 )';
  
  // get frequency
  var wetlands = inputImage.eq(1).expression(exp);

  // Natural vegetation and water masks (freq > 95%)
  var vegMask = ee.Image(0).where(wetlands.gt(coverPercent), 1);
  
  // Base map 
  var  vegMap = ee.Image(0)
    .where(vegMask.eq(1).and(wetlands.gt(majorityPercent)), 1);

                          
  vegMap = vegMap.updateMask(vegMap.neq(0));
  var filtered = mapbiomas.where(vegMap, vegMap);
  
  return filtered;
};


// implementation
var filtered, original;
if(inputVersion === 1) {
  filtered = frequencyFilter(imageAllBands);
  original = imageAllBands;
}
else {
  filtered = frequencyFilter(classification);
  original = classification;
}



var class_col2 = imageAllBands;

// SELECT THE CLASS OF THE FIRST YEAR TO BE REPEATED NEXT YEAR
var FirstYear_Select = bandNames
  .iterate(
    function (bandName, previousImage) {

      var currentImage = class_col2.select(ee.String(bandName));

      previousImage = ee.Image(previousImage);
      
      currentImage = currentImage
        .eq(previousImage
        .select(0))
        .multiply(currentImage);

      return ee.Image(previousImage).addBands(currentImage);

    }, ee.Image(filtered.select([bandNames.get(0)]))
  );
        
FirstYear_Select = ee.Image(FirstYear_Select).select(bandNames);


var t0 = 1985, t1 = 2020;

function FirstYearContinuityClass (year, previousImage2) {
  var currentImage = FirstYear_Select.select(ee.Number(year).subtract(t0));
  previousImage2 = ee.Image(previousImage2);

  var num = ee.Number(year).subtract(t0);
  currentImage = currentImage.where(previousImage2.select(num).eq(0), 0);
  
  return ee.Image(previousImage2).addBands(currentImage);
}


var firstYear = ee.Image(ee.List.sequence(t0, t1)
  .iterate(FirstYearContinuityClass,FirstYear_Select.select(0)))
  .select(bandNames);



// SELECT THE CLASS OF THE LAST YEAR TO BE REPEATED NEXT YEAR
var LastYear_Select = bandNames
  .iterate(
    function (bandName, previousImage) {

      var currentImage = class_col2.select(ee.String(bandName));

      previousImage = ee.Image(previousImage);
      
      currentImage = currentImage.eq(previousImage.select(0))
                                 .multiply(currentImage);

      return ee.Image(previousImage).addBands(currentImage);

    }, ee.Image(class_col2.select([bandNames.get(35)]))
  );
        
LastYear_Select = ee.Image(LastYear_Select).select(bandNames);


var LastYear_Select_rev= LastYear_Select.select(bandNames.reverse());



function LastYearContinuityClass (year, previousImage2) {
  var currentImage = LastYear_Select_rev.select(ee.Number(year).subtract(t0));
  previousImage2 = ee.Image(previousImage2);
  
  var num = ee.Number(year).subtract(t0);
  currentImage = currentImage.where(previousImage2.select(num).eq(0), 0);
  
  return ee.Image(previousImage2).addBands(currentImage);
}


var lastYear = ee.Image(ee.List.sequence(t0, t1)
  .iterate(LastYearContinuityClass,LastYear_Select_rev.select(0)))
  .select(bandNames);

var continuityFisrtLastYear = firstYear.selfMask().unmask(lastYear.selfMask());


filtered = filtered.blend(continuityFisrtLastYear);





/**
 * Visualizations
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

filtered = filtered.select(bandNames)
  .set({
    code_region: regionIds,
    pais: country,
    version: outputVersion,
    descripcion: 'filtro de frecuencias',
    cover: cover
  });
  
print('INPUT: ' + fullRegion + '-' + inputVersion, classification);
print('OUTPUT: ' + imageName, filtered);

Export.image.toAsset({
  image: filtered,
  description: imageName,
  assetId:  outputAsset + imageName,
  pyramidingPolicy: { '.default': 'mode' },
  region: regionsLayer.geometry().bounds(),
  scale: 30,
  maxPixels: 1e13
});