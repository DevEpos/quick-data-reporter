import Control from "sap/ui/core/Control";
import Button from "sap/m/Button";
import MultiInput from "sap/m/MultiInput";
import Label from "sap/m/Label";
import Text from "sap/m/Text";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import Title from "sap/m/Title";
import FlexBox from "sap/m/FlexBox";
import VerticalLayout from "sap/ui/layout/VerticalLayout";

/**
 * Quick Filter in {@link devepos.qdrt.control.SideFilterBar}
 *
 * @namespace devepos.qdrt.control
 */
export default class QuickFilter extends Control {
    metadata = {
        properties: {
            columnName: {
                type: "string",
                group: "Misc",
                defaultValue: null
            }
        },
        aggregations: {
            /**
             * Control for the filter
             */
            filter: { type: "sap.ui.core.Control", multiple: false, singularName: "filter", visibility: "hidden" }
        },
        events: {}
    };
    renderer = {
        apiVersion: 2,
        render(rm, control) {
            rm.renderControl(control.getAggregation("filter"));
        }
    };
    init() {
        this._filterName = new Text();
        const filterCont = new VerticalLayout({
            content: [
                new FlexBox({
                    alignItems: sap.m.FlexAlignItems.Center,
                    justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
                    items: [
                        this._filterName,
                        new Button({
                            icon: "sap-icon://decline",
                            type: sap.m.ButtonType.Transparent,
                            press: () => {
                                this.destroy();
                            }
                        })
                    ]
                }),
                // TODO: create correct control type
                new MultiInput({ width: "100%" })
            ]
        });
        filterCont.addStyleClass("deveposQdrtQuickFilter");
        this.setAggregation("filter", filterCont);
    }
    setColumnName(columnName) {
        this.setProperty("columnName", columnName);

        this._filterName?.setText(columnName);
        return this;
    }
    onAfterRendering() {}
    onBeforeRendering() {}
    exit() {}
}
