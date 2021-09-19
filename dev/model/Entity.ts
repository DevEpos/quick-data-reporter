import {
    DataRow,
    EntityType,
    EntityMetadata,
    SortCond,
    ColumnConfig,
    AggregationCond,
    FieldMetadata,
    EntityVariant,
    FieldFilter,
    FilterCond
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
    metadata: EntityMetadata = { entity: {}, fields: [] };
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
    maxRows = 200;
    /**
     * Returns all visible columns
     */
    get visibleFieldMetadata(): FieldMetadata[] {
        const visibleColKeys = this.columnsItems.filter(col => col.visible).map(col => col.fieldName);
        return visibleColKeys.map(visibleColKey =>
            this.metadata.fields.find(colMeta => colMeta.name === visibleColKey)
        );
    }
    getFilledFilters(): FieldFilter[] {
        const filters = [] as FieldFilter[];
        for (const filterName of Object.keys(this.filters)) {
            const filter = this.filters[filterName];
            if (filter.value || filter?.items?.length > 0 || filter?.ranges?.length > 0) {
                const reducedFilter = { fieldName: filterName } as FieldFilter;
                if (filter.value) {
                    reducedFilter.value = filter.value;
                }
                if (filter.ranges?.length > 0) {
                    reducedFilter.ranges = [];
                }
                for (const range of filter.ranges) {
                    const reducedRange = { operation: range.operation } as FilterCond;
                    if (range.value1) {
                        reducedRange.value1 = range.value1;
                    }
                    if (range.value2) {
                        reducedRange.value2 = range.value2;
                    }
                    if (range.exclude) {
                        reducedRange.exclude = true;
                    }
                    reducedFilter.ranges.push(reducedRange);
                }
                if (filter.items?.length > 0) {
                    reducedFilter.items = filter.items.map(item => {
                        return {
                            key: item.key
                        };
                    });
                }

                filters.push(reducedFilter);
            }
        }

        return filters;
    }
    getParameters(): FieldFilter[] {
        const params = [] as FieldFilter[];
        for (const paramName of Object.keys(this.parameters)) {
            const param = this.parameters[paramName];
            if (param.value) {
                params.push({ fieldName: paramName, value: param.value });
            }
        }
        return params;
    }
}
