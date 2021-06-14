import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import EntitySearchService from "../model/dataAccess/rest/EntitySearchService";

const VIEW_MODEL = "viewModel";

/**
 * Main Page controller
 *
 * @namespace devepos.qdrt.controller
 */
export default class MainPageController extends BaseController {
    onInit() {
        BaseController.prototype.onInit.call(this);
        this._searchService = new EntitySearchService();
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

    /**
     * Event handler for click on database entity
     * @param {Object} event event object
     */
    onOpenEntity(event) {
        const selectedEntity = this._viewModel.getObject(event.getSource().getBindingContextPath());
        if (selectedEntity) {
            this.router.navTo("entity", {
                type: encodeURIComponent(selectedEntity.type),
                name: encodeURIComponent(selectedEntity.name)
            });
        }
    }

    async onSearchForEntities(event) {
        const filterValue = event.getParameter("query");
        if (!filterValue) {
            return;
        }

        const filterTable = this.getView().byId("foundEntitiesTable");

        filterTable.setBusy(true);

        const entities = await this._searchService.searchDbEntities(filterValue);
        filterTable.setBusy(false);

        if (entities) {
            const bundle = this.getResourceBundle();
            for (const entity of entities) {
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
            this._viewModel.setProperty("/foundEntities", entities);
        } else {
            this._viewModel.setProperty("/foundEntities", []);
        }
    }
}
