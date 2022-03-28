var param = {
  regionId: 40201,
  country: "ECUADOR",
  year: 2018,
  cover: 'flooded',
};



var Wetlands = function(param) {
  
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
    var assetPeru = _this.inputs.references.peru;
    var assetColombia = _this.inputs.references.colombia;
    var assetEcuador = _this.inputs.references.ecuador;
    var regionAsset = _this.inputs._regions;
    var palette = _this.inputs.palette;
    

    // Crear máscara con base en el vector de región
    var regionId = param.regionId;
    var year = param.year;
    var cover = param.cover;
    var country = param.country.split(' ').join('-').toUpperCase();
    var version = param.version;
    
    var region = _this._getRegion(regionAsset, regionId);
    var regionMask = region.rasterMask;
    var regionLayer = region.vector;
    

    // Get mosaics
    var mosaics = _this.getMosaic(assetMosaics, regionId, [])
      .filterMetadata('year', 'equals', year)
      .median()
      .updateMask(regionMask);
      
      
    // Mapbiomas collection2
    var collection2 = ee.Image(assetMapbiomas)
      .select('classification_' + year)
      .updateMask(regionMask);
      
      
    // Reference map
    var wlReferences = _this.getRasterReference(_this.inputs.references);

    var coverReference = {
      flooded: ee.Image(1)
        .updateMask(regionMask)
        .where(wlReferences.flooded, 2),
      
      wetland: ee.Image(1)
        .updateMask(regionMask)
        .where(wlReferences.wetland, 2)
    };


    // Display layers to map
    
    Map.addLayer(mosaics, {bands: ['swir1_median', 'nir_median', 'red_median'],gain: [0.08, 0.06, 0.2]
      }, 'MOSAICO ' + year.toString(), false);

    Map.addLayer(mosaics.select('wetness'), {min: -500,max: 500,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "wetness",false);

    Map.addLayer(mosaics.select('greeness'), {min: -500,max: 2000,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "greeness",false);
    
    Map.addLayer(mosaics.select('brightness'), {min: 500,max: 5000,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "brightness", false);

    Map.addLayer(mosaics.select('bai_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "bai_median", false);

    Map.addLayer(mosaics.select('clay_median'), {min: 200,max: 400,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "clay_median",false);

    Map.addLayer(mosaics.select('mndwi_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "mndwi_median",false);
                 
    Map.addLayer(mosaics.select('mmri_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "mmri_median",false);

   Map.addLayer(mosaics.select('wefi_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "wefi_wet",false);

    Map.addLayer(mosaics.select('sefi_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "sefi_median",false);
    
    Map.addLayer(mosaics.select('sefi_dry'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "sefi_dry",false);

    Map.addLayer(mosaics.select('savi_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "savi_wet",false);

    Map.addLayer(mosaics.select('savi_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "savi_median",false);

    Map.addLayer(mosaics.select('savi_dry'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "savi_dry",false);
                 
    Map.addLayer(mosaics.select('ndwi_mcfeeters_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndwi_mcfeeters_median",false);

    Map.addLayer(mosaics.select('ndwi_gao_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndwi_gao_wet",false);
    
    Map.addLayer(mosaics.select('ndwi_gao_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndwi_gao_median",false);

    Map.addLayer(mosaics.select('ndwi_gao_dry'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndwi_gao_dry",false);
    
    Map.addLayer(mosaics.select('ndsi_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndsi_median",false);

    Map.addLayer(mosaics.select('ndvi_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndvi_wet",false);

    Map.addLayer(mosaics.select('ndvi_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndvi_median",false);

    Map.addLayer(mosaics.select('ndvi_dry'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndvi_dry",false);
                 
    Map.addLayer(mosaics.select('evi2_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "evi2_wet",false);

    Map.addLayer(mosaics.select('evi2_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "evi2_median",false);
    
    Map.addLayer(mosaics.select('evi2_dry'), {min: -200,max: 2600,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "evi2_dry",false);

    Map.addLayer(mosaics.select('shade_median'), {min: 0,max: 100,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "shade_median",false);

    Map.addLayer(mosaics.select('npv_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "npv_median",false);

    Map.addLayer(mosaics.select('gvs_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "gvs_wet",false);
                 
    Map.addLayer(mosaics.select('gvs_median'), {min: 0,max: 100,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "gvs_median",false);

    Map.addLayer(mosaics.select('gvs_dry'), {min: 0,max: 100,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "gvs_dry",false);
    
    Map.addLayer(mosaics.select('gv_median'), {min: 0,max: 100,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "gv_median",false);

    Map.addLayer(mosaics.select('ndfib_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndfib_median",false);

    Map.addLayer(mosaics.select('ndfi_wet'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndfi_wet",false);

    Map.addLayer(mosaics.select('ndfi_median'), {min: 0,max: 200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "ndfi_median",false);
                 
    Map.addLayer(mosaics.select('swir2_median'), {min: 0,max: 2200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "swir2_median",false);

    Map.addLayer(mosaics.select('swir1_median'), {min: 150,max: 2800,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "swir1_median",false);
    
    Map.addLayer(mosaics.select('nir_median'), {min: 300,max: 4500,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "nir_median",false);

    Map.addLayer(mosaics.select('red_median'), {min: 100,max: 1500,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "red_median",false);

    Map.addLayer(mosaics.select('green_median'), {min: 250,max: 1200,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "green_median",false);

    Map.addLayer(mosaics.select('blue_median'), {min: 100,max: 800,
                 palette: "2012ff,f3ff37,ff0000,9bedff,1ab156"}, "blue_median",false);
                 
    
    Map.addLayer(coverReference[cover], {}, 'CAPA OFICIAL DE REFERENCIA', false);
    
    Map.addLayer(collection2, {min: 0, max: 34, palette: palette}, 'COLECCIÓN 2 ' + year.toString(), false);
    
    //Map.addLayer(filtered, {min: 1, max:2,palette: '#daeb98,000000'}, 'BOSQUE INUNDABLE ' + year.toString());
    
  };
  
  
  

  /**
   * Input data
   * Assets paths, years and another necessary input data
   */
  this.inputs = {
    mosaics: 'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2',
    _regions: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3',
    references: {
      mapbiomas: "projects/mapbiomas-raisg/SUBPRODUCTOS/ATLAS/clasificacion/clasificacion-raisg-atlas",
      peru: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/per_inundables_MINAM2018',
      colombia: 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/COLOMBIA/col-zonas-inundables',
      ecuador: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/ECUADOR/ecu-zonas-inundables",
      bolivia: "projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/BOLIVIA/bol-zonas-inundables"
    },
    palette: require('users/mapbiomas/modules:Palettes.js').get('classification2')
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
              '(BLUE * 0.3029) + (GREEN * 0.2786) + (RED * 0.4733) + (NIR * 0.5599) + (SWIR1 * 0.508) + (SWIR2 * 0.1872)',
              landsatBands
            ),
            // Landsat 5, 7, X
            image.expression(
              '(BLUE * 0.3037) + (GREEN * 0.2793) + (RED * 0.4743) + (NIR * 0.5585) + (SWIR1 * 0.5082) + (SWIR2 * 0.1863)',
              landsatBands
            )
          )
        ).rename('brightness').toInt16();
        
        var greeness = ee.Image(
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(sensor, '8'),
            // Landsat 8
            image.expression(
              '-(BLUE * 0.2941) - (GREEN * 0.243) - (RED * 0.5424) + (NIR * 0.7276) + (SWIR1 * 0.0713) - (SWIR2 * 0.1608)',
              landsatBands
            ),
            // Landsat 5, 7, X
            image.expression(
              '-(BLUE * 0.2848) - (GREEN * 0.2435) - (RED * 0.5436) + (NIR * 0.7243) + (SWIR1 * 0.0840) - (SWIR2 * 0.1800)',
              landsatBands
            )
          )
        ).rename('greeness').toInt16();
        
        var wetness = ee.Image(
          ee.Algorithms.If(
            ee.Algorithms.IsEqual(sensor, '8'),
            // Landsat 8
            image.expression(
              '(BLUE * 0.1511) + (GREEN * 0.1973) + (RED * 0.3283) + (NIR * 0.3407) - (SWIR1 * 0.7117) - (SWIR2 * 0.4559)',
              landsatBands
            ),
            // Landsat 5, 7, X
            image.expression(
              '-(BLUE * 0.1509) + (GREEN * 0.1973) + (RED * 0.3279) + (NIR * 0.3406) - (SWIR1 * 0.7112) - (SWIR2 * 0.4572)',
              landsatBands
            )
          )
        ).rename('wetness').toInt16();
        
        
        return image
          .addBands(brightness)
          .addBands(greeness)
          .addBands(wetness);

      };
      
      
      var mosaics = ee.ImageCollection(path)
        .filterMetadata('region_code', 'equals', mosaicRegion)
      

      // Aditional Bands
      mosaics = mosaics
          .map(getMndwi)
          .map(getMmri)
          .map(getClay)
          .map(getBai)
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
        "bai_median",
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
      .map(setVersion)
      .reduceToImage(['version'], ee.Reducer.first());
    
    var colombia6 = colombia.where(colombia.eq(1), 6)
      .rename('flooded');
      
    // Ecuador
    var ecuador = ee.FeatureCollection(inputs.ecuador)
      .map(setVersion)
      .reduceToImage(['version'], ee.Reducer.first());
    
    var ecuador6 = ecuador.where(ecuador.eq(1), 6)
      .rename('flooded');
    
    // Peru
    var peru = ee.Image(inputs.peru),
        peru6 = peru.eq(3).selfMask().rename('flooded'),
        peru11 = peru.eq(4).selfMask().rename('wetland');
    
    // Bolivia
    var bolivia = ee.FeatureCollection(inputs.bolivia)
      .reduceToImage(['Id'], ee.Reducer.first());
    
    var bolivia6 = bolivia.eq(6).selfMask().rename('flooded');
    var bolivia11 = bolivia.eq(11).selfMask().rename('wetland');
      
    // Join all
    var flooded = ee.ImageCollection([colombia6, ecuador6, peru6, bolivia6]);
    flooded = flooded.mosaic();
    
    var wetland = ee.ImageCollection([peru11, bolivia11]).mosaic();
      

    return {
      flooded: flooded,
      wetland: wetland
    };
  };




  /**
   * Función para generar region de interés (ROI) con base en
   * las región de clasificación o una grilla millonésima contenida en ella
   */
  this._getRegion = function(regionPath, regionId){
    
      var setVersion = function(item) { return item.set('version', 1) };
      
      var region = ee.FeatureCollection(regionPath)
        .filter(
          ee.Filter.eq("id_regionC", regionId)
        );
      
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