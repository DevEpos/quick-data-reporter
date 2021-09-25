// Define any types that should be globally available

import Button from "sap/m/Button";
import Text from "sap/m/Text";

/**
 * Helper interface to work with implementation part of the
 * types sap.ui.model.Model and sap.ui.model.json.JSONModel
 */
interface JSONModelImpl {
    oData: object;
    bObserve: boolean;
    checkUpdate(forceUpdate?: boolean, async?: boolean): void;
    resolve(path: string, context?: object): string;
    _getObject(path: string, context?: object): any;
    observeData(): void;
}

interface ResizableControl {
    setHeight?(height: string): void;
    getHeight?(): string;
    setWidth?(width: string): void;
    getWidth?(): string;
}

/**
 * Helper interface to work with private implementation part
 * of the class sap.ui.comp.valuehelpdialog.ValueHelpDialog
 */
interface ValueHelpDialogImpl {
    oSelectionTitle: Text;
    oSelectionButton: Button;
    resetTableState();
    _rotateSelectionButtonIcon(flag: boolean);
}
