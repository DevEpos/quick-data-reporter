import models from "../model/models";
import deepExtend from "sap/base/util/deepExtend";
import Fragment from "sap/ui/core/Fragment";

/**
 * Table settings for a database entity
 *
 * @alias devepos.qdrt.model.util.EntityTableSettings
 */
export default class EntityTableSettings {
    /**
     * Creates a new TableSettings
     * @param {sap.ui.core.mvc.View} the view where the dialog is called in
     */
    constructor(view) {
        this._view = view;
        this._entityType = "";
        this._entityName = "";
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
    destroyDialog() {
        if (this._settingsDialog) {
            this._view?.removeDependent(this._settingsDialog);
            this._settingsDialog.destroy();
            this._settingsDialog = null;
            this._columnsPanel = null;
            this._groupPanel = null;
            this._sortPanel = null;
        }
    }
    /**
     * Sets the column metadata for the current entity
     * @param {Object} columnMetadata column metadata for the entity
     */
    setColumnMetadata(columnMetadata) {
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
        this._model.updateBindings();
    }

    setSortItems(sortItems) {}

    /**
     * Shows the settings
     */
    async showSettingsDialog() {
        if (!this._settingsDialog) {
            this._settingsDialog = await Fragment.load({
                id: this._view.getId(),
                name: "devepos.qdrt.fragment.EntitySettingsDialog",
                controller: this
            });
            this._view.addDependent(this._settingsDialog);
            this._settingsDialog.setModel(this._model);
            this._columnsPanel = this._view.byId("columnsPanel");
            this._sortPanel = this._view.byId("sortPanel");
            this._groupPanel = this._view.byId("groupPanel");
        }
        // TODO: save current state of model
        // this.dataBeforeOpen = deepExtend({}, this._model.getData());
        this._settingsDialog.open();
    }

    /**
     * Sets information of the entity
     * @param {String} type the type of the entity
     * @param {String} name the name of the entity
     */
    setEntityInfo(type, name) {
        this._entityType = type;
        this._entityName = name;
    }

    onCancel(event) {
        // TODO: reset model to state before open dialog
        this._settingsDialog.close();
    }
    onReset(event) {
        // TODO: restore initial table settings
    }
    onOK(event) {
        this._settingsDialog.close();
    }
    /**
     * Handler for when group items are added, updated or removed 
     * @param {Object} event event payload
     */
    onGroupItemUpdate(event) {
        // TODO: adjust available sort/columns and current sort/columns
    }
}
