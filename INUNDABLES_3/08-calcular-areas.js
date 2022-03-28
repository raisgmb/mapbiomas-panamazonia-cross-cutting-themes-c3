var param = { 
  country: 'VENEZUELA', 
  regionIds: [90201],
  cover: 'flooded',
  version: 2,
  driveFolder: 'RAISG-EXPORT'
};


var country = param.country;
var regionIds = param.regionIds;
var cover = param.cover;
var inputVersion = param.version;
var driverFolder = param.driveFolder;
var scale = 30;



// regions
var regions = ee.FeatureCollection('projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/clasificacion-regiones-3')
  .filter(
    ee.Filter.inList('id_regionC', regionIds)
  );

var territory = regions
  .reduceToImage(['id_regionC'], ee.Reducer.first());

var geometry = regions.geometry();

var pixelArea = ee.Image.pixelArea().divide(1000000);




// input collection
var fullRegion = cover.toUpperCase() + '-' + regionIds.join('-') + '-' + country;

var inputDir = "projects/mapbiomas-raisg/TRANSVERSALES/INUNDABLES_3/clasificacion";

var path = inputVersion === 1
  ? inputDir + '/' + fullRegion
  : inputDir + '-ft/' + fullRegion + '-' + inputVersion; 

var image = ee.Image(path).updateMask(territory);





// Define a list of years to export
var years = [
  '1985','1986','1987','1988','1989','1990','1991','1992','1993','1994',
  '1995','1996','1997','1998','1999','2000','2001','2002','2003','2004',
  '2005','2006','2007','2008','2009','2010','2011','2012','2013','2014',
  '2015','2016','2017','2018','2019','2020'
];




// LULC mapbiomas image

var bandnameReg = image.bandNames();
var bands = bandnameReg.getInfo();
var classif = ee.Image(0);

var bandNames = ee.List(
  years.map(function (year) {
    return 'classification_' + String(year);
  })
);

if(bands[0] === 'constant') bands = bands.slice(1);

bands.forEach(
  function (bandName) {
    var year = parseInt(bandName.split('_')[1], 10);
    
    var newImage = image.select(bandName).eq(1);
    
    var band0 = newImage.updateMask(newImage.unmask().neq(0));

    classif = classif.addBands(band0.rename(bandName));
  }
);

image = classif.select(bandnameReg);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// insert a masked band 
var bandsDictionary = bandsOccurrence
  .map( function (key, value) {
    return ee.Image(
      ee.Algorithms.If(
        ee.Number(value).eq(2),
        image.select([key]).byte(),
        ee.Image().rename([key]).byte().updateMask(image.select(0))
      )
  )}
);

// convert dictionary to image
var mapbiomas = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);








/**
* Convert a complex ob to feature collection
* @param obj 
*/
var convert2table = function (obj) {

    obj = ee.Dictionary(obj);

    var territory = obj.get('territory');

    var classesAndAreas = ee.List(obj.get('groups'));

    var tableRows = classesAndAreas.map(
        function (classAndArea) {
            classAndArea = ee.Dictionary(classAndArea);

            var classId = classAndArea.get('class');
            var area = classAndArea.get('sum');

            var tableColumns = ee.Feature(null)
                .set('territory', territory)
                .set('class', classId)
                .set('area', area);

            return tableColumns;
        }
    );

    return ee.FeatureCollection(ee.List(tableRows));
};

/**
* Calculate area crossing a cover map (deforestation, mapbiomas)
* and a region map (states, biomes, municipalites)
* @param image 
* @param territory 
* @param geometry
*/
var calculateArea = function (image, territory, geometry) {

    var reducer = ee.Reducer.sum().group(1, 'class').group(1, 'territory');

    var territoriesData = pixelArea.addBands(territory).addBands(image)
        .reduceRegion({
            reducer: reducer,
            geometry: geometry,
            scale: scale,
            maxPixels: 1e12
        });

    territoriesData = ee.List(territoriesData.get('groups'));

    var areas = territoriesData.map(convert2table);

    areas = ee.FeatureCollection(areas).flatten();

    return areas;
};


/**
 * Implementation
 */
var areas = years.map(
    function (year) {
        var image = mapbiomas.select('classification_' + year);
        
        var areas = calculateArea(image, territory, geometry);

        // set additional properties
        areas = areas.map(
            function (feature) {
                return feature.set('year', year);
            }
        );

        return areas;
    }
);


areas = ee.FeatureCollection(areas).flatten();

Export.table.toDrive({
    collection: areas,
    description: 'AREAS-' + fullRegion + '-' + inputVersion,
    folder: driverFolder,
    fileFormat: 'CSV'
});
