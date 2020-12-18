sap.ui.define([], () => {
    return {
        /**
         * Retrieves the current client for Backend calls
         * @returns {string} the found client
         */
        getCurrentClient() {
            let sClient = sap?.ushell?.Container.getLogonInformation().getClient();
            if (!sClient) {
                // retrieve client from current url
                const aClientMatchResult = window.location.href.match(/(?<=sap-client=)(\d{3})/);
                if (aClientMatchResult && aClientMatchResult.length === 2) {
                    sClient = aClientMatchResult[1];
                }
            }
            return sClient;
        }
    };
});
