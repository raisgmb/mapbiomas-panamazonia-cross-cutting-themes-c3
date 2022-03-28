/** 
 *  
 */
var bandsSpecifications = {
    'mapbiomas-glacier': [
        // ["blue_median", "uint16"],
        // ["blue_median_wet", "uint16"],
        ["blue_median_dry", "uint16"],
        // ["blue_min", "uint16"],
        // ["blue_stdDev", "uint32"],
        // ["green_median", "uint16"],
        ["green_median_dry", "uint16"],
        // ["green_median_wet", "uint16"],
        // ["green_median_texture", "int16"],
        ["green_min", "uint16"],
        // ["green_stdDev", "uint32"],
        // ["red_median", "uint16"],
        ["red_median_dry", "uint16"],
        // ["red_min", "uint16"],
        // ["red_median_wet", "uint16"],
        // ["red_stdDev", "uint32"],
        // ["nir_median", "uint16"],
        ["nir_median_dry", "uint16"],
        // ["nir_median_wet", "uint16"],
        // ["nir_min", "uint16"],
        // ["nir_stdDev", "uint32"],
        // ["swir1_median", "uint16"],
        ["swir1_median_dry", "uint16"],
        // ["swir1_median_wet", "uint16"],
        // ["swir1_min", "uint16"],
        // ["swir1_stdDev", "uint32"],
        // ["swir2_median", "uint16"],
        // ["swir2_median_wet", "uint16"],
        ["swir2_median_dry", "uint16"],
        // ["swir2_min", "uint16"],
        // ["swir2_stdDev", "uint32"],
        ["ndwimf_median", "uint8"],
        ["ndwimf_median_dry", "uint8"],
        // ["ndwimf_median_wet", "uint8"],
        // ["ndwimf_amp", "uint8"],
        ["ndsi_median", "uint8"],
        ["ndsi_median_dry", "uint8"],
        ["ndsi_median_wet", "uint8"],
        ["ndsi_min", "uint8"],
        // ["ndsi_amp", "uint8"],
        // ["soil_median", "uint8"],
        ["cloud_median", "uint8"],
        ["shade_median", "uint8"],
        // ["slope", "int16"],
    ]
};

/**
 * 
 */
var conversionFunctions = {

    "uint8": function (image) {
        return image.toUint8();
    },

    "uint16": function (image) {
        return image.toUint16();
    },

    "uint32": function (image) {
        return image.toUint32();
    },

    "int16": function (image) {
        return image.toInt16();
    },

};

/**
 * 
 * @param {*} image 
 */
exports.setBandTypes = function (image, projectName) {


    var imageSpecifBands = bandsSpecifications[projectName]
        .reduce(
            function (imageSpecifBands, bandSpecification) {

                var fun = conversionFunctions[bandSpecification[1]];

                return imageSpecifBands.addBands(
                    fun(image.select([bandSpecification[0]])),
                    [bandSpecification[0]],
                    true
                );
            }, ee.Image().select()
        );

    return ee.Image(imageSpecifBands.copyProperties(image));
};