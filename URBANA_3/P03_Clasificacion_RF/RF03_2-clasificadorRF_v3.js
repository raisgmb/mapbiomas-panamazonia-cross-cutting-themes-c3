/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var inclusion = /* color: #3614d6 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.16738394928453, -13.330389227101309],
                  [-72.16789893341539, -13.340912282207197],
                  [-72.16755561066148, -13.34625715057548],
                  [-72.15880088043687, -13.345589048497326],
                  [-72.15983084869859, -13.333228826783868]]]),
            {
              "value": 1,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.16189078522203, -13.277600016134029],
                  [-72.17390708160875, -13.271585326192126],
                  [-72.17854193878648, -13.271251172383568],
                  [-72.17837027740953, -13.27576221001186],
                  [-72.16618231964586, -13.283948693877877]]]),
            {
              "value": 1,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-76.3237420310458, -6.473597994969973],
                  [-76.32460027565135, -6.471721832052054],
                  [-76.32717516878479, -6.468694227028139],
                  [-76.32837676102088, -6.469077979381582],
                  [-76.32631677053199, -6.475303635276085]]]),
            {
              "value": 1,
              "system:index": "2"
            })]),
    exclusion = /* color: #ff0000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.13648490143296, -13.325545127154076],
                  [-72.13682822418687, -13.316357774620604],
                  [-72.13837317657945, -13.309174692473293],
                  [-72.14575461578843, -13.3075041777167],
                  [-72.15021781158921, -13.308172385001853],
                  [-72.14815787506578, -13.323206561423362],
                  [-72.14678458405015, -13.329387007486623],
                  [-72.14060477447984, -13.336068393113083]]]),
            {
              "value": 1,
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-72.10369757843492, -13.281943866213252],
                  [-72.11056403351304, -13.282445074681968],
                  [-72.13356665802476, -13.291466650095856],
                  [-72.1078174514818, -13.294139645045616]]]),
            {
              "value": 1,
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-76.3634815709856, -6.488607687549568],
                  [-76.36124997308521, -6.485196440535515],
                  [-76.36794476678638, -6.487243191515146]]]),
            {
              "value": 1,
              "system:index": "2"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

            
var param = {
  region: 70105,
  country: 'PERU',
  trees: 50,
  yearsPreview: [2000, 2018],
  _print: true,
  inputVersionSample: '1',
  outVersionClass: '6',
  useOSM : true,      // true si se quiere usar el buffer con useOSM
  dist_buffer: 1000,  //distancia en metros
  GlobalSurfaceWater: 1,
  inclusion: inclusion,
  exclusion: exclusion,
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
  //nuaci_median
];


var Urban = function(param){
  
  this.param = param;
  
  this.inputs = {
    mosaics: [
      'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'
    ],
    _regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3',
    _osm: "projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/URBANO/OSM_REF_URBAN",
    samples: 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/URBANO/',
    result: 'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion/',
    years: [
      1985, 1986, 1987, 1988, 
      1989, 1990, 1991, 1992, 
      1993, 1994, 1995, 1996, 
      1997, 1998, 1999, 2000, 
      2001, 2002, 2003, 2004, 
      2005, 2006, 2007, 2008, 
      2009, 2010, 2011, 2012, 
      2013, 2014, 2015, 2016, 
      2017, 2018, 2019, 2020
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
    var osm = _this.inputs._osm;
    var dist_buffer = param.dist_buffer
    var useOSM = param.useOSM
    var thesGSW = param.GlobalSurfaceWater
    //var roiName = param.roiName.toUpperCase();
    var variables = featureSpace;
    var trees = param.trees;
    var _print = param._print;
    var version_input = param.inputVersionSample.toString();
    var version_out = param.outVersionClass.toString();
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
    
    // inclus_exclu
    var inclus_exclu = function(capa, inclu, exclu){
         var inclusionRegions=  ee.FeatureCollection(inclu).reduceToImage(['value'], ee.Reducer.first())
                       .eq(1)
         var exclusionRegions=  ee.FeatureCollection(exclu).reduceToImage(['value'], ee.Reducer.first())
                       .eq(1)
         capa = capa.where(exclusionRegions.eq(1), 0).selfMask()        
         capa = ee.Image(0).where(capa.eq(1), 1)
                           .where(inclusionRegions.eq(1), 1).selfMask();
      return capa
    };
    
    var OSM_ref = ee.ImageCollection(osm).mosaic();
    OSM_ref = inclus_exclu(OSM_ref,param.inclusion, param.exclusion)
    
    var OSM_buffer = ee.Image(1)
    .cumulativeCost({
      source: OSM_ref, 
      maxDistance: dist_buffer,
    }).lt(dist_buffer);
    OSM_buffer = ee.Image(0).where(OSM_buffer.eq(1), 1).updateMask(regionMask)
    
    // All-years training polygons
    var samplesAsset = 'urban-' + regionId + '-' + country + '-' + version_input;
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
    var water = ee.Image("JRC/GSW1_2/GlobalSurfaceWater")
              .select('occurrence')
              .gte(thesGSW)
    
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
                            .updateMask(regionMask)
                            ;
     if(useOSM){
        yearMosaic = yearMosaic.updateMask(OSM_buffer)
     }
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
      
      classified = classified.where(water.eq(1), 27);
      classifiedImage = classifiedImage.addBands(classified.rename(name));

      
      
      // Display and exports
      Map.addLayer(classified.rename(name).updateMask(regionMask), {
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
      .where(classified.neq(24), 27)
      .where(classified.eq(24), 24);

    
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


var Urban = new Urban(param);