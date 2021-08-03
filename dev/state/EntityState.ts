import Log from "sap/base/Log";
import ValueHelpUtil from "../helper/valuehelp/ValueHelpUtil";
import Entity, { ConfigurableEntity } from "../model/Entity";
import {
    EntityType,
    EntityMetadata,
    DataRow,
    ColumnConfig,
    ValueHelpMetadata,
    ValueHelpType,
    FieldMetadata
} from "../model/ServiceModel";
import EntityService from "../service/EntityService";
import BaseState from "./BaseState";

/**
 * State for the current visible entity
 * @nonui5
 */
export default class EntityState extends BaseState<Entity> {
    private _entityService: EntityService;
    constructor() {
        super(new Entity());
        this._entityService = new EntityService();
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
    async loadData(): Promise<void> {
        try {
            const selectionData = await this._entityService.getEntityData(this.data.type, this.data.name);
            if (selectionData) {
                this.setRows(selectionData?.rows);
            }
        } catch (reqError) {
            Log.error(
                `Data for entity with type: ${this.data.type}, name: ${this.data.name} could not be loaded`,
                reqError?.statusText ?? ""
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
                reqError?.statusText ?? ""
            );
        }
    }
    async loadMetadata(): Promise<EntityMetadata> {
        try {
            const entityMetadata = await this._entityService.getMetadata(this.data.type, this.data.name);
            this.noModelUpdates = true;
            if (entityMetadata?.fields) {
                for (let i = 0; i < entityMetadata.fields.length; i++) {
                    let fieldMeta = Object.create(FieldMetadata.prototype);
                    entityMetadata.fields[i] = Object.assign(fieldMeta, entityMetadata.fields[i]);
                    fieldMeta = entityMetadata.fields[i];
                    fieldMeta.description =
                        fieldMeta.mediumDescription ||
                        (fieldMeta.longDescription?.length <= 20 && fieldMeta.longDescription) ||
                        (fieldMeta.fieldText?.length <= 20 && fieldMeta.fieldText) ||
                        fieldMeta.shortDescription ||
                        fieldMeta.name;
                    this.data.columnsItems.push({
                        columnKey: fieldMeta.name,
                        visible: true,
                        index: i
                    });
                }
            }
            this.setMetadata({ fields: entityMetadata?.fields || [] });
            this.noModelUpdates = false;
            this.updateModel();
        } catch (reqError) {
            Log.error(
                `Metadata for entity with type: ${this.data.type}, name: ${this.data.name} could not be determined`,
                reqError?.statusText ?? ""
            );
        }
        return this.data.metadata;
    }
    /**
     * Retrieves value help metadata for the given field
     * @param fieldName metadata information of a field
     * @returns promise with value help meta data
     */
    async getFieldValueHelpInfo(fieldName: string): Promise<ValueHelpMetadata> {
        if (!this.data.valueHelpMetadata.hasOwnProperty(fieldName)) {
            await this._determineValueHelpInfo(fieldName);
        }
        return this.data.valueHelpMetadata[fieldName];
    }
    reset(): void {
        this.data.type = null;
        this.data.name = null;
        this.data.aggregationCond.length = 0;
        this.data.sortCond.length = 0;
        this.data.filters = {};
        this.data.columnsItems.length = 0;
        this.data.variants.length = 0;
        this.data.rows.length = 0;
        this.data.valueHelpMetadata = {};
        const fieldMetadata = this.data.metadata?.fields;
        if (fieldMetadata) {
            fieldMetadata.length = 0;
        }
        this.updateModel();
    }

    private async _determineValueHelpInfo(fieldName: string): Promise<void> {
        const fieldMeta = this.data.metadata.fields.find(f => f.name === fieldName);

        switch (fieldMeta.valueHelpType) {
            case ValueHelpType.CheckTable:
            case ValueHelpType.ElementaryDDICSearchHelp:
            case ValueHelpType.CollectiveDDICSearchHelp:
            case ValueHelpType.CdsAnnotation:
                try {
                    const vhMetadataForField = await this._entityService.getValueHelpMetadata(
                        this.data.name,
                        this.data.type,
                        fieldName
                    );
                    this.data.valueHelpMetadata[fieldName] = vhMetadataForField;
                } catch (error) {
                    Log.error(
                        `Valuehelp metadata at column '${fieldMeta.name}' with type '${fieldMeta.valueHelpType}' could not be determined`
                    );
                    this.data.valueHelpMetadata[fieldName] = ValueHelpUtil.getNoVhMetadata(fieldMeta);
                }
                break;

            case ValueHelpType.DomainFixValues:
                this.data.valueHelpMetadata[fieldName] = ValueHelpUtil.getDomainFixValuesVhMetadata(fieldMeta);
                break;

            default:
                this.data.valueHelpMetadata[fieldName] = ValueHelpUtil.getNoVhMetadata(fieldMeta);
                break;
        }
    }
}
