import JSONModel from "sap/ui/model/json/JSONModel";

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
    private _model: JSONModel;
    private _observeModelChanges: boolean;

    constructor(stateData: T, observeModelChanges?: boolean) {
        this._observeModelChanges = observeModelChanges;
        this.data = stateData;
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
    getModel(): JSONModel {
        if (!this._model) {
            this._model = new JSONModel(this.data as any, this._observeModelChanges);
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
}
