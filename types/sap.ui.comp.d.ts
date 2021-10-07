// Expose some needed properties/methods that are not included
// in the public interface

declare module "sap/ui/comp/valuehelpdialog/ValueHelpDialog" {
    import Text from "sap/m/Text";
    import Button from "sap/m/Button";

    export default interface ValueHelpDialog {
        oSelectionTitle: Text;
        oSelectionButton: Button;
        resetTableState();
        _rotateSelectionButtonIcon(flag: boolean);
    }
}
