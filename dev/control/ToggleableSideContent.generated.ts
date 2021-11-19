import Control, { $ControlSettings } from "sap/ui/core/Control";
import { CSSSize } from "sap/ui/core/library";
import { SideContentPosition } from "sap/ui/layout/library";

declare module "./ToggleableSideContent" {
    interface $ToggleableSideContentSettings extends $ControlSettings {
        sideContentVisible?: boolean;
        sideContentWidth?: CSSSize;
        sideContentPosition?: SideContentPosition;
        content?: Control;
        sideContent?: Control[];
    }

    export default interface ToggleableSideContent {
        getSideContentVisible(): boolean;
        setSideContentVisible(sideContentVisible: boolean): this;
        getSideContentWidth(): CSSSize;
        setSideContentWidth(sideContentWidth: CSSSize): this;
        getContent(): Control;
        setContent(content: Control): this;
        getSideContent(): Control[];
        removeAllSideContent(): Control[];
        destroySideContent(): this;
        indexOfSideContent(sideContent: Control): number;
        addSideContent(sideContent: Control): this;
        insertSideContent(sideContent: Control, index: number): this;
        removeSideContent(sideContent: number | string | Control): Control;
    }
}
