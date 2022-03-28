/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-59.924572355566546, 6.7623898258090565],
                  [-59.924572355566546, 6.325801068478412],
                  [-59.240673429785296, 6.325801068478412],
                  [-59.240673429785296, 6.7623898258090565]]], null, false),
            {
              "id": 1,
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
  
var param = {
  regionId: 70105,
  country: "PERU",
  yearsPreview: [2019, 2020],
  samples: [
    1000,              // Urban
    1000               // no-Urban 
  ],
  version_out: '1',
  useOSM : false, // Usar para entrenamiento
  dist_buffer: 1000  //distancia en metros
};

/**
 * Años a procesar
 */
var years = [
    1985, 1986, 1987, 1988, 1989, 
    1990, 1991, 1992, 1993, 1994, 
    1995, 1996, 1997, 1998, 1999, 
    2000, 2001, 2002, 2003, 2004, 
    2005, 2006, 2007, 2008, 2009, 
    2010, 2011, 2012, 2013, 2014, 
    2015, 2016, 2017, 2018, 2019, 
    2020
  ]
  
  
// featureSpace
var featureSpace = [
  "blue_median",
  "green_median",
  "red_median",
  "nir_median",
  "swir1_median",
  "swir2_median",
  "ndvi_median",
  "soil_median",
  "snow_median",
  "ndwi_mcfeeters_median",
  "mndwi_median",
  "slope",
  "slppost",
  "elevation",
  "shade_mask2",
  //nuaci_median
];

var SampleUrban = function(param) {

/**
 * Input data
 * Assets paths, years and another necessary input data
 */
this.inputs = {
  mosaics: [
        'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'
          ],
  _regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3',
  _samples: 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/URBANO/',
  _osm: "projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/URBANO/OSM_REF_URBAN",
  references: {
      decisiontree: 'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion-ft',
      peru: '',
      colombia: '',
      ecuador: '',
      bolivia: '',
      guyanas: '',
      venezuela: '',
  },
  palette: require('users/mapbiomas/modules:Palettes.js').get('classification2')
};


/**
 * Initialize the app
 */
this.init = function(param) {
  var _this = this;
  var assetMosaics = _this.inputs.mosaics;
  var assetclassDT = _this.inputs.references.decisiontree;
  var osm = _this.inputs._osm;
  
  var regionAsset = _this.inputs._regions;
  var samplesAsset = _this.inputs._samples;
  var palette = _this.inputs.palette;
  var dist_buffer = param.dist_buffer
  
    // Create mask based on region vector
  var regionId = param.regionId;
  var yearsPreview = param.yearsPreview;
  var nSamples = param.samples;
  var useOSM = param.useOSM
  
  var country = param.country.split(' ').join('-').toUpperCase();
  var version_out = param.version_out
  
  var region = _this._getRegion(regionAsset, regionId);
  var regionMask = region.rasterMask;
  var regionLayer = region.vector;
  
  // Get mosaics
  var mosaics = _this.getMosaic(assetMosaics, regionId);
  print(mosaics);
  
  var OSM_ref = ee.ImageCollection(osm).mosaic();
  
  var OSM_buffer = ee.Image(1)
    .cumulativeCost({
      source: OSM_ref, 
      maxDistance: dist_buffer,
    }).lt(dist_buffer);
    OSM_buffer = ee.Image(0).where(OSM_buffer.eq(1), 1).updateMask(regionMask)
    
  // Get stable pixels from collection 2
  var collectionDT = ee.ImageCollection(assetclassDT)
                      .filterMetadata('code_region', 'equals', regionId)
                      .filterMetadata('version', 'equals', '5')
                      .filterMetadata('paso', 'equals', 'P02-4')
                      .mosaic()
                      .updateMask(regionMask);
                      
  var classes = ee.List.sequence(1, 34).getInfo();
  var stablePixels = _this.getStablePixels(collectionDT, classes);
  
  print(stablePixels.size());

  // Urban sampling points
  var colorId, stableReference;    
  var nodata = stablePixels.neq(24);  // revisar
  var urban  = stablePixels.eq(24);  // revisar
  stableReference = ee.Image(0).updateMask(regionMask);

  
  stableReference = stableReference
      .where(urban.eq(1), 24)
      .where(nodata.eq(1), 27)
      .updateMask(regionMask)
      .rename("reference");
  
  if(useOSM){
  stableReference = stableReference
      .where(urban.eq(1), 24)
      .where(nodata.eq(1), 27)
      .where(OSM_ref.eq(1), 24)
      .updateMask(regionMask)
      .rename("reference");
  }
  
  var points = stableReference.updateMask(OSM_buffer)
    .addBands(ee.Image.pixelLonLat())
    .stratifiedSample({
        numPoints: 0,
        classBand: 'reference',
        region: regionLayer.geometry().bounds(),
        scale: 30,
        seed: 1,
        geometries: true,
        dropNulls: true,
        classValues: [24, 27], 
        classPoints: [ nSamples[1], nSamples[0] ]
  });
  
  print(points.limit(10));
  
  //iterate by years
  Map.setOptions('SATELLITE');
  
  // var years = ee.List.sequence(1985, 2020, 1).getInfo();
  
  // Terrain
    var dem = ee.Image('JAXA/ALOS/AW3D30_V1_1').select("AVE");  
    var slope = ee.Terrain.slope(dem).rename('slope');
    var slppost = ee.Image('projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1').rename('slppost')
    var shadeMask2 = ee.Image("projects/mapbiomas-raisg/MOSAICOS/shademask2_v1").rename('shade_mask2')
  
  var SamplesList = ee.List([]);
  years.forEach(function(year){
        
      var mosaic = mosaics
          .filterMetadata('year', 'equals', year)
          .filterBounds(regionLayer)
          .median()
          .addBands(dem.rename('elevation'))
          .addBands(slope)
          .addBands(slppost)
          .addBands(shadeMask2)
          .select(featureSpace)
          .updateMask(regionMask)
          .updateMask(OSM_buffer);
      mosaic = mosaic.updateMask(mosaic.select('blue_median'));
      print('MOSAICO'+year,mosaic.bandNames())
      var trainingSamples = _this.getSamples(stableReference, mosaic, points);
      var training = trainingSamples.training;
      
      SamplesList = SamplesList.add(training.map(function(feature){
                  return feature.set('year', year);
                }));
                                  
      // Export samples to asset
      // var fileName = 'Urban' + '-' + regionId + '-' + country + '-' + year + '-' + version_out;
      // var assetId = samplesAsset + fileName;
      
      // Export.table.toAsset(training, fileName, assetId);

      if(yearsPreview.indexOf(year) > -1) {
        
          Map.addLayer(
            mosaic, 
            {
              bands: ['swir1_median', 'nir_median', 'red_median'],
              gain: [0.08, 0.06, 0.2]
            }, 
            'MOSAICO ' + year,
            false
          );
          
      }  

  });
  
  SamplesList = ee.FeatureCollection(SamplesList).flatten()
  print(SamplesList.limit(2))
  print('SamplesList',SamplesList.size())
  
  // Export samples to asset
  var fileName = 'urban' + '-' + regionId + '-' + country  + '-' + version_out;
  var assetId = samplesAsset + fileName;
  Export.table.toAsset(SamplesList, fileName, assetId);
  
  Map.addLayer(stableReference,
       {
        min: 0,
        max: 34,
        palette: _this.inputs.palette
       },'stableReference',false
      );

  var pts = ee.FeatureCollection(points);

  // Layers
    var eeColors = ee.List(_this.inputs.palette);
    
    var trainingPointsColor = pts.map(
        function (feature) {
    
            var c = feature.get("reference");
    
            return feature.set({
                "style": {
                    "color": eeColors.get(c),
                    "pointSize": 4
                }
            });
        }
    );
    
    Map.addLayer(trainingPointsColor.style({
        "styleProperty": "style"
    }), {}, 'points',false);

};



/**
 * Get mosaics
 * Get mosaics from collection2 asset. Then compute
 * Urbans indexes remaining.
 */
this.getMosaic = function(paths, regionId) {

    // Additional variables
   // var shademask2_v1 = shademask2_v1.rename('shade_mask2')
    
    var mosaicRegion = regionId.toString().slice(0, 3);
    
    var mosaics = paths.map( function(path) {
            
            var mosaic = ee.ImageCollection(path)
              .filterMetadata('region_code', 'equals', mosaicRegion)
              .map(function(image) {
                var index = ee.String(image.get('system:index')).slice(0, -3);
                return image
                  .set('index', index);
              });
            
            if(mosaic.size().getInfo() !== 0) return mosaic;
            
          });
          
    mosaics = mosaics.filter( 
            function(m) { return m !== undefined }
          );
    
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
                    
                return ee.Image.cat(primary, secondary);
              })
            );
          }
          
    return joinedMosaics;
    
};


/**
 * Get stable pixels
 * Get stable pixels from mapbiomas collection 2
 * Then cross over reference datasets 
 */
this.getStablePixels = function (image, classes) {
  
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
};


/**
 * Get reference raster data
 */
this.getRasterReference = function(inputs) {
  
  var setVersion = function(item) { return item.set('version', 1) };
  
  // Colombia
  var colombia = ee.FeatureCollection(inputs.colombia)
    .reduceToImage(['ID'], ee.Reducer.first());
  
  var colombiaMask = colombia
    .where(colombia.eq(0), 6).where(colombia.eq(1), 27)
    .rename('reference')
    .uint8();
  
  
  // Ecuador
  var ecuador = ee.FeatureCollection(inputs.ecuador)
    .reduceToImage(['CODIGO'], ee.Reducer.first());
  
  var ecuadorMask = ecuador
    .where(ecuador.eq(1), 6).where(ecuador.eq(2), 27)
    .rename('reference')
    .uint8();
  
  
  // Peru
  var peru =  ee.FeatureCollection(inputs.peru)
    .reduceToImage(['CODIGO'], ee.Reducer.first());
    
  var peruMask = peru
    .where(peru.eq(1), 6).where(peru.eq(2), 27)
    .rename('reference')
    .uint8();

  
  // Bolivia
  var bolivia = ee.FeatureCollection(inputs.bolivia)
    .reduceToImage(['CODIGO'], ee.Reducer.first());
  
  var boliviaMask = bolivia
    .where(bolivia.eq(1), 6).where(bolivia.eq(2), 27)
    .rename('reference')
    .uint8();

  // guyanas
  var guyanas = ee.Image(inputs.guyanas);
  
  var guyanasMask = guyanas.where(guyanas.gt(20), 6)
    .rename('reference')
    .uint8();
    

  // Join all
  var flooded = ee.ImageCollection([
    colombiaMask, boliviaMask, ecuadorMask, peruMask, guyanasMask
  ]);
  
  return flooded.mosaic();
  
};


/**
 * Función para generar region de interés (ROI) con base en
 * las región de clasificación o una grilla millonésima contenida en ella
 */
this._getRegion = function(regionPath, regionIds){
  
    var setVersion = function(item) { return item.set('version', 1) };
    
    var region = ee.FeatureCollection(regionPath)
      .filter(ee.Filter.eq('id_regionC', regionIds));
    
    var regionMask = region
      .map(setVersion)
      .reduceToImage(['version'], ee.Reducer.first());
      
    return {
      vector: region,
      rasterMask: regionMask
    };
  
};


/**
 * Get sample points
 */
this.getSamples = function(reference, mosaic, points) {
  
    var training = reference
      .addBands(mosaic)
      .sampleRegions({
          collection: points,
          properties: ['reference'],
          scale: 30,
          geometries: true,
          tileScale: 4
    });
    
    return {
      points: points, 
      training: training 
    };
    
};

return this.init(param);

};


var Samples = new SampleUrban(param);