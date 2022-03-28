/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var shademask2_v1 = ee.Image("projects/mapbiomas-raisg/MOSAICOS/shademask2_v1"),
    inclusion = /* color: #3614d6 */ee.FeatureCollection(
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
                [[[-70.66766392877642, -13.794609285395026],
                  [-70.66689145258013, -13.795359479636833],
                  [-70.66560399225298, -13.795692898525726],
                  [-70.66174161127154, -13.792358688199968],
                  [-70.65719258478228, -13.788440930204548],
                  [-70.65667760065142, -13.784856540832445],
                  [-70.65753590753619, -13.784356389103989],
                  [-70.66423070123736, -13.789691285644565],
                  [-70.66783559015337, -13.793358956299427]]]),
            {
              "value": 1,
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-70.65349729554116, -13.7889651350428],
                  [-70.6509652902311, -13.788881777962528],
                  [-70.64654500977456, -13.787047914667005],
                  [-70.6449142266935, -13.785297395357857],
                  [-70.64555795685708, -13.784130375194962],
                  [-70.64997823731362, -13.785922582331855],
                  [-70.65285356537758, -13.785672507743106],
                  [-70.65396936432778, -13.78754806063064]]]),
            {
              "value": 1,
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-70.6388631631559, -13.794383281411939],
                  [-70.63714654938637, -13.794216571091454],
                  [-70.63744695679604, -13.792757850707343],
                  [-70.638519840402, -13.791549189768075],
                  [-70.63989313141762, -13.791549189768075],
                  [-70.63959272400795, -13.79392482774404]]]),
            {
              "value": 1,
              "system:index": "4"
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
                [[[-71.00818343668679, -13.768086056875669],
                  [-71.01007171183328, -13.766418760637265],
                  [-71.01384826212625, -13.767085680559147],
                  [-71.01453490763406, -13.77375477515286],
                  [-71.01247497111062, -13.77658908273883]]]),
            {
              "value": 1,
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-78.23385874658996, -5.1571653818425185],
                  [-78.23282877832824, -5.152378302619561],
                  [-78.23866526514465, -5.154771846741181],
                  [-78.25068156153137, -5.153746043221907],
                  [-78.24965159326965, -5.16178145976389],
                  [-78.24244181543762, -5.167936178061703]]]),
            {
              "value": 1,
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Polygon(
                [[[-76.31952205687189, -9.15753386048625],
                  [-76.32175365477228, -9.152958047459926],
                  [-76.32488647490167, -9.155839121788159],
                  [-76.32492939024591, -9.157957543898199],
                  [-76.32338443785333, -9.159694640606384]]]),
            {
              "value": 1,
              "system:index": "4"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// Tema transversal AGUA 
// Clasificacion por carta con Random Forest y Arbol de decision

var param = {
    code_region: 70106,  //Region de Clasificacion
    carta : '',
    pais  :'PERU',
    version:'1',
    inclusion: inclusion,
    ndwi_mf_inclu: 80,
    exclusion: exclusion,
    };
    

// PARAMETROS DE ARBOL
/** 
   *1 ndwi_mcfeeters_4_1,  120 para Amazonia   // mayor o igual a
   *2 ndwi_mcfeeters_6_1,  30  para Amazonia   // mayor o igual a
   *3 mndwi_median_70_2,   30  para Amazonia   // mayor o igual a 
   *4 ndvi_median_80_2,    165 para Amazonia   // menor o igual a 1
**/
                 //year,  4-1,  6-1, 70-2, 80-2
var YearsParam =  [
                  [1985,  120,  44,   30,  145], 
                  [1986,  120,  44,   30,  145], 
                  [1987,  120,  44,   30,  145], 
                  [1988,  120,  44,   30,  145], 
                  [1989,  120,  44,   30,  145], 
                  [1990,  120,  44,   30,  145], 
                  [1991,  120,  44,   30,  145], 
                  [1992,  120,  44,   30,  145], 
                  [1993,  120,  44,   30,  145], 
                  [1994,  120,  44,   30,  145], 
                  [1995,  120,  44,   30,  145], 
                  [1996,  120,  44,   30,  145], 
                  [1997,  120,  44,   30,  145], 
                  [1998,  120,  44,   30,  145], 
                  [1999,  120,  44,   30,  145], 
                  [2000,  120,  44,   30,  145], 
                  [2001,  120,  44,   30,  145], 
                  [2002,  120,  44,   30,  145], 
                  [2003,  120,  44,   30,  145], 
                  [2004,  120,  44,   30,  145], 
                  [2005,  120,  44,   30,  145], 
                  [2006,  120,  44,   30,  145], 
                  [2007,  120,  44,   30,  145], 
                  [2008,  120,  44,   30,  145], 
                  [2009,  120,  44,   30,  145], 
                  [2010,  120,  44,   30,  145], 
                  [2011,  120,  44,   30,  145], 
                  [2012,  120,  44,   30,  145], 
                  [2013,  120,  44,   30,  170], 
                  [2014,  120,  44,   30,  170], 
                  [2015,  120,  44,   30,  170], 
                  [2016,  120,  44,   30,  170], 
                  [2017,  120,  44,   30,  170], 
                  [2018,  120,  44,   30,  170], 
                  [2019,  120,  44,   30,  170], 
                  [2020,  120,  44,   30,  170]
                 ]


// bandas a usar
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
  // "shade_median",
  "ndwi_mcfeeters_median",
  "mndwi_median",
  "slope",
  "slppost",
  "elevation",
  "shade_mask2",
];


// InputAsset
var assetClassif ='projects/mapbiomas-raisg/SUBPRODUCTOS/MOORE/classification/mapbiomas-raisg-collection20-integration-v8';
var assetRegions ='projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3';
var assetRegionsRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-3'
var assetcartas= 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/cartas-RAISG-regiones-2'

var assetMosaics = [
        // 'projects/mapbiomas-raisg/MOSAICOS/workspace-c2-v2',
        'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'
      ]
      
//------------------------------------------------------------------
// Packages
//------------------------------------------------------------------
var palettes = require('users/mapbiomas/modules:Palettes.js');

//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
function getMosaic(paths, regionId, gridName) {
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
        
 if(gridName && gridName !== ''){
  joinedMosaics = joinedMosaics
    .filterMetadata('grid_name', 'equals', gridName);
  } else{
      joinedMosaics = joinedMosaics
      }
      
  return joinedMosaics
}

function setGeometries (feature) {
    var lng = feature.get('longitude');
    var lat = feature.get('latitude');

    var geometry = ee.Geometry.Point([lng, lat]);

    return feature.setGeometry(geometry);
}

function DecisionTree (image, dtree) {

    this.init = function (image, dtree) {

        this.image = image;
        this.dtree = dtree;

        this._setVariables();
        this._classify();
    };

    /**
    * [_setVariables description]
    */

    this._setVariables = function () {

        if (this.image !== null) {
            this.variables = {
                "red": this.image.select(["red_median"]),
                "green": this.image.select(["green_median"]),
                "blue": this.image.select(["blue_median"]),
                "nir": this.image.select(["nir_median"]),
                "swir1": this.image.select(["swir1_median"]),
                "swir2": this.image.select(["swir2_median"]),
                // "thermal": this.image.select(["thermal_median"]),
                "ndvi": this.image.select(["ndvi_median"]),
                "soil": this.image.select(["soil_median"]),
                "snow": this.image.select(["snow_median"]),
                "shade": this.image.select(["shade_median"]),
                "ndwi_mcfeeters": this.image.select(["ndwi_mcfeeters_median"]),
                "mndwi": this.image.select(["mndwi_median"]),
                "slope": this.image.select(["slope"]),
                "slppost": this.image.select(["slppost"]),
                "elevation": this.image.select(["elevation"]),
                "shade_mask2": this.image.select(["shade_mask2"]),
            };
        }
    };

    /**
    * [_applyRule description]
    * @param  {[type]} rule [description]
    * @return {[type]}      [description]
    */

    this._applyRule = function (rule) {

        var variable = this.variables[rule.variable];
        var result;

        if (rule.operator === ">") {
            result = variable.gt(rule.thresh);

        } else if (rule.operator === ">=") {
            result = variable.gte(rule.thresh);

        } else if (rule.operator === "<") {
            result = variable.lt(rule.thresh);

        } else if (rule.operator === "<=") {
            result = variable.lte(rule.thresh);

        } else if (rule.operator === "=") {
            result = variable.eq(rule.thresh);

        } else if (rule.operator === "!=") {
            result = variable.neq(rule.thresh);

        } else {
            result = null;
        }

        return result;
    };

    /**
    * [_recursion description]
    * @param  {[type]} node           [description]
    * @param  {[type]} mask           [description]
    * @param  {[type]} classification [description]
    * @return {[type]}                [description]
    */

    this._recursion = function (node, mask, classification) {

        var result;

        if (this.dtree[node].kind === "decision") {

            // apply rule
            result = this._applyRule(this.dtree[node].rule);

            // not agree
            var node1 = String(this.dtree[node].children[0].level) + "-" +
                String(this.dtree[node].children[0].position);

            // agree
            var node2 = String(this.dtree[node].children[1].level) + "-" +
                String(this.dtree[node].children[1].position);

            var result1 = this._recursion(node1, result.eq(
                0).multiply(mask), classification); // not agree

            var result2 = this._recursion(node2, result.eq(
                1).multiply(mask), classification); // agree

            classification = result1.add(result2);
        } else {
            classification = classification.where(mask.eq(1).and(
                classification.eq(0)), this.dtree[node].class.value);
        }

        return classification;
    };

    /**
    * [_classify description]
    * @return {[type]} [description]
    */

    this._classify = function () {

        this.classification = this._recursion("1-1", ee.Image(1), ee.Image(0))
            .select([0], ["classification"]);

    };

    /**
    * [getData description]
    * @return {[type]} [description]
    */
    this.getData = function () {

        return this.classification;
    };

    this.init(image, dtree);
};

function inclus_exclu (inclu, exclu){
         var inclusionRegions=  ee.FeatureCollection(inclu).reduceToImage(['value'], ee.Reducer.first())
                       .eq(1)
         var exclusionRegions=  ee.FeatureCollection(exclu).reduceToImage(['value'], ee.Reducer.first())
                       .eq(1)
         var INCLU_EXCLU = inclusionRegions.rename('inclu').addBands(exclusionRegions.rename('exclu'));
                           
  return INCLU_EXCLU.toUint8()
}

var INCLU_EXCLU = inclus_exclu(param.inclusion,param.exclusion)

// Limite
var limite = ee.FeatureCollection(assetRegions)
                          .filterMetadata('id_regionC', 'equals', param.code_region);
// print(limite)

var region_raster = ee.Image(assetRegionsRaster).eq(param.code_region).selfMask();
// Map.addLayer(region_raster)
// Map.centerObject(limite,12)

// Clasific col2
var classif_col2 = ee.Image(assetClassif).updateMask(region_raster);

// Mosaic 
var regionCode = String(param.code_region).slice(0,3);
var CollMosaic = getMosaic(assetMosaics, param.code_region, param.carta)

// print('CollMosaic',CollMosaic.size())

// Terrain
var dem = ee.Image('JAXA/ALOS/AW3D30_V1_1').select("AVE");  
var slope = ee.Terrain.slope(dem).rename('slope');
var slppost = ee.Image('projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1').rename('slppost')
var shadeMask2 = shademask2_v1.rename('shade_mask2')
var classification = ee.Image();

YearsParam.forEach(function(parametro){

  // Select Mosaico for year
  var mosaic = CollMosaic
                .filterMetadata('year', 'equals',parametro[0])
                .filterBounds(limite)
                .mosaic();
  
  mosaic = mosaic.addBands(slope)
                .addBands(dem.rename('elevation'))
                .addBands(slppost)
                .addBands(shadeMask2)
                .updateMask(mosaic.select('swir1_median'))

  // Classification
  // TREE DECISION
  var tree = {
    ndwi_mcfeeters_4_1:parametro[1],  //mayor o igual a (Andes aprox 140, Amazonia menos de 140)
    ndwi_mcfeeters_6_1:parametro[2],  //mayor o igual a (aprox 60 en andes, para Amazonia aprox 30)
    mndwi_median_70_2:parametro[3],  //mayor o igual a (aprox 60 en andes, para Amazonia aprox 30)
    ndvi_median_80_2:parametro[4], // menor o igual a 128 en andes en amazonia valores mas altos de ndvi
  }
  
  // tree
  var dtree = {
      "1-1": {
          "kind": "decision",
          "rule": {
              "variable": "blue",
              "operator": ">=",
              "thresh": 10000
          },
          "class": {
              "value": null,
              "name": null,
              "color": null
          },
          "node": {
              "level": 1,
              "position": 1
          },
          "children": [{
              "level": 2,
              "position": 1 
          }, {
              "level": 2,
              "position": 2
          }],
          "jstreeId": "dtree_1"
      },
      "2-1": {
          "kind": "decision",
          "rule": {
              "variable": "snow",
              "operator": ">=",
              "thresh": 20
          },
          "class": null,
          "node": {
              "level": 2,
              "position": 1
          },
          "children": [{
              "level": 4,
              "position": 1
          }, {
              "level": 4,
              "position": 2
          }],
          "jstreeId": "dtree_2"
      },
      "2-2": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 2,
              "position": 2
          },
          "children": [],
          "jstreeId": "dtree_3"
      },
      "4-1": {
          "kind": "decision",
          "rule": {
              "variable": "ndwi_mcfeeters",
              "operator": ">=",
              "thresh": tree.ndwi_mcfeeters_4_1
          },
          "class": null,
          "node": {
              "level": 4,
              "position": 1
          },
          "children": [{
              "level": 5,
              "position": 1
          }, {
              "level": 5,
              "position": 2
          }],
          "jstreeId": "dtree_4"
      },
      "4-2": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 4,
              "position": 2
          },
          "children": [],
          "jstreeId": "dtree_5"
      },
      "5-1": {
          "kind": "decision",
          "rule": {
              "variable": "elevation",
              "operator": ">=",
              "thresh": 4600
          },
          "class": null,
          "node": {
              "level": 5,
              "position": 1
          },
          "children": [{
              "level": 6,
              "position": 1
          }, {
              "level": 6,
              "position": 2
          }],
          "jstreeId": "dtree_6"
      },
      "5-2": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 33,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 5,
              "position": 2
          },
          "children": [],
          "jstreeId": "dtree_7"
      },
      "6-1": {
          "kind": "decision",
          "rule": {
              "variable": "ndwi_mcfeeters",
              "operator": ">=",
              "thresh": tree.ndwi_mcfeeters_6_1
          },
          "class": null,
          "node": {
              "level": 6,
              "position": 1
          },
          "children": [{
              "level": 7,
              "position": 1
          }, {
              "level": 70,
              "position": 2
          }],
          "jstreeId": "dtree_8"
      },
      "7-1": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 7,
              "position": 1
          },
          "children": [],
          "jstreeId": "dtree_9"
      },
      "70-2": {
          "kind": "decision",
          "rule": {
              "variable": "mndwi",
              "operator": ">=",
              "thresh": tree.mndwi_median_70_2
          },
          "class": null,
          "node": {
              "level": 70,
              "position": 2
          },
          "children": [{
              "level": 80,
              "position": 1
          }, {
              "level": 80,
              "position": 2
          }],
          "jstreeId": "dtree_10"
      },
      "80-1": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 80,
              "position": 1
          },
          "children": [],
          "jstreeId": "dtree_11"
      },
      "80-2": {
          "kind": "decision",
          "rule": {
              "variable": "ndvi",
              "operator": "<=",
              "thresh": tree.ndvi_median_80_2
          },
          "class": null,
          "node": {
              "level": 80,
              "position": 2
          },
          "children": [{
              "level": 90,
              "position": 1
          }, {
              "level": 7,
              "position": 2
          }],
          "jstreeId": "dtree_12"
      },
      "90-1": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 90,
              "position": 1
          },
          "children": [],
          "jstreeId": "dtree_13"
      },
      "6-2": {
          "kind": "decision",
          "rule": {
              "variable": "ndwi_mcfeeters",
              "operator": ">=",
              "thresh": 102
          },
          "class": null,
          "node": {
              "level": 6,
              "position": 2
          },
          "children": [{
              "level": 7,
              "position": 3
          }, {
              "level": 70,
              "position": 4
          }],
          "jstreeId": "dtree_14"
      },
      "7-3": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 7,
              "position": 3
          },
          "children": [],
          "jstreeId": "dtree_15"
      },
      "70-4": {
          "kind": "decision",
          "rule": {
              "variable": "mndwi",
              "operator": ">=",
              "thresh": 63
          },
          "class": null,
          "node": {
              "level": 70,
              "position": 4
          },
          "children": [{
              "level": 80,
              "position": 3
          }, {
              "level": 80,
              "position": 4
          }],
          "jstreeId": "dtree_16"
      },
      "80-3": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 80,
              "position": 3
          },
          "children": [],
          "jstreeId": "dtree_17"
      },
      "80-4": {
          "kind": "decision",
          "rule": {
              "variable": "ndvi",
              "operator": "<=",
              "thresh": 128
          },
          "class": null,
          "node": {
              "level": 80,
              "position": 4
          },
          "children": [{
              "level": 90,
              "position": 3
          }, {
              "level": 7,
              "position": 4
          }],
          "jstreeId": "dtree_18"
      },
      "90-3": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 90,
              "position": 3
          },
          "children": [],
          "jstreeId": "dtree_19"
      },
      "7-4": {
          "kind": "decision",
          "rule": {
              "variable": "slope",
              "operator": "<=",
              "thresh": 25
          },
          "class": null,
          "node": {
              "level": 7,
              "position": 4
          },
          "children": [{
              "level": 8,
              "position": 5
          }, {
              "level": 8,
              "position": 6
          }],
          "jstreeId": "dtree_20"
      },
      "8-5": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 8,
              "position": 5
          },
          "children": [],
          "jstreeId": "dtree_21"
      },
      "8-6": {
          "kind": "decision",
          "rule": {
              "variable": "soil",
              "operator": "<=",
              "thresh": 8
          },
          "class": null,
          "node": {
              "level": 8,
              "position": 6
          },
          "children": [{
              "level": 9,
              "position": 7
          }, {
              "level": 9,
              "position": 8
          }],
          "jstreeId": "dtree_22"
      },
      "9-7": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "no_agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 9,
              "position": 7
          },
          "children": [],
          "jstreeId": "dtree_23"
      },
      "9-8": {
          "kind": "decision",
          "rule": {
              "variable": "slppost",
              "operator": "<=",
              "thresh": 35
          },
          "class": null,
          "node": {
              "level": 9,
              "position": 8
          },
          "children": [{
              "level": 10,
              "position": 5
          }, {
              "level": 10,
              "position": 6
          }],
          "jstreeId": "dtree_24"
      },
      "10-5": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 10,
              "position": 5
          },
          "children": [],
          "jstreeId": "dtree_25"
      },
      "10-6": {
          "kind": "decision",
          "rule": {
              "variable": "snow",
              "operator": "<=",
              "thresh": 15
          },
          "class": null,
          "node": {
              "level": 10,
              "position": 6
          },
          "children": [{
              "level": 11,
              "position": 8
          }, {
              "level": 11,
              "position": 9
          }],
          "jstreeId": "dtree_26"
      },
      "11-8": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 10,
              "position": 8
          },
          "children": [],
          "jstreeId": "dtree_27"
      },
      "11-9": {
          "kind": "decision",
          "rule": {
              "variable": "shade_mask2",
              "operator": "<",
              "thresh": 255
          },
          "class": null,
          "node": {
              "level": 11,
              "position": 9
          },
          "children": [{
              "level": 12,
              "position": 3
          }, {
              "level": 12,
              "position": 4
          }],
          "jstreeId": "dtree_28"
      },
      "12-3": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 12,
              "position": 3
          },
          "children": [],
          "jstreeId": "dtree_29"
      },
      "12-4": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 33,
              "name": "1_Agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 12,
              "position": 4
          },
          "children": [],
          "jstreeId": "dtree_30"
      },
      "7-2": {
          "kind": "decision",
          "rule": {
              "variable": "slope",
              "operator": "<=",
              "thresh": 35
          },
          "class": null,
          "node": {
              "level": 7,
              "position": 2
          },
          "children": [{
              "level": 8,
              "position": 3
          }, {
              "level": 8,
              "position": 4
          }],
          "jstreeId": "dtree_31"
      },
      "8-3": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 8,
              "position": 3
          },
          "children": [],
          "jstreeId": "dtree_32"
      },
      "8-4": {
          "kind": "decision",
          "rule": {
              "variable": "soil",
              "operator": "<=",
              "thresh": 6
          },
          "class": null,
          "node": {
              "level": 8,
              "position": 4
          },
          "children": [{
              "level": 9,
              "position": 5
          }, {
              "level": 9,
              "position": 6
          }],
          "jstreeId": "dtree_33"
      },
      "9-5": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 9,
              "position": 5
          },
          "children": [],
          "jstreeId": "dtree_34"
      },
      "9-6": {
          "kind": "decision",
          "rule": {
              "variable": "slppost",
              "operator": "<=",
              "thresh": 25
          },
          "class": null,
          "node": {
              "level": 9,
              "position": 6
          },
          "children": [{
              "level": 10,
              "position": 3
          }, {
              "level": 10,
              "position": 4
          }],
          "jstreeId": "dtree_35"
      },
      "10-3": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 10,
              "position": 3
          },
          "children": [],
          "jstreeId": "dtree_36"
      },
      "10-4": {
          "kind": "decision",
          "rule": {
              "variable": "snow",
              "operator": "<=",
              "thresh": 15
          },
          "class": null,
          "node": {
              "level": 10,
              "position": 4
          },
          "children": [{
              "level": 11,
              "position": 6
          }, {
              "level": 11,
              "position": 7
          }],
          "jstreeId": "dtree_37"
      },
      "11-6": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 11,
              "position": 6
          },
          "children": [],
          "jstreeId": "dtree_38"
      },
      "11-7": {
          "kind": "decision",
          "rule": {
              "variable": "shade_mask2",
              "operator": "<",
              "thresh": 255
          },
          "class": null,
          "node": {
              "level": 11,
              "position": 7
          },
          "children": [{
              "level": 12,
              "position": 1
          }, {
              "level": 12,
              "position": 2
          }],
          "jstreeId": "dtree_39"
      },
      "12-1": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 27,
              "name": "27_No_Observado",
              "color": "#ffffff"
          },
          "node": {
              "level": 12,
              "position": 1
          },
          "children": [],
          "jstreeId": "dtree_40"
      },
      "12-2": {
          "kind": "class",
          "rule": {
              "variable": null,
              "operator": null,
              "thresh": null
          },
          "class": {
              "value": 33,
              "name": "1_Agua",
              "color": "#ffffff"
          },
          "node": {
              "level": 12,
              "position": 2
          },
          "children": [],
          "jstreeId": "dtree_41"
      },
  }; 
  var dt = new DecisionTree(mosaic, dtree);
  
  var classification_treeD = dt.getData().updateMask(region_raster);
  
  var exclu = INCLU_EXCLU.select('exclu')
  var inclu = INCLU_EXCLU.select('inclu')

  classification_treeD = classification_treeD.where(exclu.eq(1), 27)
                                             .where(inclu.eq(1).and(mosaic.select('ndwi_mcfeeters_median').gte(param.ndwi_mf_inclu)), 33)
                                             
  classification = classification.addBands(classification_treeD.rename('classification_'+parametro[0]))
  
  // Layout
  
  Map.addLayer(mosaic.select(featureSpace).updateMask(region_raster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+parametro[0], false);
  
  // if(parametro[0]<=2018) {
  // Map.addLayer(classif_col2.where(classif_col2.eq(33), 33)
  //                           .where(classif_col2.neq(33), 27)
  //                           .updateMask(region_raster), {
  //     'bands': ['classification_'+parametro[0]],
  //     'palette': palettes.get('classification2'),
  //     'min': 0,
  //     'max': 34,
  //     'format': 'png'
  // }, 'Classified Collection 2-'+parametro[0], false);
  // }
  
  Map.addLayer(classification_treeD.updateMask(region_raster), {
      'palette':palettes.get('classification2'),
      'min': 0,
      'max': 34,
      'format': 'png'
  }, 'Classified TreeDes-'+parametro[0], false);


})

classification = classification.slice(1).toInt8()
                               .set('region', param.code_region)
                               .set('country', param.pais)
                               .set('metodo', 'Arbol de desicion')
                               .set('version', param.version);
// print(classification)

Export.image.toAsset({
    image: classification,
    description:'Water-'+param.pais + '-'+ param.code_region + '-'+ param.version,
    assetId:'projects/mapbiomas-raisg/TRANSVERSALES/AGUA_3/clasificacion/'+ 'Water-'+param.pais + '-'+ param.code_region + '-'+ param.version,
    scale: 30,
    pyramidingPolicy: {
      '.default': 'mode'
    },
    maxPixels: 1e13,
    region: limite.geometry().bounds()
  });