import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";

export default {
    createDeviceModel() {
        const oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
    }
};
