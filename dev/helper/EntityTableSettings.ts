import models from "../model/models";
import { ReadOnlyStateData } from "../state/BaseState";
import { AggregationCond, ColumnConfig, FieldMetadata, SortCond } from "../model/ServiceModel";
import Entity, { ConfigurableEntity } from "../model/Entity";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import P13nGroupPanel from "sap/m/P13nGroupPanel";
import P13nDialog from "sap/m/P13nDialog";
import Event from "sap/ui/base/Event";
import P13nConditionPanel from "sap/m/P13nConditionPanel";
import { P13nConditionOperation } from "sap/m/library";
import deepClone from "sap/base/util/deepClone";

type SettingsModelData = {
    columnMetadata: FieldMetadata[];
    allColumnMetadata: FieldMetadata[];
    columnsItems: ColumnConfig[];
    sortCond: SortCond[];
    aggregationCond: AggregationCond[];
};
/**
 * Table settings for a database entity
 *
 * @alias com.devepos.qdrt.model.util.EntityTableSettings
 */
export default class EntityTableSettings {
    private _view: View;
    private _dialogPromise: { resolve: (result: ConfigurableEntity) => void };
    private _okPayload: ConfigurableEntity;
    private _model: JSONModel;
    private _settingsDialog: P13nDialog;
    private _groupCondPanel: P13nConditionPanel;
    private _sortCondPanel: P13nConditionPanel;
    private _modelCurrentState: SettingsModelData;

    /**
     * Creates a new TableSettings
     * @param {sap.ui.core.mvc.View} view the view where the dialog is called in
     */
    constructor(view: View) {
        this._view = view;
        this._model = models.createViewModel();
    }
    destroyDialog(): void {
        if (this._settingsDialog) {
            this._view?.removeDependent(this._settingsDialog);
            this._settingsDialog.destroy();
            this._settingsDialog = null;
            this._groupCondPanel = null;
            this._sortCondPanel = null;
        }
    }
    /**
     * Shows the settings
     * @param state the current entity state for the settings dialog
     */
    async showSettingsDialog(state: ReadOnlyStateData<Entity>): Promise<ConfigurableEntity> {
        this._updateInternalModel(state);
        if (!this._settingsDialog) {
            this._settingsDialog = await Fragment.load({
                id: this._view.getId(),
                name: "com.devepos.qdrt.fragment.EntitySettingsDialog",
                controller: this
            });
            this._view.addDependent(this._settingsDialog);
            this._settingsDialog.attachAfterClose(() => {
                this.destroyDialog();
                this._dialogPromise.resolve(this._okPayload);
            });
            this._settingsDialog.setModel(this._model);
            // retrieve conditionPanel of Group Panel
            const groupPanelContent = (this._view.byId("groupPanel") as P13nGroupPanel).getAggregation("content");
            if (Array.isArray(groupPanelContent)) {
                this._groupCondPanel = groupPanelContent[0] as P13nConditionPanel;
            }
            // retrieve conditionPanel of Sort Panel
            const sortPanelContent = (this._view.byId("sortPanel") as P13nGroupPanel).getAggregation("content");
            if (Array.isArray(sortPanelContent)) {
                this._sortCondPanel = sortPanelContent[0] as P13nConditionPanel;
            }
        }
        return new Promise(resolve => {
            this._dialogPromise = { resolve };
            this._settingsDialog.open();
        });
    }
    onCancel(): void {
        this._okPayload = null;
        this._settingsDialog.close();
    }
    onReset(): void {
        this._modelCurrentState.allColumnMetadata = [...this._modelCurrentState.columnMetadata];
        this._modelCurrentState.columnsItems.length = 0;
        this._modelCurrentState.sortCond.length = 0;
        this._modelCurrentState.aggregationCond.length = 0;

        let colIndex = 0;
        for (const column of this._modelCurrentState.columnMetadata) {
            this._modelCurrentState.columnsItems.push({
                fieldName: column.name,
                visible: true,
                index: colIndex++
            });
        }
        this._model.setData({
            columnMetadata: this._modelCurrentState.columnMetadata.slice(0),
            allColumnMetadata: this._modelCurrentState.allColumnMetadata.slice(0),
            columnsItems: deepClone(this._modelCurrentState.columnsItems),
            sortCond: deepClone(this._modelCurrentState.sortCond),
            aggregationCond: deepClone(this._modelCurrentState.aggregationCond)
        });
    }
    onOK(): void {
        this._okPayload = this._model.getData();
        this._settingsDialog.close();
    }
    onChangeColumnsItems(event: Event): void {
        const modelData = this._model.getData() as SettingsModelData;
        modelData.columnsItems = (event.getParameter("items") as any[])?.map(p13nColItem => {
            return {
                fieldName: p13nColItem.columnKey,
                index: p13nColItem.index,
                visible: p13nColItem.visible
            };
        });
        if (modelData.aggregationCond?.length > 0) {
            for (const colItem of modelData.columnsItems) {
                const groupItem = modelData.aggregationCond.find(item => item.fieldName === colItem.fieldName);
                if (groupItem) {
                    groupItem.showIfGrouped = colItem.visible;
                }
            }
        }
        this._model.updateBindings(true);
    }
    onSortItemUpdate(): void {
        const modelData = this._model.getData() as SettingsModelData;
        const sortConditions = this._sortCondPanel?.getConditions() || [];
        modelData.sortCond.length = 0;
        for (const sortCond of sortConditions) {
            modelData.sortCond.push({
                fieldName: (sortCond as any).keyField,
                sortDirection: (sortCond as any).operation
            });
        }
        this._model.updateBindings(false);
    }
    onGroupItemUpdate(): void {
        const modelData = this._model.getData() as SettingsModelData;
        const groupConditions = this._groupCondPanel?.getConditions();
        modelData.sortCond.length = 0;
        modelData.aggregationCond.length = 0;
        if (groupConditions?.length > 0) {
            const updatedColumns = [];
            const groupFieldKeys: string[] = [];
            for (const groupCondItem of groupConditions) {
                let index = 0;
                const keyField = (groupCondItem as any).keyField;
                modelData.aggregationCond.push({
                    fieldName: keyField,
                    showIfGrouped: (groupCondItem as any).showIfGrouped
                });
                modelData.sortCond.push({
                    fieldName: keyField,
                    sortDirection: P13nConditionOperation.Ascending
                });
                groupFieldKeys.push(keyField);

                const existingColumn = modelData.columnsItems.find(col => col.fieldName === keyField);
                if (existingColumn) {
                    existingColumn.visible = (groupCondItem as any).showIfGrouped;
                    updatedColumns.push(existingColumn);
                } else {
                    updatedColumns.push({
                        fieldName: keyField,
                        visible: (groupCondItem as any).showIfGrouped,
                        index
                    });
                }
                index++;
            }
            modelData.columnsItems = updatedColumns;
            modelData.allColumnMetadata = modelData.columnMetadata.filter(colMeta =>
                groupFieldKeys.includes(colMeta.name)
            );
        } else {
            // remove all dependent information on group items
            modelData.columnsItems.length = 0;
            modelData.allColumnMetadata = [...modelData.columnMetadata];
            for (const columnMeta of modelData.columnMetadata) {
                modelData.columnsItems.push({
                    fieldName: columnMeta.name,
                    visible: true
                });
            }
        }
        this._model.updateBindings(true);
    }

    private _updateInternalModel(state: ReadOnlyStateData<Entity>) {
        this._modelCurrentState = {
            columnMetadata: state.metadata.fields,
            allColumnMetadata: [],
            columnsItems: [...state.columnsItems],
            sortCond: [...state.sortCond] || [],
            aggregationCond: [...state.aggregationCond] || []
        };
        if (this._modelCurrentState.aggregationCond?.length > 0) {
            const aggrItemKeys = this._modelCurrentState.aggregationCond.map(aggrItem => aggrItem.fieldName);
            this._modelCurrentState.allColumnMetadata = this._modelCurrentState.columnMetadata.filter(colItem =>
                aggrItemKeys.includes(colItem.name)
            );
        } else {
            this._modelCurrentState.allColumnMetadata = [...this._modelCurrentState.columnMetadata];
        }

        this._model.setData({
            columnMetadata: this._modelCurrentState.columnMetadata.slice(0),
            allColumnMetadata: this._modelCurrentState.allColumnMetadata.slice(0),
            columnsItems: deepClone(this._modelCurrentState.columnsItems),
            sortCond: deepClone(this._modelCurrentState.sortCond),
            aggregationCond: deepClone(this._modelCurrentState.aggregationCond)
        });
    }
}
