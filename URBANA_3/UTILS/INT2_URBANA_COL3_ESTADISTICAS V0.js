// ESTIDISTICA DE AREA URBANA POR AÑO Y PAIS

var param = { 
    pais: 'PERU', 
    id: 8,
    version_input: '0',
    option: 'pais' // 'bioma' o 'pais'
};

/*
    PERU : 8
    GUIANA_FRANCESA: 9
    VENEZUELA : 1
    GUYANA : 2
    COLOMBIA: 3
    BRASIL: 4
    ECUADOR: 5
    SURINAME: 6
    BOLIVIA: 7
*/


var dirinput = 'projects/mapbiomas-raisg/TRANSVERSALES/URBANO_3/INTEGRACION/URBANA-UNION-1'
//var assetPath = dirinput + '/' +  param.pais +'-CLASES-GENERALES-'+ param.version_input;

var biomas = 'projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/biomas-3'
var paises ='projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/paises-3'

var biomas =  ee.Image(biomas);
var paises =  ee.Image(paises).eq(param.id).selfMask();

var territory
if (param.option == 'bioma') {
  territory = biomas.updateMask(paises);
} else if(param.option == 'pais') {
  territory = paises;
}

/**
* @description
*    calculate area
* 
* @author
*    João Siqueira
* 
*/

// Change the scale if you need.
var scale = 30;

// Define a list of years to export
var years = [
    '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992',
    '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
    '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
    '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016',
    '2017', '2018', '2019', '2020'
];

// Define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-TRANSVERSALES';

/**
* 
*/
// Territory image
// var territory = ee.Image(assetTerritories);

// LULC mapbiomas image
var mapbiomas = ee.Image(dirinput).updateMask(paises).selfMask();

// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(1000000);

// Geometry to export
var geometry = mapbiomas.geometry();

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

    var territotiesData = pixelArea.addBands(territory).addBands(image)
        .reduceRegion({
            reducer: reducer,
            geometry: geometry,
            scale: scale,
            maxPixels: 1e12
        });

    territotiesData = ee.List(territotiesData.get('groups'));

    var areas = territotiesData.map(convert2table);

    areas = ee.FeatureCollection(areas).flatten();

    return areas;
};

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
    description: 'areas-'+param.pais + '-' + param.option,
    folder: driverFolder,
    fileNamePrefix: 'areas-'+param.pais + '-' + param.option,
    fileFormat: 'CSV'
});
