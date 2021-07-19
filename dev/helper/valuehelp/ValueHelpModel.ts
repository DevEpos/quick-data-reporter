import ValueHelpService from "../../service/ValueHelpService";
import { ValueHelpMetadata } from "../../model/ServiceModel";
import models from "../../model/models";
import { SimpleBindingParams } from "../../model/types";

import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * Model for ValueHelpDialog. It handles the necessary service
 * calls for retrieving the value help data
 */
export default class ValueHelpModel {
    private _model = models.createViewModel([]);
    private _service: ValueHelpService = new ValueHelpService();
    private _metadata: ValueHelpMetadata;

    constructor(valueHelpMetadata: ValueHelpMetadata) {
        this._metadata = valueHelpMetadata;
    }
    getModel(): JSONModel {
        return this._model;
    }

    getBindingPath(): string {
        return "/";
    }

    async fetchData(params?: SimpleBindingParams): Promise<void> {
        const valueHelpData = await this._service.retrieveValueHelpData({
            type: this._metadata.type,
            valueHelpName: this._metadata.valueHelpName,
            filters: params?.filters,
            maxRows: 200
        });
        this._model.setProperty("/", valueHelpData);
    }
}
