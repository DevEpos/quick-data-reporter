import QuickFilter from "./QuickFilter";
import StateRegistry from "../state/StateRegistry";
import AddQuickFiltersPopover, { SelectedField } from "../helper/AddQuickFilterPopover";
import ValueHelpFactory from "../helper/valuehelp/ValueHelpFactory";
import { FieldMetadata, ValueHelpType } from "../model/ServiceModel";
import { TableFilters } from "../model/Entity";
import models from "../model/models";

import Panel from "sap/m/Panel";
import ScrollContainer from "sap/m/ScrollContainer";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Button from "sap/m/Button";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import Title from "sap/m/Title";
import VerticalLayout from "sap/ui/layout/VerticalLayout";
import { ButtonType } from "sap/m/library";
import jQuery from "sap/ui/thirdparty/jquery";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import Input from "sap/m/Input";
import MultiInput from "sap/m/MultiInput";
import Token from "sap/m/Token";
import isEmptyObject from "sap/base/util/isEmptyObject";
import Log from "sap/base/Log";
import ToggleButton from "sap/m/ToggleButton";
import JSONModel from "sap/ui/model/json/JSONModel";
import ValueHelpService from "../service/ValueHelpService";

const PANEL_HEIGHT = "100%";

enum FilterCategory {
    Filters = "filters",
    Parameters = "parameters"
}

type UIModelData = {
    emptyFiltersHidden: boolean;
};
/**
 * FilterBar with vertical orientation
 *
 * @namespace com.devepos.qdrt.control
 */
export default class SideFilterPanel extends Panel {
    metadata = {
        properties: {
            /**
             * Array with all metadata of all available filters
             */
            availableFilterMetadata: { type: "object", group: "Misc" },
            /**
             * Map with all visible filters
             */
            visibleFilters: { type: "object", group: "Misc" },
            /**
             * Describes the category of the contained filters.
             * Possible values are "filters" or "parameters"
             */
            filterCategory: { type: "string", group: "Misc", defaultValue: "filters" }
        },
        aggregations: {},
        events: {}
    };
    /**
     * Currently no custom renderer is needed
     */
    renderer = "sap.m.PanelRenderer";

    private _filterContainer: VerticalLayout;
    private _scrollContainer: ScrollContainer;
    private _filtersUpdated = false;
    private _uiModelData: UIModelData;
    private _uiModel: JSONModel;
    private _vhService: ValueHelpService;

    //#region methods generated by ui5 library for metadata
    getUseToolbar?(): boolean;
    getAvailableFilterMetadata?(): FieldMetadata[];
    getVisibleFilters?(): TableFilters;
    getFilterCategory?(): string;
    //#endregion

    init(): void {
        Panel.prototype.init.call(this);
        this._uiModelData = { emptyFiltersHidden: false };
        this._uiModel = models.createViewModel(this._uiModelData);
        this.setModel(this._uiModel, "ui");
    }
    applySettings(settings: object, scope?: object): this {
        super.applySettings(settings, scope);
        if (!this.getExpandable()) {
            this.setHeight(PANEL_HEIGHT);
        } else {
            this._setHeightForExpandablePanel(this.getExpanded());
        }
        return this;
    }
    onAfterRendering(event: jQuery.Event): void {
        Panel.prototype.onAfterRendering.call(this, event);
        // do custom afterRendering
        if (!this.getExpandable()) {
            this._updateDomHeight();
        }
    }
    onBeforeRendering(event: jQuery.Event): void {
        // do custom beforeRendering
        if (!this._filterContainer) {
            this._createPanelContent();
        }
        if (this._filtersUpdated) {
            this._updateFilters(this.getVisibleFilters());
            this._filtersUpdated = false;
        }
        Panel.prototype.onBeforeRendering.call(this, event);
    }
    setExpanded(expanded: boolean): this {
        super.setExpanded(expanded);
        this._setHeightForExpandablePanel(expanded);
        return this;
    }
    setVisibleFilters(filters: TableFilters): this {
        this.setProperty("visibleFilters", filters);
        if (!this._filterContainer) {
            this._filtersUpdated = true;
            return this;
        }
        this._updateFilters(filters);
        return this;
    }

    exit(): void {
        Panel.prototype.exit.call(this);
    }

    private _updateDomHeight(): void {
        const domRef = this.getDomRef() as HTMLElement;
        if (domRef) {
            const currentHeight = this.$().css("height");
            const newHeight = `calc(${PANEL_HEIGHT} - ${(domRef as HTMLElement).offsetTop}px)`;
            if (currentHeight !== newHeight) {
                this.$().css("height", newHeight);
            }
        }
    }

    private _setHeightForExpandablePanel(expanded: boolean) {
        this.setHeight(expanded ? PANEL_HEIGHT : "");
        /*
         * Forcefully overwrite only the panel height via applying a style class
         * Panel#setHeight() also adjusts the height of the panel-content div with the same height which
         * is results in a too small height for the container on som UI5 releases (e.g. 1.71)
         */
        this.toggleStyleClass("deveposQdrt-SideFilterPanel--reducedHeight", expanded);
    }

    private _createPanelContent() {
        this._filterContainer = new VerticalLayout({
            width: "100%"
        });
        this._filterContainer.addStyleClass("deveposQdrt-SideFilterPanel__Container");
        this._scrollContainer = new ScrollContainer({
            content: this._filterContainer,
            width: "100%",
            height: "100%",
            horizontal: false,
            vertical: true
        });
        const headerToolbar = new OverflowToolbar({
            content: [new Title({ text: this.getHeaderText() }), new ToolbarSpacer()]
        });
        const filtersCategory = this.getFilterCategory();
        if (filtersCategory === FilterCategory.Filters) {
            headerToolbar.addContent(
                new Button({
                    icon: "sap-icon://add",
                    tooltip: "{i18n>entity_sideFilterPanel_newFilter}",
                    type: ButtonType.Transparent,
                    press: this._addNewFilter.bind(this)
                })
            );
            headerToolbar.addContent(
                new ToggleButton({
                    icon: "sap-icon://hide",
                    tooltip: "{i18n>entity_sideFilterPanel_hideEmpty_tooltip}",
                    type: ButtonType.Transparent,
                    pressed: { path: "ui>/emptyFiltersHidden" },
                    press: this._toggleFilterVisibility.bind(this)
                })
            );
        }
        headerToolbar.addContent(
            new Button({
                icon: "sap-icon://clear-filter",
                tooltip: "{i18n>entity_sideFilterPanel_clearFilterValues}",
                type: ButtonType.Transparent,
                press: this._clearExistingFilters.bind(this)
            })
        );
        if (filtersCategory === FilterCategory.Filters) {
            headerToolbar.addContent(
                new Button({
                    icon: "sap-icon://delete",
                    tooltip: "{i18n>entity_sideFilterPanel_deleteAllFilters}",
                    type: ButtonType.Transparent,
                    press: () => {
                        this.setVisibleFilters({});
                    }
                })
            );
        }
        this.setHeaderToolbar(headerToolbar);
        this.addContent(this._scrollContainer);
    }
    private _updateFilters(filters: TableFilters) {
        this._filterContainer.removeAllContent();
        if (!filters || isEmptyObject(filters)) {
            return;
        }

        const fieldMetadataList = this.getAvailableFilterMetadata();
        if (!fieldMetadataList || fieldMetadataList.length === 0) {
            return;
        }

        // create the quick filter instances for the given filters
        for (const filterName in filters) {
            // find the metadata for the filter field
            const fieldMetadata = fieldMetadataList.find(f => f.name === filterName);
            if (!fieldMetadata) {
                Log.error(`Metadata for filter ${filterName} was not found in property 'availableFilterMetadata`);
                return;
            }
            // create the filter control
            const quickFilter = this._createQuickFilter({
                name: filterName,
                label:
                    fieldMetadata.description === fieldMetadata.name
                        ? fieldMetadata.name
                        : `${fieldMetadata.description} (${fieldMetadata.name})`,
                tooltip: fieldMetadata.tooltip,
                fieldMetadata: fieldMetadata
            });
            this._filterContainer.addContent(quickFilter);
        }
    }
    private async _addNewFilter(event: Event) {
        const visibleFilters = this.getVisibleFilters();
        const addFiltersPopover = new AddQuickFiltersPopover(
            this.getAvailableFilterMetadata().filter(filterMeta => !visibleFilters.hasOwnProperty(filterMeta.name))
        );
        const selectedFilters = await addFiltersPopover.showPopover(event.getSource() as Control);
        if (selectedFilters?.length > 0) {
            for (const selectedFilter of selectedFilters) {
                visibleFilters[selectedFilter.name] = {};
                this._filterContainer.addContent(this._createQuickFilter(selectedFilter));
            }
        }
    }
    private _toggleFilterVisibility() {
        const quickFilters = this._filterContainer.getContent() as QuickFilter[];
        if (!quickFilters?.length) {
            return;
        }
        for (const quickFilter of quickFilters) {
            if (this._uiModelData.emptyFiltersHidden) {
                quickFilter.setVisible(quickFilter.hasValues());
            } else {
                quickFilter.setVisible(true);
            }
        }
    }
    private _createQuickFilter(filter: SelectedField) {
        const filterCategory = this.getFilterCategory();
        return new QuickFilter({
            columnName: filter.name,
            label: filter.label,
            type: filter.fieldMetadata.type,
            tooltip: filter.tooltip,
            required: filterCategory === FilterCategory.Parameters,
            deletable: filterCategory === FilterCategory.Filters,
            singleValueOnly: filterCategory === FilterCategory.Parameters,
            referenceFieldMetadata: filter.fieldMetadata,
            filterData: `{${this.getBinding("visibleFilters").getPath()}/${filter.name}}`,
            remove: (event: Event) => {
                delete this.getVisibleFilters()[(event.getSource() as QuickFilter).getColumnName()];
            },
            valueHelpRequest: this._onValueHelpRequest.bind(this)
        });
    }

    private _clearExistingFilters() {
        for (const quickFilter of this._filterContainer.getContent()) {
            (quickFilter as QuickFilter).clear();
        }
    }

    private async _onValueHelpRequest(event: Event) {
        let existingTokens: Token[];
        const quickFilter = event.getSource() as QuickFilter;
        const filterControl = quickFilter.getFilterControl() as Input;
        const entityState = StateRegistry.getEntityState();

        if (filterControl instanceof MultiInput) {
            existingTokens = filterControl.getTokens();
        }

        // Get the value help metadata information for the filter field
        quickFilter.setBusy(true);
        const vhMetadata = await entityState.getFieldValueHelpInfo(
            quickFilter.getColumnName(),
            this.getFilterCategory() === FilterCategory.Parameters
        );
        quickFilter.setBusy(false);
        const vhDialog = ValueHelpFactory.getInstance().createValueHelpDialog(
            vhMetadata,
            filterControl,
            !quickFilter.getSingleValueOnly(),
            null,
            existingTokens
        );
        if (vhMetadata?.type === ValueHelpType.CollectiveDDICSearchHelp) {
            if (!this._vhService) {
                this._vhService = new ValueHelpService();
            }
            vhDialog.setValueHelpMetadataLoader((vhName, vhType) => {
                return this._vhService.getValueHelpMetadata(vhName, vhType);
            });
        }
        const vhResult = await vhDialog.showDialog();
        if (!vhResult.cancelled) {
            if (quickFilter.getSingleValueOnly()) {
                quickFilter.setValue(vhResult.tokens[0].getKey());
            } else {
                quickFilter.setTokens(vhResult.tokens);
            }
        }
    }
}
