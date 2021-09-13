import models from "../model/models";
import BaseController from "./BaseController";
import EntityService from "../service/EntityService";
import { EntityType } from "../model/ServiceModel";
import SmartVariantManagementConnector from "../helper/variants/SmartVariantManagementConnector";

import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import Table from "sap/m/Table";
import Control from "sap/ui/core/Control";
import Input from "sap/m/Input";
import SmartVariantManagementUi2 from "sap/ui/comp/smartvariants/SmartVariantManagementUi2";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";

type ViewModelType = {
    currentEntity: {
        name: string;
    };
    selectedEntityType: EntityType;
};

/**
 * Main Page controller
 *
 * @namespace com.devepos.qdrt.controller
 */
export default class MainPageController extends BaseController {
    private _searchService: EntityService;
    private _viewModel: JSONModel;
    private _nameFilter: Input;
    private _dataModel: JSONModel;
    private _viewModelData: ViewModelType;

    onInit(): void {
        super.onInit();
        this._searchService = new EntityService();
        this._viewModelData = { currentEntity: { name: "" }, selectedEntityType: EntityType.All };
        this._viewModel = models.createViewModel(this._viewModelData);
        this.getView().setModel(this._viewModel, "ui");

        this._dataModel = models.createViewModel({ foundEntities: [] });
        this.getView().setModel(this._dataModel);

        new SmartVariantManagementConnector(
            this.byId("filterbar") as FilterBar,
            this.byId("variantManagement") as SmartVariantManagementUi2
        ).connectFilterBar();

        // get controls from filter bar
        this._nameFilter = this.byId("nameFilterCtrl") as Input;
        this._nameFilter.attachChange(
            null,
            () => {
                this.onSearch();
            },
            this
        );
        this._nameFilter.attachSubmit(
            null,
            () => {
                this.onSearch();
            },
            this
        );
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

        const filterTable = this.getView().byId("foundEntitiesTable") as Table;

        filterTable.setBusy(true);

        const entities = await this._searchService.findEntities(filterValue, this._viewModelData.selectedEntityType);
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
