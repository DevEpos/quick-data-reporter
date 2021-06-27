import models from "../model/models";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import P13nGroupPanel from "sap/m/P13nGroupPanel";
import P13nDialog from "sap/m/P13nDialog";
import Event from "sap/ui/base/Event";
import { IEntityColMetadata } from "../model/ServiceModel";

/**
 * Table settings for a database entity
 *
 * @alias devepos.qdrt.model.util.EntityTableSettings
 */
export default class EntityTableSettings {
    private _view: View;
    private _entityType: string;
    private _entityName: string;
    private _model: JSONModel;
    private _settingsDialog: P13nDialog;
    private _groupPanel: P13nGroupPanel;

    /**
     * Creates a new TableSettings
     * @param {sap.ui.core.mvc.View} view the view where the dialog is called in
     */
    constructor(view: View) {
        this._view = view;
        this._model = models.createViewModel({
            columnMetadata: [],
            p13n: {
                columnsItems: [],
                sortItems: [],
                aggregationItems: [],
                filterItems: []
            }
        });
    }
    destroyDialog(): void {
        if (this._settingsDialog) {
            this._view?.removeDependent(this._settingsDialog);
            this._settingsDialog.destroy();
            this._settingsDialog = null;
            this._groupPanel = null;
        }
    }
    /**
     * Sets the column metadata for the current entity
     * @param {Object} columnMetadata column metadata for the entity
     */
    setColumnMetadata(columnMetadata: IEntityColMetadata[]): void {
        const modelData = this._model.getData();
        modelData.columnMetadata = columnMetadata || [];
        modelData.p13n.columnsItems = [];
        modelData.p13n.sortItems = [];
        modelData.p13n.aggregationItems = [];
        modelData.p13n.filterItems = [];
        for (const column of columnMetadata) {
            modelData.p13n.columnsItems.push({
                columnKey: column.name,
                visible: true
            });
        }
        this._model.updateBindings(false);
    }

    setSortItems(sortItems: any): void {
        return;
    }

    /**
     * Shows the settings
     */
    async showSettingsDialog(): Promise<void> {
        if (!this._settingsDialog) {
            this._settingsDialog = await Fragment.load({
                id: this._view.getId(),
                name: "devepos.qdrt.fragment.EntitySettingsDialog",
                controller: this
            });
            this._view.addDependent(this._settingsDialog);
            // TODO: check Fiori Elements implementation if dialog is destroyed after each call
            // this._settingsDialog.attachAfterClose(() => {
            //     this.destroyDialog();
            // });
            this._settingsDialog.setModel(this._model);
            this._groupPanel = this._view.byId("groupPanel") as P13nGroupPanel;
        }
        // TODO: save current state of model
        // this.dataBeforeOpen = deepExtend({}, this._model.getData());
        this._settingsDialog.open();
    }

    /**
     * Sets information of the entity
     * @param type the type of the entity
     * @param name the name of the entity
     */
    setEntityInfo(type: string, name: string): void {
        this._entityType = type;
        this._entityName = name;
    }

    onCancel(event: Event): void {
        // TODO: reset model to state before open dialog
        this._settingsDialog.close();
        event.getParameter("");
    }
    onReset(event: Event): void {
        // TODO: restore initial table settings
    }
    onOK(event: Event): void {
        this._settingsDialog.close();
    }
    onChangeColumnsItems(event: Event): void {
        this._model.setProperty("/p13n/columnsItems", event.getParameter("items"));
    }
    /**
     * Handler for when group items are added, updated or removed
     * @param event event payload
     */
    onGroupItemUpdate(event: Event): void {
        // TODO: adjust available sort/columns and current sort/columns
    }
}
