import Control from "sap/ui/core/Control";

/**
 * Quick Filter in {@link devepos.qdrt.control.SideFilterBar}
 *
 * @namespace devepos.qdrt.control
 */
export default class QuickFilter extends Control {
    metadata = {
        properties: {},
        defaultAggregation: "content",
        aggregations: {
            /**
             * Control for the filter
             */
            content: { type: "sap.ui.core.Control", multiple: true, singularName: "content" }
        },
        events: {}
    };
    init() {}
    onAfterRendering() {}
    onBeforeRendering() {}
    exit() {}
}
