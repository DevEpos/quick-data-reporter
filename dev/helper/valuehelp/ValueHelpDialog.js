import BaseObject from "sap/ui/base/Object";
import ValueHelpDialogSAP from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import Filter from "sap/ui/model/Filter";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import FilterOperator from "sap/ui/model/FilterOperator";
import SearchField from "sap/m/SearchField";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";

/**
 * Util for calling a value help dialog
 *
 * @public
 * @alias devepos.qdrt.helper.valuehelp.ValueHelpDialog
 */
export default class ValueHelpDialog extends BaseObject {
    /**
     * Constructor for ValueHelpDialog
     *
     * @param {map} [params]
     *    The following parameters can be defined:
     * @param {sap.ui.model.json.JSONModel|sap.ui.model.odata.v2.ODataModel} [params.model]
     *    The data model for the bindingPath
     * @param {object} [params.inputField]
     *    input field reference
     * @param {map[]} [params.fields]
     *    fields definition for table columns and filter fields
     * @param {object} [params.keyField]
     *      the metadata information of the key field to be used
     * @param {boolean} [params.basicSearchEnabled]
     *    flag to indicate if the basic search field should be enabled in the filter bar
     * @param {boolean} [params.multipleSelection=false]
     *    enable or disable multiple selection
     * @param {boolean} [params.loadDataAtOpen=false]
     *    enable/disable the immediate data loading after the dialog is open
     * @param {boolean} [params.useAllFieldsInResultTable=false]
     *    flag to show all fields in result table
     * @param {map} [params.filterValues]
     *    map of initial filter values
     * @param {Array} [params.initialTokens]
     *    array of tokens that should be displayed after dialog opens
     */
    constructor(params) {
        this.inputField = params.inputField;
        this.fieldsConfig = params.fields;
        this.keyField = params.keyField;
        this.title = this.keyField.label || this.keyField.name;
        this.model = params.model;
        this.isMultipleSelection = params.multipleSelection || false;
        this.isBasicSearchEnabled = params.basicSearchEnabled;
        this.useAllFieldsInResultTable = params.useAllFieldsInResultTable || false;
        this.initialFilters = params.filterValues || {};
        this.initialTokens = params.initialTokens || [];

        this.tokens = [];
        this.keys = [];
        this.cols = [];
        this.filters = [];
        this.fields = [];
        this.colModel = new JSONModel();
        this.filters = [];
        this.bindingPath = "";
        this.searchFocusField = this.isBasicSearchEnabled ? this.keyField.name : "";
        this.dialog = null;
        this.retrieveDataAtOpen = params.loadDataAtOpen || false;
    }

    /**
     * Opens the value help dialog for given bindingPath which will be
     * used to fill the result table
     *
     * @param {string} bindingPath
     *    The bindingPath used for the result table
     * @returns {Promise} promise which will get resolved upon clicking ok
     *
     * @public
     */
    showDialog(bindingPath) {
        return new Promise(async (fnResolve, fnReject) => {
            // store promise callback functions
            this.dialogPromise = {
                fnResolve,
                fnReject
            };
            this.dialog = null;
            this.bindingPath = bindingPath;

            this._processFieldConfiguration();
            this.selectFields = this.fields.map(oField => oField.key).toString();
            this.colModel.setData({
                cols: this.cols
            });

            this._createDialog();
            this.dialog.setModel(this.model);
            this.dialog.setTokens(this.aInitialTokens);
            this.createFilterBar();
            if (this.filterBar && this.filterBar.attachInitialized) {
                this.filterBar.attachInitialized(this.onFilterBarInitialized, this);
            }

            const table = await this.dialog.getTableAsync();
            table.setModel(this.colModel, "columns");

            if (this.retrieveDataAtOpen) {
                this.rebindTable();
            }

            this.dialog.setRangeKeyFields(this.fields);

            this.dialog.setFilterBar(this.filterBar);

            if (!this.inputField) {
                this.dialog.addStyleClass("sapUiSizeCompact");
            }
            this.dialog.open();
            this.dialog.update();
        });
    }

    /**
     * Event Handler for when the Filter Bar was successfully initialized
     *
     * @param {object} event the Event object
     * @protected
     */
    onFilterBarInitialized(event) {
        for (const filterKey in this.initialFilters) {
            const filterControl = this.filterBar.getControlByKey(filterKey);
            if (filterControl && filterControl.setValue) {
                filterControl.setValue(this.initialFilters[filterKey]);
            }
        }
        if (this.isBasicSearchEnabled && this.inputField) {
            const value = this.inputField.getValue();
            const searchControl = this.filterBar.getBasicSearchControl();
            if (searchControl && value) {
                searchControl.setValue(value);
                this.filterBar.setFilterBarExpanded(false);
            }
        }
    }

    /**
     * Creates the value help dialog
     *
     * @private
     */
    _createDialog() {
        this.dialog = new ValueHelpDialogSAP({
            // basicSearchText: this.inputField ? this.inputField.getValue() : "",
            title: this.title,
            supportMultiselect: this.isMultipleSelection,
            basicSearchText: this.isBasicSearchEnabled && this.inputField ? this.inputField.getValue() : "",
            supportRanges: false,
            supportRangesOnly: false,
            key: this.tokenKeyFieldName,
            descriptionKey: this.tokenDescriptionFieldName,
            ok: event => {
                this.tokens = event.getParameter("tokens");
                this.dialog.close();
                this.dialogPromise.fnResolve(this.tokens || []);
            },
            cancel: () => {
                this.dialog.close();
                this.dialogPromise.fnResolve();
            },
            afterClose: () => {
                this.dialog.destroy();
            }
        });
    }

    /**
     * Processes the given field configuration to create the
     * columns and the filters for the dialog
     * @private
     */
    _processFieldConfiguration() {
        this.fieldsConfig.forEach(fieldConfig => {
            if (fieldConfig.filterable) {
                this.addFilterField(fieldConfig);
            }
            if (!fieldConfig.isKey && !fieldConfig.isTokenDescription && !this.bUseAllFieldsInResultTable) {
                return;
            }
            if (fieldConfig.isTokenKey) {
                this.tokenKeyFieldName = fieldConfig.name;
            }
            if (fieldConfig.isTokenDescription) {
                this.tokenDescriptionFieldName = fieldConfig.name;
            }
            const columnConfig = {
                label: fieldConfig.label,
                template: fieldConfig.name,
                tooltip: fieldConfig.tooltip,
                sort: fieldConfig.sortable ? fieldConfig.name : undefined,
                sorted: fieldConfig.sortable && fieldConfig.isTokenKey,
                oType: fieldConfig.type,
                sortOrder: "Ascending" // sap.ui.table.SortOrder.Ascending
            };
            if (fieldConfig.width) {
                columnConfig.width = fieldConfig.width;
            }
            this.cols.push(columnConfig);
            this.fields.push({
                label: fieldConfig.label,
                key: fieldConfig.name
            });
        });
    }

    /**
     * Adds the field to the list of visible filters of the
     * FilterBar
     *
     * @param {map} [fieldConfig] config data for filter field
     * @param {string} [fieldConfig.name] the key name of the filter field
     * @param {string} [fieldConfig.label] the label for the filter field
     * @protected
     */
    addFilterField(fieldConfig) {
        this.filters.push(
            new FilterGroupItem({
                groupName: FilterBar.INTERNAL_GROUP,
                hiddenFilter: fieldConfig.hidden || false,
                partOfCurrentVariant: true,
                visibleInFilterBar: fieldConfig.visible || false,
                name: fieldConfig.name,
                label: fieldConfig.label,
                control: new Input(fieldConfig.name)
            })
        );
    }

    /**
     * Creates the filter bar for the valuehelp dialog
     * @protected
     */
    createFilterBar = function () {
        this.filterBar = new FilterBar({
            advancedMode: true,
            showClearOnFB: false,
            basicSearch: new SearchField({
                id: "s1",
                showSearchButton: true,
                placeholder: "Search",
                search: param => {
                    const filters = [];
                    if (param.getParameter("query") && param.getParameter("query").length > 0) {
                        filters.push(
                            new Filter(this.searchFocusField, FilterOperator.Contains, param.getParameter("query"))
                        );
                    }
                    this.dialog.getTable().getBinding().filter(filters);
                }
            }),
            filterItems: [],
            filterGroupItems: this.filters,
            search: event => {
                const filters = [];
                event.getParameter("selectionSet").forEach(selection => {
                    if (selection.getValue()) {
                        const splitTab = selection.getId().split("_");
                        if (splitTab.length === 2) {
                            filters.push(new Filter(splitTab[0], FilterOperator.Contains, selection.getValue()));
                        } else {
                            filters.push(new Filter(selection.getId(), FilterOperator.Contains, selection.getValue()));
                        }
                    }
                });
                this.rebindTable({ filters: filters });
            }
        });
    };

    /**
     * Update the table bindingPath
     * @param {map} [params]
     *    The following parameters can be defined:
     * @param {array} [params.filters]
     *    Optional array of filters
     * @param {map} [params.parameters]
     *    Optional map of bindingPath parameters
     *
     * @protected
     */
    async rebindTable(params) {
        if (!this.dialog) {
            return;
        }
        const bindingParams = {
            path: this.bindingPath,
            filters: params?.filters ?? [],
            parameters: params?.parameters ?? {},
            events: {
                dataReceived: async event => {
                    const binding = event.getSource();
                    await this.dialog.getTableAsync();
                    if (binding && this.dialog && this.dialog.isOpen()) {
                        const bindingLength = binding.getLength();
                        if (bindingLength) {
                            this.dialog.update();
                        } else {
                            this.dialog._updateTitles();
                        }
                    }
                }
            }
        };

        const table = await this.dialog.getTableAsync();
        table.setShowOverlay(false);
        table.setEnableBusyIndicator(true);
        table.bindRows(bindingParams);
    }
}
