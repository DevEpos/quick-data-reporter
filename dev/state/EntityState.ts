import Log from "sap/base/Log";
import ValueHelpUtil from "../helper/valuehelp/ValueHelpUtil";
import Entity, { ConfigurableEntity, TableFilters } from "../model/Entity";
import {
    EntityType,
    EntityMetadata,
    DataRow,
    ColumnConfig,
    ValueHelpMetadata,
    ValueHelpType,
    FieldMetadata,
    QueryRequest
} from "../model/ServiceModel";
import EntityService from "../service/EntityService";
import BaseState from "./BaseState";

/**
 * State for the current visible entity
 * @nonui5
 */
export default class EntityState extends BaseState<Entity> {
    private _entityService: EntityService;
    private _valueHelpMetadataMap: Record<string, ValueHelpMetadata> = {};

    constructor() {
        super(new Entity());
        this._entityService = new EntityService();
    }
    exists(): boolean {
        return this.data.metadata?.fields?.length > 0;
    }
    setConfiguration(newSettings: ConfigurableEntity): void {
        this.data.columnsItems = newSettings?.columnsItems;
        this.data.aggregationCond = newSettings?.aggregationCond;
        this.data.sortCond = newSettings?.sortCond;
        this.updateModel();
    }
    setColumnsItems(columnsItems: ColumnConfig[]): void {
        this.data.columnsItems = columnsItems;
        this.updateModel();
    }
    getCurrentConfiguration(): ConfigurableEntity {
        return this.data;
    }
    setEntityInfo(name: string, type: EntityType): void {
        this.data.name = name;
        this.data.type = type;
        this.updateModel();
    }
    setMetadata(metadata: EntityMetadata): void {
        this.data.metadata = metadata;
        this.updateModel();
    }
    setRows(rows: DataRow[]): void {
        this.data.rows = rows;
        this.updateModel();
    }
    setFilters(filters: TableFilters): void {
        this.data.filters = filters;
        this.updateModel();
    }
    setParameters(parameters: TableFilters): void {
        this.data.parameters = parameters;
        this.updateModel();
    }
    async loadData(): Promise<void> {
        try {
            const queryRequest = {
                settings: {
                    maxRows: this.data.maxRows
                },
                parameters: this.data.getParameters(),
                filters: this.data.getFilledFilters()
            } as QueryRequest;
            const selectionData = await this._entityService.getEntityData(this.data.type, this.data.name, queryRequest);
            if (selectionData) {
                this.setRows(selectionData?.rows);
            }
        } catch (reqError) {
            Log.error(
                `Data for entity with type: ${this.data.type}, name: ${this.data.name} could not be loaded`,
                (reqError as any)?.statusText ?? ""
            );
        }
    }
    async loadVariants(): Promise<void> {
        try {
            const variantData = await this._entityService.getVariants(this.data.type, this.data.name);
            this.data.variants = [...variantData] || [];
            this.updateModel();
        } catch (reqError) {
            Log.error(
                `Variants for entity with type: ${this.data.type}, name: ${this.data.name} could not be loaded`,
                (reqError as any)?.statusText ?? ""
            );
        }
    }
    async loadMetadata(): Promise<EntityMetadata> {
        const getDescription = (fieldMeta: FieldMetadata): string => {
            if (fieldMeta.mediumDescription) {
                return fieldMeta.mediumDescription;
            } else if (fieldMeta.shortDescription) {
                return fieldMeta.shortDescription;
            } else if (fieldMeta.longDescription) {
                if (fieldMeta.longDescription.length <= 25) {
                    return fieldMeta.longDescription;
                } else {
                    return `${fieldMeta.longDescription.substring(0, 22)}...`;
                }
            } else if (fieldMeta.fieldText) {
                if (fieldMeta.fieldText.length <= 25) {
                    return fieldMeta.fieldText;
                } else {
                    return `${fieldMeta.fieldText.substring(0, 22)}...`;
                }
            } else {
                return fieldMeta.name;
            }
        };
        try {
            const entityMetadata = await this._entityService.getMetadata(this.data.type, this.data.name);
            this.noModelUpdates = true;
            if (entityMetadata?.fields) {
                for (let i = 0; i < entityMetadata.fields.length; i++) {
                    const fieldMeta = entityMetadata.fields[i];
                    fieldMeta.description = getDescription(fieldMeta);
                    this.data.columnsItems.push({
                        fieldName: fieldMeta.name,
                        visible: true,
                        index: i
                    });
                }
            }
            if (entityMetadata?.parameters) {
                const initialParamFilters = {} as TableFilters;
                for (let i = 0; i < entityMetadata.parameters.length; i++) {
                    const fieldMeta = entityMetadata.parameters[i];
                    fieldMeta.description = getDescription(fieldMeta);

                    // create filter entry for parameter as all parameters are mandatory at this time
                    initialParamFilters[fieldMeta.name] = {};
                }
                this.data.parameters = initialParamFilters;
            }
            this.setMetadata({
                entity: entityMetadata.entity,
                fields: entityMetadata?.fields || [],
                parameters: entityMetadata?.parameters || []
            });
            this.noModelUpdates = false;
            this.updateModel();
        } catch (reqError) {
            this.reset();
            Log.error(
                `Metadata for entity with type: ${this.data.type}, name: ${this.data.name} could not be determined`,
                (reqError as any)?.statusText ?? ""
            );
        }
        return this.data.metadata;
    }
    /**
     * Retrieves value help metadata for the given field
     * @param fieldName metadata information of a field
     * @param isParam flag to indicate if field is a parameter
     * @returns promise with value help meta data
     */
    async getFieldValueHelpInfo(fieldName: string, isParam?: boolean): Promise<ValueHelpMetadata> {
        const mappedFieldName = isParam ? `@param:${fieldName}` : fieldName;
        if (!this._valueHelpMetadataMap.hasOwnProperty(mappedFieldName)) {
            this._valueHelpMetadataMap[mappedFieldName] = await this._determineValueHelpInfo(
                fieldName,
                mappedFieldName,
                isParam
            );
        }
        return this._valueHelpMetadataMap[mappedFieldName];
    }
    reset(): void {
        this._valueHelpMetadataMap = {};
        this.setStateData(new Entity());
        this.updateModel(true);
    }

    private async _determineValueHelpInfo(
        fieldName: string,
        mappedFieldName: string,
        isParam: boolean
    ): Promise<ValueHelpMetadata> {
        const source = isParam ? "parameters" : "fields";
        const fieldMeta = this.data.metadata[source].find(f => f.name === fieldName);

        switch (fieldMeta.valueHelpType) {
            case ValueHelpType.CheckTable:
            case ValueHelpType.ElementaryDDICSearchHelp:
            case ValueHelpType.CollectiveDDICSearchHelp:
            case ValueHelpType.CdsAnnotation:
                try {
                    const vhMetadataForField = await this._entityService.getValueHelpMetadata(
                        this.data.name,
                        this.data.type,
                        mappedFieldName
                    );
                    return vhMetadataForField;
                } catch (error) {
                    Log.error(
                        `Valuehelp metadata at column '${fieldMeta.name}' with type '${fieldMeta.valueHelpType}' could not be determined`
                    );
                    return ValueHelpUtil.getNoVhMetadata(fieldMeta);
                }

            case ValueHelpType.DomainFixValues:
                return ValueHelpUtil.getDomainFixValuesVhMetadata(fieldMeta);

            default:
                return ValueHelpUtil.getNoVhMetadata(fieldMeta);
        }
    }
}
