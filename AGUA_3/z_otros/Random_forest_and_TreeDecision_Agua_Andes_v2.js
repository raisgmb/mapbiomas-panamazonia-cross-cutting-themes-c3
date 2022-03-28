/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var excluir = 
    /* color: #ff7319 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-77.0949551082254, -2.267070939118402],
          [-77.09066357380158, -2.2718736876108467],
          [-77.08688702350861, -2.277877100762568],
          [-77.09238018757111, -2.3084083561984854],
          [-77.0862003780008, -2.310809663189443],
          [-77.05770458942658, -2.2933143338153554],
          [-77.06010784870392, -2.2799354080864838],
          [-77.0700642085672, -2.2564362250734695],
          [-77.09650006061798, -2.2622681746881725]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Tema transversal AGUA
// Clasificacion por carta con Random Forest y Arbol de decision

var param = {
    carta : 'SD-19-V-C',
    code_region: 70304,  //Region de Clasificacion
    year: [2000,2015,2019],  // Años a procesar
    RFtrees: 30,    // # de arboles
    nSamples: 1000, // # de muestras
    version:'1'
    };
    
// Parametros importante de arbol de decision   
var tree = {
  ndwi_mcfeeters_4_1:120,  //mayor o igual a (Andes aprox 140, Amazonia menos de 140)
  ndwi_mcfeeters_6_1:60,  //mayor o igual a (aprox 60 en andes, para Amazonia aprox 40)
  ndwi_mcfeeters_6_2:102  //mayor o igual a    // Recomendado solo para ANDES
}

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
var assetRegions ='projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-2'
var assetcartas= 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/cartas-RAISG-regiones-2'
var assetMosaics = [
        'projects/mapbiomas-raisg/MOSAICOS/workspace-c2-v2',
        'projects/mapbiomas-raisg/MOSAICOS/workspace-c3'
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

function SHADEMask2 (dem, region) {
        var landsat = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR").filterBounds(region)
                        .filterDate('2000-01-01', '2000-12-31')
                        .first();
                        
        var sunAzimuth = landsat.get('SOLAR_AZIMUTH_ANGLE');
        var sunZenith = landsat.get('SOLAR_ZENITH_ANGLE');
        var sunElevation = ee.Number(90).subtract(sunZenith);

        var hillShadow = ee.Terrain.hillShadow(dem, sunAzimuth , sunZenith, 300, true);
        var hillShade = ee.Terrain.hillshade(dem, sunAzimuth , sunElevation);
        var hillShadow_mean = hillShadow.reduceNeighborhood({
          reducer: ee.Reducer.mean(),
          kernel: ee.Kernel.square(30, 'meters'),
        })
        // var SHADEMASK2 = ee.Image(1).updateMask(hillShadow_mean.lte(0.9).or(hillShade.lte(120)))  //ajustar hillShade
        //                   .multiply(255)
        //                   .byte()
        //                   .rename('shade_mask2')
        
        var SHADEMASK2 = ee.Image(0).where(hillShadow_mean.lte(0.9).or(hillShade.lte(120)), 255)
                          .byte()
                          .rename('shade_mask2')
                          
        return SHADEMASK2;
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
            "thresh": 63
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
            "thresh": 128
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
            "thresh": tree.ndwi_mcfeeters_6_2
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
            "thresh": 25
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
            "thresh": 60
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

// Limite
var limite = ee.FeatureCollection(assetcartas)
                          .filterMetadata('name', "equals", param.carta);
Map.centerObject(limite,12)

// Clasific col2
var classif_col2 = ee.Image(assetClassif).clip(limite);

// Mosaic 
var regionCode = String(param.code_region).slice(0,3);
var CollMosaic = getMosaic(assetMosaics, param.code_region, param.carta)
var listyearJoin = CollMosaic.reduceColumns(ee.Reducer.toList(), ['year']).get('list')
print('list Year Join',ee.List(listyearJoin).sort())

// Terrain
var dem = ee.Image('JAXA/ALOS/AW3D30_V1_1').select("AVE");  
var slope = ee.Terrain.slope(dem).rename('slope');
var slppost = ee.Image('projects/mapbiomas-raisg/MOSAICOS/slppost2_30_v1').rename('slppost')
var shadeMask2 = SHADEMask2(dem,limite)

// Reference Map
var water = classif_col2.eq(33).reduce('sum').gte(34).multiply(33);
var otros = classif_col2.neq(33).reduce('sum').gte(34).multiply(27);
var referenceMap = water.where(otros.eq(27), 27)
                        .rename('reference');
referenceMap = referenceMap.mask(referenceMap.neq(0));

var trainingPoints = referenceMap
      .addBands(ee.Image.pixelLonLat())
      .stratifiedSample({
        'numPoints': param.nSamples,
        'classBand': 'reference',
        'region': limite,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'tileScale':4
    });
trainingPoints = trainingPoints.map(setGeometries);


param.year.forEach(function(year){
  
  // Select Mosaico for year
  var mosaic = CollMosaic
                .filterMetadata('year', 'equals',year)
                .filterBounds(limite)
                .mosaic();
  
  mosaic = mosaic.addBands(slope)
                .addBands(dem.rename('elevation'))
                .addBands(slppost)
                .addBands(shadeMask2)
                .updateMask(mosaic.select('blue_median'))
  //print(mosaic)
  
  // samples
  var samples = referenceMap
        .addBands(ee.Image.pixelLonLat())
        .addBands(mosaic.select(featureSpace))
        .sampleRegions({
            'collection': trainingPoints,
            'properties': ['reference'],
            //'region': params.geometry,
            'scale': 30
        });
        
    samples = samples.map(setGeometries); 
    

  // Classification
  
  // RANDON FOREST
  var classifier = ee.Classifier.smileRandomForest(param.RFtrees)
      .train(samples, 'reference', featureSpace);
  
  var classified_RF = mosaic.select(featureSpace).classify(classifier);
  
  // TREE DECISION
  var dt = new DecisionTree(mosaic, dtree);
  
  var classification_treeD = dt.getData().clip(limite);
  
  
  // Layout
  
  Map.addLayer(mosaic.clip(limite), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+year, false);
  
  if(year<=2018) {
  Map.addLayer(classif_col2.where(classif_col2.eq(33), 33)
                            .where(classif_col2.neq(33), 27)
                            .clip(limite), {
      'bands': ['classification_'+year],
      'palette': palettes.get('classification2'),
      'min': 0,
      'max': 34,
      'format': 'png'
  }, 'Classified Collection 2-'+year, false);
  }
  
  Map.addLayer(classified_RF.clip(limite), {
      'palette':palettes.get('classification2'),
      'min': 0,
      'max': 34,
      'format': 'png'
  }, 'Classified RF-'+year, false);
  
  Map.addLayer(classification_treeD.clip(limite), {
      'palette':palettes.get('classification2'),
      'min': 0,
      'max': 34,
      'format': 'png'
  }, 'Classified TreeDes-'+year, false);

})


// Layers
var eeColors = ee.List(palettes.get('classification2'));

var trainingPointsColor = trainingPoints.map(
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

Map.addLayer(referenceMap, {
    'bands': ['reference'],
    'palette': palettes.get('classification2'),
    'min': 0,
    'max': 34,
    'format': 'png'
}, 'Pixel Estable Agua', false);

Map.addLayer(trainingPointsColor.style({
    "styleProperty": "style"
}), {}, 'points',false);