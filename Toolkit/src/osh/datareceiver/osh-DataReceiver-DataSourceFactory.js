/***************************** BEGIN LICENSE BLOCK ***************************

 The contents of this file are subject to the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one
 at http://mozilla.org/MPL/2.0/.

 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the License.

 Copyright (C) 2015-2017 Mathieu Dhainaut. All Rights Reserved.

 Author: Mathieu Dhainaut <mathieu.dhainaut@gmail.com>

 ******************************* END LICENSE BLOCK ***************************/

/**
 *
 * @constructor
 */
OSH.DataReceiver.DataSourceFactory = function() {};

OSH.DataReceiver.DataSourceFactory.DEFINITION_TYPE = {
    JSON:"json",
    VIDEO:"video"
};

OSH.DataReceiver.DataSourceFactory.definitionMap = {
    "http://sensorml.com/ont/swe/property/VideoFrame": OSH.DataReceiver.DataSourceFactory.DEFINITION_TYPE.VIDEO, //video
    "http://sensorml.com/ont/swe/property/Image" : OSH.DataReceiver.DataSourceFactory.DEFINITION_TYPE.VIDEO //video
};

OSH.DataReceiver.DataSourceFactory.createDatasourceFromType = function(properties,callback) {
    OSH.Asserts.checkIsDefineOrNotNull(properties);
    OSH.Asserts.checkIsDefineOrNotNull(properties.definition);

    var type = "";

    if(properties.definition in OSH.DataReceiver.DataSourceFactory.definitionMap) {
        type = OSH.DataReceiver.DataSourceFactory.definitionMap[properties.definition];
    }

    if(type === OSH.DataReceiver.DataSourceFactory.DEFINITION_TYPE.VIDEO) {
        OSH.DataReceiver.DataSourceFactory.createVideoDatasource(properties,callback);
    } else {
        OSH.DataReceiver.DataSourceFactory.createJsonDatasource(properties,callback);
    }
};

/**
 *
 * @param properties the datasource properties
 * @param callback callback function called when the datasource is created. The callback will returns undefined if no datasource matches.
 * @memberof OSH.DataReceiver.DataSourceFactory
 * @instance
 */
OSH.DataReceiver.DataSourceFactory.createVideoDatasource = function(properties,callback) {
    OSH.Asserts.checkIsDefineOrNotNull(properties);
    OSH.Asserts.checkIsDefineOrNotNull(callback);

    var oshServer = new OSH.Server({
        url: "http://"+properties.endpointUrl
    });

    var self = this;

    oshServer.getResultTemplate(properties.offeringID,properties.observedProperty, function(jsonResp){
        var resultEncodingArr = jsonResp.GetResultTemplateResponse.resultEncoding.member;
        var compression = null;

        for(var i=0;i < resultEncodingArr.length;i++) {
            var elt = resultEncodingArr[i];
            if('compression' in elt) {
                compression = elt.compression;
                break;
            }
        }

        // store compression info
        properties.compression = compression;

        var datasource;

        if(compression === "JPEG") {
            datasource = new OSH.DataReceiver.VideoMjpeg(properties.name, properties);
        } else if(compression === "H264") {
            datasource = new OSH.DataReceiver.VideoH264(properties.name, properties);
        }

        datasource.resultTemplate = self.buildDSStructure(datasource,jsonResp);
        callback(datasource);

    },function(error) {
        throw new OSH.Exception.Exception("Cannot Get result template for "+properties.endpointUrl,error);
    });
};

/**
 *
 * @param properties the datasource properties
 * @param callback callback function called when the datasource is created. The callback will returns undefined if no datasource matches.
 * @memberof OSH.DataReceiver.DataSourceFactory
 * @instance
 */
OSH.DataReceiver.DataSourceFactory.createJsonDatasource = function(properties,callback) {
    OSH.Asserts.checkIsDefineOrNotNull(properties);
    OSH.Asserts.checkIsDefineOrNotNull(callback);

    var datasource = new OSH.DataReceiver.JSON(properties.name, properties);

    this.buildDSResultTemplate(datasource,function (dsResult) {
        callback(dsResult);
    });
};

OSH.DataReceiver.DataSourceFactory.buildDSResultTemplate = function(dataSource,callback) {
    // get result template from datasource
    var server = new OSH.Server({
        url: "http://" + dataSource.properties.endpointUrl
    });

    var self = this;
    // offering, observedProperty
    server.getResultTemplate(dataSource.properties.offeringID,dataSource.properties.observedProperty, function(jsonResp){
        dataSource.resultTemplate = self.buildDSStructure(dataSource,jsonResp);
        callback(dataSource);
    },function(error) {
        // do something
    });
};

OSH.DataReceiver.DataSourceFactory.buildDSStructure = function (datasource, resultTemplate) {
    var result = [];
    var currentObj = null;
    var group = null;

    OSH.Utils.traverse(resultTemplate.GetResultTemplateResponse.resultStructure.field, function (key, value, params) {
        if (params.defLevel !== null && params.level < params.defLevel) {
            result.push(currentObj);
            currentObj = null;
            params.defLevel = null;
        }

        if (group !== null && params.level < group.level) {
            group = null;
        }

        //TODO: define stop rules
        if (!isUndefinedOrNull(value.definition) || !isUndefinedOrNull(value.axisID)) {

            var saveGroup = false;
            if (currentObj !== null) {
                saveGroup = true;
                group = {
                    path: currentObj.path,
                    level: params.level,
                    object: currentObj.object
                };
            }

            if (!isUndefinedOrNull(value.definition)) {
                currentObj = {
                    definition: value.definition,
                    path: null,
                    object: value
                };
            } else {
                currentObj = {
                    path: null,
                    object: value
                };
            }

            params.defLevel = params.level + 1;
        }

        if (params.defLevel !== null && params.level >= params.defLevel) {
            if (key === "name") {
                if (currentObj.path === null) {
                    if (group !== null) {
                        currentObj.path = group.path + "." + value;
                        currentObj.parentObject = group.object;
                    } else {
                        currentObj.path = value;
                    }
                } else {
                    currentObj.path = currentObj.path + "." + value;
                }
            }
        }
    }, {level: 0, defLevel: null});

    if (currentObj !== null) {
        result.push(currentObj);
    }

    for (var key in result) {
        var uiLabel = "no label/axisID/name defined";
        if (!isUndefinedOrNull(result[key].object.label)) {
            uiLabel = result[key].object.label;
        } else if (!isUndefinedOrNull(result[key].object.axisID)) {
            uiLabel = result[key].object.axisID;
        } else if (!isUndefinedOrNull(result[key].object.name)) {
            uiLabel = result[key].object.name;
        }
        result[key].uiLabel = uiLabel;
    }
    return result;
};