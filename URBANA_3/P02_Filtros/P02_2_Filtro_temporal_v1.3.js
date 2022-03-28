var param = { 
    code_region: 70105,  //Region de Clasificacion 
    pais: 'PERU', 
    year: 1987,  // Solo visualizacion
    version_input: '2',
    version_output: '3',
    exportOpcion: {   // Opciones para exportar
      DriveFolder: 'DRIVE-EXPORT',  // carpeta a exportar archivo drive
      exportClasifToDrive:  false, // exporta clasificaciones a drive (true or false)
      exportEstadistica: false, // Exporta Areas (true or false)
    },
    exclusion:{  // Indicar en la lista las clases y años a excluir en el filtro
      clases : [],  //lista de clases a excluir en todos los años
      years  : [],  //lista de años a excluir con todas la clases
    }
};


//---------------------ORDEN DE PRIORIDAD DE EJECUCIÓN-----------------------
// Ejemplo si se pasa 3  caso: FF NV FF NV FF NV FF =  FF FF FF FF FF FF FF   La prioridad de mantener la clase será la clase a pasar primero
var ordem_exec_first =  [24];              //Filtro de primer año
var ordem_exec_last =   [24];                               //Filtro de ultimo año
var ordem_exec_middle = [24,27,24,27];  //Filtro de años intermedios

//--------------------------------------------

var dirinput = "projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion-ft";
var dirout  =   "projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion-ft";
var AssetMosaic='projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'

var AssetRegions = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3';
var AssetRegionsRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-3';

var region = ee.FeatureCollection(AssetRegions).filterMetadata('id_regionC', 'equals', param.code_region)
var regionRaster = ee.Image(AssetRegionsRaster).eq(param.code_region).selfMask()

var prefixo_out = param.pais+ '-' + param.code_region + '-' 
////*************************************************************
// Do not Change from these lines
////*************************************************************

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median'])
            .filterMetadata('year', 'equals', param.year);
            
var Clasificacion_TD = ee.ImageCollection(dirinput)
                      .filterMetadata('descripcion', 'equals', 'gapfill')  //
                      .filterMetadata('code_region', 'equals', param.code_region)
                      .filterMetadata('version', 'equals', param.version_input)
                      .mosaic()
                      
print(Clasificacion_TD)

//-----
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

// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);
var bandNamesExclude = ee.List(
    param.exclusion.years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);


// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(Clasificacion_TD.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

print(bandsOccurrence);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                Clasificacion_TD.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(Clasificacion_TD.select(0))
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
Clasificacion_TD = imageAllBands

//--- inserta pixel 0 en vez de mask---
var classif = ee.Image();

bandNames.getInfo().forEach(
  function (bandNames) {
    var image = Clasificacion_TD.select(bandNames)
    var band0 = ee.Image(27).updateMask(regionRaster)
    band0 = band0.where(image.gte(0),image)
    classif = classif.addBands(band0.rename(bandNames))
  }
)
Clasificacion_TD =classif.select(bandNames);

//----

var mask3 = function(valor, ano, imagem){
  var mask = imagem.select('classification_'+ (parseInt(ano) - 1)).eq (valor)
        .and(imagem.select('classification_'+ (ano)              ).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 1)).eq (valor))
  var muda_img = imagem.select('classification_'+ (ano)    ).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_'+ano).blend(muda_img)
  return img_out;
}

var mask4 = function(valor, ano, imagem){
  var mask = imagem.select('classification_'+ (parseInt(ano) - 1)).eq (valor)
        .and(imagem.select('classification_'+ (ano)              ).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 1)).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 2)).eq (valor))
  var muda_img  = imagem.select('classification_'+ (ano)              ).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var muda_img1 = imagem.select('classification_'+ (parseInt(ano) + 1)).mask(mask.eq(1)).where(mask.eq(1), valor); 
  var img_out = imagem.select('classification_'+ano).blend(muda_img).blend(muda_img1)
  return img_out;
}

var mask5 = function(valor, ano, imagem){
  var mask = imagem.select('classification_'+ (parseInt(ano) - 1)).eq (valor)
        .and(imagem.select('classification_'+ (ano)              ).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 1)).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 2)).neq(valor))
        .and(imagem.select('classification_'+ (parseInt(ano) + 3)).eq (valor))
  var muda_img  = imagem.select('classification_'+ (ano)              ).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var muda_img1 = imagem.select('classification_'+ (parseInt(ano) + 1)).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var muda_img2 = imagem.select('classification_'+ (parseInt(ano) + 2)).mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_'+ano).blend(muda_img).blend(muda_img1).blend(muda_img2)
  return img_out;
}

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];
var anos4 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018'];
var anos5 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017'];

var window5years = function(imagem, valor){
  var img_out = imagem.select('classification_1985')
  for (var i_ano=0;i_ano<anos5.length; i_ano++){  
    var ano = anos5[i_ano];  
    img_out = img_out.addBands(mask5(valor,ano, imagem)) }
    img_out = img_out.addBands(imagem.select('classification_2018'))
    img_out = img_out.addBands(imagem.select('classification_2019'))
    img_out = img_out.addBands(imagem.select('classification_2020'))
  return img_out
}

var window4years = function(imagem, valor){
  var img_out = imagem.select('classification_1985')
  for (var i_ano=0;i_ano<anos4.length; i_ano++){  
    var ano = anos4[i_ano];  
    img_out = img_out.addBands(mask4(valor,ano, imagem)) }
    img_out = img_out.addBands(imagem.select('classification_2019'))
    img_out = img_out.addBands(imagem.select('classification_2020'))
  return img_out
}

var window3years = function(imagem, valor){
  var img_out = imagem.select('classification_1985')
  for (var i_ano=0;i_ano<anos3.length; i_ano++){  
    var ano = anos3[i_ano];   
    img_out = img_out.addBands(mask3(valor,ano, imagem)) }
    img_out = img_out.addBands(imagem.select('classification_2020'))
  return img_out
}

var filtered = Clasificacion_TD

var mask3first = function(valor, imagem){
  var mask = imagem.select('classification_1985').neq (valor)
        .and(imagem.select('classification_1986').eq(valor))
        .and(imagem.select('classification_1987').eq (valor))
  var muda_img = imagem.select('classification_1985').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1985').blend(muda_img)
  img_out = img_out.addBands([imagem.select('classification_1986'),
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
                              imagem.select('classification_2020')])
  return img_out;
}

var mask3last = function(valor, imagem){
  var mask = imagem.select('classification_2018').eq (valor)
        .and(imagem.select('classification_2019').eq(valor))
        .and(imagem.select('classification_2020').neq (valor))
  var muda_img = imagem.select('classification_2020').mask(mask.eq(1)).where(mask.eq(1), valor);  
  var img_out = imagem.select('classification_1985')
  img_out = img_out.addBands([imagem.select('classification_1986'),
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
                              imagem.select('classification_2019')]);
  img_out = img_out.addBands(imagem.select('classification_2020').blend(muda_img));
  return img_out;
};

for (var i_class=0;i_class<ordem_exec_first.length; i_class++){  
  var id_class = ordem_exec_first[i_class]; 
  filtered = mask3first(id_class, filtered)
}

for (var i_class=0;i_class<ordem_exec_last.length; i_class++){  
  var id_class = ordem_exec_last[i_class]; 
  filtered = mask3last(id_class, filtered)
}

for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
  var id_class = ordem_exec_middle[i_class]; 
  filtered = window3years(filtered, id_class)
}

for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
  var id_class = ordem_exec_middle[i_class]; 
  filtered = window4years(filtered, id_class)
  filtered = window5years(filtered, id_class)
}

for (var i_class=0;i_class<ordem_exec_middle.length; i_class++){  
  var id_class = ordem_exec_middle[i_class]; 
  filtered = window3years(filtered, id_class)
}

// //--- inserta pixel 0 para mask---
// var classif = ee.Image();

// bandNames.getInfo().forEach(
//   function (bandNames) {
//     var image = filtered.select(bandNames)
//     var band0 = image.updateMask(image.unmask().gt(0))
//     classif = classif.addBands(band0.rename(bandNames))
//   }
// )

var classif_FT = filtered.select(bandNames)

//Excluir clase y años 
// Classes Exclude
if(param.exclusion.clases.length>0){
  var clasifi = ee.List([])
      
      param.exclusion.clases.forEach(function(clase){
        var clasif_code =Clasificacion_TD.eq(clase).selfMask()
        clasifi = clasifi.add(Clasificacion_TD.updateMask(clasif_code).selfMask())
      })
      
      clasifi = ee.ImageCollection(clasifi)
      clasifi = clasifi.max()
      Map.addLayer(clasifi,{},'clasific exclu_classe')
      classif_FT = classif_FT.blend(clasifi)
      print('Clases excluidos en el Filtro temporal', param.exclusion.clases);
}

// Year Exclude
if(param.exclusion.years.length>0){
  var yearExlud = Clasificacion_TD.select(bandNamesExclude);  //addbands
  classif_FT =  classif_FT.addBands(yearExlud,null,true); // Remplaza las clases a no modificar
  print('Años excluidos en el Filtro temporal', param.exclusion.years);
}
  
filtered =classif_FT.select(bandNames)
                    .updateMask(regionRaster);

//----

var vis = {
    'bands': 'classification_'+param.year,
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};


Map.addLayer(Clasificacion_TD, vis, 'original'+param.year);

Map.addLayer(filtered, vis, 'filtered'+param.year);

filtered = filtered.set('code_region', param.code_region)
                    .set('pais', param.pais)
                    .set('version', param.version_output)
                    .set('descripcion', 'filtro temporal')
                    .set('paso', 'P02-2');
print(filtered);
                 
// EXPORTS 
  Export.image.toAsset({
      'image': filtered,
      'description': prefixo_out+param.version_output,
      'assetId': dirout+'/' +prefixo_out+param.version_output,
      'pyramidingPolicy': {
          '.default': 'mode'
      },
      'region': region.geometry().bounds(),
      'scale': 30,
      'maxPixels': 1e13
  });
  
  // Exportar a Google Drive
  if(param.exportOpcion.exportClasifToDrive){
    Export.image.toDrive({
      image: filtered.toInt8(),
      description: prefixo_out + 'DRIVE-'+param.version_output,
      folder: param.exportOpcion.DriveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: region.geometry().bounds()
    });
  }
  
  /**
* Función para generar las estadísticas de cobertura por año y clase
*/
function getAreas(image, region) {

  var pixelArea = ee.Image.pixelArea();
  
  var reducer = {
    reducer: ee.Reducer.sum(),
    geometry: region.geometry(),
    scale: 30,
    maxPixels: 1e13
  };
  
  var bandNames = image.bandNames();
  
  var classIds = ee.List.sequence(0, 34);
  
  
  bandNames.evaluate( function(bands, error) {
    
    if(error) print(error.message);
    
    var yearsAreas = [];
  
  
    bands.forEach(function(band) {
    
      var year = ee.String(band).split('_').get(1),
          yearImage = image.select([band]);
  
      
      // Calcular áreas para cada clase cobertura
      var covers = classIds.map(function(classId) {
  
        classId = ee.Number(classId).int8();
      
        var yearCoverImage = yearImage.eq(classId),
            coverArea = yearCoverImage.multiply(pixelArea).divide(1e6);
        
        return coverArea.reduceRegion(reducer).get(band);
  
      }).add(year);
  
    
      // Generar la lista de keys para el diccionario
      var keys = classIds.map(function(item) {
  
        item = ee.Number(item).int8();
        
        var stringItem = ee.String(item);
        
        stringItem = ee.Algorithms.If(
          item.lt(10),
          ee.String('ID0').cat(stringItem),
          ee.String('ID').cat(stringItem)
        );
        
        return ee.String(stringItem);
        
      }).add('year');
  
      
      // Crear la lista de features para cada año, sin geometrías
      var dict = ee.Dictionary.fromLists(keys, covers);
  
      yearsAreas.push( ee.Feature(null, dict) );
      
    });
    
    
    yearsAreas = ee.FeatureCollection(yearsAreas);
  
    
    Export.table.toDrive({
      collection: yearsAreas,
      description: 'ESTADISTICAS-DE-COBERTURA-'+prefixo_out+param.version_output,
      fileFormat: 'CSV',
      folder: 'P02_2-FiltroTempor-CLASSIFICATION'
    });
      
  });
  
}

// Generar estadísticas de cobertura
if(param.exportOpcion.exportEstadistica){
  getAreas(filtered, region)
}
  