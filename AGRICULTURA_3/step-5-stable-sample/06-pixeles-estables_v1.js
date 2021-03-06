/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var Excluir_Agri_1_a_0 = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-68.42970717504, 3.2388939895940463],
                  [-68.38574332470961, 3.0797760772362697],
                  [-68.18242304551431, 3.074288576977067],
                  [-68.18242149211123, 3.1840282735559673]]]),
            {
              "original": "1,",
              "new": "0,",
              "system:index": "0"
            })]),
    Excluir_no_agri_2_a_0 = /* color: #b3d63a */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-67.63214821780117, 3.2801844400311544],
                  [-67.52777810061367, 3.351476016991634],
                  [-67.52228493655117, 3.4145373163835573],
                  [-67.62940163576992, 3.466628313286214],
                  [-67.69531960451992, 3.403570429199645]]]),
            {
              "original": "2,",
              "new": "0,",
              "system:index": "0"
            })]),
    Agri_a_No_Agri_1_a_2 = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.64943331013512, -11.47930434061534],
                  [-74.52583711872887, -11.447002798997197],
                  [-74.59999483357262, -11.4173898125842],
                  [-74.65217989216637, -11.39585115315023]]]),
            {
              "original": "1,",
              "new": "2,",
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-68.82655353773384, -11.174635543262134],
                  [-68.82226200331002, -11.178172065689768],
                  [-68.81522388685494, -11.17766685084074],
                  [-68.81213398206978, -11.166720313019454],
                  [-68.81007404554634, -11.155268108504112],
                  [-68.81556720960884, -11.151899727131141],
                  [-68.82809849012642, -11.151899727131141],
                  [-68.82861347425728, -11.156615450120219],
                  [-68.82655353773384, -11.172277837686057]]]),
            {
              "original": "1,",
              "new": "2,",
              "system:index": "1"
            })]),
    natural86 = /* color: #d3d61e */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.21944379273087, -4.824889198982332],
                  [-74.14253949585587, -4.813941713623335],
                  [-74.18373822632462, -4.745515954670814]]]),
            {
              "original": "3,22,6",
              "new": "27,27,34",
              "system:index": "0"
            })]),
    natural87 = /* color: #ce4fd6 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.24396872296643, -11.69614900810988],
                  [-74.14509176984143, -11.674631746576221],
                  [-74.12861227765393, -11.569711237733213],
                  [-74.18354391827893, -11.615450675985958],
                  [-74.25770163312268, -11.583164791032253]]]),
            {
              "original": "3,21,11,",
              "new": "27,27,27,",
              "system:index": "0"
            })]),
    geometry = /* color: #d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-74.0813315068641, -12.062244180284583],
                  [-74.00649447482118, -12.043444555161882],
                  [-74.04906689305852, -12.014574669042501],
                  [-74.0827045499804, -11.952108370471802],
                  [-74.12459030654253, -12.007177200557393]]]),
            {
              "original": "3,33,",
              "new": "27,27,",
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
 
/** 
 * PASO 2: C??LCULO DE PIXELES ESTABLES Y AREAS DE EXCLUSI??N v3.2 
 * SEPTIEMBRE 2020
 * DOCUMENTACI??N:
 * ----------------------------------------------------------------------------------------------
 */ 
/** 
 * PARAMETROS DE USUARIO:
 * Ajuste los par??metros a continuac??n para generar la imagen de pixeles estables correspondiente
 * CUIDADO: considere que el proceso de exclusi??n con pol??gonos o shapes ocurr?? LUEGO
 * del remap y puede afectar el resultado generado por este ??ltimo si los pol??gonos de
 * exclusi??n y las clases remapeadas se solapan.
 * ----------------------------------------------------------------------------------------------
 */ 
var param = {
  regionId: 20601,
  Pais :'BOLIVIA',
  yearsPreview: [ 2000, 2018 ],
  InputVersion : 2,
  exclusion : {
    years: [
      
    ],
    classes: [ ],
    polygons: [ Excluir_Agri_1_a_0, Excluir_no_agri_2_a_0, Agri_a_No_Agri_1_a_2, geometry ],
    shape: '',
  },
  driveFolder: 'DRIVE-EXPORT',
  ciclo: 'ciclo-2'
};




/**
 * IMPLEMETACI??N DE LA APLICACI??N
 * Self invoked expresion que ejecuta el paso 2 de la metodolog??a
 * ----------------------------------------------------------------------------------------------
 */
var paths = require('users/raisgmb01/MapBiomas_C3:MODULES/CollectionDirectories').paths;

(function init(param) {
  
  var assets = {
    basePath: paths.muestrasestablesTA,
    regions: paths.regionVector,
    regionsRaster:  paths.regionCRaster,
    mosaics: paths.mosaics_c3_v2,
    image: paths.classificationTA,
  };
  if (param.InputVersion===2){
    assets.image = paths.clasificacionFiltrosTA
  }
  
  // Obtener la version de salida en base al ciclo
  var version = getVersion(param.ciclo);

  
  // Crear m??scara con base en el vector de regi??n
  var regionId = param.regionId;
  var region = getRegion(assets.regions, assets.regionsRaster, regionId);
  var regionMask = region.rasterMask;
    
    
  var country = region.vector.first().get('pais').getInfo().toUpperCase();
  country = country .replace('??', 'U').replace(' ', '_');
  var countryRegion = country + '-' + regionId;


  // Exclusi??n de ??reas
  var shapePath = assets.basePath + country + '/';
  var shapeName = param.exclusion.shape;
  var fullRegion = excludeAreas(regionMask, shapePath, shapeName);
  
  
  // Extraer la classificaci??n, ignorando a??os con inconsistencias.
  var filename = country + '-' + regionId + '-' + param.InputVersion;
  var image = ee.Image(assets.image+'/'+filename).updateMask(fullRegion);
  image = selectBands(image, param.exclusion.years);
  print('A??os usados', image.bandNames());

  // Generar pixeles estables
  var classes = ee.List.sequence(1, 34);
  classes = classes.removeAll(param.exclusion.classes).getInfo();
  
  var stablePixels = getStablePixels(image, classes);
  print('st',stablePixels)
  // Remapeo de clases
  //corregido para primero sacar la estabilidad de pixels y luego 
  //var originalClasses = param.remap.from;
  //var newClasses = param.remap.to;
  //stablePixels = remapBands(stablePixels, originalClasses, newClasses);
  //stablePixels = stablePixels.remap(originalClasses,newClasses)
  print(stablePixels)

  // Exclusi??n de clases en areas delimitadas con geometr??as
  
  var polygons = param.exclusion.polygons;
  stablePixels = remapWithPolygons(stablePixels, polygons);
  stablePixels = stablePixels.mask(stablePixels.gt(0))
  
  // Importar mosaicos para visualizaci??n
  var assetsMosaics = [ assets.mosaics ];
  var variables = ['nir_median', 'swir1_median', 'red_median'];
  var mosaics = getMosaic(assetsMosaics, param.regionId, variables, '');
    

  // Mostrar imagenes en el mapa
  var assetData = {
    asset: assets.image+'/'+filename,
    region: region,
    years: param.yearsPreview    
  };
  
  addLayersToMap(stablePixels, mosaics, assetData);


  // Exportar assets a GEE y Google Drive
  var imageName = 'ME-'+ countryRegion + '-' + version;
  var assetId = assets.basePath + 'muestras-estables/' + imageName;
  var driveFolder = param.driveFolder;
  var vector = region.vector;

  var props = {
    code_region: param.regionId,
    pais: country,
    version: version.toString(),
    paso: 'P02'
  };

  stablePixels = stablePixels.set(props);
  Map.addLayer(
      stablePixels,
      {
        min: 1,
        max: 2,
        palette: ['#ffff00','#ff00ff']
      },
      'PIXELES ESTABLES Agri',
      false
    );
  exportImage(stablePixels, imageName, assetId, vector, driveFolder);
  
})(param);

/**
 * FUNCIONALIDADES
 * A continuaci??n se definen las funcionalidades que se usan en la aplicaci??n.
 * Estas features se inyectan en la funci??n init() que las ejecuta y genera los
 * resultados.
 * ----------------------------------------------------------------------------------------------
 */

/**
 * Funcion para asignar una versi??n por ciclo
 * 
 */
function getVersion(cicle) { 
  var version = {
    'ciclo-1': 1,
    'ciclo-2': 3
  };
  
  return version[cicle];
}

/**
 * Funci??n para remapear (reclasificar) cabdas clasifiacadas
 * En el orden de ejecuci??n, esta funci??n corre antes del remapeo con pol??gonos
 */
function remapBands(image, originalClasses, newClasses) {
  var bandNames = image.bandNames().getInfo();
  var collectionList = ee.List([]);
  
  bandNames.forEach(
    function( bandName ) {
      var remapped = image.select(bandName)
        .remap(originalClasses, newClasses);
    
      collectionList = collectionList.add(remapped.byte().rename(bandName));
    }
  );
  var collectionRemap = ee.ImageCollection(collectionList);
  image = collectionRemap.toBands();
  

  
  var actualBandNames = image.bandNames();
  var singleClass = actualBandNames.slice(1)
    .iterate(
      function( bandName, previousBand ) {
        bandName = ee.String(bandName);
                
        previousBand = ee.Image(previousBand);

        return previousBand.addBands(image
          .select(bandName)
          .rename(ee.String('classification_')
          .cat(bandName.split('_').get(2))));
      },
      ee.Image(image.select([actualBandNames.get(0)])
          .rename(ee.String('classification_')
          .cat(ee.String(actualBandNames.get(0)).split('_').get(2))))
    );
  return ee.Image(singleClass);
}




/**
 * Funci??n para delimitar ??reas de excusi??n en las que no se tomar??n 
 * muestra de entrenamiento. 
 * Estas ??reas pueden incluirse como pol??gonos desde las herramientas de 
 * dibujo o como una colecci??n de tipo ee.FeatureCollection() ubicada en la ruta
 * establecida en el par??metro exclusion.shape.
 */
function excludeAreas(image, shapePath, shapeName) {
  var exclusionRegions;
  
  var shapes = shapePath !== '' && shapeName !== '';
    
  if(shapes)
    exclusionRegions = ee.FeatureCollection(shapePath + shapeName);
  
  else exclusionRegions = null;

  
  // Excluir todas las areas definidas
  if(exclusionRegions !== null) {
    var setVersion = function(item) { return item.set('version', 1) };
  
    exclusionRegions = exclusionRegions
      .map(setVersion)
      .reduceToImage(['version'], ee.Reducer.first())
      .eq(1);
    
    return image.where(exclusionRegions.eq(1), 0)
      .selfMask();
  } 
  else return image;
}
    



/**
 * Funci??n para remapear, de manera interactiva, zonas delimitadas por pol??gonos
 * Estos pol??gonos se dibujan con las herramientas de dibujo de GEE
 * y se definen como ee.FeatureCollection()
 */
function remapWithPolygons(stablePixels, polygons) {
  
  if(polygons.length > 0) {
    polygons.forEach(function( polygon ) {
      
      var excluded = polygon.map(function( layer ){
        
        var area = stablePixels.clip( layer );
        var from = ee.String(layer.get('original')).split(',');
        var to = ee.String(layer.get('new')).split(',');
        
        from = from.map( function( item ){
          return ee.Number.parse( item );
        });
        to = to.map(function(item){
          return ee.Number.parse( item );
        });
        
        return area.remap(from, to);
      });
        
      excluded = ee.ImageCollection( excluded ).mosaic();
      stablePixels = excluded.unmask( stablePixels ).rename('reference');
      stablePixels = stablePixels.mask( stablePixels.neq(27) );
    });
  } else stablePixels = stablePixels;
  
  return stablePixels;
  
}




/**
 * Funci??n para seleccionar las bandas con base en los a??os definidos en
 * los par??metros
 */
function selectBands(image, years) {
  var bandNames = [];
  
  years.forEach(function(year) {
    bandNames.push('classification_' + year);
  });
  
  return ee.Image(
    ee.Algorithms.If(
      years.length === 0, 
      image, 
      image.select(image.bandNames().removeAll(bandNames))
    )  
  );
}




/**
 * Funci??n para generar region de inter??s (ROI) con base en
 * las regi??n de clasificaci??n o una grilla millon??sima contenida en ella
 */
function getRegion(regionPath, regionImagePath, regionId){
  
  var region = ee.FeatureCollection(regionPath)
    .filterMetadata("id_regionC", "equals", regionId);
  
  var regionMask = ee.Image(regionImagePath).eq(regionId).selfMask();
    
  return {
    vector: region,
    rasterMask: regionMask
  };

}




/**
 * Funci??n para filtrar mosaicos
 * Permite filtrar los mosaicos por codigo de regi??n y grilla 250.000,
 * Tambi??n gestiona la selecci??n de ??ndices que ser??n utilizados para generar los
 * puntos de entrenamiento.
 */
function getMosaic(paths, regionId, variables, gridName) {
  
  // Importar datos de altitud
  var altitude = ee.Image('JAXA/ALOS/AW3D30_V1_1')
    .select('AVE')
    .rename('altitude');
      
  var slope = ee.Terrain.slope(altitude).int8()
    .rename('slope');
  
  // Gestionar mosaicos Landsat
  var mosaicRegion = regionId.toString().slice(0, 3);
  
  var mosaics = paths.map( function(path) {
    
    var mosaic = ee.ImageCollection(path)
      .filterMetadata('region_code', 'equals', mosaicRegion)
      .map(function(image) {
        var index = ee.String(image.get('system:index')).slice(0, -3);
        return image.set('index', index);
      });
    
    if(gridName && gridName !== '')
      mosaic = mosaic
        .filterMetadata('grid_name', 'equals', gridName);
    else
      mosaic = mosaic;
    
    if(mosaic.size().getInfo() !== 0) return mosaic;
    
  });
  
  
  mosaics = mosaics.filter( function(m) { return m !== undefined });
    
  var joinedMosaics = mosaics[0];

  if(mosaics.length === 2) {

    var join = ee.Join.inner(),
        joiner = ee.Filter.equals({
          leftField: 'index',
          rightField: 'index'
        });
        
    var joinedCollection = join.apply(mosaics[0], mosaics[1], joiner);
    
    joinedMosaics = ee.ImageCollection(
      joinedCollection.map( function(feature) {
        var primary = feature.get('primary'),
            secondary = feature.get('secondary');
            
        return ee.Image.cat(primary, secondary, altitude, slope);
      })
    );
  }
  
  // seleccionar variables
  if(variables.length > 0) return joinedMosaics.select(variables);
  
  else return joinedMosaics;

}




/**
 * Funci??n para extracci??n de pixeles estables
 * Esta funci??n toma dos par??metros. La imagen de la clasificaci??n y las clases que
 * se quieren obtener como salida
 */
function getStablePixels(image, classes) {
  
  var bandNames = image.bandNames(),
      images = [];

  classes.forEach(function(classId){
      var previousBand = image
        .select([bandNames.get(0)]).eq(classId);
          
      var singleClass = ee.Image(
        bandNames.slice(1)
          .iterate(
            function( bandName, previousBand ) {
              bandName = ee.String( bandName );
              return image
                .select(bandName).eq(classId)
                .multiply(previousBand);
            },
            previousBand
          )
      );
      
      singleClass = singleClass
        .updateMask(singleClass.eq(1))
        .multiply(classId);
      
      images.push(singleClass);
  });
  
  
  // blend all images
  var allStable = ee.Image();
  
  for(var i = 0; i < classes.length; i++) 
    allStable = allStable.blend(images[i]);

  return allStable;
} 




/**
 * Funci??n para graficar resultados en el mapa
 */
function addLayersToMap(stablePixels, mosaics, originalImage) {
  
  var palette = require('users/mapbiomas/modules:Palettes.js')
    .get('classification2');
  var paletteAgri = palette;
  paletteAgri[1] = '#FF0000';
  paletteAgri[2] = '#e2c539';
    
  var region = originalImage.region;
    
  var image = ee.Image(originalImage.asset)
    .updateMask(region.rasterMask);
    
  var bands;
  
  if(originalImage.years.length === 0) {
    bands = image.bandNames();
  } 
  else {
    bands = ee.List([]);
    originalImage.years.forEach(function(year){
      bands = bands.add('classification_' + year.toString());
    });
  }
  
  bands.evaluate(function(bandnames){

    bandnames.forEach(function(bandname){
      
      // Mosaicos
      var year = parseInt(bandname.split('_')[1], 10);
      
      var mosaic = mosaics.filterMetadata('year', 'equals', year)
        .mosaic()
        .updateMask(region.rasterMask);
        
      Map.addLayer(
        mosaic,
        {
          bands: ['swir1_median', 'nir_median', 'red_median'],
          gain: [0.08, 0.06, 0.2]
        },
        'MOSAICO ' + year.toString(), false
      );

      // Clasificaciones
      Map.addLayer(
        image,
        {
          bands: bandname,
          min: 0, max: 34,
          palette: palette
        },
        bandname.toUpperCase().replace('TION_', 'CION ')
      );
      
    });
    
    
    // Regi??n
    var blank = ee.Image(0).mask(0);
    var outline = blank.paint(region.vector, '000000', 2); 
    var visParLine = {'palette':'000000','opacity': 0.6};
    Map.addLayer(outline,visParLine, 'REGION ' + param.regionId);
    
    
    // Pixeles estables
    Map.addLayer(
      stablePixels,
      {
        min: 0,
        max: 34,
        palette: paletteAgri
      },
      'PIXELES ESTABLES'
    );

  });
}




/**
 * Funciones para exportar resultados a GEE y Drive
 */
function exportImage(image, imageName, imageId, region, driveFolder) {
  Export.image.toAsset({
    image: image.toInt8(),
    description: imageName,
    assetId: imageId,
    scale: 30,
    pyramidingPolicy: {
      '.default': 'mode'
    },
    maxPixels: 1e13,
    region: region.geometry().bounds()
  });
  
  if(driveFolder !== '' && driveFolder !== undefined) {
    Export.image.toDrive({
      image: image.toInt8(),
      description: imageName + '-DRIVE',
      folder: driveFolder,
      scale: 30,
      maxPixels: 1e13,
      region: region.geometry().bounds()
    });
  }
}
