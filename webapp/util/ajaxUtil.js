sap.ui.define(["jQuery.sap.global"], jQuery => {
    return {
        /**
         * Fetches Data asynchronously
         * @param {Object} parameters Parameters
         * @param {String} parameters.method Request method
         * @param {String} parameters.url URL string for request
         * @param {Array|Object} parameters.data Optional payload for the request,
         * @param {String} parameters.dataType The expected result type of the response
         * @returns {Promise<Object>} the promise of the ajax request
         */
        fetch({ method = "GET", url, data, dataType = "json" }) {
            return new Promise((resolve, reject) => {
                jQuery
                    .ajax({
                        method,
                        url,
                        data,
                        dataType
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
         * @returns {Promise<Object>} the promise of the ajax request
         */
        fetchSync({ method = "GET", url, data, dataType = "json" }) {
            let response;
            jQuery.ajax({
                method,
                url,
                data,
                dataType,
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
    };
});
