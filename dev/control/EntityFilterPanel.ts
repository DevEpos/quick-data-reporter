import ResizeAdapter from "../helper/ResizeAdapter";
import SideFilterPanel from "./SideFilterPanel";

import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";

/**
 * Entity filter panel which holds a panel for the field filters
 * and an optional panel for parameters (e.g. from a CDS view)
 *
 * @namespace com.devepos.qdrt.control
 */
export default class EntityFilterPanel extends Control {
    metadata = {
        properties: {},
        aggregations: {
            filterPanel: {
                type: "com.devepos.qdrt.control.SideFilterPanel",
                multiple: false,
                singularName: "filterPanel"
            },
            parameterPanel: {
                type: "com.devepos.qdrt.control.SideFilterPanel",
                multiple: false,
                singularName: "parameterPanel"
            }
        }
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
        render(rm: RenderManager, panel: EntityFilterPanel): void {
            // create a wrapper element with some styling
            rm.openStart("div", panel);
            rm.class("deveposQdrt-EntityFilterPanel");
            rm.openEnd();

            const parameterPanel = panel.getParameterPanel();
            const filterPanel = panel.getFilterPanel();
            if (parameterPanel && parameterPanel.getVisible()) {
                rm.renderControl(parameterPanel);
            }
            if (filterPanel) {
                rm.renderControl(filterPanel);
            }
            rm.close("div");
        }
    };
    private _resizeAdapter: ResizeAdapter;

    //#region generated methods by metadata
    getFilterPanel?(): SideFilterPanel;
    getParameterPanel?(): SideFilterPanel;
    //#endregion

    onBeforeRendering(): void {
        if (!this._resizeAdapter && this.getParameterPanel()) {
            this._resizeAdapter = new ResizeAdapter(this.getParameterPanel(), this._onParamPanelResize.bind(this));
        }
    }
    onAfterRendering(): void {
        if (this._resizeAdapter && !this._resizeAdapter.isResizeInitialized()) {
            this._resizeAdapter.initializeResize();
        }
    }
    exit(): void {
        if (this._resizeAdapter) {
            this._resizeAdapter.destroy();
        }
    }
    private _onParamPanelResize() {
        const domRef = this.getFilterPanel()?.getDomRef() as HTMLElement;
        if (!domRef) {
            return;
        }
        const oldCSSHeight = domRef.style.height;

        const newCSSHeight = `calc(${this.getFilterPanel().getHeight()} - ${domRef.offsetTop}px)`;

        if (newCSSHeight !== oldCSSHeight) {
            domRef.style.height = newCSSHeight;
        }
    }
}
