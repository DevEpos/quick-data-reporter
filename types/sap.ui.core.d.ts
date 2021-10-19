// Expose some needed properties/methods that are not included
// in the public interface

import Context from "sap/ui/model/Context";
import Model from "sap/ui/model/Model";
import Binding from "sap/ui/model/Binding";

declare module "sap/ui/model/Model" {
    export default interface Model {
        iSizeLimit: number;
        getContext(path: string): Context;
        getBindings(): Binding[];
    }
}

declare module "sap/ui/model/Binding" {
    export default interface Binding<T extends Model> {
        oModel: T;
        sPath: string;
        oContext: Context;
        bSuspended: boolean;
        _fireChange(parameters: object): void;
        _fireRefresh(parameters: object): void;
        getContext(): Context;
    }
}

declare module "sap/ui/model/ListBinding" {
    import Binding from "sap/ui/model/Binding";
    export default interface ListBinding<T extends Model> extends Binding<T> {
        getContextData(context: Context): any;
    }
}

declare module "sap/ui/model/json/JSONModel" {
    export default interface JSONModel {
        oData: object;
        bObserve: boolean;
        checkUpdate(forceUpdate?: boolean, async?: boolean): void;
        resolve(path: string, context?: object): string;
        _getObject(path: string, context?: object): any;
        observeData(): void;
    }
}
