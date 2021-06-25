import Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import JSONListBinding from "sap/ui/model/json/JSONListBinding";
import JSONModel from "sap/ui/model/json/JSONModel";
import Sorter from "sap/ui/model/Sorter";
/**
 * Custom List Binding that supports paging
 *
 * @alias devepos.qdrt.model.rest.RESTListBinding
 */
export default class RESTListBinding extends JSONListBinding {
    /**
     * Creates new list binding
     * @param model Model instance that this binding is created for and that it belongs to
     * @param path Binding path to be used for this binding
     * @param context Binding context relative to which a relative binding path will be resolved
     * @param sorters Initial sort order (can be either a sorter or an array of sorters)
     * @param filters Predefined filter/s (can be either a filter or an array of filters)
     * @param parameters Map of optional parameters as defined by subclasses; this class does not introduce any own parameters
     */
    constructor(
        model: JSONModel,
        path: string,
        context: Context,
        sorters?: Sorter | Sorter[],
        filters?: Filter | Filter[],
        parameters?: object
    ) {
        super(model, path, context, sorters, filters, parameters);
    }
    getLength(): int {
        return 0;
    }
}
