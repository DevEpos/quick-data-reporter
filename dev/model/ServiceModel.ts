export enum EntityType {
    CdsView = "C",
    Table = "T",
    View = "V"
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
    sortItems?: SortCond[];
    aggregationItems?: AggregationCond[];
    filterItems?: FilterCond[];
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
     * The description for the ui.
     */
    description?: string;
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
