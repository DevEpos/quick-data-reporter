import Control, { $ControlSettings } from "sap/ui/core/Control";
import Button from "sap/m/Button";
import MultiInput from "sap/m/MultiInput";
import Text from "sap/m/Text";
import FlexBox from "sap/m/FlexBox";
import VerticalLayout from "sap/ui/layout/VerticalLayout";
import RenderManager from "sap/ui/core/RenderManager";
import { ButtonType, FlexAlignItems, FlexJustifyContent } from "sap/m/library";

/**
 * Control settings for {@link devepos.qdrt.control.QuickFilter}
 */
export interface IQuickFilterSettings extends $ControlSettings {
    /**
     * The name of the column
     */
    columnName: string;
}

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
                group: "Misc"
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
        render(rm: RenderManager, control: QuickFilter): void {
            rm.renderControl(control.getAggregation("filter") as Control);
        }
    };

    private _filterName: Text;

    constructor(settings: IQuickFilterSettings) {
        super(settings);
    }
    init(): void {
        this._filterName = new Text();
        const filterCont = new VerticalLayout({
            content: [
                new FlexBox({
                    alignItems: FlexAlignItems.Center,
                    justifyContent: FlexJustifyContent.SpaceBetween,
                    items: [
                        this._filterName,
                        new Button({
                            icon: "sap-icon://decline",
                            tooltip: "{i18n>entity_sideFilterBar_filter_delete}",
                            type: ButtonType.Transparent,
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
    setColumnName(columnName: string): QuickFilter {
        this.setProperty("columnName", columnName);

        this._filterName?.setText(columnName);
        return this;
    }
}
