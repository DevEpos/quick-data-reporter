sap.ui.define(["sap/ui/core/UIComponent", "devepos/qdrt/model/models"], (UIComponent, models) => {
    /**
     * App Component
     *
     * @alias devepos.qdrt.Component
     */
    return UIComponent.extend("devepos.qdrt.Component", {
        metadata: {
            manifest: "json"
        },
        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once
         * @public
         * @override
         */
        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            // create the views based on the url/hash
            this.getRouter().initialize();
        }
    });
});
