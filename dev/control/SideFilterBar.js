import Panel from "sap/m/Panel";
import ScrollContainer from "sap/m/ScrollContainer";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Button from "sap/m/Button";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import Title from "sap/m/Title";
import VerticalLayout from "sap/ui/layout/VerticalLayout";
import QuickFilter from "./QuickFilter";

/**
 * FilterBar with vertical orientation
 *
 * @namespace devepos.qdrt.control
 */
export default class SideFilterBar extends Panel {
    metadata = {
        properties: {},
        aggregations: {
            /**
             * Holds all columns for which filters can be created
             */
            columnItems: { type: "devepos.qdrt.element.ColumnItem", multiple: true, singularName: "columnItem" },
            /**
             * Holds the current filter items
             */
            filterItems: { type: "devepos.qdrt.element.FilterItem", multiple: true, singularName: "filterItem" }
        },
        events: {}
    };
    /**
     * Currently no custom renderer is needed
     */
    renderer = "sap.m.PanelRenderer";
    init() {
        Panel.prototype.init.call(this);
        this._onAfterRenderingFirstTimeExecuted = false;
        this._liveChangeTimer = 0;
        this.setWidth("100%");
        this.setHeight("100%");
        this.setHeaderToolbar(
            new OverflowToolbar({
                content: [
                    // TODO: create i18n text
                    new Title({ text: "Filters" }),
                    new ToolbarSpacer(),
                    // TODO: add i18n tooltip
                    new Button({
                        icon: "sap-icon://add",
                        type: sap.m.ButtonType.Transparent,
                        press: () => {
                            this._addNewFilter();
                        }
                    }),
                    // TODO: add i18n tooltip
                    new Button({
                        icon: "sap-icon://delete",
                        type: sap.m.ButtonType.Transparent,
                        press: () => {
                            this._filterContainer.removeAllContent();
                        }
                    })
                ]
            })
        );
        this._filterContainer = new VerticalLayout({
            width: "100%"
        });
        this._scrollContainer = new ScrollContainer({
            content: this._filterContainer,
            width: "100%",
            height: "100%",
            horizontal: false,
            vertical: true
        });

        this.addContent(this._scrollContainer);
    }
    onAfterRendering() {
        // do custom afterRendering
        Panel.prototype.onAfterRendering.call(this);
    }
    onBeforeRendering() {
        Panel.prototype.onBeforeRendering.call(this);
        // do custom beforeRendering
    }
    exit() {
        Panel.prototype.exit.call(this);
    }

    _addNewFilter() {
        this._filterContainer.addContent(this._createQuickFilter("New Filter"));
    }
    _createQuickFilter(columnName) {
        return new QuickFilter({ columnName });
    }
}
