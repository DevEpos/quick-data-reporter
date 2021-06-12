import Control from "sap/ui/core/Control";

/**
 * Control with a main part and a toggleable side content.
 *
 * @namespace devepos.qdrt.control
 */
export default class ToggleableSideContent extends Control {
    metadata = {
        properties: {
            /**
             * Defines if the side content view will be shown or not
             */
            sideContentVisible: { type: "boolean", group: "Misc", defaultValue: true },
            /**
             * Width of the side content
             */
            sideContentWidth: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "350px" },
            /**
             * Position of the side content. The default position is on the right side
             */
            sideContentPosition: { type: "sap.ui.layout.SideContentPosition", group: "Appearance", defaultValue: "End" }
        },
        defaultAggregation: "content",
        aggregations: {
            /**
             * Main content which normally should hold a table control like
             * @see sap.m.Table
             */
            content: { type: "sap.ui.core.Control", multiple: false, singularName: "content" },
            /**
             * The side control
             */
            sideContent: { type: "sap.ui.core.Control", multiple: false, singularName: "sideContent" }
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
