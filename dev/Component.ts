import UIComponent from "sap/ui/core/UIComponent";
import models from "com/devepos/qdrt/model/models";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * Component for the Quick Data Reporter
 * @namespace com.devepos.qdrt
 */
export default class QdrtComponent extends UIComponent {
    _bundle: ResourceBundle;
    metadata = {
        manifest: "json"
    };

    init(): void {
        // call the base component's init function
        // eslint-disable-next-line prefer-rest-params
        super.init.apply(this, arguments as any);
        // set the device model
        this.setModel(models.createDeviceModel(), "device");
        // create the views based on the url/hash
        this.getRouter().initialize();
    }

    /**
     * Returns the i18n bundle
     * @returns the i18n resource bundle
     */
    getResourceBundle(): ResourceBundle {
        if (!this._bundle) {
            this._bundle = (this.getModel("i18n") as ResourceModel)?.getResourceBundle() as ResourceBundle;
        }
        return this._bundle;
    }

    destroy(supressInvalidate?: boolean): void {
        super.destroy.apply(this, [supressInvalidate]);
    }
}
