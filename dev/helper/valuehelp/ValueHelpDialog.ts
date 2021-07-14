import { ValueHelpField, ValueHelpMetadata } from "devepos/qdrt/model/ServiceModel";

import BaseObject from "sap/ui/base/Object";
import ValueHelpDialogSAP from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import Filter from "sap/ui/model/Filter";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import FilterOperator from "sap/ui/model/FilterOperator";
import SearchField from "sap/m/SearchField";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import Event from "sap/ui/base/Event";
import Table from "sap/ui/table/Table";
import ListBinding from "sap/ui/model/ListBinding";
import Token from "sap/m/Token";

interface TableColumnConfig {
    label: string;
    template: string;
    tooltip: string;
    sort: string;
    sorted: boolean;
    sortOrder: "Ascending" | "Descending";
    oType?: any;
    width?: number;
}

interface SimpleBindingParams {
    filters?: Filter | Filter[];
    parameters?: object;
}

export type ValueHelpFilterValues = Record<string, any>;

export interface ValueHelpDialogSettings {
    model: JSONModel;
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
     * If <code>true</code> all defined fields should be visible in the table
     */
    useAllFieldsInResultTable?: boolean;
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
    // TODO: this model needs to encapsulate the actual backend call and fill it's wrapped
    // internal model
    private _model: JSONModel;
    private _filterBar: FilterBar;
    private _inputControl: Input;
    private _vhDialogMetadata: ValueHelpMetadata;
    private _keyFieldConfig: ValueHelpField;
    private _fields: { key: string; label?: string }[];
    private _dialogTitle: string;
    private _searchFocusField: string;
    private _multipleSelection: boolean;
    private _basicSearchEnabled: boolean;
    private _useAllFieldsInResultTable: boolean;
    private _initialFilters: ValueHelpFilterValues;
    private _initialTokens: Token[];
    private _tokens: Token[] = [];
    private _loadDataAtOpen: boolean;
    private _columnModel = new JSONModel();
    private _dialog: ValueHelpDialogSAP;
    private _dialogPromise: { resolve: (tokens: Token[]) => void; reject: () => void };
    private _supportRanges: boolean;
    private _supportRangesOnly: boolean;
    private _columnsConfig: TableColumnConfig[];
    private _filterItems: FilterGroupItem[];
    private _bindingPath: string;
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
            this._keyFieldConfig.mediumDescription || this._keyFieldConfig.longDescription || this._keyFieldConfig.name;
        this._model = settings.model;
        this._multipleSelection = settings.multipleSelection || false;
        this._basicSearchEnabled = settings.basisSearchEnabled || false;
        this._useAllFieldsInResultTable = settings.useAllFieldsInResultTable || false;
        this._initialFilters = settings.initialFilters || {};
        this._initialTokens = settings.initialTokens || [];
        this._searchFocusField = this._basicSearchEnabled ? this._keyFieldConfig.name : "";
        this._loadDataAtOpen = settings.loadDataAtOpen || false;
        this._supportRanges = settings.supportRanges || false;
        this._supportRangesOnly = settings.supportRangesOnly || false;
    }

    /**
     * Opens the value help dialog for given bindingPath which will be
     * used to fill the result table
     *
     * @param bindingPath the bindingPath used for the result table
     * @returns promise which will get resolved upon clicking ok
     */
    async showDialog(bindingPath: string): Promise<Token[]> {
        this._dialog = null;
        this._bindingPath = bindingPath;
        this._processFieldConfiguration();
        this._columnModel.setData({
            cols: this._columnsConfig
        });
        this._createDialog();
        this._dialog.setModel(this._columnModel);
        this._dialog.setTokens(this._initialTokens);
        this._createFilterBar();
        if (this._filterBar && this._filterBar.attachInitialized) {
            this._filterBar.attachInitialized(this._onFilterBarInitialized, this);
        }
        const table = await this._dialog.getTableAsync();
        table.setModel(this._columnModel, "columns");
        if (this._loadDataAtOpen) {
            this._rebindTable(table);
        }
        this._dialog.setRangeKeyFields(this._fields);
        this._dialog.setFilterBar(this._filterBar);
        // Probably not needed???
        // if (!this._inputControl) {
        //     this._dialog.addStyleClass("sapUiSizeCompact");
        // }
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
        for (const fieldConfig of this._vhDialogMetadata.fields) {
            if (!fieldConfig.description) {
                fieldConfig.description =
                    fieldConfig.mediumDescription || fieldConfig.longDescription || fieldConfig.name;
            }
            if (fieldConfig.filterable) {
                this.addFilterField(fieldConfig);
            }
            if (!fieldConfig.isKey && !fieldConfig.isDescription && !this._useAllFieldsInResultTable) {
                continue;
            }
            const columnConfig = <TableColumnConfig>{
                label: fieldConfig.description,
                template: fieldConfig.name,
                // TODO: get tooltip from specific description column
                // tooltip: fieldConfig.tooltip,
                sort: fieldConfig.sortable ? fieldConfig.name : undefined,
                sorted: fieldConfig.sortable && fieldConfig.isKey,
                oType: fieldConfig.type,
                sortOrder: "Ascending" // sap.ui.table.SortOrder.Ascending
            };
            // TODO: determine column width depending on type
            // see class sap/ui/comp/util/FormatUtil
            if (fieldConfig.width) {
                columnConfig.width = fieldConfig.width;
            }
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
    protected addFilterField(fieldConfig: ValueHelpField): void {
        this._filterItems.push(
            new FilterGroupItem({
                groupName: "__BASIC",
                hiddenFilter: false,
                partOfCurrentVariant: true,
                visibleInFilterBar: fieldConfig.visible || false,
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
                search: async (event: Event) => {
                    const filters = [];
                    if (event.getParameter("query") && event.getParameter("query").length > 0) {
                        filters.push(
                            new Filter(this._searchFocusField, FilterOperator.Contains, event.getParameter("query"))
                        );
                    }
                    (await this._dialog.getTableAsync()).getBinding().filter(filters);
                }
            }),
            filterGroupItems: this._filterItems,
            search: (event: Event) => {
                const filters = [];
                for (const selection of event.getParameter("selectionSet")) {
                    if (selection.getValue()) {
                        const splitTab = selection.getId().split("_");
                        if (splitTab.length === 2) {
                            filters.push(new Filter(splitTab[0], FilterOperator.Contains, selection.getValue()));
                        } else {
                            filters.push(new Filter(selection.getId(), FilterOperator.Contains, selection.getValue()));
                        }
                    }
                }
                this._rebindTable(null, { filters: filters });
            }
        });
    }

    /**
     * Update the table bindingPath
     * @param params parameters for the binding
     */
    private async _rebindTable(table?: Table, params?: SimpleBindingParams) {
        if (!this._dialog) {
            return;
        }
        const bindingParams = {
            path: this._bindingPath,
            filters: params?.filters ?? [],
            parameters: params?.parameters ?? {},
            events: {
                dataReceived: async (event: Event) => {
                    const binding = event.getSource() as ListBinding;
                    await this._dialog.getTableAsync();
                    if (binding && this._dialog && this._dialog.isOpen()) {
                        const bindingLength = binding.getLength();
                        if (bindingLength) {
                            this._dialog.update();
                        } else {
                            // Private method access is needed here
                            (this._dialog as any)._updateTitles();
                        }
                    }
                }
            }
        };
        if (!table) {
            table = await this._dialog.getTableAsync();
        }
        table.setShowOverlay(false);
        table.setEnableBusyIndicator(true);
        table.bindRows(bindingParams as any);
    }
}
