import jQuery from "sap/ui/thirdparty/jquery";
import SystemUtil from "../../util/systemUtil";

const SAP_LANGUAGE_PARAM = "sap-language";
const SAP_CLIENT_PARAM = "sap-client";
/**
 * CSRF Token Header
 */
const CSRF_TOKEN_HEADER = "X-CSRF-Token";

/**
 * Response from AJAX request
 */
export type AjaxResponse = {
    data?: any;
    status?: int;
    request: JQuery.jqXHR<any>;
};

export type RequestOptions = {
    method: "GET" | "POST" | "PUT" | "HEAD" | "DELETE";
    headers?: Record<string, string>;
    data?: object;
    dataType?: string;
    csrfToken?: string;
    username?: string;
    password?: string;
};

const defaultReqOptions: RequestOptions = {
    method: "GET",
    dataType: "json",
    headers: {}
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

class AjaxUtil {
    private _csrfToken: string = undefined;

    /**
     * Promisfied AJAX call
     * @param url request url
     * @param options options for the request
     * @param addSapQueryParams if <code>true</code> the sap query parameters
     *      'language' and 'client' will be added to the request url
     * @returns promise to ajax request
     * @public
     */
    send(url: string, options = defaultReqOptions, addSapQueryParams = true): Promise<AjaxResponse> {
        if (addSapQueryParams) {
            url = addSapQueryParamsToUrl(url);
        }
        const headers = options?.headers ?? {};
        this._addCSRFToRequestData(headers, options?.csrfToken);
        return new Promise((fnResolve, fnReject) => {
            jQuery.ajax({
                url: url,
                headers: options?.headers,
                method: options.method,
                username: options.username,
                dataType: options.dataType ?? "json",
                password: options.password,
                data: options.data,
                success: (data, status, jqXHR) => {
                    fnResolve({ data, status: jqXHR.status, request: jqXHR });
                },
                error: (jqXHR, status, error) => {
                    fnReject({ status: jqXHR.status, statusText: error });
                }
            });
        });
    }

    /**
     * Fetches Data synchronously
     * @param url url for the request
     * @param options = defaultReqOptions,
     * @param addSapQueryParams if <code>true</code> the sap query parameters
     *      'language' and 'client' will be added to the request url
     * @returns the result of synchronous request
     */
    sendSync(url: string, options = defaultReqOptions, addSapQueryParams = true): AjaxResponse {
        let response;
        if (addSapQueryParams) {
            url = addSapQueryParamsToUrl(url);
        }
        const headers = options?.headers ?? {};
        this._addCSRFToRequestData(headers, options?.csrfToken);
        jQuery.ajax({
            url: url,
            headers: options?.headers,
            method: options.method,
            username: options.username,
            dataType: options.dataType ?? "json",
            password: options.password,
            data: options.data,
            async: false,
            success: (data, statusText, jqXHR) => {
                response = { data, status: jqXHR.status };
            },
            error: (jqXHR, statusText, error) => {
                response = { error, status: jqXHR.status };
            }
        });

        return response;
    }

    /**
     * Fetches CSRF token
     * @param invalidate if <code>true</code> the token will be fetched again from the backend
     * @returns the value of the CSRF-Token
     * @public
     */
    async fetchCSRF(invalidate?: boolean): Promise<string> {
        if (invalidate) {
            this._csrfToken = "";
        }
        if (this._csrfToken) {
            return this._csrfToken;
        }
        const result = await this.send("/sap/zqdrtrest/", {
            method: "HEAD",
            headers: {
                [CSRF_TOKEN_HEADER]: "Fetch",
                accept: "*/*"
            }
        });
        this._csrfToken = result?.request?.getResponseHeader(CSRF_TOKEN_HEADER);
        return this._csrfToken;
    }

    private _addCSRFToRequestData(headers: Record<string, unknown>, csrfToken: string): void {
        if (!headers[CSRF_TOKEN_HEADER] && csrfToken) {
            headers[CSRF_TOKEN_HEADER] = csrfToken;
        }
    }
}

export default new AjaxUtil();
