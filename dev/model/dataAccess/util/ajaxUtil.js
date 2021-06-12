import $ from "jQuery.sap.global";
import SystemUtil from "../../util/systemUtil";

const SAP_LANGUAGE_PARAM = "sap-language";
const SAP_CLIENT_PARAM = "sap-client";

/**
 * Adds SAP Query parameters to url
 * @param {String} urlString url string
 * @returns {String} url string with SAP query parameters
 */
function addSapQueryParamsToUrl(urlString = "") {
    const url = urlString.startsWith("http") ? new URL(urlString) : new URL(`http:/${urlString}`);
    if (!url.searchParams.has(SAP_LANGUAGE_PARAM)) {
        const language = SystemUtil.getCurrentLanguage();
        if (language && language !== "") {
            url.searchParams.set(SAP_LANGUAGE_PARAM, language);
        }
    }
    if (!url.searchParams.has(SAP_CLIENT_PARAM)) {
        const client = SystemUtil.getCurrentClient();
        if (client && client !== "") {
            url.searchParams.set(SAP_CLIENT_PARAM, client);
        }
    }

    return url.toString().slice(6); // remove starting 'http:/' part
}

export default {
    /**
     * CSRF Token Header
     */
    CSRF_TOKEN_HEADER: "X-CSRF-Token",
    /**
     * Promisfied AJAX call
     * @param {string} url request url
     * @param {boolean} addSapQueryParams if <code>true</code> the sap query parameters
     *      'language' and 'client' will be added to the request url
     * @param {Object} parameters parameters for the request
     * @param {Object} parameters.headers optional http headers
     * @param {Object} parameters.data payload for the request
     * @param {string} parameters.dataType the expected data type (default: json)
     * @param {string} parameters.username username for basic authentication
     * @param {string} parameters.password password for basic authentication
     * @param {string} parameters.method request method (e.g. GET/POST/PUT)
     * @param {string} parameters.CSRFToken CSRF token for POST/PUT/DELETE
     * @returns {Promise<Object>} promise to ajax request
     * @public
     */
    send(
        url,
        addSapQueryParams = true,
        {
            headers = {},
            method = "GET",
            data = undefined,
            dataType = "json",
            CSRFToken = "",
            username = "",
            password = ""
        } = {}
    ) {
        if (addSapQueryParams) {
            url = addSapQueryParamsToUrl(url);
        }
        this._addCSRFToRequestData(headers, CSRFToken);
        return new Promise((fnResolve, fnReject) => {
            $.ajax({
                url: url,
                headers: headers,
                method: method,
                username,
                dataType,
                password,
                data: data,
                success: (data, status, jqXHR) => {
                    fnResolve({ data, status: jqXHR.status, request: jqXHR });
                },
                error: (jqXHR, status, error) => {
                    fnReject({ status: jqXHR.status, statusText: error });
                }
            });
        });
    },
    /**
     * Fetches Data synchronously
     * @param {string} url url for the request
     * @param {boolean} addSapQueryParams if <code>true</code> the sap query parameters
     *      'language' and 'client' will be added to the request url
     * @param {Object} parameters Parameters
     * @param {String} parameters.method Request method
     * @param {String} parameters.url URL string for request
     * @param {Array|Object} parameters.data Optional payload for the request,
     * @param {String} parameters.dataType The expected result type of the response
     * @param {Object} parameters.headers Optional map with request headers (key/value pairs)
     * @param {string} parameters.CSRFToken CSRF token for POST/PUT/DELETE
     * @returns {Object} the result of synchronous request
     */
    sendSync(
        url,
        addSapQueryParams = true,
        { method = "GET", data, dataType = "json", headers = {}, CSRFToken = "" } = {}
    ) {
        let response;
        if (addSapQueryParams) {
            url = addSapQueryParamsToUrl(url);
        }
        this._addCSRFToRequestData(headers, CSRFToken);
        $.ajax({
            method,
            url: url,
            data,
            dataType,
            async: false,
            headers,
            success: (data, statusText, jqXHR) => {
                response = { data, status: jqXHR.status };
            },
            error: (jqXHR, statusText, error) => {
                response = { error, status: jqXHR.status };
            }
        });

        return response;
    },
    /**
     * Fetches CSRF token
     * @param {boolean} invalidate if <code>true</code> the token will be fetched again from the backend
     * @returns {Promise<string>} the value of the CSRF-Token
     * @public
     */
    async fetchCSRF(invalidate = false) {
        if (invalidate) {
            this._CSRFToken = "";
        }
        if (this._CSRFToken) {
            return this._CSRFToken;
        }
        const result = await this.send("/sap/bc/zi18nchksrv/", {
            method: "HEAD",
            headers: {
                [this.CSRF_TOKEN_HEADER]: "Fetch",
                accept: "*/*"
            }
        });
        this._CSRFToken = result?.request?.getResponseHeader(this.CSRF_TOKEN_HEADER);
        return this._CSRFToken;
    },
    _addCSRFToRequestData(headers, CSRFToken) {
        if (!headers[this.CSRF_TOKEN_HEADER] && CSRFToken) {
            headers[this.CSRF_TOKEN_HEADER] = CSRFToken;
        }
    }
};
