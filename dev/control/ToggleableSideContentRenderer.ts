import RenderManager from "sap/ui/core/RenderManager";
import { SideContentPosition } from "sap/ui/layout/library";
import ToggleableSideContent from "./ToggleableSideContent";

/**
 * Renderer for the {@link devepos.qdrt.control.ToggleableSideContent} control
 */
class ToggleableSideContentRenderer {
    apiVersion = 2;

    /**
     * Renders the HTML for the given control, using the provided
     * {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} rm
     *            the RenderManager that can be used for writing to
     *            the Render-Output-Buffer
     * @param {sap.ui.core.Control} toggleableSideContent
     *            the side Filter view
     */
    render(rm: RenderManager, toggleableSideContent: ToggleableSideContent) {
        // open main control
        rm.openStart("div", toggleableSideContent);
        rm.class("deveposQdrt-ToggleableSideContent");
        rm.openEnd();

        let sideContentWidth;
        let contentWidth = "";
        let sideContentPosition = toggleableSideContent.getSideContentPosition();
        if (!sideContentPosition) {
            sideContentPosition = SideContentPosition.End;
        }
        const sideContentVisible = toggleableSideContent.getSideContentVisible();

        if (!sideContentVisible) {
            contentWidth = "100%";
        } else {
            // calculate width of content and side filter
            sideContentWidth = toggleableSideContent.getSideContentWidth();
            if (!sideContentWidth) {
                // reset to default size
                sideContentWidth = "450px";
            }

            if (sideContentWidth.endsWith("%")) {
                const filterWidthNumeric = sideContentWidth.match(/(\d+)%/)[1];
                contentWidth = `${100 - (filterWidthNumeric as unknown as number)}%`;
            } else {
                contentWidth = `calc(100% - ${sideContentWidth})`;
            }
        }

        if (sideContentPosition === SideContentPosition.Begin) {
            this._renderSideContent(rm, toggleableSideContent, sideContentWidth, sideContentVisible);
            this._renderMain(rm, toggleableSideContent, contentWidth);
        } else {
            this._renderMain(rm, toggleableSideContent, contentWidth);
            this._renderSideContent(rm, toggleableSideContent, sideContentWidth, sideContentVisible);
        }

        // close main control
        rm.close("div");
    }

    /**
     * Renders the main content
     */
    _renderMain(rm: RenderManager, toggleableSideContent: ToggleableSideContent, width: string) {
        // open main content
        rm.openStart("section", toggleableSideContent.getId() + "-content");
        rm.class("deveposQdrt-ToggleableSideContent__Content");
        rm.style("width", width);
        rm.openEnd();

        rm.renderControl(toggleableSideContent.getContent());

        // close main content
        rm.close("section");
    }

    /**
     * Renders the side content
     */
    _renderSideContent(
        rm: RenderManager,
        toggleableSideContent: ToggleableSideContent,
        width: string,
        visible: boolean
    ) {
        if (!visible) {
            return;
        }
        // open side filter
        rm.openStart("section", toggleableSideContent.getId() + "-sideContent");
        rm.class("deveposQdrt-ToggleableSideContent__SideContent");
        rm.style("width", width);
        rm.openEnd();

        const sideContentControls = toggleableSideContent.getSideContent();
        for (const sideContentControl of sideContentControls) {
            if (sideContentControl.getVisible()) {
                rm.renderControl(sideContentControl);
            }
        }

        // close side filter
        rm.close("section");
    }
}

export default new ToggleableSideContentRenderer();
