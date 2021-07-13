import Control from "sap/ui/core/Control";
import ResizeHandler from "sap/ui/core/ResizeHandler";

/**
 * Helper class for connecting a scroll container
 * @namespace devepos.qdrt.helper
 */
export default class ResizeAdapter {
    _resizableControl: Control;
    _parentControl: Control;
    _parentControlDomSuffix: string;
    _excludedHeightsControls: Control[];
    _liveChangeTimer: number;
    _onAfterRenderingFirstTimeExecuted: boolean;
    _containerResizeListener: string;

    /**
     * Creates new Resize adapter instance
     * @param resizableControl the scroll container whoose height should be set
     * @param parentControl the parent container to get the size for the scroll container
     * @param parentControlDomSuffix optional id suffix to read concrete dom element
     * @param excludedHeightsControls optional array of control whose height should
     *      be subtracted from the scroll container height
     */
    constructor(
        resizableControl: Control,
        parentControl: Control,
        parentControlDomSuffix?: string,
        excludedHeightsControls?: Control[]
    ) {
        if (!(resizableControl as any)?.setHeight) {
            throw Error("Control is not resizable via 'setHeight'");
        }
        this._resizableControl = resizableControl;

        this._parentControl = parentControl;
        this._parentControlDomSuffix = parentControlDomSuffix;
        this._excludedHeightsControls = excludedHeightsControls;
        this._liveChangeTimer = 0;
        this._onAfterRenderingFirstTimeExecuted = false;

        this._containerResizeListener = ResizeHandler.register(this._parentControl, this._onResize.bind(this));
    }
    destroy(): void {
        ResizeHandler.deregister(this._containerResizeListener);
        window.clearTimeout(this._liveChangeTimer);
    }
    isResizeInitialized(): boolean {
        return !this._onAfterRenderingFirstTimeExecuted;
    }
    initializeResize(): void {
        // adapt scroll-container very first time to the right size of the browser
        if (!this._onAfterRenderingFirstTimeExecuted) {
            this._onAfterRenderingFirstTimeExecuted = true;

            window.clearTimeout(this._liveChangeTimer);
            this._liveChangeTimer = window.setTimeout(() => {
                this._onResize();
            }, 0);
        }
    }
    private _onResize(): boolean {
        let resultChanged = false;
        let oldControlHeight;
        let newControlHeight;

        if (this._parentControl) {
            oldControlHeight = this._resizableControl.$().outerHeight();
            newControlHeight = this._parentControl.$(this._parentControlDomSuffix).height();
            if (this._excludedHeightsControls?.length > 0) {
                for (const excludeHeightControl of this._excludedHeightsControls) {
                    newControlHeight -= excludeHeightControl ? excludeHeightControl.$().outerHeight() : 0;
                }
            }

            if (oldControlHeight !== newControlHeight) {
                (this._resizableControl as any).setHeight(`${newControlHeight}px`);
                resultChanged = true;
            }
        }
        return resultChanged;
    }
}
