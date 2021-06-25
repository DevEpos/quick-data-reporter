import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import Model from "sap/ui/model/Model";
import QdrtComponent from "../Component";

/**
 * Base controller for all view controllers
 * @alias devepos.qdrt.controller.BaseController
 * @namespace devepos.qdrt.controller
 */
export default class BaseController extends Controller {
    protected router: Router;
    onInit() {
        this.router = this.getRouter() as Router;
    }
    getOwnerComponent(): QdrtComponent {
        return <QdrtComponent>super.getOwnerComponent();
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
    getModel(name: string): Model {
        return this.getView().getModel(name);
    }

    /**
     * Convenience method for setting the view model in every controller of the application.
     * @public
     * @param {sap.ui.model.Model} model the model instance
     * @param {string} name the model name
     */
    setModel(model: Model, name: string) {
        this.getView().setModel(model, name);
    }

    /**
     * Convenience method for getting the resource bundle.
     * @returns the resourceModel of the component
     */
    getResourceBundle(): ResourceBundle {
        return this.getOwnerComponent().getResourceBundle();
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
            // @ts-ignore - navTo method has only 3 parameters on lower versions
            this.router.navTo("main", {}, true);
        }
    }
}
