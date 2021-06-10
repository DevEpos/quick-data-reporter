import JSONListBinding from "sap/ui/model/json/JSONListBinding";
/**
 * Custom List Binding that supports paging
 *
 * @alias devepos.qdrt.model.rest.RESTListBinding
 */
export default class RESTListBinding extends JSONListBinding {
    /**
     * Creates a new RESTListBinding instance
     *
     */
    constructor() {
        JSONListBinding.apply(this, arguments);
    }
    getLength() {
        return 0;
    }
}
