import UIComponent from "sap/ui/core/UIComponent";
import models from "devepos/qdrt/model/models";

/**
 * @namespace devepos.qdrt
 */
export default class Component extends UIComponent {
    metadata = {
        manifest: "json"
    };

    init() {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);
        // set the device model
        this.setModel(models.createDeviceModel(), "device");
        // create the views based on the url/hash
        this.getRouter().initialize();
    }
}
