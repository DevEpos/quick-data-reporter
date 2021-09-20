import { EntityType } from "./ServiceModel";
import I18nUtil from "../helper/I18nUtil";

/**
 * Returns the icon string for the given entity type
 * @param type the type of an entity
 * @returns the corresponding type for an entity type
 */
export function entityTypeIconFormatter(type: EntityType): string {
    switch (type) {
        case EntityType.CdsView:
            return "sap-icon://customer-view";
        case EntityType.Table:
            return "sap-icon://grid";
        case EntityType.View:
            return "sap-icon://table-view";
        default:
            return null; // an empty string will raise an error in an Icon control
    }
}
/**
 * Returns the tooltip for the given entity type
 * @param type the type of an entity
 * @returns the corresponding tooltip for an entity type
 */
export function entityTypeTooltipFormatter(type: EntityType): string {
    switch (type) {
        case EntityType.CdsView:
            return I18nUtil.getText("dbEntity_type_cds");
        case EntityType.Table:
            return I18nUtil.getText("dbEntity_type_table");
        case EntityType.View:
            return I18nUtil.getText("dbEntity_type_view");
        default:
            return "";
    }
}
