import models from "../model/models";
import BaseController from "./BaseController";
import EntitySearchService from "../model/dataAccess/rest/EntitySearchService";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import Table from "sap/m/Table";
import Control from "sap/ui/core/Control";
import { EntityType } from "../model/ServiceModel";

/**
 * Main Page controller
 *
 * @namespace devepos.qdrt.controller
 */
export default class MainPageController extends BaseController {
    _searchService: EntitySearchService;
    _viewModel: JSONModel;
    _dataModel: JSONModel;

    onInit(): void {
        super.onInit();
        this._searchService = new EntitySearchService();
        this._viewModel = models.createViewModel({ currentEntity: { name: "" } });
        this.getView().setModel(this._viewModel, "ui");

        this._dataModel = models.createViewModel({ foundEntities: [] });
        this.getView().setModel(this._dataModel);
        this.onSearchForEntities(new Event("", null, { query: "demo*" }));
    }

    /**
     * Event handler for click on database entity
     * @param {Object} event event object
     */
    onOpenEntity(event: Event): void {
        const selectedEntity = this._dataModel.getObject((event.getSource() as Control).getBindingContext().getPath());
        if (selectedEntity) {
            this.router.navTo("entity", {
                type: encodeURIComponent(selectedEntity.type),
                name: encodeURIComponent(selectedEntity.name)
            });
        }
    }
    onToggleFavorite(event: Event): void {
        const selectedPath = (event.getSource() as Control)?.getBindingContext()?.getPath();
        const selectedEntity = this._dataModel.getObject(selectedPath);
        if (selectedEntity) {
            if (selectedEntity?.isFavorite) {
                selectedEntity.isFavorite = false;
            } else {
                selectedEntity.isFavorite = true;
            }
            this._dataModel.setProperty(`${selectedPath}/isFavorite`, selectedEntity.isFavorite);
        }
    }

    async onSearchForEntities(event: Event): Promise<void> {
        const filterValue = event.getParameter("query");
        if (!filterValue) {
            return;
        }

        const filterTable = this.getView().byId("foundEntitiesTable") as Table;

        filterTable.setBusy(true);

        const entities = await this._searchService.searchDbEntities(filterValue);
        filterTable.setBusy(false);

        if (entities) {
            const bundle = this.getResourceBundle();
            for (const entity of entities) {
                if (entity.type) {
                    switch (entity.type) {
                        case EntityType.CdsView:
                            entity.typeIcon = "sap-icon://customer-view";
                            entity.typeTooltip = bundle.getText("dbEntity_type_cds");
                            break;
                        case EntityType.Table:
                            entity.typeIcon = "sap-icon://grid";
                            entity.typeTooltip = bundle.getText("dbEntity_type_table");
                            break;
                        case EntityType.View:
                            entity.typeIcon = "sap-icon://table-view";
                            entity.typeTooltip = bundle.getText("dbEntity_type_view");
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        this._dataModel.setProperty("/foundEntities", entities?.length > 0 ? entities : 0);
    }
}
