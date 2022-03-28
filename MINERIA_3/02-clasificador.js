var param = {
  region: 703,
  country: 'PERU',
  roiName: 'andes-centro',
  variables: [
    "ndvi_median", "ndfi_median", "evi2_median", "soil_median", "savi_median",
    "npv_median", "soil_amp", "nuaci_median", "ndfib_median", "gvs_median",
    "gcvi_median", "pri_median", "ndwi_gao_median", "ndwi_mcfeeters_median"
  ],
  trees: 50,
  yearsPreview: [2000, 2020],
  _print: false,
  outVersion: 1
};



var Mining = function(param){
  
  this.param = param;
  
  this.inputs = {
    mosaics: [
      'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'
    ],
    samples: 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/MINERIA/',
    result: 'projects/mapbiomas-raisg/TRANSVERSALES/MINERIA_3/clasificacion/',
    years: [
      1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995,
      1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 
      2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
      2018, 2019, 2020
    ]
  };
  
  
  
  this.init = function(param){
    
    // Set satellite as default view
    Map.setOptions({
      mapTypeId: 'SATELLITE'
    });
    
    // Inputs and parms
    var _this = this;
    var regionId = param.region.toString();
    var country = param.country;
    var roiName = param.roiName.toUpperCase();
    var variables = param.variables;
    var trees = param.trees;
    var _print = param._print;
    var version = param.outVersion.toString();
    
    var samplesPath = _this.inputs.samples;
    var assetMosaics = _this.inputs.mosaics;
    var years = _this.inputs.years;
    var outputPath = _this.inputs.result;
    
    
    // Region
    var roiPath = 'roi-' + regionId + '-' + country + '-' + roiName;
    var roi = ee.FeatureCollection( samplesPath + roiPath);
    
    var geometryRaster = roi
      .map(this.setVersion)
      .reduceToImage(['version'], ee.Reducer.first());
      

    // Mosaics
    var mosaic = this.getMosaic( assetMosaics, regionId, roi, variables )
      .map(function(image){
        return image.updateMask(geometryRaster);
      });
    
    
    // All-years training polygons
    var samplesAsset = 'mineria-' + regionId + '-' + country + '-' + roiName;
    var trainingSamples = ee.FeatureCollection(samplesPath + samplesAsset);
    

    // Define classifier
    var classifier = ee.Classifier.smileRandomForest({
        numberOfTrees: trees, 
        variablesPerSplit: 1
    });
    
    var classifiedImage = ee.Image().byte();
    

    // Iterate by years
    years.forEach(function(year) {
      
      // Mosaics
      var yearMosaic = mosaic.filterMetadata('year', 'equals', year)
        .median()
        .updateMask(geometryRaster);
      
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
      classified = _this.spatialFilter(classified, 8).rename(name)
        .eq(1).selfMask();
      
      classifiedImage = classifiedImage.addBands(classified);
      
      
      // Display and exports
      Map.addLayer(classified, {
          min: 0, max: 1
        }, 
        'CLASIFICACION ' + year, 
        false
      );
      
      
    });
    
    // Export image to asset
    var siteName = samplesAsset.toUpperCase() + '-' + version;

    classifiedImage = classifiedImage.slice(1).byte()
      .set({
        site: roiName,
        region: param.region,
        country: country,
        varsion: version
      });
      
    if(_print) print(classifiedImage);

    Export.image.toAsset({
      image: classifiedImage,
      description: siteName,
      assetId: outputPath + siteName,
      region: roi,
      scale: 30,
      maxPixels: 1e13
    });
    
  };
  
  
  /**
   * Get mosaics
   */
  this.getMosaic = function(paths, regionId, roi, variables) {
  
    var mosaicRegion = regionId.toString();
    
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
              
          return ee.Image.cat(primary, secondary);
        })
      );
    }
    
    // Select variables
    if(variables.length > 0) {
      var rgb = ['swir1_median', 'nir_median', 'red_median'];
      variables = rgb.concat(variables);
      return joinedMosaics.select(variables);
    }
    else return joinedMosaics;
  
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
      .where(classified.neq(30), 0)
      .where(classified.eq(30), 1);

    
    return classified;
    
  };
  
  
  
  
  /**
   * Spatial filter
   */
  this.spatialFilter = function(image, minMappingUnit) {

    var connectedPixels = image
      .connectedPixelCount(minMappingUnit, false);
    
    var correct = image
      .where(connectedPixels.gte(minMappingUnit).and(image.eq(0)), 1)
      .neq(1).selfMask();
    
    return image.updateMask(connectedPixels.gte(minMappingUnit));
    
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


var Mining = new Mining(param);