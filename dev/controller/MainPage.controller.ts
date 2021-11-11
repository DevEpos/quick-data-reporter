import models from "../model/models";
import BaseController from "./BaseController";
import EntityService from "../service/EntityService";
import { DbEntity, EntitySearchScope, EntityType, PagingParams } from "../model/types";
import SmartVariantManagementConnector from "../helper/variants/SmartVariantManagementConnector";
import { entityTypeIconFormatter, entityTypeTooltipFormatter } from "../model/formatter";
import AjaxJSONModel from "../model/AjaxJSONModel";

import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import Table from "sap/m/Table";
import Control from "sap/ui/core/Control";
import SmartVariantManagementUi2 from "sap/ui/comp/smartvariants/SmartVariantManagementUi2";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import Log from "sap/base/Log";
import formatMessage from "sap/base/strings/formatMessage";
import Binding from "sap/ui/model/Binding";
import Fragment from "sap/ui/core/Fragment";

const FOUND_ENTITIES_PATH = "/foundEntities";

type ViewModelType = {
    nameFilter: string;
    descriptionFilter: string;
    selectedEntityType: EntityType;
    selectedSearchScope: EntitySearchScope;
};

/**
 * Main Page controller
 *
 * @namespace com.devepos.qdrt.controller
 */
export default class MainPageController extends BaseController {
    entityTypeIconFormatter = entityTypeIconFormatter;
    entityTypeTooltipFormatter = entityTypeTooltipFormatter;
    formatMessage = formatMessage;
    private _entitiesTable: Table;
    private _entityService: EntityService;
    private _viewModel: JSONModel;
    private _dataModel: AjaxJSONModel;
    private _viewModelData: ViewModelType;
    private _variantMgmnt: SmartVariantManagementUi2;

    onInit(): void {
        super.onInit();
        this._entityService = new EntityService();
        this._viewModelData = {
            nameFilter: "",
            descriptionFilter: "",
            selectedEntityType: EntityType.All,
            selectedSearchScope: EntitySearchScope.All
        };
        this._viewModel = models.createViewModel(this._viewModelData);
        this.getView().setModel(this._viewModel, "ui");

        this._dataModel = new AjaxJSONModel({ foundEntities: [] });
        this._dataModel.setDataProvider(FOUND_ENTITIES_PATH, {
            getData: (startIndex, length, determineLength) => {
                const pagingParams = {
                    $top: length,
                    $skip: startIndex
                } as PagingParams;
                if (determineLength) {
                    pagingParams.$count = true;
                }
                return this._entityService.findEntities(
                    this._viewModelData.nameFilter,
                    this._viewModelData.descriptionFilter,
                    this._viewModelData.selectedEntityType,
                    this._viewModelData.selectedSearchScope,
                    pagingParams
                );
            }
        });
        this._entitiesTable = this.getView().byId("foundEntitiesTable") as Table;
        this.getView().setModel(this._dataModel);

        this._variantMgmnt = this.byId("variantManagement") as SmartVariantManagementUi2;
        new SmartVariantManagementConnector(this.byId("filterbar") as FilterBar, this._variantMgmnt).connectFilterBar();
    }

    _onEntityNavPress(event: Event): void {
        const selectedEntity = this._dataModel.getObject((event.getSource() as Control).getBindingContext().getPath());
        this._navToEntity(selectedEntity);
    }

    /**
     * Set variant to modified if a filter changes
     */
    _onFilterChange(): void {
        this._variantMgmnt?.currentVariantSetModified(true);
    }

    async _onToggleFavorite(event: Event): Promise<void> {
        const selectedPath = (event.getSource() as Control)?.getBindingContext()?.getPath();
        const selectedEntity = this._dataModel.getObject(selectedPath) as DbEntity;
        if (selectedEntity) {
            try {
                if (selectedEntity?.isFavorite) {
                    await this._entityService.deleteFavorite(selectedEntity.name, selectedEntity.type);
                    selectedEntity.isFavorite = false;
                } else {
                    await this._entityService.createFavorite(selectedEntity.name, selectedEntity.type);
                    selectedEntity.isFavorite = true;
                }
                this._dataModel.updateBindings(false);
            } catch (reqError) {
                Log.error(`Error during favorite handling`, (reqError as any).error?.message || reqError);
            }
        }
    }

    async _onSearch(): Promise<void> {
        const itemsBinding = this._entitiesTable.getBinding("items") as Binding<any>;
        if (!itemsBinding) {
            const colItemTemplate = await Fragment.load({
                id: this.getView().getId(),
                name: "com.devepos.qdrt.fragment.MainTableItemsTemplate",
                controller: this
            });
            this.getView().addDependent(colItemTemplate);
            this._entitiesTable.bindItems({
                path: FOUND_ENTITIES_PATH,
                template: colItemTemplate
            });
        } else {
            this._dataModel.refreshListPath(FOUND_ENTITIES_PATH);
        }
    }
    private _navToEntity(entity: DbEntity) {
        if (entity) {
            this.router.navTo("entity", {
                type: encodeURIComponent(entity.type),
                name: encodeURIComponent(entity.name)
            });
        }
    }
}
