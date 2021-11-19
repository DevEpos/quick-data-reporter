import Control, { $ControlSettings } from "sap/ui/core/Control";
import { URI } from "sap/ui/core/library";

declare module "./CustomizationPanel" {
    interface $CustomizationPanelSetting extends $ControlSettings {
        title?: string;
        icon?: URI;
        content?: Control[];
    }

    export default interface CustomizationPanel {
        getTitle(): string;
        setTitle(title: string): this;
        getIcon(): URI;
        setIcon(icon: URI): this;
        getContent(): Control[];
        setContent(content: Control[]): this;
        addContent(content: Control): this;
        removeAllContent(): this;
    }
}
