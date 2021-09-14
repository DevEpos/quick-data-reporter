import ODataType from "sap/ui/model/odata/type/ODataType";
import I18nUtil from "../helper/I18nUtil";
import TypeFactory from "./TypeFactory";

export enum EntityType {
    All = "all",
    CdsView = "C",
    Table = "T",
    View = "V"
}

export enum DisplayFormat {
    UpperCase = "UpperCase"
}

/**
 * Operators for the Filter.
 */
export enum FilterOperator {
    /**
     * Will result in Operator EQ
     */
    Auto = "Auto",
    Contains = "Contains",
    StartsWith = "StartsWith",
    EndsWith = "EndsWith",
    BT = "BT",
    EQ = "EQ",
    GE = "GE",
    GT = "GT",
    LE = "LE",
    LT = "LT",
    NE = "NE",
    Empty = "Empty",
    NotEmpty = "NotEmpty"
}

export enum ValueHelpType {
    DomainFixValues = "DomainFixValues",
    ElementaryDDICSearchHelp = "ElementaryDDICSearchHelp",
    CollectiveDDICSearchHelp = "CollectiveDDICSearchHelp",
    CheckTable = "CheckTable",
    Date = "Date",
    /**
     * For future implementations
     */
    CdsAnnotation = "CdsAnnotation"
}
export interface FieldFilter {
    fieldName?: string;
    value?: string;
    ranges?: FilterCond[];
    items?: FilterItem[];
}

export interface FilterItem {
    key: string;
    text: string;
}

export interface FilterCond {
    keyField?: string;
    operation: string;
    value1?: any;
    value2?: any;
    exclude?: boolean;
}

export interface SortCond {
    fieldName: string;
    sortDirection?: string;
}

export interface AggregationCond {
    fieldName: string;
    operation?: string;
    showIfGrouped?: boolean;
}

export interface ColumnConfig {
    fieldName: string;
    index?: number;
    visible: boolean;
}

export interface DbEntity {
    type: EntityType;
    name: string;
    description?: string;
    packageName?: string;
    isFavorite?: boolean;
    // additional properties for ui
    typeIcon?: string;
    typeTooltip?: string;
}

export interface EntityVariantData {
    columnItems?: ColumnConfig[];
    sortCond?: SortCond[];
    aggregationCond?: AggregationCond[];
    filterCond?: FilterCond[];
}

export interface EntityVariant {
    key: string;
    text: string;
    author: string;
    executeOnSelection?: boolean;
    favorite?: boolean;
    global?: boolean;
    labelReadOnly?: boolean;
    readOnly?: boolean;
    dataString: string;
    data: EntityVariantData;
}

export interface EntityMetadata {
    parameters?: FieldMetadata[];
    fields?: FieldMetadata[];
}

export class FieldMetadata {
    private _typeInstance: ODataType;
    private _tooltip: string;
    /**
     * The name of the column
     */
    name: string;
    /**
     * Indicates if the field is a key field
     */
    isKey?: boolean;
    /**
     * The data type of the column
     */
    type: string; // use enum
    /**
     * The max number of characters/digits this column can hold
     */
    maxLength?: number;
    /**
     * Number of digits a numerical type can hold including decimal places
     */
    precision?: number;
    /**
     * Maximum number of digits right next to the decimal point
     */
    scale?: number;
    /**
     * The data element assigned as column type
     */
    rollname?: string;
    /**
     * The short description for the column
     */
    shortDescription?: string;
    /**
     * The medium description for the column
     */
    mediumDescription?: string;
    /**
     * The long description for the column
     */
    longDescription?: string;
    /**
     * The tooltip for the column
     */
    get tooltip(): string {
        if (!this._tooltip) {
            const description = this.fieldText || (this.description && this.description !== this.name) || "-";
            this._tooltip =
                `${I18nUtil.getText("entity_field_description")}: ${description}\n` +
                `${I18nUtil.getText("entity_field_technicalName")}: ${this.name}`;
        }
        return this._tooltip;
    }
    /**
     * The DDIC description for the column
     */
    fieldText?: string;
    /**
     * The description for the ui.
     */
    description?: string;
    /**
     * Indicates if the field is filterable
     */
    filterable?: boolean;
    /**
     * Indicates if the field is sortable
     */
    sortable?: boolean;
    /**
     * Indicates if the field is a technical field and should not be displayed
     */
    technical?: boolean;
    /**
     * The display format to be used for the field
     */
    displayFormat?: string;
    /**
     * Indicates if there is a value help for the field available
     */
    hasValueHelp?: boolean;
    /**
     * The type of the defined value help if the property "hasValueHelp" is true
     */
    valueHelpType?: ValueHelpType;

    /**
     * Retrieves the type instance derived from the metadata of the field
     */
    get typeInstance(): ODataType {
        if (!this._typeInstance) {
            const formatOptions: { displayFormat?: String } = {};
            const constraints: { precision?: number; scale?: number; maxLength?: number } = {};
            if (this.displayFormat) {
                formatOptions.displayFormat = this.displayFormat;
            }
            if (this.maxLength) {
                constraints.maxLength = this.maxLength;
            }
            if (this.precision || this.scale) {
                constraints.precision = this.precision;
                constraints.scale = this.scale;
            }
            this._typeInstance = TypeFactory.getType(this.type, formatOptions, constraints);
        }
        return this._typeInstance;
    }
}

export type DataRow = Record<string, unknown>;

/**
 * Result from data preview service
 */
export interface QueryResult {
    /**
     * The actual retrieved data rows
     */
    rows: DataRow[];
}

/**
 * Information about field in a Value Help dialog
 */
export class ValueHelpField extends FieldMetadata {
    isDescription?: boolean;
    visible?: boolean;
    /**
     * Width in CSS style, e.g. 9em
     */
    width?: string;
}

interface ValueHelpInfo {
    /**
     * The name of the value help. Depending on the type of the value help
     * this can be either a domain, a check table or the name of DDIC search help
     */
    valueHelpName: string;
    /**
     * The type of the value help
     */
    type: ValueHelpType;
    /**
     * Field metadata for Table/Filters in value help dialog
     */
    fields?: ValueHelpField[];
}

/**
 * Metadata of a value help for a field in an entity
 */
export interface ValueHelpMetadata extends ValueHelpInfo {
    /**
     * The targeted field of a DB entity
     */
    targetField?: string;
    /**
     * Identifier of field that is to be used as the token key
     */
    tokenKeyField?: string;
    /**
     * Identifier of field that is to be used as the token description
     */
    tokenDescriptionField?: string;
    /**
     * Ids of filter fields
     */
    filterFields?: string[];
    /**
     * Ids of output fields
     */
    outputFields?: string[];
}

/**
 * Describes a request to retrieve data via value help
 */
export interface ValueHelpRequest extends ValueHelpInfo {
    /**
     * Optional array of filter conditions
     */
    filters?: FilterCond[];
    /**
     * Optional array of sort items
     */
    sortCond?: SortCond[];
    /**
     * The maximum number of rows to retrieve
     */
    maxRows?: number;
}
