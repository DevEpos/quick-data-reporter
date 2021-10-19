import AjaxJSONModel from "../model/AjaxJSONModel";

/**
 * Read only data of the state
 */
export type ReadOnlyStateData<T> = { +readonly [P in keyof T]: T[P] };

/**
 * Base for all state classes
 */
export default class BaseState<T> {
    protected data: T;
    protected noModelUpdates: boolean;
    private _model: AjaxJSONModel;
    private _observeModelChanges: boolean;

    constructor(stateData: T, observeModelChanges?: boolean) {
        this._observeModelChanges = observeModelChanges;
        this.setStateData(stateData);
    }

    turnOffModelUpdate(): void {
        this.noModelUpdates = true;
    }

    turnOnModelUpdate(): void {
        this.noModelUpdates = false;
    }

    /**
     * Returns the current state data as readonly
     * @returns the current state data
     */
    getData(): ReadOnlyStateData<T> {
        return this.data;
    }

    /**
     * Returns the model of the state
     * @returns the model of the state
     */
    getModel(): AjaxJSONModel {
        if (!this._model) {
            this._model = new AjaxJSONModel(this.data as any, this._observeModelChanges);
        }
        return this._model;
    }

    /**
     * Updates the model
     * @param forceUpdate whether or not a model update should be forced
     */
    updateModel(forceUpdate?: boolean): void {
        if (this.noModelUpdates) {
            return;
        }
        if (this._model) {
            this._model.updateBindings(forceUpdate);
            this.data = this._model.getData();
        }
    }

    /**
     * Complete update of the state object
     * @param stateData the new data for the object
     */
    protected setStateData(stateData: T): void {
        this.data = stateData;
        if (this._model) {
            this._model.setData(this.data as any);
        } else {
            this.getModel();
        }
    }
}
