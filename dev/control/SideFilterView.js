import Control from "sap/ui/core/Control";
import SideFilterViewRenderer from "./SideFilterViewRenderer";

/**
 * Control with a main part
 * @namespace devepos.qdrt.control
 */
export default class SideFilterView extends Control {
    metadata = {
        properties: {
            /**
             * Defines if the side filter view will be shown or not
             */
            sideFilterVisible: { type: "boolean", group: "Misc", defaultValue: true },
            /**
             * Width of the filter control
             */
            sideFilterWidth: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "400px" }
        },
        defaultAggregation: "content",
        aggregations: {
            /**
             * Main content which normally should hold a table control like
             * @see sap.m.Table
             */
            content: { type: "sap.ui.core.Control", multiple: false, singularName: "content" },
            /**
             * The side filter control
             */
            sideFilter: { type: "sap.ui.core.Control", multiple: false, singularName: "sideFilter" }
        },
        events: {}
    };

    /**
     * Initializes the side filter view
     */
    init() {}

    onAfterRendering() {}

    onBeforeRendering() {}

    exit() {}
}
