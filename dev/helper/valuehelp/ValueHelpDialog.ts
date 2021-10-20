import { FilterCond, ValueHelpField, ValueHelpMetadata, ValueHelpType } from "../../model/ServiceModel";
import ValueHelpModel from "./ValueHelpModel";
import { SimpleBindingParams } from "../../model/types";
import FormatUtil from "../FormatUtil";
import I18nUtil from "../I18nUtil";
import FilterOperatorConfigurations from "../filter/FilterOperatorConfigurations";

import BaseObject from "sap/ui/base/Object";
import ValueHelpDialogSAP from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import FilterOperator from "sap/ui/model/FilterOperator";
import SearchField from "sap/m/SearchField";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import Event from "sap/ui/base/Event";
import Table from "sap/ui/table/Table";
import Token from "sap/m/Token";
import DateType from "sap/ui/model/type/Date";
import Log from "sap/base/Log";
import { smartfilterbar, valuehelpdialog } from "sap/ui/comp/library";
import List from "sap/m/List";
import { ListMode, PlacementType } from "sap/m/library";
import ResponsivePopover from "sap/m/ResponsivePopover";
import StandardListItem from "sap/m/StandardListItem";
import CustomData from "sap/ui/core/CustomData";
import Control from "sap/ui/core/Control";
import TypeUtil from "../../model/TypeUtil";

interface TableColumnConfig {
    label: string;
    template: string;
    tooltip: string;
    sort: string;
    sorted: boolean;
    sortOrder: "Ascending" | "Descending";
    oType?: any;
    /**
     * Width in css style, e.g. 9em
     */
    width?: string;
}

export type ValueHelpResult = {
    cancelled: boolean;
    tokens?: Token[];
};

export type ValueHelpFilterValues = Record<string, any>;

export interface ValueHelpDialogSettings {
    /**
     * Input Field reference
     */
    inputField?: Input;
    /**
     * Metadata for Table/Tokens/Filters of {@link sap.ui.comp.valuehelpdialog.ValueHelpDialog}
     */
    valueHelpMetadata: ValueHelpMetadata;
    /**
     * Marks whether the basic search field should be visible in the filter bar
     */
    basisSearchEnabled?: boolean;
    /**
     * If <code>true</code> multiple selection is enabled
     */
    multipleSelection?: boolean;
    /**
     * If <code>true</code> the ranges tab will be shown as well
     */
    supportRanges?: boolean;
    /**
     * If <code>true</code> only the ranges tab will be visible
     */
    supportRangesOnly?: boolean;
    /**
     * If <code>true</code> the values should be loaded immediately after the dialog
     * opens
     */
    loadDataAtOpen?: boolean;
    /**
     * Map of optional initial filter values
     */
    initialFilters?: ValueHelpFilterValues;
    /**
     * Optional array of tokens
     */
    initialTokens?: Token[];
}

export type ValueHelpMetadataLoader = (vhName: string, vhType: ValueHelpType) => Promise<ValueHelpMetadata>;

/**
 * Util for calling a value help dialog
 *
 */
export default class ValueHelpDialog extends BaseObject {
    //#region properties
    private _vhModel: ValueHelpModel;
    private _filterBar: FilterBar;
    private _table: Table;
    private _inputControl: Input;
    private _currentVhMetadata: ValueHelpMetadata;
    private _vhMetadata: ValueHelpMetadata;
    private _keyFieldConfig: ValueHelpField;
    private _fields: { key: string; label?: string }[] = [];
    private _dialogTitle: string;
    private _searchFocusField: string;
    private _multipleSelection: boolean;
    private _basicSearchEnabled: boolean;
    private _initialFilters: ValueHelpFilterValues;
    private _initialTokens: Token[];
    private _tokens: Token[] = [];
    private _loadDataAtOpen: boolean;
    private _columnModel = new JSONModel();
    private _dialog: ValueHelpDialogSAP;
    private _dialogPromise: { resolve: (result: ValueHelpResult) => void; reject: () => void };
    private _supportRanges: boolean;
    private _supportRangesOnly: boolean;
    private _columnsConfig: TableColumnConfig[] = [];
    private _filterItems: FilterGroupItem[] = [];
    private _collectiveVhPopover: ResponsivePopover;
    private _valueHelpMetadataLoader: ValueHelpMetadataLoader;
    //#endregion

    /**
     * Constructor for ValueHelpDialog
     * @param settings settings for the value help dialog
     */
    constructor(settings: ValueHelpDialogSettings) {
        super();
        this._inputControl = settings.inputField;
        this._vhMetadata = settings.valueHelpMetadata;
        this._updateCurrentVhMetadata();
        this._keyFieldConfig = this._currentVhMetadata.fields.find(
            fc => fc.name === this._currentVhMetadata.tokenKeyField
        );
        if (!this._keyFieldConfig) {
            throw Error(`No keyfield found with name '${this._currentVhMetadata.tokenKeyField}`);
        }
        this._dialogTitle =
            this._keyFieldConfig.description ||
            this._keyFieldConfig.mediumDescription ||
            this._keyFieldConfig.longDescription ||
            this._keyFieldConfig.name;
        this._multipleSelection = settings.multipleSelection || false;
        this._basicSearchEnabled = settings.basisSearchEnabled || false;
        this._initialFilters = settings.initialFilters || {};
        this._initialTokens = settings.initialTokens || [];
        this._searchFocusField = this._basicSearchEnabled ? this._keyFieldConfig.name : "";
        this._loadDataAtOpen = settings.loadDataAtOpen || false;
        this._supportRanges = settings.supportRanges || false;
        this._supportRangesOnly = settings.supportRangesOnly || false;
        this._vhModel = new ValueHelpModel(this._currentVhMetadata);
    }

    /**
     * Sets the callback function for loading value help metadata
     * @param metadataLoader callback function for loading value help metadata
     */
    setValueHelpMetadataLoader(metadataLoader: ValueHelpMetadataLoader): void {
        this._valueHelpMetadataLoader = metadataLoader;
    }

    /**
     * Opens the value help dialog for given bindingPath which will be
     * used to fill the result table
     *
     * @returns promise with dialog result
     */
    async showDialog(): Promise<ValueHelpResult> {
        this._dialog = null;
        this._processFieldConfiguration();
        this._columnModel.setData({
            cols: this._columnsConfig
        });
        this._createDialog();
        this._dialog.setModel(this._vhModel.getModel());
        this._dialog.setModel(this._columnModel, "columns");

        // adjust tokens which were created in quick filter
        for (const token of this._initialTokens) {
            if (token.data("range")?.__quickFilter) {
                token.data("range").keyField = this._keyFieldConfig.name;
                delete token.data("range").__quickFilter;
            }
        }
        this._dialog.setTokens(this._initialTokens);
        if (!this._supportRangesOnly) {
            this._createFilterBar();
            this._table = await this._dialog.getTableAsync();
            this._table.bindRows(this._vhModel.getVhResultBindingInfo());
            if (this._loadDataAtOpen) {
                this._loadData();
            }
            this._dialog.setFilterBar(this._filterBar);
        }
        const rangeKeyField = {
            key: this._keyFieldConfig.name,
            label: this._keyFieldConfig.description,
            type: TypeUtil.generalizeType(this._keyFieldConfig.type)?.toLowerCase(),
            formatSettings: {
                maxLength: this._keyFieldConfig.maxLength
            },
            precision: this._keyFieldConfig.precision,
            scale: this._keyFieldConfig.scale
        };
        this._dialog.setRangeKeyFields([rangeKeyField]);
        this._createControlsForCollectiveSearch();
        return new Promise((resolve, reject) => {
            // store promise callback functions
            this._dialogPromise = { resolve, reject };
            this._dialog.open();
            this._dialog.update();
        });
    }

    private _updateCurrentVhMetadata() {
        if (this._vhMetadata.type === ValueHelpType.CollectiveDDICSearchHelp) {
            this._currentVhMetadata = this._vhMetadata.includedValueHelps[0];
            this._currentVhMetadata.tokenKeyField = this._vhMetadata.tokenKeyField;
        } else {
            this._currentVhMetadata = this._vhMetadata;
        }
    }

    /**
     * Creates popover control to choose from a list of all included
     * search helps in a collective search help
     */
    private _createControlsForCollectiveSearch() {
        if (this._vhMetadata.type !== ValueHelpType.CollectiveDDICSearchHelp) {
            return;
        }
        const DATA_CHILD_VH = "_childVh";

        let childVhItem: StandardListItem = null;

        // Selection Controls
        const childVhList = new List({
            mode: ListMode.SingleSelectMaster,
            selectionChange: (evt: Event) => {
                const selectedChildVh = evt.getParameter("listItem");
                this._collectiveVhPopover.close();
                if (selectedChildVh) {
                    this._triggerChildVhChange(selectedChildVh.data(DATA_CHILD_VH));
                }
            }
        });

        this._collectiveVhPopover = new ResponsivePopover({
            placement: PlacementType.Bottom,
            showHeader: true,
            contentHeight: "30rem",
            title: I18nUtil.getText("vhDialog_collectiveSH_popover_title"),
            content: [childVhList],
            afterClose: () => {
                this._dialog._rotateSelectionButtonIcon(false);
            }
        });

        childVhItem = new StandardListItem({
            title: this._currentVhMetadata.description
        });
        childVhItem.data(DATA_CHILD_VH, this._currentVhMetadata);
        childVhList.addItem(childVhItem);
        childVhList.setSelectedItem(childVhItem);

        this._dialog.oSelectionTitle.setText(this._currentVhMetadata.description);
        this._dialog.oSelectionTitle.setTooltip(this._currentVhMetadata.description);
        for (const childVh of this._vhMetadata.includedValueHelps) {
            if (childVh.valueHelpName === this._currentVhMetadata.valueHelpName) {
                continue;
            }
            childVhItem = new StandardListItem({
                title: childVh.description
            });
            childVhItem.data(DATA_CHILD_VH, childVh);
            childVhList.addItem(childVhItem);
        }
        this._dialog.oSelectionButton.setVisible(true);
        this._dialog.oSelectionTitle.setVisible(true);
        this._dialog.oSelectionButton.attachPress(() => {
            if (!this._collectiveVhPopover.isOpen()) {
                this._dialog._rotateSelectionButtonIcon(true);
                this._collectiveVhPopover.openBy(this._dialog.oSelectionButton);
            } else {
                this._collectiveVhPopover.close();
            }
        });
    }
    private async _triggerChildVhChange(childVh: ValueHelpMetadata) {
        if (!childVh) {
            return;
        }
        this._dialog.oSelectionTitle.setText(childVh.description);
        this._dialog.oSelectionTitle.setTooltip(childVh.description);
        this._dialog.resetTableState();
        this._dialog.setBusy(true);
        // if full metadata of vh is not yet loaded do so now
        if (!childVh.fields?.length && this._valueHelpMetadataLoader) {
            try {
                const vhMetadata = await this._valueHelpMetadataLoader(childVh.valueHelpName, childVh.type);
                childVh.fields = vhMetadata?.fields;
                childVh.outputFields = vhMetadata?.outputFields;
                childVh.filterFields = vhMetadata?.filterFields;
            } catch (reqError) {
                // TODO: handle error correctly
                Log.error(
                    `VH metadata for '${childVh.valueHelpName}' could not be loaded`,
                    (reqError as any)?.error?.message || reqError
                );
            }
        }
        this._currentVhMetadata = childVh;
        this._vhModel.setVhMetadata(this._currentVhMetadata);
        this._updateControlsForCollectiveSearch();
        this._dialog.setBusy(false);
    }

    private _updateControlsForCollectiveSearch() {
        // clear current configuration
        this._fields.length = 0;
        this._columnsConfig.length = 0;
        this._filterItems.length = 0;

        if (this._filterBar) {
            (this._filterBar as any)._setCollectiveSearch(null);
            this._filterBar.destroy();
            this._filterBar = null;
        }

        this._processFieldConfiguration();
        this._createFilterBar();
        this._dialog.setFilterBar(this._filterBar);

        // update bindings and ui after columns were updated
        this._columnModel.updateBindings(false);
        this._table.bindRows(this._vhModel.getVhResultBindingInfo());
        this._dialog.update();
    }
    /**
     * Event Handler for when the Filter Bar was successfully initialized
     */
    private _onFilterBarInitialized() {
        for (const filterKey in this._initialFilters) {
            const filterControls = this._filterBar.getControlsByFieldGroupId(filterKey);
            if (filterControls?.length === 1 && filterControls[0] instanceof Input) {
                filterControls[0].setValue(this._initialFilters[filterKey]);
            }
        }
        if (this._basicSearchEnabled && this._inputControl) {
            const value = this._inputControl.getValue();
            const basicSearchId = this._filterBar.getBasicSearch();
            if (basicSearchId && value) {
                (sap.ui.getCore().byId(basicSearchId) as Input)?.setValue(value);
                this._filterBar.setFilterBarExpanded(false);
            }
        }
    }

    /**
     * Creates the value help dialog
     */
    private _createDialog() {
        let tokenDisplayBehaviour = "";
        let descriptionKey = this._currentVhMetadata.tokenDescriptionField;
        if (!descriptionKey || descriptionKey === "") {
            descriptionKey = this._currentVhMetadata.tokenKeyField;
            tokenDisplayBehaviour = smartfilterbar.DisplayBehaviour.idOnly;
        }
        this._dialog = new ValueHelpDialogSAP({
            title: this._dialogTitle,
            supportMultiselect: this._multipleSelection,
            basicSearchText: this._basicSearchEnabled && this._inputControl ? this._inputControl.getValue() : "",
            supportRanges: this._supportRanges,
            supportRangesOnly: this._supportRangesOnly,
            key: this._currentVhMetadata.tokenKeyField,
            displayFormat: this._keyFieldConfig.displayFormat ?? "",
            descriptionKey,
            tokenDisplayBehaviour,
            maxExcludeRanges: !this._multipleSelection ? "0" : "-1",
            maxIncludeRanges: !this._multipleSelection ? "1" : "-1",
            ok: (event: Event) => {
                this._tokens = event.getParameter("tokens") as Token[];
                this._dialog.close();
                this._dialogPromise.resolve({ cancelled: false, tokens: this._tokens || [] });
            },
            cancel: () => {
                this._dialog.close();
                this._dialogPromise.resolve({ cancelled: true });
            },
            afterClose: () => {
                this._dialog.destroy();
                this._dialog = null;
                this._collectiveVhPopover?.destroy();
                this._collectiveVhPopover = null;
            }
        });

        // enable enhanced exclude operations handling - the solution probably works
        // Option 1) Use the way which is used by Fiori Elements framework
        // if (this._dialog.getMetadata().hasProperty("_enhancedExcludeOperations")) {
        //     this._dialog.setProperty("_enhancedExcludeOperations", true);
        // }

        // Option 2) custom setting of exclude operations
        this._dialog.setExcludeRangeOperations(
            FilterOperatorConfigurations.getOperatorsForType(this._keyFieldConfig.type, true).getOperators(
                !(this._dialog as any)?._oOperationsHelper
            ) as valuehelpdialog.ValueHelpRangeOperation[],
            TypeUtil.generalizeType(this._keyFieldConfig.type)?.toLowerCase()
        );

        /* implement fix for token creation.
         * This is needed if the key column has values which are invalid URI components i.e. values which would
         *  throw an error if <code>decodeURIComponent</code> would be called for them
         */
        const _addRemoveTokenByKey = this._dialog._addRemoveTokenByKey;
        if (_addRemoveTokenByKey) {
            this._dialog._addRemoveTokenByKey = (key: string, row: any, add: boolean) => {
                _addRemoveTokenByKey.call(this._dialog, encodeURIComponent(key), row, add);
            };
        }
    }

    /**
     * Processes the given field configuration to create the
     * columns and the filters for the dialog
     */
    private _processFieldConfiguration() {
        const fieldsMap: Record<string, ValueHelpField> = {};
        for (const fieldConfig of this._currentVhMetadata.fields) {
            if (!fieldConfig.description) {
                fieldConfig.description =
                    fieldConfig.mediumDescription || fieldConfig.longDescription || fieldConfig.name;
            }
            fieldsMap[fieldConfig.name] = fieldConfig;
        }

        // 1) consider fields for filterbar
        for (const filterField of this._currentVhMetadata?.filterFields ?? []) {
            this._addFilterField(fieldsMap[filterField]);
        }

        // 2) consider output fields for table
        for (const outputField of this._currentVhMetadata.outputFields) {
            const fieldConfig = fieldsMap[outputField];
            const columnConfig = <TableColumnConfig>{
                label: fieldConfig.description,
                template: fieldConfig.name,
                tooltip: fieldConfig.description,
                width: FormatUtil.getWidth(fieldConfig, 15),
                sort: fieldConfig.name,
                sorted: fieldConfig.isKey || fieldConfig.name === this._keyFieldConfig.name,
                oType: fieldConfig.type === "Date" ? new DateType() : undefined,
                sortOrder: "Ascending"
            };
            this._columnsConfig.push(columnConfig);
            this._fields.push({ key: fieldConfig.name });
        }
    }

    /**
     * Adds the field to the list of visible filters of the
     * FilterBar
     *
     * @param fieldConfig data for filter field
     */
    private _addFilterField(fieldConfig: ValueHelpField): void {
        this._filterItems.push(
            new FilterGroupItem({
                groupName: "__BASIC",
                hiddenFilter: false,
                partOfCurrentVariant: true,
                visibleInFilterBar: true,
                name: fieldConfig.name,
                label: fieldConfig.description,
                control: new Input({ customData: new CustomData({ key: "fieldName", value: fieldConfig.name }) })
            })
        );
    }

    /**
     * Creates the filter bar for the valuehelp dialog
     */
    private _createFilterBar() {
        this._filterBar = new FilterBar({
            advancedMode: true,
            showClearOnFB: false,
            basicSearch: this._basicSearchEnabled
                ? new SearchField({
                      showSearchButton: true,
                      placeholder: "{i18n>vhDialog_searchField_placeholder}",
                      search: (event: Event) => {
                          const filters = [];
                          if (event.getParameter("query") && event.getParameter("query").length > 0) {
                              filters.push({
                                  columnKey: this._searchFocusField,
                                  operation: FilterOperator.Contains,
                                  value1: event.getParameter("query")
                              });
                          }
                          this._loadData({ filters });
                      }
                  })
                : null,
            filterGroupItems: this._filterItems,
            search: (event: Event) => {
                const filters: FilterCond[] = [];
                for (const selection of event.getParameter("selectionSet") as Control[]) {
                    if (selection instanceof Input) {
                        const value = selection.getValue();
                        if (value) {
                            filters.push({
                                keyField: selection.data("fieldName"),
                                operation: FilterOperator.Contains,
                                value1: value
                            });
                        }
                    }
                }
                this._loadData({ filters: filters });
            },
            initialized: this._onFilterBarInitialized.bind(this)
        });
    }

    /**
     * Update the row binding of the table
     * @param table an optional reference to the table
     * @param params optional parameters for the binding
     */
    private async _loadData(params?: SimpleBindingParams) {
        if (!this._dialog || !this._table) {
            return;
        }
        const useOverlay = this._table.getRows()?.length > 0;
        const setBusy = (busy: boolean, useOverlay: boolean) => {
            if (useOverlay) {
                this._table.setShowOverlay(busy);
            }
            this._table.setBusy(busy);
        };
        setBusy(true, useOverlay);
        try {
            await this._vhModel.fetchData(params);
        } catch (reqError) {
            Log.error("Value help data could not be loaded", (reqError as any)?.error?.message ?? reqError);
        }
        // Was the dialog closed in the meantime?
        if (this._dialog) {
            this._dialog.update();
            setBusy(false, useOverlay);
        }
    }
}
