/**
 * Utility for retrieving ABAP system values
 */
export default {
    /**
     * Retrieves the current client for Backend calls
     * @returns {string} the found client
     */
    getCurrentClient(): string {
        // @ts-ignore
        let sClient = sap?.ushell?.Container.getLogonSystem?.().getClient();
        if (!sClient) {
            // retrieve client from current url
            const aClientMatchResult = window.location.href.match(/(?<=sap-client=)(\d{3})/);
            if (aClientMatchResult && aClientMatchResult.length === 2) {
                sClient = aClientMatchResult[1];
            }
        }
        return sClient;
    },

    /**
     * Retrieves the current language for backend calls
     * @returns {String} the current language
     */
    getCurrentLanguage(): string {
        return sap.ui.getCore().getConfiguration().getLanguage();
    }
};
