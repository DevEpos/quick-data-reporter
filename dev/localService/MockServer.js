import MockServer from "sap/ui/core/util/MockServer";
import Log from "sap/base/Log";
import UriParameters from "sap/base/util/UriParameters";
import AjaxUtil from "../model/dataAccess/util/ajaxUtil";
import DateFormat from "sap/ui/core/format/DateFormat";
import CalendarType from "sap/ui/core/CalendarType";

let mockServer;
const _sAppModulePath = "devepos/qdrt/";
const _sJsonFilesModulePath = _sAppModulePath + "localService/mockdata/";

export default {
    /**
     * Initializes the mock server.
     * You can configure the delay with the URL parameter "serverDelay".
     * The local mock data in this folder is returned instead of the real data for testing.
     * @public
     *
     */
    init() {
        this._mockData = {};
        const uriParameters = new UriParameters(window.location.href);
        const mockServerUrl = "/sap/zqdrtrest/";

        mockServer = new MockServer({
            rootUri: mockServerUrl
        });
        this._modelFormatter = DateFormat.getDateInstance({
            calendarType: CalendarType.Gregorian,
            pattern: "yyyy-MM-dd",
            strictParsing: true,
            UTC: true
        });
        this._randomSeed = {};

        // configure mock server with a delay of 1s
        MockServer.config({
            autoRespond: true,
            autoRespondAfter: uriParameters.get("serverDelay") || 1000
        });

        mockServer.setRequests([
            {
                method: "HEAD",
                path: /.*/,
                response: xhr => {
                    xhr.respond(200, { "X-CSRF-Token": "Dummy" });
                }
            },
            {
                method: "GET",
                path: /entities\/vh.*/,
                response: xhr => {
                    this._getMockdata(xhr, "dbentities");
                }
            },
            {
                method: "POST",
                path: /entities\/(.*)\/(.*)\/dataPreview.*/,
                response: xhr => {
                    this._getMockdata(xhr, "datapreview");
                }
            },
            {
                method: "POST",
                path: /entities\/(.*)\/(.*)\/metadata.*/,
                response: xhr => {
                    this._getMockdata(xhr, "entityMetadata");
                }
            }
        ]);
        mockServer.start();

        Log.info("Running the app with mock data");
    },

    /**
     * Returns the mockserver of the app, should be used in integration tests
     * @public
     * @returns {sap.ui.core.util.MockServer} Mockserver instance
     */
    getMockServer() {
        return mockServer;
    },

    _getCachedMockdata(jsonFileName) {
        if (this._mockData[jsonFileName]) {
            return this._mockData[jsonFileName];
        } else {
            const jsonResponse = this._getJSONContent(jsonFileName);
            if (jsonResponse?.status === 200) {
                this._mockData[jsonFileName] = jsonResponse?.data || {};
            } else {
                this._mockData[jsonFileName] = null;
            }
            return jsonResponse?.data;
        }
    },

    _getJSONContent(jsonFileName) {
        const localUri = sap.ui.require.toUrl(_sJsonFilesModulePath + jsonFileName + ".json");
        return AjaxUtil.sendSync(localUri);
    },

    _getMockdata(xhr, jsonFileName) {
        try {
            const json = this._getCachedMockdata(jsonFileName);
            if (json) {
                xhr.respond(200, {}, JSON.stringify(json));
            } else {
                xhr.respond(204, {}, "");
            }
        } catch (errorStatus) {
            xhr.respond(500, {}, "");
        }
    },

    _getPseudoRandomNumber(type) {
        if (!this._randomSeed) {
            this._randomSeed = {};
        }
        if (!this._randomSeed.hasOwnProperty(type)) {
            this._randomSeed[type] = 0;
        }
        this._randomSeed[type] = ((this._randomSeed[type] + 11) * 25214903917) % 281474976710655;
        return this._randomSeed[type] / 281474976710655;
    },

    _generatePropertyValue(propertyName, type, index) {
        if (!index) {
            index = Math.floor(this._getPseudoRandomNumber("String") * 10000) + 101;
        }
        let date;
        switch (type) {
            case "String":
                return propertyName + " " + index;
            case "DateTime":
                date = new Date();
                date.setFullYear(2000 + Math.floor(this._getPseudoRandomNumber("DateTime") * 20));
                date.setDate(Math.floor(this._getPseudoRandomNumber("DateTime") * 30));
                date.setMonth(Math.floor(this._getPseudoRandomNumber("DateTime") * 12));
                date.setMilliseconds(0);
                return "/Date(" + date.getTime() + ")/";
            case "Date":
                date = new Date();
                date.setFullYear(2000 + Math.floor(this._getPseudoRandomNumber("DateTime") * 20));
                date.setDate(Math.floor(this._getPseudoRandomNumber("DateTime") * 30));
                date.setMonth(Math.floor(this._getPseudoRandomNumber("DateTime") * 12));
                date.setMilliseconds(0);
                return this._modelFormatter.format(date);
            case "Int":
            case "Int16":
            case "Int32":
            case "Int64":
                return Math.floor(this._getPseudoRandomNumber("Int") * 10000);
            case "Decimal":
                return Math.floor(this._getPseudoRandomNumber("Decimal") * 1000000) / 100;
            case "Boolean":
                return this._getPseudoRandomNumber("Boolean") < 0.5;
            case "Byte":
                return Math.floor(this._getPseudoRandomNumber("Byte") * 10);
            case "Double":
                return this._getPseudoRandomNumber("Double") * 10;
            case "Single":
                return this._getPseudoRandomNumber("Single") * 1000000000;
            case "SByte":
                return Math.floor(this._getPseudoRandomNumber("SByte") * 10);
            case "Time":
                // ODataModel expects ISO8601 duration format
                return (
                    "PT" +
                    Math.floor(this._getPseudoRandomNumber("Time") * 23) +
                    "H" +
                    Math.floor(this._getPseudoRandomNumber("Time") * 59) +
                    "M" +
                    Math.floor(this._getPseudoRandomNumber("Time") * 59) +
                    "S"
                );
            case "Guid":
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
                    /[xy]/g,
                    function (c) {
                        var r = (this._getPseudoRandomNumber("Guid") * 16) | 0,
                            v = c === "x" ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                    }.bind(this)
                );
            case "Binary":
                var nMask = Math.floor(-2147483648 + this._getPseudoRandomNumber("Binary") * 4294967295),
                    sMask = "";
                /*eslint-disable */
                for (
                    var nFlag = 0, nShifted = nMask;
                    nFlag < 32;
                    nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1
                );
                /*eslint-enable */
                return sMask;
            case "DateTimeOffset":
                date = new Date();
                date.setFullYear(2000 + Math.floor(this._getPseudoRandomNumber("DateTimeOffset") * 20));
                date.setDate(Math.floor(this._getPseudoRandomNumber("DateTimeOffset") * 30));
                date.setMonth(Math.floor(this._getPseudoRandomNumber("DateTimeOffset") * 12));
                date.setMilliseconds(0);
                return "/Date(" + date.getTime() + "+0000)/";
            default:
                return propertyName + " " + index;
        }
    }
};
