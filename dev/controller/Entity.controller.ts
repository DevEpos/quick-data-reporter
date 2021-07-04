import BaseController from "./BaseController";
import models from "../model/models";
import { EntityType } from "../model/ServiceModel";
import EntityTableSettings from "../helper/EntityTableSettings";
import Column from "sap/ui/table/Column";
import Text from "sap/m/Text";
import Table from "sap/ui/table/Table";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import { HorizontalAlign } from "sap/ui/core/library";
import Context from "sap/ui/model/Context";
import { EntityColMetadata } from "../model/ServiceModel";
import Control from "sap/ui/core/Control";
import EntityState from "../state/EntityState";
import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";

/**
 * Controller for a single database entity
 *
 * @alias devepos.qdrt.controller.Entity
 */
export default class EntityController extends BaseController {
    private _uiModel: JSONModel;
    private _entityTableSettings: EntityTableSettings;
    private _dataPreviewTable: Table;
    private _entityState: EntityState;
    /**
     * Initializes entity controller
     */
    onInit(): void {
        BaseController.prototype.onInit.call(this);
        this._uiModel = models.createViewModel({
            sideContentVisible: true
        });
        this._entityState = new EntityState();
        this._entityTableSettings = new EntityTableSettings(this.getView());
        this._entityState.getData();
        this._dataPreviewTable = this.getView().byId("dataPreviewTable") as Table;
        this.getView().setModel(this._uiModel, "ui");
        this.getView().setModel(this._entityState.getModel());
        this.router.getRoute("entity").attachPatternMatched(this._onEntityMatched, this);
        this.router.getRoute("main").attachPatternMatched(this._onMainMatched, this);
    }

    private _onMainMatched() {
        this._entityTableSettings?.destroyDialog();
        if (this._entityState) {
            setTimeout(() => {
                this._entityState.reset();
            }, 1000);
        }
    }
    private async _onEntityMatched(event: Event) {
        const args = event.getParameter("arguments");
        const entityInfo = {
            type: decodeURIComponent(args.type),
            name: decodeURIComponent(args.name)
        };
        this._entityState.setEntityInfo(entityInfo.name, entityInfo.type as EntityType);
        this._dataPreviewTable.setBusy(true);
        await this._entityState.loadMetadata();
        this._dataPreviewTable.setBusy(false);
    }
    /**
     * Handles entity settings event
     */
    async onTableSettings(): Promise<void> {
        const newSettings = await this._entityTableSettings.showSettingsDialog(this._entityState.getData());
        if (newSettings) {
            this._entityState.setConfiguration(newSettings);
        }
    }
    /**
     * Event handler to trigger data update
     */
    async onUpdateData(): Promise<void> {
        this._dataPreviewTable.setBusy(true);
        await this._entityState.loadData();
        this._dataPreviewTable.setBusy(false);
    }
    onCellContextMenu(event: Event): void {
        const contextMenu = event.getParameter("contextMenu") as Menu;
        if (contextMenu) {
            contextMenu.destroyItems();
            contextMenu.addItem(
                new MenuItem({
                    text: "Quickfilter on Cell"
                })
            );
        }
    }
    /**
     * Creates columns
     * @param id the id of the column
     * @param context the context binding of the column
     * @returns the created column
     */
    columnsFactory(id: string, context: Context): Column {
        const columnMetadataInfo = context.getObject() as EntityColMetadata;

        let width = "5rem";
        if (columnMetadataInfo.length > 50) {
            width = "15rem";
        } else if (columnMetadataInfo.length > 9) {
            width = "15rem";
        }

        let template: string | Control = columnMetadataInfo.name;
        let hAlign = HorizontalAlign.Begin;
        switch (columnMetadataInfo.type) {
            case "Date":
                width = "8rem";
                template = new Text({
                    text: {
                        path: template,
                        type: "sap.ui.model.type.Date",
                        formatOptions: {
                            style: "medium",
                            source: {
                                pattern: "yyyy-MM-dd"
                            }
                        }
                    }
                });
                break;
            case "DateTime":
                template = new Text({
                    text: {
                        path: template,
                        type: "sap.ui.model.type.DateTime",
                        formatOptions: {
                            style: "long"
                        }
                    }
                });
                break;
            case "Time":
                template = new Text({
                    text: {
                        type: "sap.ui.model.type.Time",
                        formatOptions: {
                            relative: true,
                            relativeScale: "auto"
                        }
                    }
                });
                break;
            case "Decimal":
                hAlign = HorizontalAlign.End;
                break;
            default:
                break;
        }
        return new Column({
            label: new Text({
                text:
                    columnMetadataInfo.shortDescription ||
                    columnMetadataInfo.mediumDescription ||
                    columnMetadataInfo.longDescription ||
                    columnMetadataInfo.name,
                tooltip: columnMetadataInfo.name,
                wrapping: false
            }),
            hAlign,
            width: width,
            template,
            sortProperty: columnMetadataInfo.name,
            showSortMenuEntry: true
        });
    }
}
