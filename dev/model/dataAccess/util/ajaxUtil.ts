import jQuery from "sap/ui/thirdparty/jquery";
import SystemUtil from "../../util/systemUtil";

const SAP_LANGUAGE_PARAM = "sap-language";
const SAP_CLIENT_PARAM = "sap-client";

/**
 * Response from AJAX request
 */
export type AjaxResponse = {
    data?: any;
    status?: int;
    request: JQuery.jqXHR<any>;
};

/**
 * Adds SAP Query parameters to url
 * @param urlString url string
 * @returns url string with SAP query parameters
 */
function addSapQueryParamsToUrl(urlString = ""): string {
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
    _CSRFToken: undefined,
    /**
     * CSRF Token Header
     */
    CSRF_TOKEN_HEADER: "X-CSRF-Token",
    /**
     * Promisfied AJAX call
     * @param url request url
     * @param parameters parameters for the request
     * @param parameters.headers optional http headers
     * @param parameters.data payload for the request
     * @param parameters.dataType the expected data type (default: json)
     * @param parameters.username username for basic authentication
     * @param parameters.password password for basic authentication
     * @param parameters.method request method (e.g. GET/POST/PUT)
     * @param parameters.CSRFToken CSRF token for POST/PUT/DELETE
     * @param addSapQueryParams if <code>true</code> the sap query parameters
     *      'language' and 'client' will be added to the request url
     * @returns promise to ajax request
     * @public
     */
    send(
        url: string,
        {
            headers = {},
            method = "GET",
            data = undefined,
            dataType = "json",
            CSRFToken = "",
            username = "",
            password = ""
        } = {},
        addSapQueryParams = true
    ): Promise<AjaxResponse> {
        if (addSapQueryParams) {
            url = addSapQueryParamsToUrl(url);
        }
        this._addCSRFToRequestData(headers, CSRFToken);
        return new Promise((fnResolve, fnReject) => {
            jQuery.ajax({
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
     * @param url url for the request
     * @param parameters Parameters
     * @param parameters.method Request method
     * @param parameters.url URL string for request
     * @param parameters.data Optional payload for the request,
     * @param parameters.dataType The expected result type of the response
     * @param parameters.headers Optional map with request headers (key/value pairs)
     * @param parameters.CSRFToken CSRF token for POST/PUT/DELETE
     * @param addSapQueryParams if <code>true</code> the sap query parameters
     *      'language' and 'client' will be added to the request url
     * @returns the result of synchronous request
     */
    sendSync(
        url: string,
        { method = "GET", data = undefined, dataType = "json", headers = {}, CSRFToken = "" } = {},
        addSapQueryParams = true
    ): AjaxResponse {
        let response;
        if (addSapQueryParams) {
            url = addSapQueryParamsToUrl(url);
        }
        this._addCSRFToRequestData(headers, CSRFToken);
        jQuery.ajax({
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
     * @param invalidate if <code>true</code> the token will be fetched again from the backend
     * @returns the value of the CSRF-Token
     * @public
     */
    async fetchCSRF(invalidate?: boolean): Promise<string> {
        if (invalidate) {
            this._CSRFToken = "";
        }
        if (this._CSRFToken) {
            return this._CSRFToken;
        }
        const result = await this.send("/sap/zqdrtrest/", {
            method: "HEAD",
            headers: {
                [this.CSRF_TOKEN_HEADER]: "Fetch",
                accept: "*/*"
            }
        });
        this._CSRFToken = result?.request?.getResponseHeader(this.CSRF_TOKEN_HEADER);
        return this._CSRFToken;
    },
    _addCSRFToRequestData(headers: Record<string, unknown>, CSRFToken: string): void {
        if (!headers[this.CSRF_TOKEN_HEADER] && CSRFToken) {
            headers[this.CSRF_TOKEN_HEADER] = CSRFToken;
        }
    }
};
