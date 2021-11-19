import { $ControlSettings } from "sap/ui/core/Control";
import SideFilterPanel from "./SideFilterPanel";

declare module "./EntityFilterPanel" {
    interface $EntityFilterPanelSettings extends $ControlSettings {
        filterPanel: SideFilterPanel;
        parameterPanal: SideFilterPanel;
    }

    export default interface EntityFilterPanel {
        getFilterPanel(): SideFilterPanel;
        getParameterPanel(): SideFilterPanel;
    }
}
