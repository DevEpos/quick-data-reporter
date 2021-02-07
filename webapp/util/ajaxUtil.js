sap.ui.define(["sap/ui/thirdparty/jquery", "./systemUtil"], (jQuery, SystemUtil) => {
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

    return {
        /**
         * Fetches Data asynchronously
         * @param {Object} parameters Parameters
         * @param {String} parameters.method Request method
         * @param {String} parameters.url URL string for request
         * @param {Array|Object} parameters.data Optional payload for the request,
         * @param {String} parameters.dataType The expected result type of the response
         * @param {Map} parameters.headers Optional map with request headers (key/value pairs)
         * @param {Boolean} addSapQueryParams adds query parameters for SAP system like sap-language
         * @returns {Promise<Object>} the promise of the ajax request
         */
        fetch({ method = "GET", url, data, dataType = "json", headers = {} }, addSapQueryParams = true) {
            if (addSapQueryParams) {
                url = addSapQueryParamsToUrl(url);
            }
            return new Promise((resolve, reject) => {
                jQuery
                    .ajax({
                        method,
                        url,
                        data,
                        dataType,
                        headers
                    })
                    .done((data, statusText, jqXHR) => {
                        resolve({ data, status: jqXHR.status });
                    })
                    .fail((jqXHR, statusText, error) => {
                        reject({ status: jqXHR.status, error });
                    });
            });
        },
        /**
         * Fetches Data synchronously
         * @param {Object} parameters Parameters
         * @param {String} parameters.method Request method
         * @param {String} parameters.url URL string for request
         * @param {Array|Object} parameters.data Optional payload for the request,
         * @param {String} parameters.dataType The expected result type of the response
         * @param {Map} parameters.headers Optional map with request headers (key/value pairs)
         * @returns {Promise<Object>} the promise of the ajax request
         */
        fetchSync({ method = "GET", url, data, dataType = "json", headers = {} }) {
            let response;
            jQuery.ajax({
                method,
                url,
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
        }
    };
});
