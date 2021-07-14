export enum EntityType {
    CdsView = "C",
    Table = "T",
    View = "V"
}

export enum ValueHelpType {
    DomainFixValues = "DomainFixValues",
    SimpleDDICSearchHelp = "SimpleDDICSearchHelp",
    CollectiveDDICSearchHelp = "CollectiveDDICSearchHelp",
    CheckTable = "CheckTable",
    Date = "Date",
    /**
     * For future implementations
     */
    CdsAnnotation = "CdsAnnotation"
}

export interface FilterCond {
    columnKey: string;
    operation: string;
    value1?: any;
    value2?: any;
    exclude?: boolean;
}

export interface SortCond {
    columnKey: string;
    sortDirection?: string;
}

export interface AggregationCond {
    columnKey: string;
    operation?: string;
    showIfGrouped?: boolean;
}

export interface ColumnConfig {
    columnKey: string;
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
    colMetadata?: EntityColMetadata[];
}

export interface EntityColMetadata {
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
    length: int;
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
     * Indicates if the field allows case sensitive input
     */
    isCaseSensitive?: boolean;
    /**
     * Indicates if there is a value help for the field available
     */
    hasValueHelp?: boolean;
    /**
     * The type of the defined value help if the property "hasValueHelp" is true
     */
    valueHelpType?: ValueHelpType;
}

export type DataRow = Record<string, unknown>;

/**
 * Result from data preview service
 */
export interface DataPreview {
    /**
     * The actual retrieved data rows
     */
    rows: DataRow[];
}

/**
 * Information about field in a Value Help dialog
 */
export interface ValueHelpField extends EntityColMetadata {
    isDescription?: boolean;
    visible?: boolean;
    width?: number;
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
    fields: ValueHelpField[];
}

/**
 * Metadata of a value help for a field in an entity
 */
export interface ValueHelpMetadata extends ValueHelpInfo {
    /**
     * The targeted field of a DB entity
     */
    targetField: string;
    /**
     * Identifier of field that is to be used as the token key
     */
    tokenKeyField: string;
    /**
     * Identifier of field that is to be used as the token description
     */
    tokenDescriptionField: string;
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
