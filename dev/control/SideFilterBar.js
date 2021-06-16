import Control from "sap/ui/core/Control";

/**
 * FilterBar with vertical orientation
 *
 * @namespace devepos.qdrt.control
 */
export default class SideFilterBar extends Control {
    metadata = {
        properties: {},
        defaultAggregation: "filters",
        aggregations: {
            /**
             * Holds the current filters of the SideFilterBar
             */
            filters: { type: "devepos.qdrt.control.QuickFilter", multiple: true, singularName: "filter" }
        },
        events: {}
    };
    init() {}
    onAfterRendering() {}
    onBeforeRendering() {}
    exit() {}
}
