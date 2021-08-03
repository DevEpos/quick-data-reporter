import {
    DataRow,
    EntityType,
    EntityMetadata,
    FilterCond,
    SortCond,
    ColumnConfig,
    AggregationCond,
    FieldMetadata,
    EntityVariant,
    ValueHelpMetadata
} from "./ServiceModel";

/**
 * Describes an entity which is configurable
 */
export interface ConfigurableEntity {
    /**
     * Current sort items
     */
    sortCond: SortCond[];
    /**
     * Current column configuration
     */
    columnsItems: ColumnConfig[];
    /**
     * Current group items
     */
    aggregationCond: AggregationCond[];
}

export type TableFilters = Record<string, FilterCond[]>;

/**
 * Describes an entity
 */
export default class Entity implements ConfigurableEntity {
    /**
     * The name of an entity
     */
    name: string;
    /**
     * Type of an entity
     */
    type: EntityType;
    /**
     * Metadata of an entity
     */
    metadata: EntityMetadata = { fields: [] };
    /**
     * Value help metadata for each field where a value help is defined
     */
    valueHelpMetadata: Record<string, ValueHelpMetadata> = {};
    /**
     * List of variants of the entity
     */
    variants?: EntityVariant[] = [];
    /**
     * Data rows of an entity
     */
    rows: DataRow[] = [];
    /**
     * All visible filters with their set filter values
     */
    filters: TableFilters = {};
    sortCond: SortCond[] = [];
    columnsItems: ColumnConfig[] = [];
    aggregationCond: AggregationCond[] = [];
    /**
     * Returns all visible columns
     */
    get visibleFieldMetadata(): FieldMetadata[] {
        const visibleColKeys = this.columnsItems.filter(col => col.visible).map(col => col.columnKey);
        return visibleColKeys.map(visibleColKey =>
            this.metadata.fields.find(colMeta => colMeta.name === visibleColKey)
        );
    }
}
