import { FilterCond, ValueHelpMetadata, ValueHelpType } from "../../model/ServiceModel";
import ValueHelpDialog from "./ValueHelpDialog";

import Input from "sap/m/Input";
import Token from "sap/m/Token";

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
     * @param initialFilters optional array of initial filter conditions
     * @param initialTokens optional array of conditions as tokens
     * @returns the created value help dialog reference
     */
    createValueHelpDialog(
        metadata: ValueHelpMetadata,
        inputField?: Input,
        multipleSelection?: boolean,
        initialFilters?: FilterCond[],
        initialTokens?: Token[]
    ): ValueHelpDialog {
        let supportRangesOnly = false;

        if (!metadata?.type) {
            supportRangesOnly = true;
        }

        const vhDialog = new ValueHelpDialog({
            inputField: inputField,
            loadDataAtOpen: metadata.type === ValueHelpType.DomainFixValues,
            valueHelpMetadata: metadata,
            multipleSelection: multipleSelection,
            supportRanges: multipleSelection,
            initialFilters: initialFilters,
            initialTokens: initialTokens,
            supportRangesOnly: supportRangesOnly
        });

        return vhDialog;
    }
}
