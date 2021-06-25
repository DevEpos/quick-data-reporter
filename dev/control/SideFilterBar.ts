import Panel from "sap/m/Panel";
import ScrollContainer from "sap/m/ScrollContainer";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Button from "sap/m/Button";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import Title from "sap/m/Title";
import VerticalLayout from "sap/ui/layout/VerticalLayout";
import QuickFilter from "./QuickFilter";
import { ButtonType } from "sap/m/library";

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
    _onAfterRenderingFirstTimeExecuted: boolean;
    _liveChangeTimer: number;
    _filterContainer: any;
    _scrollContainer: ScrollContainer;
    init() {
        Panel.prototype.init.call(this);
        this._onAfterRenderingFirstTimeExecuted = false;
        this._liveChangeTimer = 0;
        this.setWidth("100%");
        this.setHeight("100%");
        this.setHeaderToolbar(
            new OverflowToolbar({
                content: [
                    new Title({ text: "{i18n>entity_sideFilterBar_title}" }),
                    new ToolbarSpacer(),
                    new Button({
                        icon: "sap-icon://add",
                        tooltip: "{i18n>entity_sideFilterBar_newFilter}",
                        type: ButtonType.Transparent,
                        press: () => {
                            this._addNewFilter();
                        }
                    }),
                    new Button({
                        icon: "sap-icon://delete",
                        tooltip: "{i18n>entity_sideFilterBar_deleteAllFilters}",
                        type: ButtonType.Transparent,
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
    onAfterRendering(event: jQuery.Event) {
        // do custom afterRendering
        Panel.prototype.onAfterRendering.call(this, event);
    }
    onBeforeRendering(event: jQuery.Event) {
        Panel.prototype.onBeforeRendering.call(this, event);
        // do custom beforeRendering
    }
    exit() {
        Panel.prototype.exit.call(this);
    }

    _addNewFilter() {
        this._filterContainer.addContent(this._createQuickFilter("New Filter"));
    }
    _createQuickFilter(columnName: string) {
        return new QuickFilter({ columnName });
    }
}
