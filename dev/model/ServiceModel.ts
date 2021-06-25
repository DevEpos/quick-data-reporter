export enum EntityType {
    CdsView = "C",
    Table = "T",
    View = "V"
}

export interface IDbEntity {
    type: EntityType;
    name: string;
    description?: string;
    packageName?: string;
    isFavorite?: boolean;
    // additional properties for ui
    typeIcon?: string;
    typeTooltip?: string;
}

export interface IEntityVariant {
    name?: string;
    author: string;
    executeOnSelection?: boolean;
    favorite?: boolean;
    global?: boolean;
    labelReadOnly?: boolean;
    readOnly?: boolean;
}

export interface IEntityMetadata {
    colMetadata?: IEntityColMetadata[];
}

export interface IEntityColMetadata {
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
}

/**
 * Result from data preview service
 */
export interface IDataPreview {
    /**
     * The actual retrieved data rows
     */
    rows: object[];
}
