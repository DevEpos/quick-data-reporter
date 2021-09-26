import ValueHelpService from "../../service/ValueHelpService";
import { ValueHelpMetadata } from "../../model/ServiceModel";
import models from "../../model/models";
import { SimpleBindingParams } from "../../model/types";

import JSONModel from "sap/ui/model/json/JSONModel";
import { AggregationBindingInfo } from "sap/ui/base/ManagedObject";

/**
 * Model for ValueHelpDialog. It handles the necessary service
 * calls for retrieving the value help data
 */
export default class ValueHelpModel {
    private _vhMetadata: ValueHelpMetadata;
    private _model = models.createViewModel([]);
    private _service: ValueHelpService = new ValueHelpService();

    constructor(vhMetadata: ValueHelpMetadata) {
        this.setVhMetadata(vhMetadata);
    }
    setVhMetadata(vhMetadata: ValueHelpMetadata): void {
        this._vhMetadata = vhMetadata;
        this._model?.setProperty("/", null);
    }
    getModel(): JSONModel {
        return this._model;
    }
    /**
     * Returns binding info for VH result
     * @returns binding info for VH result
     */
    getVhResultBindingInfo(): AggregationBindingInfo {
        return {
            path: "/"
        };
    }
    async fetchData(params?: SimpleBindingParams): Promise<void> {
        const valueHelpData = await this._service.retrieveValueHelpData({
            type: this._vhMetadata.type,
            valueHelpName: this._vhMetadata.valueHelpName,
            sourceTab: this._vhMetadata.sourceTab,
            sourceField: this._vhMetadata.sourceField,
            filters: params?.filters,
            maxRows: 200
        });
        this._model.setProperty("/", valueHelpData);
    }
}
