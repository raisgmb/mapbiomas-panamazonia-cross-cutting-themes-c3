var param = {
  region: 70304,
  country: 'PERU',
  trees: 50,
  yearsPreview: [2000, 2018],
  _print: true,
  outVersion: 1
};

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
];


var Water = function(param){
  
  this.param = param;
  
  this.inputs = {
    mosaics: [
      // 'projects/mapbiomas-raisg/MOSAICOS/workspace-c2-v2',
      'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'
    ],
    _regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3',
    samples: 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/AGUA/',
    result: 'projects/mapbiomas-raisg/TRANSVERSALES/AGUA_3/clasificacion/',
    years: [
      1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
      1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 
      2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
      2018, 2019, 2020
    ],
    palette: require('users/mapbiomas/modules:Palettes.js').get('classification2')
  };
  
  
  
  this.init = function(param){
    
    // Set satellite as default view
    Map.setOptions({
      mapTypeId: 'SATELLITE'
    });
    
    // Inputs and parms
    var _this = this;
    var regionId = param.region;
    var regionAsset = _this.inputs._regions;
    var country = param.country;
    //var roiName = param.roiName.toUpperCase();
    var variables = featureSpace;
    var trees = param.trees;
    var _print = param._print;
    var version_out = param.outVersion.toString();
    var palette = _this.inputs.palette;
    
    var samplesPath = _this.inputs.samples;
    var assetMosaics = _this.inputs.mosaics;
    var years = _this.inputs.years;
    var outputPath = _this.inputs.result;
    
    
    // Region
    var region = _this._getRegion(regionAsset, regionId);
    var regionMask = region.rasterMask;
    var regionLayer = region.vector;
      print(regionLayer)

    // Mosaics
    var mosaic = this.getMosaic( assetMosaics, regionId);
    
    print(mosaic)
    
    // All-years training polygons
    var samplesAsset = 'water-' + regionId + '-' + country + '-' + version_out;
    var trainingSamples = ee.FeatureCollection(samplesPath + samplesAsset);
    

    // Define classifier
    var classifier = ee.Classifier.smileRandomForest({
        numberOfTrees: trees, 
        variablesPerSplit: 1
    });
    
    // Terrain
    var dem = ee.Image('JAXA/ALOS/AW3D30_V1_1').select("AVE");  
    var slope = ee.Terrain.slope(dem).rename('slope');
    var slppost = ee.Image('projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1').rename('slppost')
    var shadeMask2 = ee.Image("projects/mapbiomas-raisg/MOSAICOS/shademask2_v1").rename('shade_mask2')
    
    
    var classifiedImage = ee.Image().byte();
    
    // Iterate by years
    years.forEach(function(year) {
      
      // Mosaics
      var yearMosaic = mosaic.filterMetadata('year', 'equals', year)
                            .filterBounds(regionLayer)
                            .median()
                            .addBands(dem.rename('elevation'))
                            .addBands(slope)
                            .addBands(slppost)
                            .addBands(shadeMask2)
                            .select(featureSpace)
                            .updateMask(regionMask);
     
      yearMosaic = yearMosaic.updateMask(yearMosaic.select('blue_median'));
      
      
      Map.addLayer(yearMosaic, {
          bands: ['swir1_median', 'nir_median', 'red_median'],
          gain: [0.08, 0.06, 0.2]
        }, 
        'MOSAICO ' + year, 
        false
      );
      

      // Samples
      var yearSamples = trainingSamples.filterMetadata('year', 'equals', year)
        .map(function(feature){
          return _this.removeProperty(feature, 'year');
        });
        
      
      // Classification
      var classified = _this.classifyRandomForests(
        yearMosaic, classifier, yearSamples
      );
      
      var name = 'classification_' + year.toString();

      classifiedImage = classifiedImage.addBands(classified.rename(name));
      
      
      // Display and exports
      Map.addLayer(classified.rename(name), {
          min: 0, 
          max: 34,
          palette: _this.inputs.palette
        }, 
        'CLASIFICACION ' + year, 
        false
      );
      
      
    });
    
    // Export image to asset
    var siteName = samplesAsset.toUpperCase() + '-RF-' + version_out;

    classifiedImage = classifiedImage.slice(1).updateMask(regionMask).byte()
      .set({
        region: regionId,
        country: country,
        metodo: 'Random forest',
        version: version_out
      });
      
    if(_print) print(classifiedImage);

    Export.image.toAsset({
      image: classifiedImage,
      description: siteName,
      assetId: outputPath + siteName,
      region: regionLayer.geometry().bounds(),
      scale: 30,
      maxPixels: 1e13
    });
    
  };
  
  
  /**
   * Get mosaics
   * Get mosaics from collection2 asset. Then compute
   * waters indexes remaining.
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
   * RandomForests classifier
   */
  this.classifyRandomForests = function(mosaic, classifier, samples) {

    var bands = mosaic.bandNames();
    
    var nBands = bands.size();
    
    var points = samples.size();
    
    var nClassSamples = samples
      .reduceColumns(ee.Reducer.toList(), ['reference'])
      .get('list');
      
      
    nClassSamples = ee.List(nClassSamples)
      .reduce(ee.Reducer.countDistinct());
    
    
    var _classifier = ee.Classifier(
      ee.Algorithms.If(
        ee.Algorithms.IsEqual(nBands, 0),
        null, 
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nClassSamples, 1),
          null,
          classifier.train(samples, 'reference', bands)
        )
      )
    );

    var classified = ee.Image(
      ee.Algorithms.If(
        ee.Algorithms.IsEqual(points, 0),
        ee.Image().rename('classification'),
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nBands, 0),
          ee.Image().rename('classification'),
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(nClassSamples, 1),
            ee.Image().rename('classification'),
            mosaic.classify(_classifier)
          )
        )
      )
    ).unmask(27).toByte();
    

    classified = classified
      .where(classified.neq(33), 27)
      .where(classified.eq(33), 33);

    
    return classified;
    
  };
  

  /**
   * utils methods
   */
  this.setVersion = function(item){ return item.set('version', 1) };
  
  
  
  this.removeProperty = function(feature, property) {
    var properties = feature.propertyNames();
    var selectProperties = properties.filter(ee.Filter.neq('item', property));
    return feature.select(selectProperties);
  };
  
  
  
  return this.init(param);
  
};


var Water = new Water(param);