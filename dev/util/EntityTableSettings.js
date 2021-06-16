import models from "../model/models";
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
            this._settingsDialog.destroy();
            this._settingsDialog = null;
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
        }
        // TODO: Store state of model
        // this.oDataBeforeOpen = deepExtend({}, this.oJSONModel.getData());
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
        this._settingsDialog.close();
    }
    onReset(event) {}
    onOK(event) {
        this._settingsDialog.close();
    }
}
