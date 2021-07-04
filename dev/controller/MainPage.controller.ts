import models from "../model/models";
import BaseController from "./BaseController";
import EntityService from "../service/EntityService";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import Table from "sap/m/Table";
import Control from "sap/ui/core/Control";
import { EntityType } from "../model/ServiceModel";
import MultiInput from "sap/m/MultiInput";

/**
 * Main Page controller
 *
 * @namespace devepos.qdrt.controller
 */
export default class MainPageController extends BaseController {
    private _searchService: EntityService;
    private _viewModel: JSONModel;
    private _nameFilter: MultiInput;
    private _dataModel: JSONModel;

    onInit(): void {
        super.onInit();
        this._searchService = new EntityService();
        this._viewModel = models.createViewModel({ currentEntity: { name: "" } });
        this.getView().setModel(this._viewModel, "ui");

        this._dataModel = models.createViewModel({ foundEntities: [] });
        this.getView().setModel(this._dataModel);

        // get controls from filter bar
        this._nameFilter = this.byId("nameFilterCtrl") as MultiInput;
        this._nameFilter.attachSubmit(
            null,
            (event: Event) => {
                this.onSearch();
            },
            this
        );

        // trigger dummy search
        this._nameFilter.setValue("demo*");
        this._nameFilter.fireSubmit();
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

    async onSearch(): Promise<void> {
        const filterValue = this._nameFilter.getValue();
        if (!filterValue) {
            return;
        }

        const filterTable = this.getView().byId("foundEntitiesTable") as Table;

        filterTable.setBusy(true);

        const entities = await this._searchService.findEntities(filterValue);
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
