import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";
import ReactiveJSONModel from "./ReactiveJSONModel";

export default {
    /**
     * Creates json model with device information
     * @returns the device model
     * @public
     */
    createDeviceModel(): JSONModel {
        const oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
    },
    /**
     * Creates new json view model
     * @param data the data for the model
     * @param observeChanges if <code>true</code> all property changes will trigger an automatic binding update
     * @returns the created JSON model
     * @public
     */
    createViewModel(data?: object, observeChanges?: boolean): ReactiveJSONModel {
        return new ReactiveJSONModel(data, observeChanges);
    }
};
