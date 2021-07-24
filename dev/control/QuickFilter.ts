import { ValueHelpType } from "../model/ServiceModel";

import Control, { $ControlSettings } from "sap/ui/core/Control";
import Button from "sap/m/Button";
import MultiInput from "sap/m/MultiInput";
import FlexBox from "sap/m/FlexBox";
import VerticalLayout from "sap/ui/layout/VerticalLayout";
import RenderManager from "sap/ui/core/RenderManager";
import { ButtonType, FlexAlignItems, FlexJustifyContent } from "sap/m/library";
import Item from "sap/ui/core/Item";
import Token from "sap/m/Token";
import Parameters from "sap/ui/core/theming/Parameters";
import Label from "sap/m/Label";
import ComboBox from "sap/m/ComboBox";
import Input from "sap/m/Input";
import Event from "sap/ui/base/Event";
import { ValueState } from "sap/ui/core/library";
import DatePicker from "sap/m/DatePicker";

/**
 * Control settings for {@link devepos.qdrt.control.QuickFilter}
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
     * Gets fired if value help request is triggered on filter control
     */
    valueHelpRequest?: Function;
    /**
     * Event handler for the change event
     */
    change?: Function;
    /**
     * Event handler for the submit event.
     */
    submit?: Function;
    /**
     * Event handler for the remove event.
     */
    remove?: Function;
    /**
     * Controls whether only a single value can be entered in the filter
     */
    singleValueOnly?: boolean;
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
}

const CUSTOM_DATA__IS_CHANGING = "__changing";

/**
 * Quick Filter in {@link devepos.qdrt.control.SideFilterPanel}
 *
 * @namespace devepos.qdrt.control
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
            valueHelpType: { type: "string", group: "Misc" }
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
             * The change event. Will be fired if the focus of the filter field is lost or if the "Enter" key is pressed.
             */
            change: {
                value: { type: "string" }
            },
            /**
             * Submit event for {@link sap.m.Input} controls
             */
            submit: {},
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

    constructor(settings: QuickFilterSettings) {
        super(settings);
    }

    //#region empty methods generated by ui5 library for metadata
    getType?(): string;
    getLabel?(): string;
    getColumnName?(): string;
    fireValueHelpRequest?(): this;
    fireChange?(parameters?: object): this;
    fireSubmit?(): this;
    fireRemove?(): this;
    getSingleValueOnly?(): boolean;
    setSingleValueOnly?(singleValueOnly: boolean): this;
    getRequired?(): boolean;
    getHasValueHelp?(): boolean;
    getValueHelpType?(): ValueHelpType;
    //#endregion

    init(): void {
        this._filterName = new Label();
        this._filterCont = new VerticalLayout({
            width: "100%",
            content: [
                new FlexBox({
                    alignItems: FlexAlignItems.Center,
                    justifyContent: FlexJustifyContent.SpaceBetween,
                    items: [
                        this._filterName,
                        new Button({
                            icon: "sap-icon://decline",
                            tooltip: "{i18n>entity_quickFilter_delete}",
                            type: ButtonType.Transparent,
                            press: () => {
                                this.fireRemove();
                                this.destroy();
                            }
                        })
                    ]
                })
            ]
        });
        // this._filterCont.addStyleClass("deveposQdrt-QuickFilter");
        this.setAggregation("filter", this._filterCont);

        this.addEventDelegate({
            onThemeChanged: () => {
                /**
                 * As theme parameters are used the control needs to be re-rendered upon
                 * theme change.
                 */
                this.invalidate();
            }
        });
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
            } else {
                this._filterControl.setTokens(tokens);
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
            this._attachEventHandlers();
            this._filterCont.addContent(this._filterControl);
        }

        if (this._filterNameUpdateRequired) {
            this._updateFilterName();
            this._filterNameUpdateRequired = false;
        }
    }
    private _attachEventHandlers() {
        if (this._filterControl instanceof Input) {
            this._filterControl.attachValueHelpRequest(() => {
                this.fireValueHelpRequest();
            }, this);
            this._filterControl.attachChange((event: Event) => {
                if (this._filterControl instanceof MultiInput) {
                    this._filterControl.data(CUSTOM_DATA__IS_CHANGING, true);
                }
                this.fireChange({ value: event.getParameter("value") });
            }, this);
            if (this._filterControl instanceof MultiInput) {
                this._filterControl.attachSubmit(() => {
                    if (this._filterControl.data(CUSTOM_DATA__IS_CHANGING)) {
                        this._filterControl.data(CUSTOM_DATA__IS_CHANGING, false);
                        return;
                    }
                    this.fireSubmit();
                }, this);
            }
        } else if (this._filterControl instanceof ComboBox) {
            this._filterControl.attachChange(() => {
                const comboBoxFilter = this._filterControl as ComboBox;
                const selectedKey = comboBoxFilter.getSelectedKey();
                const value = comboBoxFilter.getValue();

                if (!selectedKey && value) {
                    comboBoxFilter.setValueState(ValueState.Error);
                    comboBoxFilter.setValueStateText("Please enter/select a valid entry!");
                } else {
                    comboBoxFilter.setValueState(ValueState.None);
                    this.fireChange({ value: (this._filterControl as ComboBox).getSelectedKey() });
                }
            }, this);
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
                            text: "{i18n>booleanType_yes}"
                        }),
                        new Item({
                            key: "false",
                            text: "{i18n>booleanType_no}"
                        })
                    ]
                });

            case "Date":
                if (this.getSingleValueOnly()) {
                    return new DatePicker({ width: "100%" });
                } else {
                    return new MultiInput({ width: "100%" });
                }

            default:
                if (this.getSingleValueOnly()) {
                    return new Input({ width: "100%" });
                } else {
                    return new MultiInput({ width: "100%" });
                }
        }
    }
}
