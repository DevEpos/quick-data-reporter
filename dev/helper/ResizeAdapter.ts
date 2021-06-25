import ScrollContainer from "sap/m/ScrollContainer";
import Control from "sap/ui/core/Control";
import ResizeHandler from "sap/ui/core/ResizeHandler";

/**
 * Helper class for connecting a scroll container
 * @namespace devepos.qdrt.helper
 */
export default class ResizeAdapter {
    _scrollContainer: ScrollContainer;
    _parentControl: Control;
    _parentControlDomSuffix: string;
    _excludedHeightsControls: Control[];
    _liveChangeTimer: number;
    _onAfterRenderingFirstTimeExecuted: boolean;
    _containerResizeListener: string;

    /**
     * Creates new Resize adapter instance
     * @param {sap.m.ScrollContainer} scrollContainer the scroll container whoose height should be set
     * @param {sap.m.Control} parentControl the parent container to get the size for the scroll container
     * @param {string} parentControlDomSuffix optional id suffix to read concrete dom element
     * @param {sap.m.Control[]} excludedHeightsControls optional array of control whose height should
     *      be subtracted from the scroll container height
     */
    constructor(
        scrollContainer: ScrollContainer,
        parentControl: Control,
        parentControlDomSuffix?: string,
        excludedHeightsControls?: Control[]
    ) {
        this._scrollContainer = scrollContainer;
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
        let oldScrollContainerHeight;
        let newScrollContainerHeight;

        if (this._parentControl) {
            oldScrollContainerHeight = this._scrollContainer.$().outerHeight();
            newScrollContainerHeight = this._parentControl.$(this._parentControlDomSuffix).height();
            if (this._excludedHeightsControls?.length > 0) {
                for (const excludeHeightControl of this._excludedHeightsControls) {
                    newScrollContainerHeight -= excludeHeightControl ? excludeHeightControl.$().outerHeight() : 0;
                }
            }

            if (oldScrollContainerHeight !== newScrollContainerHeight) {
                this._scrollContainer.setHeight(`${newScrollContainerHeight}px`);
                resultChanged = true;
            }
        }
        return resultChanged;
    }
}
