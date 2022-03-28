var param = {
  country: 'PERU',
  region: 70208,
  cover: 'wetlands',
  years: [1990, 1995, 2000, 2000, 2005, 2010, 2015, 2020]
};


// assets
var assetPath   = 'projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion/';
var samplesPath = 'projects/mapbiomas-raisg/MUESTRAS/COLECCION3/TRANSVERSALES/INUNDABLES/';
var mosaicPath  = 'projects/mapbiomas-raisg/MOSAICOS/workspace-c3-v2';


// Composición y contraste RGB de 4 imágenes para un mismo momento
var years = param.years;

var cover = param.cover;

var yearClassification = {};

function getVisualization(bands) { return {min: 0, max: 1, bands: bands} }

years.forEach(function(year) {
    yearClassification[year] = {
        image: 'classification_' + year,
        samples: cover + '-' + param.region + '-' + param.country + '-' + year,
        yearFilter: ee.Filter.eq('year', year)
    };
});



//Creación y linkeo entre maps
var mapPanel = [];

assetPath = assetPath + cover.toUpperCase() + '-'+ param.region + '-' + param.country;
var classification = ee.Image(assetPath);
var mosaics = ee.ImageCollection(mosaicPath);

years.forEach(function(year) {
  
    var mosaic = mosaics
      .filter(yearClassification[year].yearFilter);
      

    var label = ui.Label({
      value: year,
      style: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'right',
        backgroundColor: '00000080',
        border: '2px solid ffffff00',
        position: 'bottom-right'
      },
    });
    
    
    var map = ui.Map()
      .setOptions('SATELLITE')
      .setControlVisibility(false)
      .add(label);
      

    map.addLayer(
      mosaic,
      {
        bands: ['ndwi_gao_median'],
        min: 90,
        max: 180,
        palette: 'ff9716,6ce90d,0cffc7,1091ff,0536eb,101762'
      },
      'NDWI', false
    );

      
    map.addLayer(
      mosaic,
      {
        bands: ['swir1_median', 'nir_median', 'blue_median'],
        gain: [0.08, 0.06, 0.2]
      },
      'MOSAICO', false
    );
    
    
    map.addLayer(
      classification,
      getVisualization(yearClassification[year].image),
      'CLASIFICACIÓN'
    );
    
    map.setControlVisibility({
      fullscreenControl: true,
      layerList: true
    });
    
    mapPanel.push(map);

});


var linker = ui.Map.Linker(mapPanel);


//Configuración de la posición de los  maps sobre la vista
var mapGrid = ui.Panel(
    [
        ui.Panel([mapPanel[0], mapPanel[4]], null, {stretch: 'both'}),
        ui.Panel([mapPanel[1], mapPanel[5]], null, {stretch: 'both'}),
        ui.Panel([mapPanel[2], mapPanel[6]], null, {stretch: 'both'}),
        ui.Panel([mapPanel[3], mapPanel[7]], null, {stretch: 'both'})
    ],
    ui.Panel.Layout.flow('horizontal'), {stretch: 'both'}
);


// Controladores de título y escala-zoom para el primer map
mapPanel[0].setControlVisibility({
  zoomControl: true,
  scaleControl: true
});


var mainTitle = ui.Label('VISOR DE ÁREAS INUNDABLES - MAPBIOMAS AMAZONÍA',
  {
    stretch: 'horizontal',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '9 px'
  }
);


// Centrado del map en localización y carga de títulos y maps en mosaico
mapPanel[0].centerObject(classification, 10);
ui.root.widgets().reset([mainTitle, mapGrid]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));