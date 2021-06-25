import BaseController from "./BaseController";
import DataPreviewService from "../model/dataAccess/rest/DataPreviewService";
import EntityMetadataService from "../model/dataAccess/rest/EntityMetadataService";
import models from "../model/models";
import EntityTableSettings from "../helper/EntityTableSettings";
import Column from "sap/ui/table/Column";
import Text from "sap/m/Text";
import Table from "sap/ui/table/Table";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import { HorizontalAlign } from "sap/ui/core/library";
import Context from "sap/ui/model/Context";
import { IEntityColMetadata } from "../model/ServiceModel";
import Control from "sap/ui/core/Control";

/**
 * Controller for a single database entity
 *
 * @alias devepos.qdrt.controller.Entity
 */
export default class EntityController extends BaseController {
    private _uiModel: JSONModel;
    private _entityTableSettings: EntityTableSettings;
    private _dataModel: JSONModel;
    private _dataPreviewTable: Table;
    private _previewService: DataPreviewService;
    private _metadataService: EntityMetadataService;
    /**
     * Initializes entity controller
     *
     */
    onInit() {
        BaseController.prototype.onInit.call(this);
        this._uiModel = models.createViewModel({
            sideContentVisible: true
        });
        this._entityTableSettings = new EntityTableSettings(this.getView());
        this._dataModel = models.createViewModel({
            entity: {},
            rows: [],
            columnMetadata: []
        });
        this._dataPreviewTable = this.getView().byId("dataPreviewTable") as Table;
        this._previewService = new DataPreviewService();
        this._metadataService = new EntityMetadataService();
        this.getView().setModel(this._dataModel);
        this.getView().setModel(this._uiModel, "ui");
        this.router.getRoute("entity").attachPatternMatched(this._onEntityMatched, this);
        this.router.getRoute("main").attachPatternMatched(this._onMainMatched, this);
    }

    private _onMainMatched(event: Event) {
        if (this._entityTableSettings) {
            this._entityTableSettings.destroyDialog();
        }
        if (this._dataModel) {
            this._dataModel.setProperty("/", {
                entity: {},
                rows: [],
                columnsMetadata: []
            });
        }
    }
    private async _onEntityMatched(event: Event) {
        const args = event.getParameter("arguments");
        const dataModelData = this._dataModel.getData();
        const entityInfo = {
            type: decodeURIComponent(args.type),
            name: decodeURIComponent(args.name)
        };
        this._entityTableSettings.setEntityInfo(entityInfo.type, entityInfo.name);
        this._dataModel.setProperty("/entity", entityInfo);
        this._dataPreviewTable.setBusy(true);
        try {
            const entityMetadata = await this._metadataService.getMetadata(entityInfo.type, entityInfo.name);
            dataModelData.columnMetadata = entityMetadata?.colMetadata || [];
            this._entityTableSettings.setColumnMetadata(entityMetadata?.colMetadata);
        } catch (reqError) {
            // TODO: handle error
        }
        this._dataModel.updateBindings(false);
        this._dataPreviewTable.setBusy(false);
    }
    /**
     * Handles entity settings event
     */
    async onTableSettings() {
        this._entityTableSettings.showSettingsDialog();
    }
    /**
     * Event handler to trigger data update
     */
    async onUpdateData() {
        this._dataPreviewTable.setBusy(true);
        const { entity: entityInfo } = this._dataModel.getData();
        try {
            const selectionData = await this._previewService.getEntityData(entityInfo.type, entityInfo.name);
            if (selectionData) {
                this._dataModel.setProperty("/rows", selectionData.rows);
            }
        } catch (reqError) {
            // TODO: handle error
        }
        this._dataPreviewTable.setBusy(false);
    }
    /**
     * Creates columns
     * @param id the id of the column
     * @param context the context binding of the column
     * @returns the created column
     */
    columnsFactory(id: string, context: Context): Column {
        const columnMetadataInfo = context.getObject() as IEntityColMetadata;

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
            template
        });
    }
}
