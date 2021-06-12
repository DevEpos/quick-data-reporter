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
    render(rm, toggleableSideContent) {
        // open main control
        rm.openStart("div", toggleableSideContent);
        rm.class("deveposQdrtToggleableSideContent");
        rm.openEnd();

        let sideContentWidth;
        let contentWidth = "";
        let sideContentPosition = toggleableSideContent.getSideContentPosition();
        if (!sideContentPosition) {
            sideContentPosition = sap.ui.layout.SideContentPosition.End;
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
                contentWidth = `${100 - filterWidthNumeric}%`;
            } else {
                contentWidth = `calc(100% - ${sideContentWidth})`;
            }
        }

        if (sideContentPosition === sap.ui.layout.SideContentPosition.Begin) {
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
    _renderMain(rm, toggleableSideContent, width) {
        // open main content
        rm.openStart("section", toggleableSideContent.getId() + "-content");
        rm.class("deveposQdrtToggleableSideContentContent");
        rm.style("width", width);
        rm.openEnd();

        rm.renderControl(toggleableSideContent.getContent());

        // close main content
        rm.close("section");
    }

    /**
     * Renders the side content
     */
    _renderSideContent(rm, toggleableSideContent, width, visible) {
        if (!visible) {
            return;
        }
        // open side filter
        rm.openStart("section", toggleableSideContent.getId() + "-sideFilter");
        rm.class("deveposQdrtToggleableSideContentSideContent");
        rm.style("width", width);
        rm.openEnd();

        rm.renderControl(toggleableSideContent.getSideContent());

        // close side filter
        rm.close("section");
    }
}

export default new ToggleableSideContentRenderer();
