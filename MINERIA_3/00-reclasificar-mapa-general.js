// Parámetros de usuario
var param = {
  country: 'VENEZUELA',
  regionId: 90224,
  inputVersion: 4,
  period: [1985, 2020],
  globalSurfaceWater: {
    band: 'occurrence',
    minPercentage: 30
  }
};





var regionId = param.regionId;
var country = param.country;
var inputVersion = param.inputVersion;
var period = param.period;
var water = param.globalSurfaceWater;
var setVersion = function(item) { return item.set('version', 1) };


// Definir región de clasificación
var regionsPath = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3';
var regionLayer = ee.FeatureCollection(regionsPath)
  .filterMetadata('id_regionC', 'equals', regionId)
  .map(setVersion);
  
var regionRaster = regionLayer
  .reduceToImage(['version'], ee.Reducer.first());
  

// Definir ROI como raster
var rois = {
  VENEZUELA: 'users/Mosaico_Clasification/AFF/GENERAL/VECTORS/30-mineria-las-claritas-canaima',
  PERU: '',
  ECUADOR: '',
  GUYANA: '',
  SURINAME: '',
  GUIANA_FRANCESA: '',
  BOLIVIA: '',
  COLOMBIA: ''
};
var roi = ee.FeatureCollection(rois[country]);


var raster = roi
  .map(setVersion)
  .reduceToImage(['version'], ee.Reducer.first());


raster = raster
  .addBands(ee.Image.pixelArea())
  .clipToBoundsAndScale({
      geometry: regionLayer.geometry().bounds(),
      scale: 30
  })
  .select('first');

Map.addLayer(raster)

// Definir ventana temporal
var allYears = ee.List.sequence(1985, 2020).getInfo();
var interval = ee.List.sequence(period[0], period[1]);
var bands = interval.map(function(item){
  item = ee.String(ee.Number(item).toInt16());
  return ee.String('classification_').cat(item);
});


// Cargar clasificación y 'cortar' por región
// Realmente lo que hago es importar el asset correspondiente a la región. El mismo asset ya viene delimitado
// Luego enmascaro lo que está por fuera de la referencia de minería
var basePath = 'projects/mapbiomas-raisg/COLECCION3/clasificacion-ft/';
var assetName = country + '-' + regionId + '-' + inputVersion;
var classification = ee.Image(basePath + assetName );


// Definir máscara de rios usando GSW
var waterImage = ee.Image("JRC/GSW1_2/GlobalSurfaceWater")
  .select(water.band)
  .gt(water.minPercentage)
  .eq(1)
  .unmask()
  .updateMask(regionRaster);


// Importar mosaicos Landsat
var assetMosaic = 'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2';
var regionCode = regionId.toString().substring(0, 3);
var mosaic = ee.ImageCollection(assetMosaic)
  .filterMetadata('region_code', 'equals', regionCode)
  .select(['swir1_median', 'nir_median', 'red_median']);


// Definir paleta de colores y parámetros de visualización
var palette = require('users/mapbiomas/modules:Palettes.js')
  .get('classification2');
var vis = { min: 0, max: 34, palette: palette};


// Crear la imagen reclasificada para cada año
var finalImage = ee.Image(0).updateMask(raster);
var range = interval.getInfo();
Map.setOptions('SATELLITE');

allYears.forEach(function(year){
  // Seleccionar y filtrar mosaicos por año
  var image = classification.select('classification_' + year);
  var yearMosaic = mosaic
    .filterMetadata('year', 'equals', year)
    .mosaic()
    .updateMask(regionRaster);


  // Visualización mapa general
  Map.addLayer(yearMosaic, 
    {
      bands: ['swir1_median', 'nir_median', 'red_median'],
      min:150,
      max:4700,
    }, 
   'Mosaico-Col3-'+ year, 
   false
  );
   
  Map.addLayer(
    image,
    vis,
    'Clasif-orig-Col3-' + year,
    false
  );
  
  
  if(range.indexOf(year) !== -1) {
    // Esta es la línea que extrae la clase 25
    // Se coloca dentro del cilco forEach para que haga la extracción por cada año
    var nonVegetated = image.updateMask(image.eq(25));

    
    // Aca se ejecuta la reclasificación de la imagen, con base en la roi
    var remapped = image
      .where(
        raster
          .eq(1)
          .and(image.eq(25).or(image.eq(21)))
          .and(waterImage.eq(0)),
        30
      )
      .remap([30], [30], 27);
      
    remapped = remapped.rename('classification_' + year);
    
    finalImage = finalImage.addBands(remapped);


    // Visualización mapa general reclasificado
    Map.addLayer(
      remapped,
      vis,
      'REMAP -' + year,
      false
    );
    
  }
  
});

// Visualización sólo clase 25
Map.addLayer(
  roi,
  vis,
  'Referencia',
  false
);


Map.addLayer(
  waterImage.eq(1).selfMask(),
  { min: 0, max: 1, palette: 'white,blue'},
  "Ocurrencia agua > " + water.minPercentage + "%",
  false
);


// Exportar a los assets de raisg
var outputPath = 'projects/mapbiomas-raisg/TRANSVERSALES/MINERIA_3/clasificacion/';
var outputVersion = inputVersion + 1;
var assetName = 'MINERIA-' + regionId + '-' + country + '-' + outputVersion;

finalImage = finalImage.slice(1).toByte()
  .set({
    site: country + '-' + regionId,
    country: country,
    region: regionId,
    metodo: 'Random forests',
    version: outputVersion
  });

      
Export.image.toAsset({
  image: finalImage,
  description: assetName,
  assetId: outputPath + assetName,
  region: regionLayer.geometry().bounds(),
  scale: 30,
  maxPixels: 1e13
});