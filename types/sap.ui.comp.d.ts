// Expose some needed properties/methods that are not included
// in the public interface

declare module "sap/ui/comp/valuehelpdialog/ValueHelpDialog" {
    import Text from "sap/m/Text";
    import Button from "sap/m/Button";

    export default interface ValueHelpDialog {
        oSelectionTitle: Text;
        oSelectionButton: Button;
        resetTableState();
        /**
         * Adds or removes a token
         * @private
         */
        _addRemoveTokenByKey(key: string, row: any, add: boolean): void;
        /**
         * Rotates the icon for the collective value help popover
         * @private
         */
        _rotateSelectionButtonIcon(flag: boolean);
    }
}
