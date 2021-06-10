import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";

export default {
    /**
     * Creates json model with device information
     * @returns {sap.ui.model.json.JSONModel} the device model
     * @public
     */
    createDeviceModel() {
        const oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
    },
    /**
     * Creates new json view model
     * @param {Object} oData the data for the model
     * @returns {sap.ui.model.json.JSONModel} the created JSON model
     * @public
     */
    createViewModel(oData) {
        return new JSONModel(oData);
    }
};
