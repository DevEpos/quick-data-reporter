import { $ControlSettings } from "sap/ui/core/Control";
import { TableFilters } from "../model/Entity";
import { FieldMetadata } from "../model/types";

declare module "./SideFilterPanel" {
    interface $SideFilterPanelSettings extends $ControlSettings {
        availableFilterMetadata?: object;
        visibleFilters?: object;
        filterCategory?: string;
    }

    export default interface SideFilterPanel {
        getAvailableFilterMetadata(): FieldMetadata[];
        setAvailableFilterMetadata(availableFilterMetadata: FieldMetadata[]): this;
        getVisibleFilters(): TableFilters;
        setVisibleFilters(visibleFilters: TableFilters): this;
        getFilterCategory(): FilterCategory;
        setFilterCategory(filterCategory: FilterCategory): this;
    }
}
