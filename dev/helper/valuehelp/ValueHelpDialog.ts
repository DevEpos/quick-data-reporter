import { FilterCond, ValueHelpField, ValueHelpMetadata } from "../../model/ServiceModel";
import ValueHelpModel from "./ValueHelpModel";
import { SimpleBindingParams } from "../../model/types";
import FormatUtil from "../FormatUtil";

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
     * Name of the key field
     */
    keyFieldName: string;
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
    private _vhDialogMetadata: ValueHelpMetadata;
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
    private _dialogPromise: { resolve: (tokens: Token[]) => void; reject: () => void };
    private _supportRanges: boolean;
    private _supportRangesOnly: boolean;
    private _columnsConfig: TableColumnConfig[] = [];
    private _filterItems: FilterGroupItem[] = [];
    //#endregion

    /**
     * Constructor for ValueHelpDialog
     * @param settings settings for the value help dialog
     */
    constructor(settings: ValueHelpDialogSettings) {
        super();
        this._inputControl = settings.inputField;
        this._vhDialogMetadata = settings.valueHelpMetadata;
        this._keyFieldConfig = this._vhDialogMetadata.fields.find(fc => fc.name === settings.keyFieldName);
        if (!this._keyFieldConfig) {
            throw Error(`No keyfield found with name '${settings.keyFieldName}`);
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
        this._vhModel = new ValueHelpModel(this._vhDialogMetadata);
    }

    /**
     * Opens the value help dialog for given bindingPath which will be
     * used to fill the result table
     *
     * @returns promise which will get resolved upon clicking ok
     */
    async showDialog(): Promise<Token[]> {
        this._dialog = null;
        this._processFieldConfiguration();
        this._columnModel.setData({
            cols: this._columnsConfig
        });
        this._createDialog();
        this._dialog.setModel(this._vhModel.getModel());
        this._dialog.setTokens(this._initialTokens);
        if (!this._supportRangesOnly) {
            this._createFilterBar();
            if (this._filterBar && this._filterBar.attachInitialized) {
                this._filterBar.attachInitialized(this._onFilterBarInitialized, this);
            }
            this._table = await this._dialog.getTableAsync();
            this._table.bindRows({ path: this._vhModel.getBindingPath() });
            this._table.setModel(this._columnModel, "columns");
            if (this._loadDataAtOpen) {
                this._loadData();
            }
            this._dialog.setFilterBar(this._filterBar);
        }
        const rangeKeyField = {
            key: this._keyFieldConfig.name,
            label: this._keyFieldConfig.description,
            type: this._keyFieldConfig.type?.toLowerCase(),
            formatSettings: {
                // TODO: create new type to handle uppercase formatting
                maxLength: this._keyFieldConfig.length
            }
        };
        this._dialog.setRangeKeyFields([rangeKeyField]);
        return new Promise((resolve, reject) => {
            // store promise callback functions
            this._dialogPromise = { resolve, reject };
            this._dialog.open();
            this._dialog.update();
        });
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
        this._dialog = new ValueHelpDialogSAP({
            title: this._dialogTitle,
            supportMultiselect: this._multipleSelection,
            basicSearchText: this._basicSearchEnabled && this._inputControl ? this._inputControl.getValue() : "",
            supportRanges: this._supportRanges,
            supportRangesOnly: this._supportRangesOnly,
            key: this._vhDialogMetadata.tokenKeyField,
            descriptionKey: this._vhDialogMetadata.tokenDescriptionField,
            maxExcludeRanges: !this._multipleSelection ? "0" : "-1",
            maxIncludeRanges: !this._multipleSelection ? "1" : "-1",
            ok: (event: Event) => {
                this._tokens = event.getParameter("tokens") as Token[];
                this._dialog.close();
                this._dialogPromise.resolve(this._tokens || []);
            },
            cancel: () => {
                this._dialog.close();
                this._dialogPromise.reject();
            },
            afterClose: () => {
                this._dialog.destroy();
            }
        });
    }

    /**
     * Processes the given field configuration to create the
     * columns and the filters for the dialog
     */
    private _processFieldConfiguration() {
        const fieldsMap: Record<string, ValueHelpField> = {};
        for (const fieldConfig of this._vhDialogMetadata.fields) {
            if (!fieldConfig.description) {
                fieldConfig.description =
                    fieldConfig.mediumDescription || fieldConfig.longDescription || fieldConfig.name;
            }
            fieldsMap[fieldConfig.name] = fieldConfig;
        }

        // 1) consider fields for filterbar
        for (const filterField of this._vhDialogMetadata?.filterFields ?? []) {
            this._addFilterField(fieldsMap[filterField]);
        }

        // 2) consider output fields for table
        for (const outputField of this._vhDialogMetadata.outputFields) {
            const fieldConfig = fieldsMap[outputField];
            const columnConfig = <TableColumnConfig>{
                label: fieldConfig.description,
                template: fieldConfig.name,
                tooltip: fieldConfig.description,
                width: FormatUtil.getWidth(fieldConfig, 15),
                sort: fieldConfig.sortable ? fieldConfig.name : undefined,
                sorted: fieldConfig.sortable && fieldConfig.isKey,
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
                control: new Input(fieldConfig.name)
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
            basicSearch: new SearchField({
                showSearchButton: true,
                placeholder: "Search",
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
            }),
            filterGroupItems: this._filterItems,
            search: (event: Event) => {
                const filters: FilterCond[] = [];
                for (const selection of event.getParameter("selectionSet")) {
                    if (selection.getValue()) {
                        const splitTab = selection.getId().split("_");
                        if (splitTab.length === 2) {
                            filters.push({
                                columnKey: splitTab[0],
                                operation: FilterOperator.Contains,
                                value1: selection.getValue()
                            });
                        } else {
                            filters.push({
                                columnKey: selection.getId(),
                                operation: FilterOperator.Contains,
                                value1: selection.getValue()
                            });
                        }
                    }
                }
                this._loadData({ filters: filters });
            }
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
        } catch (error) {
            Log.error("Value help data could not be loaded", error?.statusText ?? error);
        }
        this._dialog.update();
        setBusy(false, useOverlay);
    }
}
