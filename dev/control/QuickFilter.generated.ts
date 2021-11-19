import { $ControlSettings } from "sap/ui/core/Control";
import { FieldFilter, FieldMetadata, ValueHelpType } from "../model/types";

declare module "./QuickFilter" {
    interface $QuickFilterSettings extends $ControlSettings {
        /**
         * The name of the column
         */
        columnName?: string;
        /**
         * Label of the column
         */
        label?: string;
        /**
         * Data type of the column
         */
        type?: string;
        /**
         * Holds the actual entered value/ranges of the filter
         */
        filterData?: string;
        /**
         * Gets fired if value help request is triggered on filter control
         */
        valueHelpRequest?: Function;
        /**
         * Event handler for the remove event.
         */
        remove?: Function;
        /**
         * Controls whether only a single value can be entered in the filter
         */
        singleValueOnly?: boolean;
        /**
         * Controls whether the filter can be deleted
         */
        deletable?: boolean;
        /**
         * Controls whether a value is required
         */
        required?: boolean;
        /**
         * Flag whether or not there is value help defined for the column
         */
        hasValueHelp?: boolean;
        /**
         * The type of the value help of the column if one is defined
         */
        valueHelpType?: ValueHelpType;
        /**
         * Metadata of the reference field which provides additional information
         */
        referenceFieldMetadata?: FieldMetadata | string;
    }

    export default interface QuickFilter {
        // properties
        getType(): string;
        setType(type: string): this;
        getLabel(): string;
        setLabel(label: string): this;
        getColumnName(): string;
        setColumnName(columnName: string): this;
        getFilterData(): FieldFilter;
        setFilterData(filterData: FieldFilter): this;
        getSingleValueOnly(): boolean;
        setSingleValueOnly(singleValueOnly: boolean): this;
        getDeletable(): boolean;
        setDeletable(deletable: boolean): this;
        getRequired(): boolean;
        setRequired(required: boolean): this;
        getHasValueHelp(): boolean;
        setHasValueHelp(hasValueHelp: boolean): this;
        getValueHelpType(): ValueHelpType;
        setValueHelpType(valueHelpType: ValueHelpType): this;
        getReferenceFieldMetadata(): FieldMetadata;
        setReferenceFieldMetadata(referenceFieldMetadata: FieldMetadata): this;
        // Events
        attachValueHelpRequest(data: object, callback: Function, listener?: object): this;
        attachValueHelpRequest(callback: Function, listener?: object): this;
        detachValueHelpRequest(callback: Function, listener?: object): this;
        fireValueHelpRequest(): this;
        attachRemove(data: object, callback: Function, listener?: object): this;
        attachRemove(callback: Function, listener?: object): this;
        detachRemove(callback: Function, listener?: object): this;
        fireRemove(): this;
    }
}
