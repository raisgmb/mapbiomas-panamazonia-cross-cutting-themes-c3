var param = {
  regionIds: [ 70207 ],  // Años que serán clasificados
  country: "PERU",
  years: [ 2015, 2020 ],
  trees: 60,
  cover: 'flooded',
  outputVersion: 1,
  maskLayer: '' //'peru-suceptibilidad-inundable-ingemmet'
};



var Wetlands = function(param) {
  
  /**
   * Input data
   * Assets paths, years and another necessary input data
   */
  this.inputs = {
    mosaics: 'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2',
    _regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3',
    _samples: 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/INUNDABLES/',
    outputPath: 'projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion/',
    references: {
      mapbiomas: "projects/mapbiomas-raisg/SUBPRODUCTOS/ATLAS/clasificacion/clasificacion-raisg-atlas",
      peru: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/PERU/per-inundables-box',
      colombia: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/COLOMBIA/col-inundables-box',
      ecuador: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/ECUADOR/ecu-inundables-box",
      bolivia: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/BOLIVIA/bol-inundables-box",
      guyanas: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/MAPAS_REFERENCIA/wetlands-cifor-guyanas',
      venezuela: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/VENEZUELA/ven-inundables-box',
    },
    palette: require('users/mapbiomas/modules:Palettes.js').get('classification2')
  };




  /**
   * Constructor method Wetlands class
   * 
   * @params: param
   * @return: ee.Image() of wetland cover
   */
  this.init = function(param) {
    var _this = this;
    var assetMosaics = _this.inputs.mosaics;
    var assetMapbiomas = _this.inputs.references.mapbiomas;
    var regionAsset = _this.inputs._regions;
    var samplesAsset = _this.inputs._samples;
    var outputPath = _this.inputs.outputPath;
    var palette = _this.inputs.palette;
    

    // Crear máscara con base en el vector de región
    var regionIds = param.regionIds;
    var years = param.years;
    var trees = param.trees;
    var cover = param.cover;
    var country = param.country.split(' ').join('-').toUpperCase();
    var version = param.version;
    
    var region = _this._getRegion(regionAsset, regionIds);
    var regionMask = region.rasterMask;
    var regionLayer = region.vector;
    

    // Get mosaics
    var mosaics = _this.getMosaic(assetMosaics, regionIds[0], []);

      
    // Reference map
    var referenceImage = _this.getRasterReference(_this.inputs.references);
    var wlReferences, referenceLayer;
    
    if(country === 'VENEZUELA' || country === 'GUYANA' || country === 'GUYANAS' ||
       country === 'SURINAME' || country === 'GUIANA FRANCESA') {
      referenceLayer = ee.Image(1)
        .updateMask(regionMask)
        .where(referenceImage.eq(6), 2);
    }
    else {
      wlReferences = referenceImage
        .updateMask(regionMask);
        
      referenceLayer = wlReferences.remap([6], [2], 1);
    }
    

    // Mapbiomas collection2
    var collection2 = ee.Image(assetMapbiomas);


    // Flooded sampling points
    var colorId = 'ffee1d';
    
    // Wetlands sampling points
    if(cover === 'wetlands') colorId = '45c2a5';

    
    //iterate by years
    var variablesImportance = ee.FeatureCollection([]),
        classified = ee.Image(0),
        regions = regionIds.join('-');
        

    years.forEach(function(year){

      var yearMosaic = mosaics
        .filterMetadata('year', 'equals', year)
        .median()
        .updateMask(regionMask);
      
      var bands = yearMosaic.bandNames();
      
      var nBands = bands.size();
  

      // Import training samples
      var fileName = cover + '-' + regions + '-' + country + '-' + year;
  
      var assetId = samplesAsset + fileName;
      
      var trainingSamples = ee.FeatureCollection(
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nBands, 0),
          null,
          ee.FeatureCollection(assetId)
        )
      );


      // Get the samples number of classes
      var nClasSample = trainingSamples
        .reduceColumns(ee.Reducer.toList(), ['reference'])
        .get('list');
        
      nClasSample = ee.List(nClasSample).reduce(ee.Reducer.countDistinct());


      // Classifier
      var classifier = ee.Classifier.smileRandomForest({
        numberOfTrees: trees, 
        variablesPerSplit: 1
      });
      
      classifier = ee.Classifier(
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nBands, 0),
          null, 
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(nClasSample, 1),
            null,
            classifier.train(trainingSamples, 'reference', bands)
          )
        )
      );
      
      
      // Explainer for importances
      var explainer = ee.Dictionary(
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nBands, 0) ,
          null,
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(nClasSample, 1) ,
            null,
            classifier.explain()
          )
        )
      );
      
      
      var importances = ee.Feature(
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nBands, 0),
          null, 
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(nClasSample, 1),
            null,
            ee.Feature( null, 
              ee.Dictionary(explainer.get('importance')))
                .set('_trees', explainer.get('numberOfTrees'))
                .set('_oobError', explainer.get('outOfBagErrorEstimate'))
                .set('_year', year)
          )
        )
      );
      
      variablesImportance = variablesImportance
          .merge( ee.FeatureCollection( [ importances ] ));
  
  
  
      // Classification
      classified = ee.Image(
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nBands, 0),
          classified.addBands(
            ee.Image().updateMask(regionMask)
              .rename('classification_' + year)
          ),
        ee.Algorithms.If(
          ee.Algorithms.IsEqual(nClasSample, 1),
          classified.addBands(
            ee.Image().updateMask(regionMask)
              .rename('classification_' + year)
          ),
          classified.addBands(
              _this.spatialFilter(
                  yearMosaic.classify(classifier).eq(2).selfMask(), 8
              )
              .select(['classification'], ['classification_' + year])
            )

          )
        )
      ).updateMask(referenceLayer.eq(2)).toByte();
      
      return classified;

    });
    
    
    // Exports
    var uppCover = cover.toUpperCase();
    var csvName = 'IMPORTANCE-' + '-' + uppCover + '-' + regions + '-' + country;
    var imageName = uppCover + '-' + regionIds.join('-') + '-' + country;
    var imageId = outputPath + imageName;
    
    Export.table.toDrive({
      collection: variablesImportance, 
      description: csvName,
      folder: 'RAISG-EXPORT',
      fileFormat: 'CSV',
    });
    
    
    classified = classified.set({
      cover: cover,
      country: country,
      region: regions
    });

    Export.image.toAsset({
      image: classified.toInt8(),
      description: imageName,
      assetId: imageId,
      scale: 30,
      pyramidingPolicy: {
        '.default': 'mode'
      },
      maxPixels: 1e13,
      region: regionLayer.geometry().bounds()
    });

    
    // Displays
    var ref = referenceLayer.updateMask(referenceLayer.neq(1));
  
    Map.setOptions({ mapTypeId: 'SATELLITE'});
    
    Map.addLayer(
      ref, { palette: 'black' }, 'CAPA DE REFERENCIA', false
    );
    
    if(country === 'PERU') {
      var asset = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/per_inundables_MINAM2018';
      var additionalLayer = ee.Image(asset).updateMask(ref);
      
      Map.addLayer(
        additionalLayer,
        {
          min: 0, 
          max: 4,
          palette: '80fff4,4cb1b2,5386a4,3bf4e4'
        },
        'REFERENCIA MINAM',
        false
      );
    }
    
    
    years.forEach(function(year){
        
      var mosaic = mosaics
        .filterMetadata('year', 'equals', year)
        .median()
        .updateMask(regionMask);

      if(year < 2019) {
        var col2 = collection2.select('classification_' + year)
          .updateMask(regionMask);
          
        Map.addLayer(
          col2,
          {
            min: 0, 
            max: 34,
            palette: palette
          },
          'COLECCIÓN 2 ' + year,
          false
        );
      }
      
      /*
      Map.addLayer(mosaic.select('wetness'),
        {
          min: -700,
          max: 700,
          palette: "6effd7,13adb4,e47f28,ffd26e"
        },
        "WETNESS " + year
      );
      */

      Map.addLayer(mosaic.select('greeness'),
        {
          min: -200,
          max: 2600,
          palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"
        },
        "GREENESS " + year,
        false
      );
      
      Map.addLayer(
        mosaic, 
        {
          bands: ['swir1_median', 'nir_median', 'red_median'],
          gain: [0.08, 0.06, 0.2]
        }, 
        'MOSAICO ' + year,
        false
      );

      
      Map.addLayer(
        classified.select('classification_' + year.toString()),
        {
          min: 1, 
          max: 2,
          palette: ['FF0000', '000000']
        },
        'CLASIFICACION ' + year
      );
      
    });
    
  };
  
  
  

  /**
   * Get mosaics
   * Get mosaics from collection2 asset. Then compute
   * wetlands indexes remaining.
   */
  this.getMosaic = function(path, regionId, variables) {
  
      var mosaicRegion = regionId.toString().slice(0, 3);
      
      
      // Additional variables
      var getMndwi = function(image) {
        var mndwi = image.expression(
          '(GREEN - SWIR1) / (GREEN + SWIR1)',  
          {
            GREEN: image.select('green_median'),
            SWIR1: image.select('swir1_median')
          }
        )
        .multiply(100).add(100).byte()
        .rename('mndwi_median');
      
        return image.addBands(mndwi);
      };
    
      var getMmri = function(image) { 
        var mmri = image.expression(
          '(MNDWI - NDVI) / (MNDWI + NDVI)',  
          {
            MNDWI: image.select('mndwi_median'),
            NDVI: image.select('ndvi_median')
          }
        )
        .multiply(100).add(100).byte()
        .rename('mmri_median');
        
        return image.addBands(mmri);
      };
      
      var getClay = function(image) {
        var clay = image.expression(
          '(SWIR1 / SWIR2)',  
          {
            SWIR1: image.select('swir1_median'),
            SWIR2: image.select('swir2_median') 
          }
        )
        .multiply(100).add(100).int16()
        .rename('clay_median');
        
        return image.addBands(clay);    
      };
      
      var getBai = function(image) {
        var bai = image.expression(
          '1 / ( ((0.1 - RED) ** 2) + ((0.06 - NIR) ** 2) )',  
          {
            NIR: image.select('nir_median'),
            RED: image.select('red_median') 
          }
        )
        .multiply(100).add(100).int16()
        .rename('bai_median');
        
        return image.addBands(bai);    
      };
      
      var tasseledCap = function(image){
        var sensor = ee.String(image.get('sensor')).slice(1);
        
        var landsatBands = {
          BLUE: image.select('blue_median'),
          GREEN: image.select('green_median'),
          RED: image.select('red_median'),
          NIR: image.select('nir_median'),
          SWIR1: image.select('swir1_median'),
          SWIR2: image.select('swir2_median'),
        };

        
        var brightness = ee.Image(
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(sensor, '8'),
            // Landsat 8
            image.expression(
              '(BLUE * 0.3029) + (GREEN * 0.2786) + (RED * 0.4733) +\
               (NIR * 0.5599) + (SWIR1 * 0.508) + (SWIR2 * 0.1872)',
              landsatBands
            ),
            // Landsat 5, 7, X
            image.expression(
              '(BLUE * 0.3037) + (GREEN * 0.2793) + (RED * 0.4743) +\
               (NIR * 0.5585) + (SWIR1 * 0.5082) + (SWIR2 * 0.1863)',
              landsatBands
            )
          )
        ).rename('brightness').toInt16();
        
        var greeness = ee.Image(
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(sensor, '8'),
            // Landsat 8
            image.expression(
              '-(BLUE * 0.2941) - (GREEN * 0.243) - (RED * 0.5424) +\
               (NIR * 0.7276) + (SWIR1 * 0.0713) - (SWIR2 * 0.1608)',
              landsatBands
            ),
            // Landsat 5, 7, X
            image.expression(
              '-(BLUE * 0.2848) - (GREEN * 0.2435) - (RED * 0.5436) +\
               (NIR * 0.7243) + (SWIR1 * 0.0840) - (SWIR2 * 0.1800)',
              landsatBands
            )
          )
        ).rename('greeness').toInt16();
        
        var wetness = ee.Image(
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(sensor, '8'),
            // Landsat 8
            image.expression(
              '(BLUE * 0.1511) + (GREEN * 0.1973) + (RED * 0.3283) +\
               (NIR * 0.3407) - (SWIR1 * 0.7117) - (SWIR2 * 0.4559)',
              landsatBands
            ),
            // Landsat 5, 7, X
            image.expression(
              '-(BLUE * 0.1509) + (GREEN * 0.1973) + (RED * 0.3279) +\
               (NIR * 0.3406) - (SWIR1 * 0.7112) - (SWIR2 * 0.4572)',
              landsatBands
            )
          )
        ).rename('wetness').toInt16();
        
        
        return image
          .addBands(brightness)
          .addBands(greeness)
          .addBands(wetness);

      };
      
      
      // Process mosaics form RAISG assets
      var mosaics = ee.ImageCollection(path)
        .filterMetadata('region_code', 'equals', mosaicRegion);
        
      
      // Aditional Bands
      mosaics = mosaics
          .map(getMndwi)
          .map(getMmri)
          .map(getClay)
          .map(tasseledCap);
  
      
      // Select variables
      variables = [
        "blue_median",
        "green_median",
        "red_median",
        "nir_median",
        "swir1_median",
        "swir2_median",
        "ndfi_median",
        "ndfib_median",
        "gv_median",
        "gvs_dry",
        "gvs_median",
        "npv_median",
        "shade_median",
        "evi2_dry",
        "evi2_median",
        "ndvi_dry",
        "ndvi_median",
        "ndwi_gao_dry",
        "ndwi_gao_median",
        "ndwi_mcfeeters_median",
        "savi_dry",
        "savi_median",
        "sefi_dry",
        "sefi_median",
        "mmri_median",
        "mndwi_median",
        "clay_median",
        "brightness",
        "greeness",
        "wetness"
      ];
      
      return mosaics.select(variables);
      
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
      .where(colombia.eq(1), 6).where(colombia.eq(0), 27)
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
      .where(bolivia.eq(2), 6).where(bolivia.eq(1), 27)
      .rename('reference')
      .uint8();
  
  
    // guyanas
    var guyanas = ee.Image(inputs.guyanas);
    
    var guyanasMask = guyanas.where(guyanas.gt(20), 6)
      .rename('reference')
      .uint8();
      
  
  // venezuela
  var venezuela = ee.Image(inputs.venezuela);
  
  var venezuelaMask = venezuela
    .where(venezuela.eq(1), 6).where(venezuela.eq(0), 27)
    .rename('reference')
    .uint8();
    

  // Join all
  var flooded = ee.ImageCollection([
    colombiaMask, boliviaMask, ecuadorMask, peruMask, guyanasMask, venezuelaMask
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
        .filter(ee.Filter.inList('id_regionC', regionIds))
        .union();
      
      var regionMask = region
        .map(setVersion)
        .reduceToImage(['version'], ee.Reducer.first());
        
      return {
        vector: region,
        rasterMask: regionMask
      };
    
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
  
  
  
  
  return this.init(param);
};


var wetlands = new Wetlands(param)