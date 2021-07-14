import {
    DataRow,
    EntityType,
    EntityMetadata,
    FilterCond,
    SortCond,
    ColumnConfig,
    AggregationCond,
    EntityColMetadata,
    EntityVariant,
    ValueHelpMetadata
} from "./ServiceModel";

/**
 * Describes an entity which is configurable
 */
export interface ConfigurableEntity {
    /**
     * Current filter items
     */
    filterItems: FilterCond[];
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
    metadata: EntityMetadata = { colMetadata: [] };
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
    filterItems: FilterCond[] = [];
    sortCond: SortCond[] = [];
    columnsItems: ColumnConfig[] = [];
    aggregationCond: AggregationCond[] = [];
    /**
     * Returns all visible columns
     */
    get visibleColMetadata(): EntityColMetadata[] {
        const visibleColKeys = this.columnsItems.filter(col => col.visible).map(col => col.columnKey);
        return visibleColKeys.map(visibleColKey =>
            this.metadata.colMetadata.find(colMeta => colMeta.name === visibleColKey)
        );
    }
}
