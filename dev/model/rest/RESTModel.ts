import JSONModel from "sap/ui/model/json/JSONModel";
/**
 * Custom JSON Model that handles calls to REST services
 *
 * @alias devepos.qdrt.rest.RESTModel
 */
export default class RESTModel extends JSONModel {
    /**
     * Creates a new RESTModel instance
     * @param data js object
     * @param observe whether to observe the JSON data for property changes
     */
    constructor(data?: object, observe?: boolean) {
        super(data, observe);
    }
}
