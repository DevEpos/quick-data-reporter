import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";

export default {
    /**
     * Creates json model with device information
     * @returns {sap.ui.model.json.JSONModel} the device model
     * @public
     */
    createDeviceModel(): JSONModel {
        const oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
    },
    /**
     * Creates new json view model
     * @param {Object} data the data for the model
     * @param {boolean} observeChanges if <code>true</code> all property changes will trigger an automatic binding update
     * @returns {sap.ui.model.json.JSONModel} the created JSON model
     * @public
     */
    createViewModel(data?: any, observeChanges?: boolean): JSONModel {
        return new JSONModel(data, observeChanges);
    }
};
