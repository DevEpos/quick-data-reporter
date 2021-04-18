import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import AjaxUtil from "../util/ajaxUtil";

const VIEW_MODEL = "viewModel";
const ANALYSIS_FILTER_PREFIX = "ANL:";

/**
 * Main Page controller
 *
 * @namespace devepos.qdrt.controller
 */
export default class MainPageController extends BaseController {
    onInit() {
        this._openEntityMap = new Map();
        this._viewModel = new JSONModel({ currentEntity: { name: "" } });
        this.setModel(this._viewModel, VIEW_MODEL);
        this.onSearchForEntities({
            mParams: {
                query: "demo*"
            },
            getParameter(id) {
                return this.mParams[id];
            }
        });
    }

    onEntitySelect(event) {
        const entityKey = event.getParameter("key");
    }

    async onSearchForEntities(event) {
        const filterValue = event.getParameter("query");
        if (!filterValue) {
            return;
        }

        const filterTable = this.getView().byId("foundEntitiesTable");

        filterTable.setBusy(true);
        const response = await AjaxUtil.fetch(
            {
                url: `/sap/zqdrtrest/entities/vh?$top=50&filter=${filterValue}`
            },
            true
        );
        filterTable.setBusy(false);

        if (response.status === 200) {
            const bundle = this.getResourceBundle();
            for (const entity of response.data) {
                if (entity.type) {
                    switch (entity.type) {
                        case "C":
                            entity.typeIcon = "sap-icon://customer-view";
                            entity.typeTooltip = bundle.getText("dbEntity_type_cds");
                            break;
                        case "T":
                            entity.typeIcon = "sap-icon://grid";
                            entity.typeTooltip = bundle.getText("dbEntity_type_table");
                            break;
                        case "V":
                            entity.typeIcon = "sap-icon://table-view";
                            entity.typeTooltip = bundle.getText("dbEntity_type_view");
                            break;
                        default:
                            break;
                    }
                }
            }
            this._viewModel.setProperty("/foundEntities", response.data);
        } else {
            this._viewModel.setProperty("/foundEntities", []);
        }
    }
}
