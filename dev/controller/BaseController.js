import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";

/**
 * Base controller for all view controllers
 * @alias devepos.qdrt.controller.BaseController
 * @namespace devepos.qdrt.controller
 */
export default class BaseController extends Controller {
    onInit() {
        this.router = this.getRouter();
    }
    getRouter() {
        return this.getOwnerComponent().getRouter();
    }

    /**
     * Convenience method for getting the view model by name in every controller of the application.
     * @public
     * @param {string} name the model name
     * @returns {sap.ui.model.Model} the model instance
     */
    getModel(name) {
        return this.getView().getModel(name);
    }

    /**
     * Convenience method for setting the view model in every controller of the application.
     * @public
     * @param {sap.ui.model.Model} model the model instance
     * @param {string} name the model name
     * @returns {sap.ui.mvc.View} the view instance
     */
    setModel(model, name) {
        return this.getView().setModel(model, name);
    }

    /**
     * Convenience method for getting the resource bundle.
     * @public
     * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
     */
    getResourceBundle() {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    }

    /**
     * Event handler for navigating back.
     * It there is a history entry we go one step back in the browser history
     * If not, it will replace the current entry of the browser history with the main route.
     * @public
     */
    onNavBack() {
        const previousHash = History.getInstance().getPreviousHash();

        if (previousHash !== undefined) {
            history.go(-1);
        } else {
            this.router.navTo("main", {}, true);
        }
    }
}
