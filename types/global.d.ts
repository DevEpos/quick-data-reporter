// Define any types that should be globally available

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
