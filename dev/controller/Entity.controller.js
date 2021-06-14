import BaseController from "./BaseController";
import DataPreviewService from "../model/dataAccess/rest/DataPreviewService";
import EntityMetadataService from "../model/dataAccess/rest/EntityMetadataService";
import models from "../model/models";
import Column from "sap/ui/table/Column";
import Text from "sap/m/Text";
import Fragment from "sap/ui/core/Fragment";

/**
 * Controller for a single database entity
 *
 * @alias devepos.qdrt.controller.Entity
 */
export default class EntityController extends BaseController {
    /**
     * Initializes entity controller
     *
     */
    onInit() {
        BaseController.prototype.onInit.call(this);
        this._uiModel = models.createViewModel({
            sideContentVisible: true
        });
        this._dataModel = models.createViewModel({
            entity: {},
            rows: [],
            columnMetadata: [],
            p13n: {
                columnsItems: []
            }
        });
        this._dataPreviewTable = this.getView().byId("dataPreviewTable");
        this._previewService = new DataPreviewService();
        this._metadataService = new EntityMetadataService();
        this.getView().setModel(this._dataModel);
        this.getView().setModel(this._uiModel, "ui");
        this.router.getRoute("entity").attachPatternMatched(this._onEntityMatched, this);
    }

    async _onEntityMatched(event) {
        const args = event.getParameter("arguments");
        const dataModelData = this._dataModel.getData();
        const entityInfo = {
            type: decodeURIComponent(args.type),
            name: decodeURIComponent(args.name)
        };
        this._dataModel.setProperty("/entity", entityInfo);
        this._dataPreviewTable.setBusy(true);
        try {
            const entityMetadata = await this._metadataService.getMetadata(entityInfo.type, entityInfo.name);
            if (entityMetadata?.colMetadata) {
                // fill p13n tables from columns
                for (const colMeta of entityMetadata?.colMetadata) {
                    dataModelData.p13n.columnsItems.push({
                        columnKey: colMeta.name,
                        visible: true
                    });
                }
                dataModelData.columnMetadata = entityMetadata?.colMetadata;
            }
        } catch (reqError) {}
        this._dataModel.updateBindings();
        this._dataPreviewTable.setBusy(false);
    }
    /**
     * Handles entity settings event
     * @param {Object} event  event object
     */
    async onTableSettings(event) {
        const view = this.getView();

        if (!this._personalizationDialog) {
            this._personalizationDialog = await Fragment.load({
                id: view.getId(),
                name: "devepos.qdrt.fragment.PersDialog",
                controller: this
            });
        }
        view.addDependent(this._personalizationDialog);
        this._personalizationDialog.setModel(this._dataModel);
        // this._dataModel.setProperty("/ShowResetEnabled", this._isChangedColumnsItems());
        // this.oDataBeforeOpen = deepExtend({}, this.oJSONModel.getData());
        this._personalizationDialog.open();
    }
    /**
     * Creates columns
     * @param {String} id the id of the column
     * @param {sap.ui.model.ContextBinding} context the context binding of the column
     * @returns
     */
    columnsFactory(id, context) {
        this._dataPreviewTable.autoRes;
        const columnName = context.getProperty("name");
        const shortDescr = context.getProperty("shortDescription");
        const mediumDescr = context.getProperty("mediumDescription");
        const longDescr = context.getProperty("longDescription");
        const length = context.getProperty("length");
        const dataType = context.getProperty("type");
        let width = "5rem";
        if (length > 50) {
            width = "15rem";
        } else if (length > 9) {
            width = "15rem";
        }

        let template = columnName;
        let hAlign = "Begin";
        switch (dataType) {
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
                hAlign = "End";
            default:
                break;
        }
        return new Column({
            label: new Text({
                text: shortDescr || mediumDescr || longDescr || columnName,
                tooltip: columnName,
                wrapping: false
            }),
            hAlign,
            width: width,
            template
        });
    }
}
