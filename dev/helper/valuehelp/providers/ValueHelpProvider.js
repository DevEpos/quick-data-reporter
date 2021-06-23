import BaseObject from "sap/ui/base/Object";
import ValueState from "sap/ui/core/ValueState";
import Log from "sap/base/Log";
import ValueHelpDialog from "../ValueHelpDialog";

/**
 * Constructor for new ValueHelpProvider
 * @param {map} [params]
 *    The following parameters can be defined:
 * @param {object} [params.control]
 *      control, which should be extended with a value list provider
 * @param {object} [params.model]
 *      JSON model which should be used for filling
 * @param {string} [params.entitySet]
 *      the entity set to be used to fetch the values
 * @param {object} [params.keyField]
 *      the metadata information of the key field to be used
 * @param {array} [params.fieldsMetaData]
 *      Metadata information about the fields for the value list
 * @param {string} [params.basicSearchEnabled]
 *      flag to indicate if the basic search is enabled for the entity
 * @class
 * Class which provides value help support for an input/multiinput control
 *
 * @extends sap.ui.base.Object
 *
 * @constructor
 * @public
 * @alias group.msg.dairy.bpro.lib.commons.providers.ValueHelpProvider
 */
export default class ValueHelpProvider extends BaseObject {
    constructor(params) {
        this.control = params.control;
        this.model = params.model;
        this.fieldsMetadata = params.fieldsMetaData;
        this.keyField = params.keyField;
        this.oValueListConfig = {};
        this.hasBasicSearch = params.basicSearchEnabled;
        this.keyFieldName = this.keyField.name;
        const descriptionField = this.fieldsMetadata.find(field => field.isTokenDescription);
        this.descriptionFieldName = descriptionField ? descriptionField.name : this.keyFieldName;
        this._onInitialize();
    }

    _onInitialize() {
        this._onValueHelpRequest = async () => {
            const oValueHelpDialog = new ValueHelpDialog({
                inputField: this.control,
                model: this.model,
                fields: this.fieldsMetadata,
                keyField: this.keyField,
                multipleSelection: this.control.addToken ? true : false,
                basicSearchEnabled: this.hasBasicSearch,
                initialTokens: this.control.getTokens ? this.control.getTokens() : []
            });
            try {
                const tokens = await oValueHelpDialog.showDialog(`/${this.sEntitySet}`);
                if (tokens) {
                    let key = "";
                    if (this.control.isA("sap.m.MultiInput")) {
                        this.control.setValue("");
                        this.control.destroyTokens();
                        this.control.setTokens(tokens);
                    } else if (tokens.length > 0) {
                        key = tokens[0].getKey();
                        this.control.setValue(key);
                    }
                    // a chosen value help entry should always be valid
                    this.control.setValueState(ValueState.None);
                }
            } catch (error) {
                Log.error(error);
            }
        };
        this.control.attachValueHelpRequest(this._onValueHelpRequest);
    }

    destroy() {
        if (this._onValueHelpRequest) {
            this.control.detachValueHelpRequest(this._onValueHelpRequest);
            this._onValueHelpRequest = null;
        }
    }
}
