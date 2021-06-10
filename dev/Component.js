import UIComponent from "sap/ui/core/UIComponent";
import models from "devepos/qdrt/model/models";

/**
 * Component for the Quick Data Reporter
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

    /**
     * Returns the i18n bundle
     * @returns {sap.base.i18n.ResourceBundle} the i18n resource bundle
     */
    getResourceBundle() {
        if (!this._bundle) {
            this._bundle = this.getModel("i18n")?.getResourceBundle();
        }
        return this._bundle;
    }

    destroy() {
        UIComponent.prototype.destroy.apply(this, arguments);
    }
}
