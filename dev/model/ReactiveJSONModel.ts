import JSONModel from "sap/ui/model/json/JSONModel";
import jQuery from "sap/ui/thirdparty/jquery";

/**
 * JSON model which is reactive in its nature
 * @namespace devepos.qdrt.model
 */
export default class ReactiveJSONModel extends JSONModel {
    /**
     * Creates new reactive JSON model
     * @param data the JS object for the model
     * @param observe if <code>true</code> all changes to model properties will be observed (experimental)
     */
    constructor(data?: object, observe?: boolean) {
        super(data, observe);
    }

    /**
     * Creates new observer for the property at 'propertyPath'
     * @param propertyPath path to property that should be watched for changes
     * @param onChange function that will be called when the watched property changes
     * @returns this model instance
     */
    addWatcher(propertyPath: string, onChange: (modelData: object) => void): this {
        throw new Error("Not yet implemented");
    }

    /**
     * Creates new computed property at the given path. Any depth is possible.
     * e.g. a model as the following data structure:
     * {
     *      persons: [
     *          { name: "",
     *            hobbies: [
     *              { name: "Skiing" }
     *            ]
     *          }
     *      ]
     * }
     * It is possible to create a computed property named "/computed" or even at hobbie level
     * e.g. /persons/hobbies/computed
     *
     * @param propertyPath
     *      path to the new property. If array is detected in the path the property will be created
     *      at each object in the array
     * @param watchPath paths that should be watched for changes
     * @param compute compute function to calculate the new property value
     * @returns this model instance
     */
    addComputedProperty(
        propertyPath: string,
        watchPath: string | string[] | RegExp | RegExp[],
        compute: (modelData: object) => any
    ): this {
        throw new Error("Not yet implemented");
    }

    /**
     * Sets a new value for the given property at `path` in the model. If the model value changed all
     * interested parties are informed.
     * @param path path of the property
     * @param value value for the property
     * @param context the context which will be used to set the property
     * @param asyncUpdate wheter to update bindings dependent on this property asynchronously
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    setProperty(path: string, value: any, context?: object, asyncUpdate?: boolean): boolean {
        const _this = this as unknown as JSONModelImpl;
        const resolvedPath = _this.resolve(path, context);

        // return if path / context is invalid
        if (!resolvedPath) {
            return false;
        }

        // If data is set on root, call setData instead
        if (resolvedPath == "/") {
            this.setData(value);
            // TODO: notify all watchers and computed properties
            return true;
        }

        const lastSlashIndex = resolvedPath.lastIndexOf("/");
        // In case there is only one slash at the beginning, sObjectPath must contain this slash
        const objectPath = resolvedPath.substring(0, lastSlashIndex || 1);
        const propertyName = resolvedPath.substr(lastSlashIndex + 1);

        const objAtPath = _this._getObject(objectPath);
        if (objAtPath) {
            objAtPath[propertyName] = value;
            _this.checkUpdate(false, asyncUpdate);
            return true;
        }
        return false;
    }

    /**
     * Sets the data, passed as a JS object tree, to the model.
     *
     * @param data the data to set on the model
     * @param merge whether to merge the data instead of replacing it
     */
    setData(data: object, merge?: boolean): void {
        // to access private parts of the Model implementation
        const _this = this as unknown as JSONModelImpl;
        if (merge) {
            // do a deep copy
            _this.oData = jQuery.extend(true, Array.isArray(_this.oData) ? [] : {}, _this.oData, data);
        } else {
            _this.oData = data;
        }
        if (_this.bObserve) {
            _this.observeData();
        }
        _this.checkUpdate();
    }
}
