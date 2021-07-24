import Log from "sap/base/Log";
import ValueHelpUtil from "../helper/valuehelp/ValueHelpUtil";
import Entity, { ConfigurableEntity } from "../model/Entity";
import {
    EntityType,
    EntityMetadata,
    DataRow,
    ColumnConfig,
    ValueHelpMetadata,
    ValueHelpType
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
            // TODO: handle error
        }
    }
    async loadVariants(): Promise<void> {
        try {
            const variantData = await this._entityService.getVariants(this.data.type, this.data.name);
            this.data.variants = [...variantData] || [];
            this.updateModel();
        } catch (reqError) {
            // TODO: handle error
        }
    }
    async loadMetadata(): Promise<EntityMetadata> {
        try {
            const entityMetadata = await this._entityService.getMetadata(this.data.type, this.data.name);
            this.noModelUpdates = true;
            this.setMetadata({ colMetadata: entityMetadata?.colMetadata || [] });
            if (entityMetadata?.colMetadata) {
                for (let i = 0; i < entityMetadata.colMetadata.length; i++) {
                    const colMeta = entityMetadata.colMetadata[i];
                    colMeta.description =
                        colMeta.mediumDescription ||
                        (colMeta.longDescription?.length <= 20 && colMeta.longDescription) ||
                        (colMeta.fieldText?.length <= 20 && colMeta.fieldText) ||
                        colMeta.shortDescription ||
                        colMeta.name;
                    this.data.columnsItems.push({
                        columnKey: colMeta.name,
                        visible: true,
                        index: i
                    });
                }
            }
            this.noModelUpdates = false;
            this.updateModel();
        } catch (reqError) {
            // TODO: handle error
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
        const colMetadata = this.data.metadata?.colMetadata;
        if (colMetadata) {
            colMetadata.length = 0;
        }
        this.updateModel();
    }

    private async _determineValueHelpInfo(fieldName: string): Promise<void> {
        const fieldMeta = this.data.metadata.colMetadata.find(f => f.name === fieldName);

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
