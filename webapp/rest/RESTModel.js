sap.ui.define(["sap/ui/model/json/JSONModel"], JSONModel => {
    /**
     * Custom JSON Model that
     *
     * @alias devepos.qdrt.rest.RESTModel
     */
    return JSONModel.extend("devepos.qdrt.rest.RESTModel", {
        /**
         * Creates a new RESTModel instance
         *
         */
        constructor: function () {
            JSONModel.apply(this, arguments);
        }
    });
});
