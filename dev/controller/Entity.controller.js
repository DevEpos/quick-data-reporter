import BaseController from "./BaseController";
import models from "../model/models";

/**
 * Controller for a single database entity
 *
 * @alias devepos.qdrt.controller.Entity
 */
export default class EntityController extends BaseController {
    /**
     * Initializes entity controller
     *
     */
    onInit() {
        BaseController.prototype.onInit.call(this);
        this._viewModel = models.createViewModel({ entity: {} });
        this.getView().setModel(this._viewModel, "vm");
        this.router.getRoute("entity").attachPatternMatched(this._onEntityMatched, this);
    }

    _onEntityMatched(event) {
        const args = event.getParameter("arguments");
        this._viewModel.setProperty("/entity", {
            type: decodeURIComponent(args.type),
            name: decodeURIComponent(args.entity)
        });
    }
}
