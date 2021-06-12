class SideFilterViewRenderer {
    apiVersion = 2;

    /**
     * Renders the HTML for the given control, using the provided
     * {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} rm
     *            the RenderManager that can be used for writing to
     *            the Render-Output-Buffer
     * @param {sap.ui.core.Control} sideFilterView
     *            the side Filter view
     */
    render(rm, sideFilterView) {
        // open main control
        rm.openStart("div", sideFilterView);
        rm.class("deveposQdrtSideFilterView");
        rm.openEnd();

        let filterWidth;
        let contentWidth = "";
        const sideFilterVisible = sideFilterView.getSideFilterVisible();

        if (!sideFilterVisible) {
            contentWidth = "100%";
        } else {
            // calculate width of content and side filter
            filterWidth = sideFilterView.getSideFilterWidth();
            if (!filterWidth) {
                // reset to default size
                filterWidth = "450px";
            }

            if (filterWidth.endsWith("%")) {
                const filterWidthNumeric = filterWidth.match(/(\d+)%/)[1];
                contentWidth = `${100 - filterWidthNumeric}%`;
            } else {
                contentWidth = `calc(100% - ${filterWidth})`;
            }
        }

        // open main content
        rm.openStart("section", sideFilterView.getId() + "-content");
        rm.class("deveposQdrtSideFilterViewContent");
        rm.style("width", contentWidth);
        rm.openEnd();

        rm.renderControl(sideFilterView.getContent());

        // close main content
        rm.close("section");

        if (sideFilterVisible) {
            // open side filter
            rm.openStart("section", sideFilterView.getId() + "-sideFilter");
            rm.class("deveposQdrtSideFilterViewSideFilter");
            rm.style("width", filterWidth);
            rm.openEnd();

            rm.renderControl(sideFilterView.getSideFilter());

            // close side filter
            rm.close("section");
        }

        // close main control
        rm.close("div");
    }
}

export default new SideFilterViewRenderer();
