import { ReadOnlyStateData } from "../state/BaseState";
import Entity from "../model/Entity";

import ResponsivePopover from "sap/m/ResponsivePopover";
import Control from "sap/ui/core/Control";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Event from "sap/ui/base/Event";
import List from "sap/m/List";
import formatMessage from "sap/base/strings/formatMessage";
import ListBinding from "sap/ui/model/ListBinding";
import Filter from "sap/ui/model/Filter";

interface FieldConfig {
    name: string;
    selected: boolean;
}

class PopoverModel {
    fields: FieldConfig[] = [];
    multiSelect = false;
    get hasSelectedItems(): boolean {
        return this.fields?.some(f => f.hasOwnProperty("selected") && f.selected);
    }
    get selectedItemCount(): int {
        let selectedItemCount = 0;
        for (const field of this.fields) {
            if (field.selected) {
                selectedItemCount++;
            }
        }
        return selectedItemCount;
    }
    get selectedFields(): string[] {
        return this.fields.filter(f => f.selected).map(f => f.name);
    }
}

/**
 * Popover to add new filters to side filter bar
 */
export default class AddQuickFiltersPopover {
    formatMessage = formatMessage;
    private _modelData: PopoverModel;
    private _popover: ResponsivePopover;
    private _model: JSONModel;
    private _searchTimer: number;
    private _fieldList: List;
    private _popoverPromise: { resolve: (selectedFields: string[]) => void };
    constructor(entityStateData: ReadOnlyStateData<Entity>) {
        this._createModel(entityStateData);
    }

    /**
     * Shows popover to allow user the selection of one or several fields of
     * the current entity
     * @param sourceButton the button the popover should be opened by
     * @returns Promise with selected field(s)
     */
    async showPopover(sourceButton: Control): Promise<string[]> {
        const popover = await this._createPopover();
        popover.setModel(this._model);
        sourceButton.addDependent(popover);
        this._fieldList = Fragment.byId("addFiltersPopover", "fieldsList") as List;
        return new Promise(resolve => {
            this._popoverPromise = { resolve };
            popover.openBy(sourceButton);
        });
    }

    private _createModel(entityStateData: ReadOnlyStateData<Entity>): void {
        this._modelData = new PopoverModel();
        for (const colMeta of entityStateData?.metadata?.colMetadata) {
            this._modelData.fields.push({
                name: colMeta.name,
                selected: false
            });
        }
        this._model = new JSONModel(this._modelData);
    }

    private async _createPopover(): Promise<ResponsivePopover> {
        this._popover = await Fragment.load({
            id: "addFiltersPopover",
            name: "devepos.qdrt.fragment.AddFilterPopover",
            controller: this
        });
        // this._fieldList = this._popover.getV
        return this._popover;
    }
    onSearchPromptLiveChange(evt: Event): void {
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
        }
        const query = evt.getParameter("newValue");
        this._searchTimer = setTimeout(() => {
            const fieldsBinding = this._fieldList.getBinding("items") as ListBinding;
            if (query) {
                fieldsBinding.filter(new Filter("name", "Contains", query));
            } else {
                fieldsBinding.filter([]);
            }
        }, 300);
    }
    onFieldPress(evt: Event): void {
        const selectedField = ((evt.getSource() as Control)?.getBindingContext()?.getObject() as FieldConfig).name;
        this._popover.close();
        this._popoverPromise.resolve([selectedField]);
    }
    onAcceptSelection(): void {
        this._popover.close();
        this._popoverPromise.resolve(this._modelData.selectedFields);
    }
    onAfterClose(): void {
        this._popover?.destroy();
    }
}
