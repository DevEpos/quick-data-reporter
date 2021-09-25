import ValueHelpService from "../../service/ValueHelpService";
import { ValueHelpType } from "../../model/ServiceModel";
import models from "../../model/models";
import { SimpleBindingParams } from "../../model/types";

import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * Model for ValueHelpDialog. It handles the necessary service
 * calls for retrieving the value help data
 */
export default class ValueHelpModel {
    private _vhName: string;
    private _vhType: ValueHelpType;
    private _model = models.createViewModel([]);
    private _service: ValueHelpService = new ValueHelpService();

    constructor(name: string, type: ValueHelpType) {
        this.updateValueHelpInfo(name, type);
    }
    updateValueHelpInfo(name: string, type: ValueHelpType): void {
        this._vhName = name;
        this._vhType = type;
        this._model?.setProperty("/", null);
    }
    getModel(): JSONModel {
        return this._model;
    }

    getBindingPath(): string {
        return "/";
    }

    async fetchData(params?: SimpleBindingParams): Promise<void> {
        const valueHelpData = await this._service.retrieveValueHelpData({
            type: this._vhType,
            valueHelpName: this._vhName,
            filters: params?.filters,
            maxRows: 200
        });
        this._model.setProperty("/", valueHelpData);
    }
}
