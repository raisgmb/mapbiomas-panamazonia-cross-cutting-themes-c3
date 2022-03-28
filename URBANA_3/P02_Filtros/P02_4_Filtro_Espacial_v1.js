var param = { 
    code_region: 70105,  //Region de Clasificacion 
    pais: 'PERU', 
    year: 2015,  // Solo visualizacion
    version_input: '4',
    version_output: '5',
    eightConnected: true,
    min_connect_pixel: 5
};


var dirinput = "projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion-ft";
var dirout  =   "projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/clasificacion-ft";
var AssetMosaic='projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2'

var AssetRegions = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3';
var AssetRegionsRaster = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-3';

var prefixo_out = param.pais+ '-' + param.code_region + '-' + param.version_output

var region = ee.FeatureCollection(AssetRegions).filterMetadata('id_regionC', 'equals', param.code_region)
var regionRaster = ee.Image(AssetRegionsRaster).eq(param.code_region).selfMask()

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var mosaicRegion = param.code_region.toString().slice(0, 3);
var mosaic = ee.ImageCollection(AssetMosaic)
            .filterMetadata('region_code', 'equals', mosaicRegion)
            .select(['swir1_median', 'nir_median', 'red_median'])
            .filterMetadata('year', 'equals', param.year);
            
            
var class4FT = ee.ImageCollection(dirinput)
                      .filterMetadata('code_region', 'equals', param.code_region)
                      .filterMetadata('paso', 'equals', 'P02-3') 
                      .filterMetadata('version', 'equals', param.version_input)
                      .first()
print(class4FT)


var years = [
    1985, 1986, 1987, 1988,
    1989, 1990, 1991, 1992,
    1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020];    
    
// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// add connected pixels bands
var imageFilledConnected = class4FT.addBands(
    class4FT
        .connectedPixelCount(100, param.eightConnected)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_connected')
            }
        ))
);

print(imageFilledConnected)
class4FT= imageFilledConnected;

var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_1985',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis3 = {
      bands: 'classification_'+param.year,
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
// Map.addLayer(class4FT.select(bandNames), vis, 'class4FT_1985', false);

var ano = '1985'
var moda_85 = class4FT.select('classification_'+ano).focal_mode(1, 'square', 'pixels')
moda_85 = moda_85.mask(class4FT.select('classification_'+ano+ '_connected').lte(param.min_connect_pixel))
var class_outTotal = class4FT.select('classification_'+ano).blend(moda_85)

// Map.addLayer(class_outTotal, vis, 'class4 MODA_1985', false);

var anos = ['1986','1987','1988','1989','1990','1991','1992','1993',
            '1994','1995','1996','1997','1998','1999','2000','2001',
            '2002','2003','2004','2005','2006','2007','2008','2009',
            '2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020'];
            
for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  var moda = class4FT.select('classification_'+ano).focal_mode(1, 'square', 'pixels')
  moda = moda.mask(class4FT.select('classification_'+ano+ '_connected').lte(param.min_connect_pixel))
  var class_out = class4FT.select('classification_'+ano).blend(moda)
  class_outTotal = class_outTotal.addBands(class_out)
}


class_outTotal = class_outTotal.select(bandNames).updateMask(regionRaster)
                          .set('code_region', param.code_region)
                          .set('pais', param.pais)
                          .set('version', param.version_output)
                          .set('descripcion', 'filtro espacial')
                          .set('paso', 'P02-4');
            
print('Result', class_outTotal)

Map.addLayer(mosaic.mosaic().updateMask(regionRaster), {
      'bands': ['swir1_median', 'nir_median', 'red_median'],
      'gain': [0.08, 0.06, 0.08],
      'gamma': 0.65
  }, 'mosaic-'+param.year, false);
  
Map.addLayer(class4FT.select(bandNames), vis3, 'class-ORIGINAL'+param.year);
Map.addLayer(class_outTotal, vis3, 'class-SPATIAL FILTER'+param.year);

Export.image.toAsset({
    'image': class_outTotal,
    'description': prefixo_out,
    'assetId': dirout+'/'+ prefixo_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': region.geometry().bounds(),
    'scale': 30,
    'maxPixels': 1e13
});
