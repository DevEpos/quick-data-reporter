import AjaxListBinding from "./AjaxListBinding";

import Log from "sap/base/Log";
import Binding from "sap/ui/model/Binding";
import Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import JSONModel from "sap/ui/model/json/JSONModel";
import ListBinding from "sap/ui/model/ListBinding";
import Model from "sap/ui/model/Model";
import Sorter from "sap/ui/model/Sorter";

export interface DataResult {
    results: object | [];
    count?: number;
}

export interface AjaxDataProvider {
    /**
     * Fetches data
     * @param startIndex starting index for data retrieval
     * @param length number of entries to be retrieved
     * @param determineLength flag to indicate that the
     * @returns promise with result of request
     */
    getData(startIndex: number, length: number, determineLength?: boolean): Promise<DataResult>;
}

type AjaxPathSettings = {
    path: string;
    dataProvider: AjaxDataProvider;
};

/**
 * Model which enriches the standard JSONModel with optional asynchronous
 * data loading for specified paths in the model
 *
 * @namespace com.devepos.qdrt.model
 */
export default class AjaxJSONModel extends JSONModel {
    private _ajaxListPaths: Record<string, AjaxPathSettings>;
    /**
     * Constructor for new AjaxJSONModel
     * @param data Either the URL where to load the JSON from or a JS object
     * @param observe Whether to observe the JSON data for property changes (experimental)
     */
    constructor(data?: object | string, observe?: boolean) {
        super(data, observe);
        this._ajaxListPaths = {};
    }

    /**
     * Configures a given path in this model as an Ajax Path
     * @param path absolute Binding path
     * @param dataProvider Data Provider which will be used to retrieve data
     */
    setDataProvider(path: string, dataProvider: AjaxDataProvider): void {
        this._ajaxListPaths[path] = {
            path,
            dataProvider
        };
    }

    getProperty(path: string, context?: Context): any {
        const resolvedPath = this.resolve(path, context);
        if (path?.endsWith("$count")) {
            const parentObjPath = resolvedPath.substring(0, resolvedPath.indexOf("$count"));
            const parentObj = this.getObject(parentObjPath);
            return parentObj?.$count ?? 0;
        } else {
            return super.getProperty(path, context);
        }
    }

    /**
     * Resets the data at the given path and refreshes
     * all the binding
     * @param path a resolved path
     */
    refreshListPath(path: string): void {
        if (!path) {
            return;
        }
        if (path === "/") {
            this.oData = []; // can it also be an associative array? (i.e. {})
        } else {
            // the path should already be resolved
            const lastSlashIndex = path.lastIndexOf("/");
            const objectPath = path.substring(0, lastSlashIndex || 1);
            const propertyPath = path.substring(lastSlashIndex + 1);
            if (objectPath) {
                const object = this.getObject(objectPath);
                object[propertyPath] = [];
            }
        }

        // Refresh the binding that match the given path
        const bindings = (this.getBindings() as Binding<Model>[]) || [];
        for (const binding of bindings) {
            let bindingPath: string = binding.getPath();
            if (binding.isRelative()) {
                bindingPath = this.resolve(binding.getPath(), binding.getContext());
            }
            if (bindingPath === path) {
                binding.refresh(false);
            }
        }
    }

    /**
     * Requests data from the server. The data provider to be used for the service call
     * will be determined through the given path. {@link AjaxDataProvider}
     * @param path path to object in the model
     * @param startIndex starting index for data request
     * @param length number of entries to read
     * @param determineLength if <code>true</code> the maximum available length should be determined
     * @returns promise with data response
     */
    async requestData(
        path: string,
        startIndex: number,
        length: number,
        determineLength: boolean,
        successHandler: (data: DataResult) => void
    ): Promise<void> {
        const dataProvider = this._ajaxListPaths[path]?.dataProvider;
        if (!dataProvider) {
            throw new Error(`No Data Provider registered at path ${path}`);
        }
        try {
            const result = await dataProvider.getData(startIndex, length, determineLength);
            this._importData(path, result, startIndex);
            if (successHandler) {
                successHandler(result);
            }
            this.checkUpdate(false, false);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * Creates a new list binding to this model.
     *
     * @param path Binding path, either absolute or relative to a given <code>context</code>
     * @param context Binding context referring to this model
     * @param sorters Initial sort order
     * @param filters Predifined filters
     * @param additionalParams additional binding parameters specific to this model
     * @returns the created List Binding
     */
    bindList(
        path: string,
        context?: Context,
        sorters?: Sorter | Sorter[],
        filters?: Filter | Filter[],
        additionalParams?: object
    ): ListBinding<JSONModel> {
        const absolutePath = this.resolve(path, context);
        if (this._ajaxListPaths.hasOwnProperty(absolutePath)) {
            return new AjaxListBinding(this, path, context);
        }
        // TODO: check the path if an {@see AjaxListBinding} is necessary
        return super.bindList(path, context, sorters, filters, additionalParams);
    }

    private _importData(path: string, data: DataResult, startIndex: number) {
        if (!data?.results || !Array.isArray(data.results)) {
            return;
        }
        const list = this.getObject(path);
        if (!list) {
            Log.error(`No array defined at path '${path}'`);
            return;
        }

        for (let i = 0; i < data.results.length; i++) {
            list[startIndex++] = data.results[i];
        }
    }
}
