/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
  country: 'ECUADOR',
  regionIds: [40201],
  cover: 'flooded',
  year: 2000,
  inputVersion: 2,
  outputVersion: 3,
  optionalFilters: {
    fourYears: true,
    fiveYears: true
  }
};



// params
var country = param.country;
var regionIds = param.regionIds;
var cover = param.cover;
var inputVersion = param.inputVersion;
var outputVersion = param.outputVersion;
var year = param.year;
var optionalFilters = param.optionalFilters;
var first =  [1];              //Filtro de primer año
var last =   [1];              //Filtro de ultimo año
var middle = [1, 27, 1];       //Filtro de años intermedios


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



// setup temporal masks 
var mask3 = function(valor, ano, imagem){
  var prev = 'classification_' + (parseInt(ano, 10) - 1);
  var curr = 'classification_' + (parseInt(ano, 10));
  var next = 'classification_' + (parseInt(ano, 10) + 1);
  
  var mask = imagem
    .select(prev).eq (valor)
      .and(imagem.select(curr).neq(valor))
      .and(imagem.select(next).eq (valor));
  
  var muda_img = imagem.select(curr)
    .mask(mask.eq(1)).where(mask.eq(1), valor);
    
  var img_out = imagem
    .select(curr).blend(muda_img);
  
  return img_out;
};


var mask4 = function(valor, ano, imagem){
  var prev = 'classification_' + (parseInt(ano, 10) - 1);
  var curr = 'classification_' + (parseInt(ano, 10));
  var next = 'classification_' + (parseInt(ano, 10) + 1);
  var nex2 = 'classification_' + (parseInt(ano, 10) + 2);
  
  var mask = imagem
    .select(prev).eq (valor)
      .and(imagem.select(curr).neq(valor))
      .and(imagem.select(next).neq(valor))
      .and(imagem.select(nex2).eq (valor));
  
  var muda_img  = imagem.select(curr)
    .mask(mask.eq(1)).where(mask.eq(1), valor);  
  
  var muda_img1 = imagem
    .select(next).mask(mask.eq(1)).where(mask.eq(1), valor); 

  var img_out = imagem.select(curr).blend(muda_img).blend(muda_img1);

  return img_out;
};

var mask5 = function(valor, ano, imagem){
  var prev = 'classification_' + (parseInt(ano, 10) - 1);
  var curr = 'classification_' + (parseInt(ano, 10));
  var next = 'classification_' + (parseInt(ano, 10) + 1);
  var nex2 = 'classification_' + (parseInt(ano, 10) + 2);
  var nex3 = 'classification_' + (parseInt(ano, 10) + 3);

  var mask = imagem
    .select(prev).eq (valor)
      .and(imagem.select(curr).neq(valor))
      .and(imagem.select(next).neq(valor))
      .and(imagem.select(nex2).neq(valor))
      .and(imagem.select(nex3).eq (valor));
  
  var muda_img  = imagem
    .select(curr).mask(mask.eq(1)).where(mask.eq(1), valor);  
  
  var muda_img1 = imagem
    .select(next).mask(mask.eq(1)).where(mask.eq(1), valor);  
  
  var muda_img2 = imagem
    .select(nex2).mask(mask.eq(1)).where(mask.eq(1), valor);  
  
  var img_out = imagem
    .select('classification_'+ano)
    .blend(muda_img).blend(muda_img1).blend(muda_img2);
  
  return img_out;
};


var anos3 = [
  '1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
  '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
  '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015',
  '2016','2017','2018','2019'
];


var anos4 = anos3.slice(0, -1);

var anos5 = anos4.slice(0, -1);


var window5years = function(imagem, valor){
  var img_out = imagem.select('classification_1985');
   
  for (var i_ano=0;i_ano<anos5.length; i_ano++){  
    var ano = anos5[i_ano];  
    img_out = img_out.addBands(mask5(valor,ano, imagem));
  }
  img_out = img_out.addBands(imagem.select('classification_2018'));
  img_out = img_out.addBands(imagem.select('classification_2019'));
  img_out = img_out.addBands(imagem.select('classification_2020'));
     
  return img_out;
};

var window4years = function(imagem, valor){
  var img_out = imagem.select('classification_1985');
  
  for (var i_ano=0;i_ano<anos4.length; i_ano++){  
    var ano = anos4[i_ano];  
    img_out = img_out.addBands(mask4(valor,ano, imagem));
  }
  img_out = img_out.addBands(imagem.select('classification_2019'));
  img_out = img_out.addBands(imagem.select('classification_2020'));
  
  return img_out;
};

var window3years = function(imagem, valor){
  var img_out = imagem.select('classification_1985');
  
  for (var i_ano=0;i_ano<anos3.length; i_ano++) {  
    var ano = anos3[i_ano];   
    img_out = img_out.addBands(mask3(valor,ano, imagem));
  }
  
  img_out = img_out.addBands(imagem.select('classification_2020'));
  
  return img_out;
};




var filtered = imageAllBands;

var mask3first = function(valor, imagem){
  var mask = imagem.select('classification_1985').neq (valor)
        .and(imagem.select('classification_1986').eq(valor))
        .and(imagem.select('classification_1987').eq (valor));
        
  var muda_img = imagem.select('classification_1985').mask(mask.eq(1)).where(mask.eq(1), valor);
  
  var img_out = imagem.select('classification_1985').blend(muda_img);
  
  img_out = img_out.addBands([
    imagem.select('classification_1986'),
    imagem.select('classification_1987'),
    imagem.select('classification_1988'),
    imagem.select('classification_1989'),
    imagem.select('classification_1990'),
    imagem.select('classification_1991'),
    imagem.select('classification_1992'),
    imagem.select('classification_1993'),
    imagem.select('classification_1994'),
    imagem.select('classification_1995'),
    imagem.select('classification_1996'),
    imagem.select('classification_1997'),
    imagem.select('classification_1998'),
    imagem.select('classification_1999'),
    imagem.select('classification_2000'),
    imagem.select('classification_2001'),
    imagem.select('classification_2002'),
    imagem.select('classification_2003'),
    imagem.select('classification_2004'),
    imagem.select('classification_2005'),
    imagem.select('classification_2006'),
    imagem.select('classification_2007'),
    imagem.select('classification_2008'),
    imagem.select('classification_2009'),
    imagem.select('classification_2010'),
    imagem.select('classification_2011'),
    imagem.select('classification_2012'),
    imagem.select('classification_2013'),
    imagem.select('classification_2014'),
    imagem.select('classification_2015'),
    imagem.select('classification_2016'),
    imagem.select('classification_2017'),
    imagem.select('classification_2018'),
    imagem.select('classification_2019'),
    imagem.select('classification_2020')
  ]);
  
  return img_out;
};

var mask3last = function(valor, imagem){
  var mask = imagem.select('classification_2018').eq (valor)
        .and(imagem.select('classification_2019').eq(valor))
        .and(imagem.select('classification_2020').neq (valor));
        
  var muda_img = imagem.select('classification_2020').mask(mask.eq(1)).where(mask.eq(1), valor);

  var img_out = imagem.select('classification_1985');

  img_out = img_out.addBands([
    imagem.select('classification_1986'),
    imagem.select('classification_1987'),
    imagem.select('classification_1988'),
    imagem.select('classification_1989'),
    imagem.select('classification_1990'),
    imagem.select('classification_1991'),
    imagem.select('classification_1992'),
    imagem.select('classification_1993'),
    imagem.select('classification_1994'),
    imagem.select('classification_1995'),
    imagem.select('classification_1996'),
    imagem.select('classification_1997'),
    imagem.select('classification_1998'),
    imagem.select('classification_1999'),
    imagem.select('classification_2000'),
    imagem.select('classification_2001'),
    imagem.select('classification_2002'),
    imagem.select('classification_2003'),
    imagem.select('classification_2004'),
    imagem.select('classification_2005'),
    imagem.select('classification_2006'),
    imagem.select('classification_2007'),
    imagem.select('classification_2008'),
    imagem.select('classification_2009'),
    imagem.select('classification_2010'),
    imagem.select('classification_2011'),
    imagem.select('classification_2012'),
    imagem.select('classification_2013'),
    imagem.select('classification_2014'),
    imagem.select('classification_2015'),
    imagem.select('classification_2016'),
    imagem.select('classification_2017'),
    imagem.select('classification_2018'),
    imagem.select('classification_2019')
  ]);
  
  img_out = img_out
    .addBands(imagem.select('classification_2020').blend(muda_img));
  
  return img_out;
};




// implementation
var filtered, original;
if(inputVersion === 1) {
  filtered = imageAllBands;
  original = imageAllBands;
}
else {
  filtered = classification;
  original = classification;
}


for (var i_class=0;i_class<first.length; i_class++){  
   var id_class = first[i_class]; 
   filtered = mask3first(id_class, filtered);
}

for (var i_class=0;i_class<last.length; i_class++){  
   var id_class = last[i_class]; 
   filtered = mask3last(id_class, filtered);
}

for (var i_class=0;i_class<middle.length; i_class++){  
   var id_class = middle[i_class]; 
   filtered = window4years(filtered, id_class);
   filtered = window5years(filtered, id_class);
}

for (var i_class=0;i_class<middle.length; i_class++){  
   var id_class = middle[i_class]; 
   filtered = window3years(filtered, id_class);
}


for (var i_class=0;i_class<middle.length; i_class++){  
   var id_class = middle[i_class]; 
   filtered = window3years(filtered, id_class)
}





if(optionalFilters.fourYear && optionalFilters.fiveYears) {
  for (var i = 0; i < middle.length; i++){  
     var id_class = middle[i];
     filtered = window4years(filtered, id_class);
     filtered = window5years(filtered, id_class);
  }
}

if(optionalFilters.fourYear) {
  for (var i = 0; i < middle.length; i++){
     var id_class = middle[i];
     filtered = window4years(filtered, id_class);
  }
}

if(optionalFilters.fiveYear) {
  for (var i = 0; i < middle.length; i++){
     var id_class = middle[i];
     filtered = window5years(filtered, id_class);
  }
}

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
    descripcion: 'filtro temporal',
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