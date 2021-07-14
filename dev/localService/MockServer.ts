import ajaxUtil from "../service/ajaxUtil";

import _MockServer from "sap/ui/core/util/MockServer";
import Log from "sap/base/Log";
import UriParameters from "sap/base/util/UriParameters";
import DateFormat from "sap/ui/core/format/DateFormat";
import CalendarType from "sap/ui/core/CalendarType";
import { SinonFakeXMLHttpRequest } from "sinon";

const APP_MODULE_PATH = "devepos/qdrt/";
const JSON_FILES_MODULE_PATH = APP_MODULE_PATH + "localService/mockdata/";
const MOCK_SERVER_URL = "/sap/zqdrtrest/";

/**
 * @namespace devepos.qdrt.localService
 */
export default class MockServer {
    private _mockServer: _MockServer;
    private _mockData: Record<string, unknown> = {};
    private _modelFormatter: DateFormat;
    private _randomSeed: Record<string, number> = {};
    /**
     * Initializes the mock server.
     * You can configure the delay with the URL parameter "serverDelay".
     * The local mock data in this folder is returned instead of the real data for testing.
     * @public
     *
     */
    constructor() {
        const uriParameters = new UriParameters(window.location.href);
        this._mockServer = new _MockServer({
            rootUri: MOCK_SERVER_URL
        });
        this._modelFormatter = DateFormat.getDateInstance({
            calendarType: CalendarType.Gregorian,
            pattern: "yyyy-MM-dd",
            strictParsing: true,
            UTC: true
        });
        this._randomSeed = {};
        // configure mock server with a delay of 1s
        _MockServer.config({
            autoRespond: true,
            autoRespondAfter: (uriParameters.get("serverDelay") as unknown as number) || 1000
        });

        this._mockServer.setRequests([
            {
                method: "HEAD",
                path: /.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    xhr.respond(200, { "X-CSRF-Token": "Dummy" }, null);
                }
            },
            {
                method: "GET",
                path: /entities[^/]*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    this._getMockdata(xhr, "dbentities");
                }
            },
            {
                method: "POST",
                path: /entities\/(.*)\/(.*)\/dataPreview.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    this._getMockdata(xhr, "datapreview");
                }
            },
            {
                method: "GET",
                path: /entities\/(.*)\/(.*)\/metadata.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    this._getMockdata(xhr, "entityMetadata");
                }
            },
            {
                method: "GET",
                path: /entities\/(.*)\/(.*)\/variants.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    this._getMockdata(xhr, "entityvariants");
                }
            },
            {
                method: "GET",
                path: /entities\/(.*)\/(.*)\/valueHelpMetadata.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    this._getMockdata(xhr, "valueHelpMetadata");
                }
            }
        ]);
        this._mockServer.start();

        Log.info("Running the app with mock data");
    }

    /**
     * Returns the mockserver of the app, should be used in integration tests
     * @public
     * @returns {sap.ui.core.util.MockServer} Mockserver instance
     */
    getMockServer(): _MockServer {
        return this._mockServer;
    }

    private _getCachedMockdata(jsonFileName: string) {
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
    }

    private _getJSONContent(jsonFileName: string) {
        const localUri = sap.ui.require.toUrl(JSON_FILES_MODULE_PATH + jsonFileName + ".json");
        return ajaxUtil.sendSync(localUri);
    }

    private _getMockdata(xhr: SinonFakeXMLHttpRequest, jsonFileName: string) {
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
    }

    private _getPseudoRandomNumber(type: string): number {
        if (!this._randomSeed) {
            this._randomSeed = {};
        }
        // eslint-disable-next-line no-prototype-builtins
        if (!this._randomSeed.hasOwnProperty(type)) {
            this._randomSeed[type] = 0;
        }
        this._randomSeed[type] = ((this._randomSeed[type] + 11) * 25214903917) % 281474976710655;
        return this._randomSeed[type] / 281474976710655;
    }

    private _generatePropertyValue(propertyName: string, type: string, index: int) {
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
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
                    const r = (this._getPseudoRandomNumber("Guid") * 16) | 0;
                    const v = c === "x" ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
            case "Binary":
                /*eslint-disable */
                const nMask = Math.floor(-2147483648 + this._getPseudoRandomNumber("Binary") * 4294967295);
                let sMask = "";
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
}
