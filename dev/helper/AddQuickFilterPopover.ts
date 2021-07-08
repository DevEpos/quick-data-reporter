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
import ScrollContainer from "sap/m/ScrollContainer";
import OverflowToolbar from "sap/m/OverflowToolbar";

const FRAGMENT_ID = "addFiltersPopover";

interface FieldConfig {
    name: string;
    description: string;
    longDescription: string;
    selected: boolean;
}

class PopoverModel {
    fields: FieldConfig[] = [];
    multiSelect = false;
    get hasSelectedItems(): boolean {
        return this.fields?.some(f => f.selected);
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
    private _popupEventDelegate: { onAfterRendering(): void };
    private _popoverPromise: { resolve: (selectedFields: string[]) => void };
    private _scroller: ScrollContainer;
    private _infoToolbar: OverflowToolbar;

    constructor(entityStateData: ReadOnlyStateData<Entity>) {
        this._createModel(entityStateData);
        this._popupEventDelegate = {
            onAfterRendering: () => {
                this._calculateScrollerHeight();
                // calculation is only needed once
                this._popover.removeEventDelegate(this._popupEventDelegate);
            }
        };
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
        this._fieldList = Fragment.byId(FRAGMENT_ID, "fieldsList") as List;
        this._scroller = Fragment.byId(FRAGMENT_ID, "listScroller") as ScrollContainer;
        this._infoToolbar = Fragment.byId(FRAGMENT_ID, "infoToolbar") as OverflowToolbar;
        return new Promise(resolve => {
            this._popoverPromise = { resolve };
            popover.openBy(sourceButton);
        });
    }

    onSearchPromptLiveChange(evt: Event): void {
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
        }
        const query = evt.getParameter("newValue");
        this._searchTimer = setTimeout(() => {
            const fieldsBinding = this._fieldList.getBinding("items") as ListBinding;
            if (query) {
                fieldsBinding.filter(new Filter("description", "Contains", query));
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
        this._popover.removeEventDelegate(this._popupEventDelegate);
        this._popover?.destroy();
    }
    private _createModel(entityStateData: ReadOnlyStateData<Entity>): void {
        this._modelData = new PopoverModel();
        for (const colMeta of entityStateData?.metadata?.colMetadata) {
            this._modelData.fields.push({
                name: colMeta.name,
                description:
                    colMeta.description === colMeta.name ? colMeta.name : `${colMeta.description} (${colMeta.name})`,
                longDescription: colMeta.longDescription,
                selected: false
            });
        }
        this._model = new JSONModel(this._modelData);
        /* recalculate the scroller height if the info toolbar becomes
         * visible. This happens if at least one field is selected
         */
        this._model.attachPropertyChange(
            null,
            (evt: Event) => {
                const path = evt.getParameter("path");
                if (path === "selected") {
                    setTimeout(this._calculateScrollerHeight.bind(this), 50);
                }
            },
            this
        );
    }
    private async _createPopover(): Promise<ResponsivePopover> {
        this._popover = await Fragment.load({
            id: FRAGMENT_ID,
            name: "devepos.qdrt.fragment.AddFilterPopover",
            controller: this
        });
        this._popover.addEventDelegate(this._popupEventDelegate, this);
        return this._popover;
    }
    private _calculateScrollerHeight() {
        console.log("Calculate Scroll Height");
        let infoToolbarHeight = 0;
        if (this._infoToolbar?.getVisible()) {
            infoToolbarHeight = this._infoToolbar.getDomRef()?.clientHeight;
        }
        const footerDomElem = this._popover?.getDomRef()?.querySelector("footer");
        if (this._scroller && footerDomElem) {
            this._scroller.setHeight(`calc(100% - ${footerDomElem.clientHeight + infoToolbarHeight}px)`);
        }
    }
}
