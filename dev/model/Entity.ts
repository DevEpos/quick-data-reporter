import {
    DataRow,
    EntityType,
    EntityMetadata,
    SortCond,
    ColumnConfig,
    AggregationCond,
    FieldMetadata,
    EntityVariant,
    FieldFilter
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

export type TableFilters = Record<string, FieldFilter>;

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
     * List of variants of the entity
     */
    variants?: EntityVariant[] = [];
    /**
     * Data rows of an entity
     */
    rows: DataRow[] = [];
    /**
     * CDS View parameters
     */
    parameters?: TableFilters = {};
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
