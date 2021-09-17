import {
    DisplayFormat,
    FieldFilter,
    FieldMetadata,
    FilterCond,
    FilterItem,
    ValueHelpType
} from "../model/ServiceModel";
import FilterCreator from "../helper/filter/FilterCreator";

import Control, { $ControlSettings } from "sap/ui/core/Control";
import Button from "sap/m/Button";
import Input from "sap/m/Input";
import MultiInput from "sap/m/MultiInput";
import ComboBox from "sap/m/ComboBox";
import DatePicker from "sap/m/DatePicker";
import FlexBox from "sap/m/FlexBox";
import VerticalLayout from "sap/ui/layout/VerticalLayout";
import RenderManager from "sap/ui/core/RenderManager";
import { ButtonType, FlexAlignItems, FlexJustifyContent } from "sap/m/library";
import Item from "sap/ui/core/Item";
import Token from "sap/m/Token";
import Parameters from "sap/ui/core/theming/Parameters";
import Label from "sap/m/Label";
import Event from "sap/ui/base/Event";
import { ValueState } from "sap/ui/core/library";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import isEmptyObject from "sap/base/util/isEmptyObject";

/**
 * Control settings for {@link com.devepos.qdrt.control.QuickFilter}
 */
export interface QuickFilterSettings extends $ControlSettings {
    /**
     * The name of the column
     */
    columnName: string;
    /**
     * Label of the column
     */
    label?: string;
    /**
     * Data type of the column
     */
    type?: string;
    /**
     * Holds the actual entered value/ranges of the filter
     */
    filterData?: string;
    /**
     * Gets fired if value help request is triggered on filter control
     */
    valueHelpRequest?: Function;
    /**
     * Event handler for the remove event.
     */
    remove?: Function;
    /**
     * Controls whether only a single value can be entered in the filter
     */
    singleValueOnly?: boolean;
    /**
     * Controls whether the filter can be deleted
     */
    deletable?: boolean;
    /**
     * Controls whether a value is required
     */
    required?: boolean;
    /**
     * Flag whether or not there is value help defined for the column
     */
    hasValueHelp?: boolean;
    /**
     * The type of the value help of the column if one is defined
     */
    valueHelpType?: ValueHelpType;
    /**
     * Metadata of the reference field which provides additional information
     */
    referenceFieldMetadata: FieldMetadata | string;
}

/**
 * Quick Filter in {@link com.devepos.qdrt.control.SideFilterPanel}
 *
 * @namespace com.devepos.qdrt.control
 */
export default class QuickFilter extends Control {
    metadata = {
        properties: {
            /**
             * The name of the column for which filter shall be created
             */
            columnName: { type: "string", group: "Misc" },
            /**
             * The label for the filter, normally this should be the label of the column
             */
            label: { type: "string", group: "Misc" },
            /**
             * The data type of the column. This is needed to create the appropriate control.
             * If no type is supplied the default control will be a {@link sap.m.MultiInput} control.
             */
            type: { type: "string", group: "Misc" },
            /**
             * The maximum number of characters this filter control supports
             */
            maxLength: { type: "int", group: "Misc", defaultValue: -1 },
            /**
             * Controls whether the filter can be removed or not
             */
            deletable: { type: "boolean", group: "Misc", defaultValue: true },
            /**
             * Controls whether only a single value can be entered in the filter
             */
            singleValueOnly: { type: "boolean", group: "Misc", defaultValue: false },
            /**
             * Controls whether a value is required
             */
            required: { type: "boolean", group: "Misc", defaultValue: false },
            /**
             * Flag whether or not there is value help defined for the column
             */
            hasValueHelp: { type: "boolean", group: "Misc", defaultValue: false },
            /**
             * The type of the value help of the column if one is defined
             */
            valueHelpType: { type: "string", group: "Misc" },
            /**
             * Holds the actual entered value/ranges of the filter
             */
            filterData: { type: "object", group: "Misc" },
            /**
             * Metadata of the reference field which provides additional information
             */
            referenceFieldMetadata: { type: "object", group: "Misc" }
        },
        aggregations: {
            /**
             * Control for the filter
             */
            filter: { type: "sap.ui.core.Control", multiple: false, singularName: "filter", visibility: "hidden" }
        },
        events: {
            /**
             * Will be fired before the actual value help request
             */
            valueHelpRequest: {},
            /**
             * Get's fired if filter is removed
             */
            remove: {}
        }
    };
    renderer = {
        apiVersion: 2,
        render(rm: RenderManager, control: QuickFilter): void {
            // create a wrapper element with some styling
            rm.openStart("div", control);
            rm.class("deveposQdrt-QuickFilter");
            // apply border-color style via theme parameter
            rm.style("border-color", Parameters.get("sapUiGroupTitleBorderColor") as string);
            rm.openEnd();
            // render the actual control
            rm.renderControl(control.getAggregation("filter") as Control);
            rm.close("div");
        }
    };

    private _filterName: Label;
    private _filterControl: Control;
    private _filterNameUpdateRequired = true;
    private _filterCont: VerticalLayout;
    private _filterCreator: FilterCreator;

    constructor(settings: QuickFilterSettings) {
        super(settings);
    }

    //#region empty methods generated by ui5 library for metadata
    getType?(): string;
    getLabel?(): string;
    getColumnName?(): string;
    fireValueHelpRequest?(): this;
    fireRemove?(): this;
    getSingleValueOnly?(): boolean;
    setSingleValueOnly?(singleValueOnly: boolean): this;
    getRequired?(): boolean;
    getHasValueHelp?(): boolean;
    getValueHelpType?(): ValueHelpType;
    getReferenceFieldMetadata?(): FieldMetadata;
    getFilterData?(): FieldFilter;
    getDeletable?(): boolean;
    //#endregion

    applySettings(settings: object, scope?: object): this {
        super.applySettings(settings, scope);
        this._filterName = new Label();
        const titleItems: Control[] = [this._filterName];
        if (this.getDeletable()) {
            titleItems.push(
                new Button({
                    icon: "sap-icon://decline",
                    tooltip: "{i18n>entity_quickFilter_delete}",
                    type: ButtonType.Transparent,
                    press: () => {
                        this.fireRemove();
                        this.destroy();
                    }
                })
            );
        }
        this._filterCont = new VerticalLayout({
            width: "100%",
            content: [
                new FlexBox({
                    alignItems: FlexAlignItems.Center,
                    justifyContent: FlexJustifyContent.SpaceBetween,
                    items: titleItems
                })
            ]
        });
        // this._filterCont.addStyleClass("deveposQdrt-QuickFilter");
        this.setAggregation("filter", this._filterCont);
        return this;
    }
    clear(): this {
        this.setValue("");
        this.setTokens();
        return this;
    }
    destroy(): void {
        super.destroy.apply(this);
    }
    /**
     * Returns the current value of the filter control
     * @returns the current value of the filter control
     */
    getValue(): string {
        if (this._filterControl instanceof Input) {
            return this._filterControl.getValue();
        } else if (this._filterControl instanceof ComboBox) {
            return this._filterControl.getSelectedKey();
        }
        return null;
    }
    /**
     * @returns <code>true</code> if the filter has active values
     */
    hasValues(): boolean {
        const filterData = this.getFilterData();
        if (!filterData || isEmptyObject(filterData)) {
            return false;
        }
        return (
            ((this.getSingleValueOnly() || this.getType() === "Boolean") && !!filterData?.value) ||
            filterData?.ranges?.length > 0 ||
            filterData?.ranges?.length > 0
        );
    }
    /**
     * Returns the filter control of this quick filter
     * @returns the filter control
     */
    getFilterControl(): Control {
        return this._filterControl;
    }
    setRequired(required: boolean): this {
        this.setProperty("required", required);
        this._filterNameUpdateRequired = true;
        return this;
    }
    setColumnName(columnName: string): this {
        this.setProperty("columnName", columnName);

        this._filterNameUpdateRequired = true;
        return this;
    }

    setLabel(label: string): this {
        this.setProperty("label", label);

        this._filterNameUpdateRequired = true;
        return this;
    }

    setTooltip(tooltip: string): this {
        super.setTooltip(tooltip);
        this._filterNameUpdateRequired = true;
        return this;
    }

    setTokens(tokens?: Token[]): this {
        if (this._filterControl instanceof MultiInput) {
            if (!tokens || tokens.length === 0) {
                this._filterControl.removeAllTokens();
                this._deleteAllFilters();
            } else {
                this._filterControl.setTokens(tokens);
                this._createFiltersFromTokens(tokens);
            }
        }
        return this;
    }

    setValue(value: string): this {
        if (this._filterControl instanceof DatePicker || this._filterControl instanceof Input) {
            this._filterControl.setValue(value);
        } else if (this._filterControl instanceof ComboBox) {
            this._filterControl.setSelectedKey(value);
        }
        return this;
    }

    onBeforeRendering(): void {
        if (!this._filterControl) {
            this._filterControl = this._createControl();
            this._setControlInputFromFilters();
            this._attachEventHandlers();
            this._filterCont.addContent(this._filterControl);
        }

        if (this._filterNameUpdateRequired) {
            this._updateFilterName();
            this._filterNameUpdateRequired = false;
        }
    }
    onThemeChanged(): void {
        /**
         * As theme parameters are used the control needs to be re-rendered upon
         * theme change.
         */
        this.invalidate();
    }
    private _attachEventHandlers() {
        const fieldMeta = this.getReferenceFieldMetadata();
        if (this._filterControl instanceof Input) {
            if (fieldMeta.displayFormat === DisplayFormat.UpperCase) {
                this._filterControl.attachChange(() => {
                    const value = (this._filterControl as Input).getValue();
                    if (value) {
                        (this._filterControl as Input).setValue(value.toUpperCase());
                    }
                }, this);
            }
            this._filterControl.attachValueHelpRequest(() => {
                this.fireValueHelpRequest();
            }, this);
            if (this._filterControl instanceof MultiInput) {
                this._filterControl.attachTokenUpdate((evt: Event) => {
                    let currentTokens = (this._filterControl as MultiInput).getTokens();
                    const deletedTokens = evt.getParameter("removedTokens") as Token[];
                    if (deletedTokens?.length) {
                        const remainingTokens = [];
                        for (const token of currentTokens) {
                            if (
                                deletedTokens.findIndex(deletedToken => deletedToken.getKey() === token.getKey()) === -1
                            ) {
                                remainingTokens.push(token);
                            }
                        }
                        currentTokens = remainingTokens;
                    }
                    this._createFiltersFromTokens(currentTokens);
                }, this);
                this._filterControl.addValidator(this._validateCurrentToken.bind(this));
            }
            // attach handlers regarding parsing/validation/formatting
            this._filterControl.attachParseError(this._handleValidationError.bind(this), this);
            this._filterControl.attachFormatError(this._handleValidationError.bind(this), this);
            this._filterControl.attachValidationError(this._handleValidationError.bind(this), this);
            this._filterControl.attachValidationSuccess(() => {
                const inputFilterControl = this._filterControl as Input;
                inputFilterControl.setValueState(ValueState.None);
                inputFilterControl.setValueStateText("");
            }, this);
        } else if (this._filterControl instanceof ComboBox) {
            this._filterControl.attachChange(() => {
                const comboBoxFilter = this._filterControl as ComboBox;
                const selectedKey = comboBoxFilter.getSelectedKey();
                const value = comboBoxFilter.getValue();

                if (!selectedKey && value) {
                    comboBoxFilter.setValueState(ValueState.Error);
                    this.getFilterData().value = null;
                    comboBoxFilter.setValueStateText("Please enter/select a valid entry!");
                } else {
                    comboBoxFilter.setValueState(ValueState.None);
                    this.getFilterData().value = selectedKey;
                }
            }, this);
        } else if (this._filterControl instanceof DatePicker) {
            this._filterControl.attachChange((event: Event) => {
                const isValid = event.getParameter("valid");
                const datePicker = this._filterControl as DatePicker;
                if (isValid) {
                    datePicker.setValueStateText("");
                    datePicker.setValueState(ValueState.None);
                } else {
                    datePicker.setValueState(ValueState.Error);
                }
            }, this);
        }
    }

    /**
     * Sets the control input from the bound filter information
     */
    private _setControlInputFromFilters() {
        const filterData = this.getFilterData();
        if (!filterData || isEmptyObject(filterData)) {
            return;
        }
        const filterCreator = this._getFilterCreator();
        const tokens = [];
        if (filterData.ranges && filterData.ranges.length > 0) {
            let rangeIndex = 0;
            for (const range of filterData.ranges) {
                tokens.push(filterCreator.createToken(range, null, `range_${rangeIndex++}`));
            }
        }
        if (filterData.items) {
            for (const item of filterData.items) {
                tokens.push(new Token({ key: item.key, text: item.text }));
            }
        }

        this.setTokens(tokens);
    }

    private _createFiltersFromTokens(currentTokens: Token[]) {
        const ranges: FilterCond[] = [];
        const items: FilterItem[] = [];
        for (const token of currentTokens) {
            const rangeData = token.data("range") as FilterCond;
            if (rangeData) {
                ranges.push({ ...rangeData });
            } else {
                items.push({ key: token.getKey(), text: token.getText() });
            }
        }
        // update the ranges of the filter binding
        const filterDataBinding = this.getBinding("filterData");
        if (filterDataBinding) {
            const model = filterDataBinding.getModel() as JSONModel;
            model.setProperty(`${filterDataBinding.getPath()}/ranges`, ranges);
            model.setProperty(`${filterDataBinding.getPath()}/items`, items);
        }
    }

    private _deleteAllFilters() {
        const filterDataBinding = this.getBinding("filterData");
        if (filterDataBinding) {
            const model = filterDataBinding.getModel() as JSONModel;
            model.setProperty(filterDataBinding.getPath(), {});
        }
    }

    /**
     * Validation of the current token
     */
    private _validateCurrentToken(event: { text: string }): Token {
        if (!event.text || event.text === "") {
            return null;
        }
        // determine the new token
        const filterCreator = this._getFilterCreator();
        filterCreator.setValue(event.text);
        try {
            const filterCond = filterCreator.createFilter();
            return filterCreator.createToken(filterCond, (this._filterControl as MultiInput).getTokens());
        } catch (error) {
            return null;
        }
    }

    private _updateFilterName() {
        const label = this.getLabel();
        const columnName = this.getColumnName();
        if (label !== "") {
            this._filterName?.setText(label);
        } else {
            this._filterName?.setText(columnName);
        }

        const tooltip = this.getTooltip();
        this._filterName?.setTooltip(tooltip);

        this._filterName.setRequired(this.getRequired());
    }

    private _createControl(): Control {
        const type = this.getType();
        const refFieldMetadata = this.getReferenceFieldMetadata();
        const typeInstance = refFieldMetadata.typeInstance;
        const valueBinding = {
            path: `${this.getBinding("filterData").getPath()}/value`,
            type: typeInstance
        } as PropertyBindingInfo;

        // create appropriate control according to type
        switch (type) {
            case "Boolean":
                return new ComboBox({
                    width: "100%",
                    editable: true,
                    items: [
                        new Item({
                            key: "",
                            text: ""
                        }),
                        new Item({
                            key: "true",
                            text: typeInstance.formatValue(true, "string")
                        }),
                        new Item({
                            key: "false",
                            text: typeInstance.formatValue(false, "string")
                        })
                    ]
                });

            case "Date":
                if (this.getSingleValueOnly()) {
                    return new DatePicker({ width: "100%", dateValue: valueBinding });
                } else {
                    return new MultiInput({ width: "100%", value: valueBinding });
                }

            default:
                if (this.getSingleValueOnly()) {
                    return new Input({
                        width: "100%",
                        value: valueBinding,
                        showValueHelp: refFieldMetadata.hasValueHelp
                    });
                } else {
                    return new MultiInput({ width: "100%", value: valueBinding });
                }
        }
    }

    private _handleValidationError(event: Event) {
        const exception = event.getParameter("exception");
        const inputFilterControl = this._filterControl as Input;
        if (exception) {
            inputFilterControl.setValueStateText(exception.message);
        }
        inputFilterControl.setValueState(ValueState.Error);
    }

    private _getFilterCreator(): FilterCreator {
        if (!this._filterCreator) {
            this._filterCreator = new FilterCreator(this.getColumnName(), this.getReferenceFieldMetadata());
        }
        return this._filterCreator;
    }
}
