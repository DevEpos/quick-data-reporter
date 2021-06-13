import BaseController from "./BaseController";
import Column from "sap/ui/table/Column";
import Text from "sap/m/Text";
import models from "../model/models";
import DataPreviewService from "../model/dataAccess/rest/DataPreviewService";

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
        this._viewModel = models.createViewModel({
            entity: {},
            sideContentVisible: true,
            data: {
                rows: [],
                columnMetadata: []
            }
        });
        this._dataPreviewTable = this.getView().byId("dataPreviewTable");
        this._previewService = new DataPreviewService();
        this.getView().setModel(this._viewModel, "vm");
        this.router.getRoute("entity").attachPatternMatched(this._onEntityMatched, this);
    }

    async _onEntityMatched(event) {
        const args = event.getParameter("arguments");
        this._viewModel.setProperty("/entity", {
            type: decodeURIComponent(args.type),
            name: decodeURIComponent(args.name)
        });
        const entity = this._viewModel.getData().entity;
        this._dataPreviewTable.setBusy(true);
        try {
            const response = await this._previewService.getEntityData(entity.type, entity.name);
            if (response?.status === 200) {
                this._viewModel.setProperty("/data/columnMetadata", response?.data?.columnMetadata);
                this._viewModel.setProperty("/data/rows", response?.data?.data);
            }
        } catch (reqError) {}
        this._dataPreviewTable.setBusy(false);
    }
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

        let template = `vm>${columnName}`;
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
