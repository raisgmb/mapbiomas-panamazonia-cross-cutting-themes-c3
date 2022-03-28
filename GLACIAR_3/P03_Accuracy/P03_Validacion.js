
var classification_input = ee.ImageCollection('projects/mapbiomas-raisg/TRANSVERSALES/GLACIAR_3/clasificacion-ft')
                      // .filterMetadata('code_region', 'equals', param.regionGlacier)
                      .filterMetadata('version', 'equals', 7)
                      .mosaic()
    
        var origname = [25,34]                      
        var newname  = [2 ,1]
      
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
      
     var classification_remap = ee.Image();
      
      years.forEach( function( year ) {
          var col1flor = classification_input.select('classification_' + year.toString())
                                             .remap ( origname, newname );
      
          classification_remap = classification_remap.addBands(col1flor.int8().rename(('classification_' + year.toString())));
      });
      classification_remap = classification_remap.slice(1)



/**
 * Accuracy_Multitemporal (iterador)
 * by: Efrain
*/ 
//var year = 2018
var GlobalAccuracy = []
var GlacierName = [[1,'BLANCA'],  [2,'HUALLANCA'],
                  [3,'HUAYHUASH'],[4,'RAURA'],
                  [5,'LA_VIUDA'], [6,'CENTRAL'],
                  [7,'CHONTA'],   [8,'HUAGORUNCHO'],
                  [9,'HUAYTAPALLANA'],[10,'AMPATO'],
                  [11,'HUANZO'],    [12,'CHILA'],
                  [13,'VILCABAMBA'],[14,'LA_RAYA'],
                  [15,'URUBAMBA'],  [16,'VILCANOTA'],
                  [17,'CARABAYA'],  [18,'APOLOBAMBA'],
                  [19,'VOLCANICA'], [20,'BARROSO']]

for (var year=1985; year<=2019; year++) {
  //print(year)
  var listaAcuraccy = []

  for(var i = 1; i<=1;i++) {
  var params = { 
      // 'region': 'Cord-'+ GlacierName[i-1][0],  // ID CORDILLERA
      // 'gridName': GlacierName[i-1][1],//CORDILLERA
      // 'pais': 'PERU',    //
      'year': year,     // AÑO
      'geometry': null
  };
  
  // params.geometry = ee.FeatureCollection("projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-glacier-3")
  //                   .filterMetadata('Codigo', 'equals', params.region);
  
  var classification = classification_remap
                       .select('classification_'+params.year)
                       .rename('classification')
                       //.clip(params.geometry)
  
  // ACURACCY
  var PuntoValida = ee.FeatureCollection("users/NDFIb1/Punto_Val_Glacier_v0")
                   // .filterBounds(params.geometry)
                    .filterMetadata('class_'+params.year, 'not_equals', 3)
                    .filterMetadata('class_'+params.year, 'not_equals', 4);
  
  var validacao = classification.sampleRegions(PuntoValida,['class_'+params.year], 30, null,2);
  var acuracia_classificacao = validacao.errorMatrix('classification','class_'+params.year);
  //print('Matriz de confusion: ', acuracia_classificacao);
  //print('Clasifi Acuraccy:'+GlacierName[i-1][1],acuracia_classificacao.accuracy());
  listaAcuraccy.push(acuracia_classificacao.accuracy())
  }

//print(listaAcuraccy)
GlobalAccuracy.push(listaAcuraccy)
}

print(GlobalAccuracy)
var featureCollection = ee.FeatureCollection(GlobalAccuracy
                        .map(function(element){
                        return ee.Feature(null,{prop:element})}))


//print(featureCollection)

Export.table.toDrive({
  collection: featureCollection,
  folder: 'Export_accuracy_glacier',
  description:'Export_accuracy'+'glacier',
  fileFormat: 'CSV'
});

// var palette = ['d5d5e5','0000ff','ff0000']
// Map.addLayer(PuntoValida.filterMetadata('class_'+year, 'equals', 1).style({'color':palette[1]}));
// Map.addLayer(PuntoValida.filterMetadata('class_'+year, 'equals', 2).style({'color':palette[2]}));