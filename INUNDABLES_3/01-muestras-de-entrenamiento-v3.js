/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var exclusion = 
    /* color: #d63000 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-73.99831567918044, -9.138707024841754],
                  [-74.02990137253981, -9.175313346731201],
                  [-73.97359644089919, -9.233604499818176],
                  [-73.92965112839919, -9.192937266549182],
                  [-73.95437036668044, -9.150909550936442]]]),
            {
              "from": "6,27",
              "to": "0,0",
              "system:index": "0"
            })]),
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-67.28859223131823, -10.92535041308116],
                  [-67.40120209459948, -10.944227413154424],
                  [-67.42866791491198, -11.100590396593706],
                  [-67.28035248522448, -11.122151162899744],
                  [-67.23091400866198, -11.008939414533785]]]),
            {
              "from": "6,27",
              "to": "0,0",
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var param = {
  regionIds: [30215],
  country: "COLOMBIA",
  referenceYear: null,
  exclusion: [],
  collection: ['c2', 8],            // coleccion de referencia. [numero de colección, versión de asset]
  yearsPreview: [2020],
  cover: "flooded",                // flooded o wetlands
  samples: [
    1000,                          // wetlands / flooded
    1000,                          // no-wetlands / no-flooded
  ],
  displayPoints: 500
};



var SampleWetlands = function (param) {
  /**
   * Input data
   * Assets paths, years and another necessary input data
   */
  this.inputs = {
    mosaics: "projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2",
    slppost: "projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1",
    _regions: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3",
    _samples: "projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/INUNDABLES/",
    maskPath: "projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/",
    references: {
      mapbiomas: {
        'c2': {
          all: "projects/mapbiomas-raisg/SUBPRODUCTOS/MOORE/classification/mapbiomas-raisg-collection20-integration-v8",
          ven: "users/Mosaico_Clasification/AFF/COLLECTION1/RASTERS/VENEZUELA-AFF-6"
        },
        'c3': "projects/mapbiomas-raisg/COLECCION3/clasificacion"
      },
      peru: {
        ibc: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/PERU/per-inundables-box",
        minamb: "projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/per_inundables_MINAM2018",
      },
      colombia: {
        flooded: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/bi-cifor-col',
        wetlands: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/COLOMBIA/col_fnnf_inundable'
      },
      ecuador: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/ECUADOR/ecu-inundables-box",
      bolivia: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/BOLIVIA/bol-inundables-box1",
      guyanas: "projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/MAPAS_REFERENCIA/wetlands-cifor-guyanas",
      venezuela:
        "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3"
        //"projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/COLOMBIA/col-zonas-inundables",
    },
    palette: require("users/mapbiomas/modules:Palettes.js").get("classification2"),
  };

  /**
   * Constructor method
   * This method initialize the app, based on the use defined parameters
   */
  this.init = function (param) {
    var _this = this;
    var vis;
    var referenceImage;


    // Params
    var regionIds = param.regionIds;
    var country = param.country;
    var referenceYear = param.referenceYear;
    var cover = param.cover;
    var nSamples = param.samples;
    var displayPoints = param.displayPoints;
    var yearsPreview = param.yearsPreview;
    var exclusionPolygons = param.exclusion;
    var collection = param.collection;


    // Inputs and assets
    var references = _this.inputs.references;
    var assetRegions = _this.inputs._regions;
    var assetMosaics = _this.inputs.mosaics;
    var assetSamples = _this.inputs._samples;
    var palette = _this.inputs.palette;
    var region = _this._getRegion(assetRegions, regionIds);
    var regionLayer = region.vector;
    var regionMask = region.rasterMask;


    // Reference image
    var collectionId = collection[0];
    var assetVersion = collection[1];
    if(collectionId === 'c2') assetVersion = null;
    
    var mapbiomas = _this.getMapbiomasPaths(
      references.mapbiomas, regionIds, country, collectionId, assetVersion
    );
    
    references.mapbiomas = mapbiomas;
    var referenceImages = _this
      .getReference(references, country, regionMask, referenceYear, cover
    );
    
    if(isNaN(referenceYear)) {
      referenceImage = referenceImages.main;
      vis = {min:0, max: 34, palette: palette};
    }
    else {
      if(referenceYear) referenceImage = referenceImages.year;
      else referenceImage = referenceImages.main;
      vis = {min:0, max: 34, palette: _this.inputs.palette};
    }
    
    
    // Apply exclusion based on polygons
    referenceImage = _this.remapWithPolygons(referenceImage, exclusionPolygons)
      .remap([6], [2], 1)
      .rename('reference');
    
    
    // Get mosaics
    var mosaics = _this.getMosaic(assetMosaics, regionIds, []);
    var slppost = ee.Image('projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1');
    var altitude = ee.Image("JAXA/ALOS/AW3D30_V1_1")
      .select('AVE')
      .updateMask(regionMask)
      .rename('altitude');
    var slope = ee.Terrain.slope(altitude).int8().rename('slope');

    
    var points = referenceImage
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
    
    var years = ee.List.sequence(1985, 2020).getInfo();
  
    years.forEach(function(year){
          
      var mosaic = mosaics
        .filterMetadata('year', 'equals', year)
        .median()
        .updateMask(regionMask)
        .addBands([slppost, altitude, slope]);
      
      var trainingSamples = _this.getSamples(referenceImage, mosaic, points);
      var training = trainingSamples.training;
      
      // Export samples to asset
      var regionCode;
      if(country === 'VENEZUELA') regionCode = regionIds.sort()[regionIds.length - 1];
      else regionCode = regionIds.join('-');
      
      var fileName = cover + '-' + regionCode + '-' + country + '-' + year;
      var assetId = assetSamples + fileName;
      Export.table.toAsset(training, fileName, assetId);

      
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



    // Send images to map
    if(country === 'PERU') {
      Map.addLayer(
        referenceImages.alternative, 
        {min: 6, max: 27, palette: '76a5af,d5d5e5'},
        'MINAMB',
        false
      );
    }

    Map.addLayer(
      referenceImages.stable,
      vis, 
      "STABLE",
      false
    );
    
    Map.addLayer(
      referenceImage, 
      {min: 1, max: 2, palette: 'd5d5e5,76a5af'},
      'REFERENCE',
      false
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
        
        var color = ee.List(['BBBBBB', '76a5af']).get(classId);
        
        return point.set({ style: { color: color } });
      }
    );
    
    Map.addLayer(
      styledPoints.style({
          styleProperty: "style",
          width: 0.5,
      }), {}, 'TRAINING SAMPLES', false
    );
    
    Map.addLayer(
      regionLayer.style({
        color: 'lightblue', fillColor: 'ffffff00'
      }),
      {},
      'REGION'
    )


  };




  /**
   * Method for getting from collection3 asset. Then compute wetlands indexes.
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
   * Method for set the region of interest (ROI)
   */
  this._getRegion = function (regionPath, regionIds) {
    var setVersion = function (item) {
      return item.set("version", 1);
    };

    var region = ee
      .FeatureCollection(regionPath)
      .filter(ee.Filter.inList("id_regionC", regionIds))
      .union();

    var regionMask = region
      .map(setVersion)
      .reduceToImage(["version"], ee.Reducer.first());

    return {
      vector: region,
      rasterMask: regionMask,
    };
  };




  /**
   * Method for getting stable pixels from multiband image
   */
  this.getStablePixels = function (image, classes) {
    var bandNames = image.bandNames(),
      images = [];

    classes.forEach(function (classId) {
      var previousBand = image.select([bandNames.get(0)]).eq(classId);

      var singleClass = ee.Image(
        bandNames.slice(1).iterate(function (bandName, previousBand) {
          bandName = ee.String(bandName);
          return image.select(bandName).eq(classId).multiply(previousBand);
        }, previousBand)
      );

      singleClass = singleClass.updateMask(singleClass.eq(1)).multiply(classId);

      images.push(singleClass);
    });

    // blend all images
    var allStable = ee.Image();

    for (var i = 0; i < classes.length; i++)
      allStable = allStable.blend(images[i]);

    return allStable;
  };




  /**
   * Get reference raster data
   */
  this.getMapbiomasPaths = function (inputs, regions, country, collection, version) {
    var path = inputs[collection];

    if(collection === 'c2') {
      if(country === 'VENEZUELA') return ee.Image(path.ven);
      else return ee.Image(path.all);
    }
    else {
      var images = [];
      var newPath;
      
      regions.forEach(function(region) {
        if(version === 3) newPath = path + '/';
        else newPath = path + '-ft/';
        
        var img = ee.Image(newPath + country + '-' + region + '-' + version);
        images.push(img);
      });
      
      return ee.ImageCollection(images).mosaic();
    }
  };
  
  
   
   
  /**
   * Get reference raster data
   */
  this.getReference = function (inputs, country, region, year, cover) {
    var image;
    var imageMinamb;
    var imageMask;
    var coverCondition;
    var stableReference;
    var imageMinambMask;
    var imageYear = null;
    var classIds = ee.List.sequence(0, 34).getInfo();
    country = country.toLowerCase();
    
    var setupImage = function (image) { return image.rename("reference").uint8() };


    // mapbiomas
    var mapbiomas = inputs.mapbiomas.updateMask(region);
    var stablePixels = this.getStablePixels(mapbiomas, classIds);
    
    
    // stable pixels reference remap
    if(cover === 'wetlands') {
      coverCondition = stablePixels.gte(11).and(stablePixels.lte(13));

      if(country === 'peru') {
        imageMinamb = ee.Image(inputs[country].minamb);

        imageMinambMask = ee.Image(27)
          .updateMask(region)
          .where(imageMinamb.eq(4), 6).where(imageMinamb.neq(4), 27);        
      }
    }
    else {
      if(country === 'peru') {
        coverCondition = stablePixels.eq(3).or(stablePixels.eq(6));
        
        imageMinamb = ee.Image(inputs[country].minamb);

        imageMinambMask = ee.Image(27)
          .updateMask(region)
          .where(imageMinamb.neq(4), 6).where(imageMinamb.eq(4), 27);
      }
      else if(country === 'bolivia' || country === 'colombia') {
          coverCondition = stablePixels.eq(3).and(stablePixels.neq(33));
      }
      else if(country === 'venezuela') {
        coverCondition = stablePixels.eq(6);
      }
      else {
        coverCondition = stablePixels.eq(3);
      }
    }
    
    stableReference = stablePixels
      .where(coverCondition.eq(1), 1).remap([1, 6], [6, 27], 27);
    
    if (year) {
      imageYear = mapbiomas.select("classification_" + year)
        .where(coverCondition.eq(1), 1).remap([1, 6], [6, 27], 27);
      
      imageYear = setupImage(imageYear.updateMask(stableReference));
    }

    switch (country) {
      case "colombia":
        image = cover === 'wetlands'
          ? ee.FeatureCollection(inputs[country][cover])
              .map(function(item) { return item.set('version', 1) })
              .reduceToImage(["version"], ee.Reducer.first())
          : ee.Image(inputs[country][cover]);

        imageMask = ee.Image(27)
          .where(
            image.eq(1).and(stableReference.eq(6)), 6
          )
          .updateMask(stableReference);
        break;
      
      case 'venezuela':
        var colombia = ee
          .FeatureCollection('projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-2')
          .filterMetadata('pais', 'equals', 'Colombia')
          .map(function(item) { return item.set('version', 1) })
          .reduceToImage(['version'], ee.Reducer.first());
        
        var elevation = ee.Image('USGS/SRTMGL1_003')
          .updateMask(region)
          .select('elevation');
        
        image = ee
          .FeatureCollection(inputs[country])
          .map(function(item) { return item.set('version', 1) })
          .reduceToImage(['version'], ee.Reducer.first())
          .updateMask(region);
        
        imageMask = ee.Image(27)
            .where(
              image.eq(1).and(stableReference.eq(6)),
              6
            )
          .updateMask(stableReference)
          .updateMask(elevation.gte(50).and(elevation.lte(120)));
        break;

      case "bolivia":
        image = ee
          .FeatureCollection(inputs[country])
          .reduceToImage(["CODIGO"], ee.Reducer.first())
          .updateMask(region);

        imageMask = ee.Image(27)
          .where(
            stableReference.eq(6).and(image.eq(1)),
            6
          )
          .updateMask(stableReference)
          .updateMask(region)
          .updateMask(image);
        
        break;
        
      case "ecuador":
        image = ee
          .FeatureCollection(inputs[country])
          .reduceToImage(["CODIGO"], ee.Reducer.first())
          .updateMask(region);

        imageMask = image.where(image.eq(1), 6).where(image.eq(2), 27);

        break;

      case "peru":
        // Geomorphologic layer
        var imageIbc = ee
          .FeatureCollection(inputs[country].ibc)
          .reduceToImage(["CODIGO"], ee.Reducer.first())
          .updateMask(region);
          
        var imageIbcMask = imageIbc
          .where(imageIbc.eq(1), 6).where(imageIbc.eq(2), 27);
        
        // Intersection
        imageMask = ee.Image(27)
          .where(
            stableReference.eq(6)
            .and(imageIbcMask.eq(6))
            .and(imageMinambMask.eq(6)),
            6
          )
          .updateMask(stableReference)
          .updateMask(region);

        break;

      case "guyanas":
        image = ee.Image(inputs[country]).updateMask(region);
        imageMask = image.where(image.gt(20), 6);

        break;
        
      /*
      case "venezuela":
        image = ee.Image(inputs[country]).updateMask(region);
        imageMask = image.where(image.eq(1), 6).where(image.eq(0), 27);

        break;
      */
    }

    if (country === "peru") {
      return {
        main: setupImage(imageMask),
        stable: setupImage(stablePixels),
        year: imageYear,
        alternative: setupImage(imageMinambMask),
      };
    }
    else {
      return {
        main: setupImage(imageMask),
        stable: setupImage(stablePixels),
        year: imageYear,
        alternative: null,
      };
    }
  };
  
  

  
  /**
   * Remap function based on polygon
   */
  this.remapWithPolygons = function (image, polygons) {
    if(polygons.length > 0) {
      polygons.forEach(function( polygon ) {
        
        var excluded = polygon.map(function(layer){
          var area = image.clip( layer );
  
          var from = ee.String(layer.get('from'))
            .split(',')
            .map(function(item) { return ee.Number.parse(item) });
            
          var to = ee.String(layer.get('to'))
            .split(',')
            .map(function(item){ return ee.Number.parse(item) });
          
          return area.remap(from, to);
        });
          
        excluded = ee.ImageCollection(excluded).mosaic();
        image = excluded.unmask(image).rename('reference');
        image = image.mask(image.neq(0));
      });
    }
    else image = image;

    return image;
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

new SampleWetlands(param);