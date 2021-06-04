sap.ui.define(["sap/ui/model/json/JSONListBinding"], JSONListBinding => {
    /**
     * Custom List Binding that supports paging
     *
     * @alias devepos.qdrt.rest.RESTListBinding
     */
    return JSONListBinding.extend("devepos.qdrt.rest.RESTListBinding", {
        /**
         * Creates a new RESTListBinding instance
         *
         */
        constructor: function () {
            JSONListBinding.apply(this, arguments);
        },
        getLength() {
            return 0;
        }
    });
});
