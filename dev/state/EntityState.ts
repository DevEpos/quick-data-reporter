import Entity, { ConfigurableEntity } from "../model/Entity";
import { EntityType, EntityMetadata, DataRow, ColumnConfig } from "../model/ServiceModel";
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
        this.data.aggregationItems = newSettings?.aggregationItems;
        this.data.sortItems = newSettings?.sortItems;
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
                        (colMeta?.longDescription.length <= 20 && colMeta.longDescription) ||
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
    reset(): void {
        this.data.type = null;
        this.data.name = null;
        this.data.aggregationItems.length = 0;
        this.data.sortItems.length = 0;
        this.data.filterItems.length = 0;
        this.data.columnsItems.length = 0;
        this.data.rows.length = 0;
        const colMetadata = this.data.metadata?.colMetadata;
        if (colMetadata) {
            colMetadata.length = 0;
        }
        this.updateModel();
    }
}
