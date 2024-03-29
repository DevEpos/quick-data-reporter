import BaseController from "./BaseController";
import models from "../model/models";
import { EntityType, SortCond } from "../model/types";
import EntityTableSettings from "../helper/EntityTableSettings";
import { FieldMetadata } from "../model/types";
import EntityState from "../state/EntityState";
import StateRegistry from "../state/StateRegistry";
import FormatUtil from "../helper/FormatUtil";
import { entityTypeIconFormatter, entityTypeTooltipFormatter } from "../model/formatter";
import { SpecialFieldNames } from "../model/globalConsts";

import Column from "sap/ui/table/Column";
import Text from "sap/m/Text";
import Table from "sap/ui/table/Table";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import { HorizontalAlign } from "sap/ui/core/library";
import Control from "sap/ui/core/Control";
import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";
import CustomData from "sap/ui/core/CustomData";
import MessageBox from "sap/m/MessageBox";
import formatMessage from "sap/base/strings/formatMessage";

/**
 * Controller for a single database entity
 *
 * @alias com.devepos.qdrt.controller.Entity
 */
export default class EntityController extends BaseController {
    entityTypeIconFormatter = entityTypeIconFormatter;
    entityTypeTooltipFormatter = entityTypeTooltipFormatter;
    formatMessage = formatMessage;
    private _uiModel: JSONModel;
    private _entityTableSettings: EntityTableSettings;
    private _queryResultTable: Table;
    private _entityState: EntityState;
    /**
     * Initializes entity controller
     */
    onInit(): void {
        BaseController.prototype.onInit.call(this);
        this._uiModel = models.createViewModel({
            sideContentVisible: true
        });
        this._entityState = StateRegistry.getEntityState();
        this._entityTableSettings = new EntityTableSettings(this.getView());
        this._queryResultTable = this.getView().byId("queryResultTable") as Table;
        // call private method to start data request only after a given timeout. This prevents
        //  to many calls to the server
        if (this._queryResultTable._setLargeDataScrolling) {
            this._queryResultTable._setLargeDataScrolling(true);
        }
        this.getView().setModel(this._uiModel, "ui");
        this.getView().setModel(this._entityState.getModel());
        this.router.getRoute("entity").attachPatternMatched(this._onEntityMatched, this);
        this.router.getRoute("main").attachPatternMatched(this._onMainMatched, this);

        const variantManagement = this.byId("variantManagement");
        // this needs to be done to always show the standard variant in the Popover
        (variantManagement as any)?.setStandardFavorite(true);
    }

    private _onMainMatched() {
        this._queryResultTable?.getColumns()?.forEach(col => col.setVisible(false));
        this._entityTableSettings?.destroyDialog();
    }
    private async _onEntityMatched(event: Event) {
        const args = event.getParameter("arguments");
        this.getView().setBusy(true);
        this._queryResultTable.unbindRows();
        this._queryResultTable.setFirstVisibleRow(0);
        this._entityState.reset();
        const entityInfo = {
            type: decodeURIComponent(args.type).toUpperCase(),
            name: decodeURIComponent(args.name).toUpperCase()
        };
        this._entityState.setEntityInfo(entityInfo.name, entityInfo.type as EntityType);
        await Promise.all([this._entityState.loadMetadata(), this._entityState.loadVariants()]);
        if (!this._entityState.exists()) {
            MessageBox.error(this.getResourceBundle().getText("entity_not_exists_msg", [entityInfo.name]), {
                onClose: () => {
                    this.router.navTo("main");
                }
            });
        } else {
            this._createColumns();
        }
        this.getView().setBusy(false);
    }
    /**
     * Handles entity settings event
     */
    async onTableSettings(): Promise<void> {
        const updatedSettings = await this._entityTableSettings.showSettingsDialog(this._entityState.getData());
        if (updatedSettings) {
            this.getView().setBusy(true);
            this._entityState.setConfiguration(updatedSettings.entityConfig);
            this._createColumns();
            this.onUpdateData();
            this.getView().setBusy(false);
        }
    }
    /**
     * Event handler to trigger data update
     */
    onUpdateData(): void {
        const rowsBinding = this._queryResultTable.getBinding("rows");
        if (rowsBinding) {
            this._entityState.getModel().refreshListPath("/rows", true);
        } else {
            this._queryResultTable.bindRows({ path: "/rows" });
        }
    }
    onCellContextMenu(event: Event): void {
        const contextMenu = event.getParameter("contextMenu") as Menu;
        if (contextMenu) {
            contextMenu.destroyItems();
            contextMenu.addItem(
                new MenuItem({
                    text: "Quickfilter on Cell"
                })
            );
        }
    }
    onColumnMove(event: Event): void {
        const movedColumn = event.getParameter("column") as Column;
        const newColIndex = event.getParameter("newPos") as number;
        const oldColIndex = this._queryResultTable.indexOfColumn(movedColumn);

        const visibleColItems = [];
        const hiddenColItems = [];
        for (const colItem of this._entityState.getData().columnsItems) {
            if (colItem.visible) {
                visibleColItems.push(colItem);
            } else {
                hiddenColItems.push(colItem);
            }
        }

        const oldColumn = visibleColItems.find(colItem => colItem.index === oldColIndex);
        if (oldColumn) {
            oldColumn.index = newColIndex;
        }
        const sortedItems = visibleColItems.sort((col1, col2) => (col1.index > col2.index ? 1 : -1));
        for (let i = 0; i < sortedItems.length; i++) {
            sortedItems[i].index = i;
        }
        sortedItems.push(...hiddenColItems);
        this._entityState.setColumnsItems(sortedItems);
    }
    private _createColumns(): void {
        this._queryResultTable.destroyColumns();
        const stateData = this._entityState.getData();
        for (const columnMeta of stateData.visibleFieldMetadata) {
            this._queryResultTable.addColumn(
                this._createColumn(
                    columnMeta,
                    stateData.sortCond.find(cond => cond.fieldName === columnMeta.name)
                )
            );
        }
        if (stateData.aggregationCond?.length > 0) {
            this._queryResultTable.addColumn(this._createGroupCountColumn());
        }
    }
    /**
     * Creates column
     * @param fieldMetadataInfo metadata of field
     * @param sortCond sort condition
     * @returns the created column
     */
    private _createColumn(fieldMetadataInfo: FieldMetadata, sortCond?: SortCond): Column {
        let template: string | Control = fieldMetadataInfo.name;
        let hAlign = HorizontalAlign.Begin;
        switch (fieldMetadataInfo.type) {
            case "Date":
                template = new Text({
                    text: {
                        path: template,
                        type: "sap.ui.model.odata.type.Date",
                        formatOptions: {
                            style: "medium",
                            source: {
                                pattern: "yyyy-MM-dd"
                            }
                        }
                    }
                });
                break;
            case "DateTimeOffset":
                // TODO: create custom type for ABAP type TIMSTAMPL
                break;
            case "DateTime":
                template = new Text({
                    text: {
                        path: template,
                        type: "sap.ui.model.type.DateTime",
                        formatOptions: {
                            style: "medium",
                            source: {
                                pattern: "yyyyMMddHHmmss"
                            }
                        }
                    }
                });
                break;
            case "Time":
                template = new Text({
                    text: {
                        path: template,
                        type: "sap.ui.model.type.Time",
                        formatOptions: {
                            source: {
                                pattern: "HH:mm:ss"
                            }
                        }
                    }
                });
                break;
            case "Boolean":
                template = new Text({
                    text: {
                        path: template,
                        type: "sap.ui.model.odata.type.Boolean"
                    }
                });
                break;
            case "Decimal":
                hAlign = HorizontalAlign.End;
                break;
            default:
                break;
        }
        return new Column({
            label: new Text({
                text: fieldMetadataInfo.description,
                tooltip: fieldMetadataInfo.tooltip,
                wrapping: false
            }),
            hAlign,
            width: FormatUtil.getWidth(fieldMetadataInfo, 15),
            template,
            sortProperty: fieldMetadataInfo.name,
            showSortMenuEntry: false,
            sorted: !!sortCond,
            sortOrder: sortCond ? sortCond.sortDirection : null,
            customData: new CustomData({
                key: "columnKey",
                value: fieldMetadataInfo.name
            })
        });
    }
    private _createGroupCountColumn() {
        return new Column({
            label: new Text({
                text: "{i18n>entity_table_aggrCount_col_title}",
                tooltip: "{i18n>entity_table_aggrCount_col_tooltip}",
                wrapping: false
            }),
            hAlign: HorizontalAlign.End,
            width: "15em",
            template: new Text({
                text: {
                    path: SpecialFieldNames.groupCountCol,
                    type: "sap.ui.model.odata.type.Int32"
                }
            }),
            sortProperty: SpecialFieldNames.groupCountCol,
            showSortMenuEntry: false,
            customData: new CustomData({
                key: "columnKey",
                value: SpecialFieldNames.groupCountCol
            })
        });
    }
}
