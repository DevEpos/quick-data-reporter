import FlexBox from "sap/m/FlexBox";
import { FlexAlignItems, FlexJustifyContent } from "sap/m/library";
import Control from "sap/ui/core/Control";
import Icon from "sap/ui/core/Icon";
import Title from "sap/m/Title";
import RenderManager from "sap/ui/core/RenderManager";

/**
 * Panel for customization like Column settings, Filter criteria, etc.
 * @namespace com.devepos.qdrt.control
 */
export default class CustomizationPanel extends Control {
    metadata = {
        properties: {
            title: { type: "String", group: "Misc" },
            icon: { type: "sap.ui.core.URI", group: "Appearance" }
        },
        defaultAggregation: "content",
        aggregations: {
            content: { type: "sap.ui.core.Control", multiple: true, singularName: "content" }
        },
        events: {}
    };
    renderer = {
        apiVersion: 2,

        /**
         * Renders the HTML for the given control, using the provided
         * {@link sap.ui.core.RenderManager}.
         *
         * @param rm the RenderManager that can be used for writing to the Render-Output-Buffer
         * @param panel the side customziation panel to render
         */
        render(rm: RenderManager, panel: CustomizationPanel): void {
            // create a wrapper element with some styling
            rm.openStart("div", panel);
            rm.class("deveposQdrt-CustomizationPanel");
            rm.openEnd();

            // render the header
            rm.openStart("header", panel.getId() + "-header");
            rm.openEnd();
            rm.renderControl(panel.getHeader());
            rm.close("header");

            const contentItems = panel.getContent();
            if (contentItems?.length > 0) {
                rm.openStart("div", panel.getId() + "-content");
                rm.openEnd();
                // render content aggregation
                for (const contentItem of contentItems) {
                    if (contentItem.getVisible()) {
                        rm.renderControl(contentItem);
                    }
                }
                rm.close("div");
            }
            rm.close("div");
        }
    };
    private _icon: Icon;
    private _titleControl: Title;
    private _headerBox: FlexBox;

    constructor(idOrSettings?: string | $CustomizationPanelSetting);
    constructor(id?: string, settings?: $CustomizationPanelSetting);
    constructor(id?: string, settings?: $CustomizationPanelSetting) {
        super(id, settings);
    }

    getHeader(): FlexBox {
        if (this._headerBox) {
            // update the icon
            this._getIconControl();
        } else {
            this._headerBox = new FlexBox({
                alignItems: FlexAlignItems.Center,
                justifyContent: FlexJustifyContent.Start,
                items: [this._getIconControl(), this._getTitleControl()]
            });
        }
        return this._headerBox;
    }

    exit(): void {
        // it is enough to dispose of the header box as the icon and title are aggregations
        // of the box
        if (this._headerBox) {
            this._headerBox.destroy();
        }
    }
    /**
     * Lazily creates the icon control
     * @returns the control for the icon URI
     */
    private _getIconControl(): Icon {
        if (this._icon) {
            this._icon.setSrc(this.getIcon());
        } else {
            this._icon = new Icon({
                src: this.getIcon()
            });
        }
        return this._icon;
    }

    /**
     * Lazily creates the icon control
     * @returns the title control to hold the title
     */
    private _getTitleControl(): Title {
        if (this._titleControl) {
            this._titleControl.setText(this.getTitle());
        } else {
            this._titleControl = new Title({
                text: this.getTitle(),
                titleStyle: "H4"
            });
            this._titleControl.addStyleClass("deveposQdrt-CustomizationPanel__HeaderTitle");
        }
        return this._titleControl;
    }
}
