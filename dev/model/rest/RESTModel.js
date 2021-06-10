import JSONModel from "sap/ui/model/json/JSONModel";
/**
 * Custom JSON Model that handles calls to REST services
 *
 * @alias devepos.qdrt.rest.RESTModel
 */
export default class RESTModel extends JSONModel {
    /**
     * Creates a new RESTModel instance
     */
    constructor() {
        JSONModel.apply(this, arguments);
    }
}
