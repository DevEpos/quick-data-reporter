import { ValueHelpMetadata, ValueHelpType } from "../../model/ServiceModel";
import ValueHelpDialog from "./ValueHelpDialog";

import Input from "sap/m/Input";

/**
 * Factory for creating value helps
 */
export default class ValueHelpFactory {
    private static _instance: ValueHelpFactory;
    private constructor() {
        // singleton constructor
    }

    /**
     * Retrieves an instance of the factory
     * @returns instance of the factory
     */
    static getInstance(): ValueHelpFactory {
        if (!ValueHelpFactory._instance) {
            ValueHelpFactory._instance = new ValueHelpFactory();
        }
        return ValueHelpFactory._instance;
    }

    /**
     * Creates a new instance of a value help dialog
     * @param metadata metadata information of a value help
     * @param inputField reference to the input field on which value help is called
     * @param multipleSelection whether or not multiple selection is allowed
     * @returns the created value help dialog reference
     */
    createValueHelpDialog(
        metadata: ValueHelpMetadata,
        inputField?: Input,
        multipleSelection?: boolean
    ): ValueHelpDialog {
        let supportRangesOnly = false;
        const supportRanges = true;

        if (metadata?.type === ValueHelpType.Date || !metadata?.type) {
            supportRangesOnly = true;
        }
        const vhDialog = new ValueHelpDialog({
            inputField: inputField,
            keyFieldName: metadata.tokenKeyField,
            loadDataAtOpen: metadata.type === ValueHelpType.DomainFixValues,
            valueHelpMetadata: metadata,
            multipleSelection: multipleSelection,
            supportRanges: supportRanges,
            supportRangesOnly: supportRangesOnly
        });

        return vhDialog;
    }
}
