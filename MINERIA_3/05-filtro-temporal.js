/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
  country: 'PERU',
  input: 'MINERIA-703-PERU-ANDES-CENTRO-1',
  output: 'MINERIA-703-PERU-ANDES-CENTRO-2',
  inputCollection: 'clasificacion',
  regionIds: [ 703 ],
  years: [
    1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
  ],
  yearPreview: 2010,
  version: 2,
  optionalFilters: {
    fourYears: true,
    fiveYears: true
  }
};



// params
var country = param.country;
var regionIds = param.regionIds;
var input = param.input;
var output = param.output;
var inputCollection = param.inputCollection;
var outputVersion = param.outputVersion;
var years = param.years;
var yearPreview = param.yearPreview;
var optionalFilters = param.optionalFilters;
var first =  [1];              //Filtro de primer año
var last =   [1];              //Filtro de ultimo año
var middle = [30];       //Filtro de años intermedios


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




var filtered = allBandsImage;

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
  'min': 0,
  'max': 34,
  'palette': palette,
  'format': 'png'
};

var selector = 'classification_' + yearPreview;

var original = allBandsImage.select(selector);
var fullFiltered = filtered.select(selector);
var mos = mosaics.filterMetadata('year', 'equals', yearPreview).mosaic();

original = original.mask(original.eq(30));
fullFiltered = fullFiltered.mask(fullFiltered.eq(30));
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
  fullFiltered,
  vis,
  'FILTRO TEMPORAL ' + yearPreview
);





/**
 * Export images to asset
 */
filtered = filtered.select(bandNames)
  .set({
    code_region: regionIds,
    pais: country,
    version: outputVersion,
    descripcion: 'filtro temporal',
    cover: 'mineria'
  });
  
print('INPUT: ' + input, allBandsImage);
print('OUTPUT: ' + output, filtered);

Export.image.toAsset({
  image: filtered,
  description: output,
  assetId:  outputDir + output,
  pyramidingPolicy: { '.default': 'mode' },
  region: regions.geometry().bounds(),
  scale: 30,
  maxPixels: 1e13
});