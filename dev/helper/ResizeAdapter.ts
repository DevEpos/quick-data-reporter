import Control from "sap/ui/core/Control";
import ResizeHandler from "sap/ui/core/ResizeHandler";

/**
 * Helper class for connecting a scroll container
 * @namespace com.devepos.qdrt.helper
 */
export default class ResizeAdapter {
    private _resizableControl: Control;
    private _parentControlDomSuffix: string;
    private _excludedHeightsControls: Control[];
    private _liveChangeTimer: number;
    private _onAfterRenderingFirstTimeExecuted: boolean;
    private _containerResizeListener: string;
    private _excludeDomSiblingsHeights: boolean;

    /**
     * Creates new Resize adapter instance
     * @param resizableControl the control whoose height should be changed
     * @param listenerControl the control which triggers the resize event
     * @param parentControlDomSuffix optional id suffix to read concrete dom element
     * @param excludedHeightsControls optional array of control whose height should
     *      be subtracted from the scroll container height
     * @param excludeDomSiblingsHeights optional flag to indicate if the heights of the DOM
     *      siblings of the resizable control should be excluded
     */
    constructor(
        resizableControl: Control,
        listenerControl: Control,
        parentControlDomSuffix?: string,
        excludedHeightsControls?: Control[],
        excludeDomSiblingsHeights?: boolean
    ) {
        if (!(resizableControl as any)?.setHeight) {
            throw Error("Control is not resizable via 'setHeight'");
        }
        this._resizableControl = resizableControl;

        this._parentControlDomSuffix = parentControlDomSuffix;
        this._excludedHeightsControls = excludedHeightsControls;
        this._excludeDomSiblingsHeights = excludeDomSiblingsHeights;
        this._liveChangeTimer = 0;
        this._onAfterRenderingFirstTimeExecuted = false;

        this._containerResizeListener = ResizeHandler.register(listenerControl, this._onResize.bind(this));
    }
    destroy(): void {
        ResizeHandler.deregister(this._containerResizeListener);
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
                this._onResize();
            }, 0);
        }
    }
    private _onResize(): boolean {
        let resultChanged = false;
        let oldControlHeight;
        let newControlHeight;

        const parentControl = this._resizableControl.getParent() as Control;
        if (parentControl && parentControl instanceof Control) {
            oldControlHeight = this._resizableControl.$().outerHeight();
            newControlHeight = parentControl.$(this._parentControlDomSuffix).height();
            if (this._excludedHeightsControls?.length > 0) {
                for (const excludeHeightControl of this._excludedHeightsControls) {
                    newControlHeight -= excludeHeightControl ? excludeHeightControl.$().outerHeight() : 0;
                }
            }
            if (this._excludeDomSiblingsHeights) {
                const resizableControlDomRef = this._resizableControl.getDomRef();
                for (let i = 0; i < resizableControlDomRef.parentElement.children.length; i++) {
                    const possibleSibling = resizableControlDomRef.parentElement.children[i];
                    if (possibleSibling === resizableControlDomRef) {
                        continue;
                    }
                    newControlHeight -= possibleSibling.clientHeight;
                }
            }
            if (oldControlHeight !== newControlHeight) {
                (this._resizableControl as ResizableControl).setHeight(`${newControlHeight}px`);
                resultChanged = true;
            }
        }
        return resultChanged;
    }
}
