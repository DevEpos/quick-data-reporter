import ajaxUtil from "../service/ajaxUtil";
import { ValueHelpRequest } from "../model/types";

import _MockServer from "sap/ui/core/util/MockServer";
import Log from "sap/base/Log";
import UriParameters from "sap/base/util/UriParameters";
import DateFormat from "sap/ui/core/format/DateFormat";
import CalendarType from "sap/ui/core/CalendarType";
import { SinonFakeXMLHttpRequest } from "sinon";

const APP_MODULE_PATH = "com/devepos/qdrt/";
const JSON_FILES_MODULE_PATH = APP_MODULE_PATH + "localService/mockdata/";
const MOCK_SERVER_URL = "/sap/zqdrtrest/";

/**
 * @namespace com.devepos.qdrt.localService
 */
export default class MockServer {
    private _mockServer: _MockServer;
    private _mockData: Record<string, unknown> = {};
    private _dateFormatter: DateFormat;
    private _randomSeed: Record<string, number> = {};
    private _dateTimeFormatter: DateFormat;
    private _timeFormatter: DateFormat;
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
        this._dateFormatter = DateFormat.getDateInstance({
            calendarType: CalendarType.Gregorian,
            pattern: "yyyy-MM-dd",
            strictParsing: true,
            UTC: true
        });
        this._dateTimeFormatter = DateFormat.getDateTimeInstance({
            calendarType: CalendarType.Gregorian,
            pattern: "yyyyMMddHHmmss",
            strictParsing: true,
            UTC: false
        });
        this._timeFormatter = DateFormat.getTimeInstance({
            calendarType: CalendarType.Gregorian,
            pattern: "HH:mm:ss",
            strictParsing: true,
            UTC: false
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
                path: /entities\/(.*)\/(.*)\/queryResult.*/,
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
                path: /entities\/(.*)\/(.*)\/vhMetadata.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    const response = this._getCachedMockdata("valueHelpMetadata");
                    if (!response) {
                        xhr.respond(204, {}, "");
                        return;
                    }
                    const uriParams = new UriParameters(xhr.url);
                    xhr.respond(200, {}, JSON.stringify(response[uriParams.get("field")]));
                }
            },
            {
                method: "POST",
                path: /valueHelpData.*/,
                response: (xhr: SinonFakeXMLHttpRequest) => {
                    const response = this._getCachedMockdata("valueHelpData");
                    if (!response) {
                        xhr.respond(204, {}, "");
                        return;
                    }
                    if (xhr.requestBody) {
                        try {
                            const payload = JSON.parse(xhr.requestBody) as ValueHelpRequest;
                            if (payload?.valueHelpName) {
                                xhr.respond(200, {}, JSON.stringify(response[payload.valueHelpName]));
                            }
                        } catch (parseError) {
                            xhr.respond(500, {}, "Parsing error of request");
                            return;
                        }
                    }
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
                return this._dateTimeFormatter.format(date);
            case "Date":
                date = new Date();
                date.setFullYear(2000 + Math.floor(this._getPseudoRandomNumber("DateTime") * 20));
                date.setDate(Math.floor(this._getPseudoRandomNumber("DateTime") * 30));
                date.setMonth(Math.floor(this._getPseudoRandomNumber("DateTime") * 12));
                date.setMilliseconds(0);
                return this._dateFormatter.format(date);
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
                return (
                    `${Math.floor(this._getPseudoRandomNumber("Time") * 23)}:` +
                    `${Math.floor(this._getPseudoRandomNumber("Time") * 59)}:` +
                    `${Math.floor(this._getPseudoRandomNumber("Time") * 59)}`
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
