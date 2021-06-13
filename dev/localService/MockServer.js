import MockServer from "sap/ui/core/util/MockServer";
import Log from "sap/base/Log";
import UriParameters from "sap/base/util/UriParameters";
import AjaxUtil from "../model/dataAccess/util/ajaxUtil";

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
        const uriParameters = new UriParameters(window.location.href);
        const mockServerUrl = "/sap/zqdrtrest/";

        mockServer = new MockServer({
            rootUri: mockServerUrl
        });

        // configure mock server with a delay of 1s
        MockServer.config({
            autoRespond: true,
            autoRespondAfter: uriParameters.get("serverDelay") || 1000
        });

        const getJson = (xhr, jsonFileName) => {
            const localUri = sap.ui.require.toUrl(_sJsonFilesModulePath + jsonFileName + ".json");
            const json = AjaxUtil.sendSync(localUri);
            if (json.status === 200) {
                xhr.respondJSON(200, {}, json.data);
            } else {
                xhr.respondJSON(json.status, {}, []);
            }
            return true;
        };
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
                    return getJson(xhr, "dbentities");
                }
            },
            {
                method: "POST",
                path: /entities\/(.*)\/(.*)\/dataPreview.*/,
                response: xhr => {
                    return getJson(xhr, "datapreview");
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
    }
};
