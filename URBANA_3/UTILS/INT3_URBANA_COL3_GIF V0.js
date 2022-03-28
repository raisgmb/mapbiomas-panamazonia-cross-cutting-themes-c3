/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var Area_trabajo = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Feature(
        ee.Geometry.Polygon(
            [[[-72.00941016102047, -13.497359379598963],
              [-72.00941016102047, -13.572127898455221],
              [-71.85457159900875, -13.572127898455221],
              [-71.85457159900875, -13.497359379598963]]], null, false),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Animacion de clasificacion col2 con texto de año y crea gif 
// Por Pais
// By : Efrain Yury Turpo Cayo 
// IBC-PERU 

var params = { 
    // 'pais': 'BOLIVIA',    //
    'year': 2005,     // AÑO
    'geometry': null,
    'version_input': 0,
};


var assetCountries = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-2';
var dirinput = 'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/INTEGRACION/URBANA-UNION-1'
//var assetPath = dirinput + '/' +  params.pais +'-CLASES-GENERALES-'+ params.version_input;
var Clasific = ee.Image(dirinput).clip(Area_trabajo);

print(Clasific)


function NamecountryCase (name){
          var paisLowerCase =''
          switch (name) {
            case "PERU":
                paisLowerCase = 'Perú';
                break;
            case "GUIANA_FRANCESA":
                paisLowerCase = 'Guiana Francesa';
                break;
            case "VENEZUELA":
                paisLowerCase = 'Venezuela';
                break;
            case "GUYANA":
                paisLowerCase = 'Guyana';
                break;
            case "COLOMBIA":
                paisLowerCase = 'Colombia';
                break;
            case "BRASIL":
                paisLowerCase = 'Brasil';
                break;
            case "ECUADOR":
                paisLowerCase = 'Ecuador';
                break;
            case "SURINAME":
                paisLowerCase = 'Suriname';
                break;
            case "BOLIVIA":
                paisLowerCase = 'Bolivia'
            }
  return paisLowerCase
}

// var country = ee.FeatureCollection(assetCountries)
//                   .filterMetadata('name', 'equals', NamecountryCase(params.pais));

params.geometry = Area_trabajo
//params.geometry = country

// var Clasific= ee.Image(dirinput)
//               .clip(params.geometry)

var list = ee.List([])
for(var i =0; i<36; i++ ){
   list = list.add(Clasific.select(i).rename('classification').set('year',1985+i))
}

print(list)

var imagecollection =ee.ImageCollection.fromImages(list)
print(imagecollection)
//Map.addLayer(country.geometry().bounds())
///*******************
var text = require('users/gena/packages:text');

var annotations = [
  {position: 'left', offset: '5%', margin: '5%', property: 'label', scale: Map.getScale() * 1.5}
]

var palettes =  [ "ffffff", "129912", "1f4423", "006400", "00ff00", "687537", "76a5af",
                  "29eee4", "77a605", "935132", "bbfcac", "45c2a5", "b8af4f", "bbfcac",
                  "ffffb2", "ffd966", "f6b26b", "f99f40", "e974ed", "d5a6bd", "c27ba0",
                  "fff3bf", "ea9999", "dd7e6b", "aa0000", "ff99ff", "0000ff", "d5d5e5",
                  "dd497f", "b2ae7c", "af2a2a", "8a2be2", "968c46", "0000ff", "4fd3ff" ]
              
var gettext = function (image) {
    var texty = image.get('year');
    image = image.visualize({
      forceRgbOutput: true,
      min: 0,
      max: 34,
      palette: palettes
    })
    .set({label:texty});
  
    var annotated = text.annotateImage(image, {}, Area_trabajo.geometry().bounds(), annotations);
    
    return annotated.set('year', texty)
}

var imagecollectionText = imagecollection.map(gettext);

// Declaramos una nueva variable bajo la que realizar composiciones RGB o índices
var ComposicionRGB = { 
  bands: ['vis-red','vis-green','vis-blue'], // Realiza tu composición de imágenes
  crs: 'EPSG:4326', // Asigna un sistema mediante código EPSG
  // min: 0,
  // max: 255, // Juega con los valores de píxel para su representación más clara
  region: Area_trabajo.geometry(),
  framesPerSecond: 2, // Añade los frames por segundo para acelerar la animación
  dimensions: '720',}; // Parametriza una dimensión máxima de tamaño del gif

// Generamos el GIF animado del timelpase e imprimimos su URL para descarga
var AnimacionGIF = imagecollectionText.getVideoThumbURL(ComposicionRGB);
print (AnimacionGIF);

var vis = {
      "bands": 'vis-red,vis-green,vis-blue',
  }
Map.addLayer(imagecollectionText.filterMetadata('year', 'equals', params.year), vis, 'Mos'+params.year)
