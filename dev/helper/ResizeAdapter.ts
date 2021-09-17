import Control from "sap/ui/core/Control";
import ResizeHandler from "sap/ui/core/ResizeHandler";

/**
 * Helper class for connecting a scroll container
 * @namespace com.devepos.qdrt.helper
 */
export default class ResizeAdapter {
    private _resizeCallback: Function;
    private _resizeHandlerId: string;
    private _liveChangeTimer: number;
    private _onAfterRenderingFirstTimeExecuted: boolean;

    /**
     * Creates new Resize adapter instance
     * @param listenerControl the control to check for size updates
     * @param resizeCallback the function to be called if resize was detected
     */
    constructor(listenerControl: Control, resizeCallback: Function) {
        this._resizeCallback = resizeCallback;
        this._resizeHandlerId = ResizeHandler.register(listenerControl, resizeCallback);
    }
    destroy(): void {
        ResizeHandler.deregister(this._resizeHandlerId);
        // ResizeHandler.deregister(this._resizeListener2);
        window.clearTimeout(this._liveChangeTimer);
    }
    isResizeInitialized(): boolean {
        return this._onAfterRenderingFirstTimeExecuted;
    }
    initializeResize(): void {
        // adapt scroll-container very first time to the right size of the browser
        if (!this._onAfterRenderingFirstTimeExecuted) {
            this._onAfterRenderingFirstTimeExecuted = true;

            window.clearTimeout(this._liveChangeTimer);
            this._liveChangeTimer = window.setTimeout(() => {
                this._resizeCallback();
            }, 0);
        }
    }
}
