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
            })]),
    exclusion = 
    /* color: #d63000 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[-75.31786805095382, -8.295997323726375],
               [-75.18191224040694, -8.319098296290907],
               [-75.0638092130632, -8.203579888375463],
               [-75.1132476896257, -8.052675940217002],
               [-75.2286041349382, -8.025480029069378],
               [-75.29726868571944, -8.098904794848576]]],
             [[[-75.38103943767257, -8.408771484566218],
               [-75.57604676189132, -8.537810058336865],
               [-75.62823182048507, -8.687168614604094],
               [-75.55900962804542, -8.767328932110551],
               [-75.33881540904935, -8.900356273387619],
               [-75.13384705486006, -8.855465091542932],
               [-75.0816619962663, -8.734679368229108],
               [-75.29726868571944, -8.41013001026387]]]]),
        {
          "id": 1,
          "system:index": "0"
        }),
    geometry2 = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Polygon(
            [[[-75.26430970134443, -9.065727243922815],
              [-75.3618133634538, -9.161999960024],
              [-75.28216248454756, -9.22978201119955],
              [-75.17092591228193, -9.214871074505751],
              [-75.1805389493913, -9.143018663688983]]]),
        {
          "id": 1,
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
  regionIds: [70209],
  country: "PERU",
  referenceYear: null,
  exclusion: [exclusion, geometry2],
  yearsPreview: [2020],
  cover: 'flooded',    //flooded o wetlands
  samples: [
    1000,              // wetland / flooded
    1000               // no-wetland / no-flooded
  ],
  displayPoints: 500
};


var SampleWetlands = function(param) {

  /**
   * Input data
   * Assets paths, years and another necessary input data
   */
  this.inputs = {
    mosaics: 'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2',
    slppost: 'projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1',
    _regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3',
    _samples: 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/INUNDABLES/',
    maskPath: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/',
    references: {
        mapbiomas: "projects/mapbiomas-raisg/SUBPRODUCTOS/ATLAS/clasificacion/clasificacion-raisg-atlas",
        peru: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/PERU/per-inundables-box',
        colombia: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/COLOMBIA/col-inundables-box',
        ecuador: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/ECUADOR/ecu-inundables-box',
        bolivia: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/BOLIVIA/bol-inundables-box',
        guyanas: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/MAPAS_REFERENCIA/wetlands-cifor-guyanas',
        venezuela: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/VENEZUELA/ven-inundables-box',
    },
    palette: require('users/mapbiomas/modules:Palettes.js').get('classification2')
  };
  
  
  
  
  /**
   * Initialize the app
   */
  this.init = function(param) {
    var _this = this;
    var assetMosaics = _this.inputs.mosaics;
    var assetMapbiomas = _this.inputs.references.mapbiomas;
  
    
    var regionAsset = _this.inputs._regions;
    var samplesAsset = _this.inputs._samples;
    var palette = _this.inputs.palette;
    
    
    // Create mask based on region vector
    var regionIds = param.regionIds;
    var yearsPreview = param.yearsPreview;
    var referenceYear = param.referenceYear;
    var cover = param.cover;
    var nSamples = param.samples;
    var exclusionPolygons = param.exclusion;
    var displayPoints = param.displayPoints;
    var country = param.country.split(' ').join('-').toUpperCase();
    
    var region = _this._getRegion(regionAsset, regionIds);
    var regionMask = region.rasterMask;
    var regionLayer = region.vector;
    
    /** 
     * For test the sampling
     * var region = geometry;
     * var regionMask = geometry.reduceToImage(['id'], ee.Reducer.first());
     * regionLayer = region
     */
  
    var maskPath = this.inputs.maskPath;
  
  
    // Get mosaics
    var mosaics = _this.getMosaic(assetMosaics, regionIds, []);
    var slppost = ee.Image('projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1')
        .updateMask(regionMask);
  
    
    // Sample reference
    var referenceImage = _this.getRasterReference(_this.inputs.references);
    var referenceLayer;
    
    if(country === 'VENEZUELA' || country === 'GUYANA' || country === 'GUYANAS' ||
       country === 'SURINAME' || country === 'GUIANA FRANCESA') {
      referenceLayer = ee.Image(1)
        .updateMask(regionMask)
        .where(referenceImage.eq(6), 2);
    }
    else {
      referenceLayer = referenceImage
        .updateMask(regionMask);
    }
    
  
    // Get stable pixels from collection 2
    var collection2 = ee.Image(assetMapbiomas).updateMask(regionMask);
    var classes = ee.List.sequence(1, 34).getInfo();
    var stablePixels = _this.getStablePixels(collection2, classes);
  
  
    // Flooded sampling points
    var colorId, yearImage, stableReference, condition, forestCondition;    
    var nodata = referenceLayer.eq(27).or(stablePixels.eq(33));
    stableReference = ee.Image(1).updateMask(referenceLayer.gte(0));
    stableReference = remapWithPolygons(stableReference, exclusionPolygons);
  
    
    if(referenceYear) {
      yearImage = collection2.select('classification_' + referenceYear);
    }
    else {
      yearImage = stablePixels;
    }
    
    
    // Wetlands sampling points
    if(cover === 'wetlands') {
      colorId = '45c2a5';
      
      condition = referenceLayer.eq(6)
        .and(yearImage.gte(11))
        .and(yearImage.lte(13));
    }
    
    else {
      colorId = '76a5af';
      
      if(country === 'PERU') {
        forestCondition = yearImage.eq(6);
        condition = referenceLayer.eq(6)
          .and(forestCondition);
      }
      else {
        forestCondition = yearImage.eq(3);
        condition = referenceLayer.eq(6)
          .and(forestCondition.or(yearImage.neq(33)));
      }
    }
  
    stableReference = stableReference
      .updateMask(stableReference.neq(0))
      .where(condition, 2)
      .where(nodata, 1)
      .rename("reference");    
    
    
  
    var points = stableReference
      .addBands(ee.Image.pixelLonLat())
      .stratifiedSample({
        numPoints: 0,
        classBand: 'reference',
        region: regionLayer,
        scale: 30,
        seed: 1,
        geometries: true,
        dropNulls: true,
        classValues: [1, 2], 
        classPoints: [ nSamples[1], nSamples[0] ]
    });
    
    
    //iterate by years
    Map.setOptions('SATELLITE');
    
    var years = ee.List.sequence(1985, 2020, 1).getInfo();
  
    years.forEach(function(year){
          
      var mosaic = mosaics
        .filterMetadata('year', 'equals', year)
        .median()
        .updateMask(regionMask)
        .addBands(slppost);
      
      var trainingSamples = _this.getSamples(stableReference, mosaic, points);
      var training = trainingSamples.training;
      
      
      // Export samples to asset
      var fileName = cover + '-' + regionIds.join('-') + '-' + country + '-' + year;
      var assetId = samplesAsset + fileName;
      Export.table.toAsset(training, fileName, assetId);


      mosaic = mosaic.updateMask(stableReference.neq(0));
      
      if(yearsPreview.indexOf(year) > -1) {
          
        Map.addLayer(
          mosaic.select('wetness'),
          {
            min: -600,
            max: 700,
            palette: "af0000,ff2b2b,35eb2a,70abb8,2151d8"
          },
          "WETNESS " + year,
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
          
      }  
  
    });
    

    Map.addLayer(
      slppost.updateMask(stableReference.neq(0)),
      {
        min: 0,
        max: 100,
        palette: "2151d8,70abb8,35eb2a,ff2b2b,af0000"
      },
      "SLPPOST",
      false
    );
    
  
    Map.addLayer(
      stablePixels.updateMask(stableReference.neq(0)),
      {
        min: 0,
        max: 34,
        palette: _this.inputs.palette
      },
      'COLECCION 2'
    );
  
  
    Map.addLayer(
     referenceLayer.updateMask(stableReference.neq(0)),
      {
        min: 6,
        max: 27,
        palette: ['76a5af', 'd5d5e5']
      },
      'CAPA DE REFERENCIA'
    );
    
  
    var pts = ee.FeatureCollection(points);
    
    var subsetPoints = ee.FeatureCollection(
      pts.filterMetadata('reference', 'not_equals', 1)
        .toList(displayPoints)
    ).merge(
      ee.FeatureCollection(
        pts.filterMetadata('reference', 'equals', 1)
          .toList(displayPoints)
      )
    );
    
    
    var styledPoints = subsetPoints.map(
      function(point) {
        var value = point.get('reference');

        var classId = ee.Number(value).add(-1).byte();
        
        var color = ee.List(['BBBBBB', colorId]).get(classId);
        
        return point.set({ style: { color: color } });
      }
    );
    
  
  
    Map.addLayer(
        styledPoints.style({
            styleProperty: "style",
            width: 0.5,
        }), {}, 'MUESTRAS DE ENTRENAMIENTO', false
    );
  
  };




  /**
   * Get mosaics
   * Get mosaics from collection2 asset. Then compute
   * wetlands indexes remaining.
   */
  this.getMosaic = function(path, regionIds, variables) {
  
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
      var mosaicRegions = [];
      
      regionIds.forEach(function(item){
        var code = item.toString().slice(0, 3);
        mosaicRegions.push(code);
      });
    
      var mosaics = ee.ImageCollection(path)
        .filter(
            ee.Filter.inList('region_code', mosaicRegions)
        );
  
      // Aditional Bands
      var joinedMosaics = mosaics
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
        "ndfi_wet",
        "ndfib_median",
        "gv_median",
        "gvs_dry",
        "gvs_median",
        "gvs_wet",
        "npv_median",
        "shade_median",
        "evi2_dry",
        "evi2_median",
        "evi2_wet",
        "ndvi_dry",
        "ndvi_median",
        "ndvi_wet",
        "ndsi_median",
        "ndwi_gao_dry",
        "ndwi_gao_median",
        "ndwi_gao_wet",
        "ndwi_mcfeeters_median",
        "savi_dry",
        "savi_median",
        "savi_wet",
        "sefi_dry",
        "sefi_median",
        "wefi_wet",
        "mmri_median",
        "mndwi_median",
        "clay_median",
        "brightness",
        "greeness",
        "wetness"
      ];
      
      return joinedMosaics.select(variables);
      
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
   * Función para remapear, de manera interactiva, zonas delimitadas por polígonos
   * Estos polígonos se dibujan con las herramientas de dibujo de GEE
   * y se definen como ee.FeatureCollection()
   */
  function remapWithPolygons(image, polygons) {
    
    var newImage = image;
    
    if(polygons.length > 0) {
      var pols = ee.FeatureCollection(polygons);
      var raster = pols.reduceToImage(['id'], ee.Reducer.first());
      
      newImage = image.where(raster, 0).selfMask()
    }
    
    return newImage;
    
  }




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


var Samples = new SampleWetlands(param);