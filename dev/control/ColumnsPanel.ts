import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import List from "sap/m/List";
import SearchField from "sap/m/SearchField";
import Control from "sap/ui/core/Control";
import DragInfo from "sap/ui/core/dnd/DragInfo";
import DropInfo from "sap/ui/core/dnd/DropInfo";
import RenderManager from "sap/ui/core/RenderManager";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Button from "sap/m/Button";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import ScrollContainer from "sap/m/ScrollContainer";
import CustomListItem from "sap/m/CustomListItem";
import Title from "sap/m/Title";
import FlexBox from "sap/m/FlexBox";
import HBox from "sap/m/HBox";

/**
 * Customization panel for columns of an entity
 * @namespace com.devepos.qdrt.control
 */
export default class ColumnsPanel extends Control {
    metadata = {
        properties: {},
        aggregations: {
            _toolbar: { type: "sap.m.OverflowToolbar", multiple: false, hidden: true },
            _columnSearch: { type: "sap.m.SearchField", multiple: false, hidden: true },
            _listScroller: { type: "sap.m.ScrollContainer", multiple: false, hidden: true }
        }
    };
    renderer = {
        apiVersion: 2,

        render(rm: RenderManager, panel: ColumnsPanel): void {
            rm.openStart("div", panel);
            rm.class("deveposQdrt-ColumnsPanel");
            rm.openEnd();
            rm.renderControl(panel.getAggregation("_toolbar") as Control);
            rm.renderControl(panel.getAggregation("_columnSearch") as Control);
            rm.renderControl(panel.getAggregation("_listScroller") as Control);
            rm.close("div");
        }
    };

    private _searchField: SearchField;
    private _firstTimeRendering = true;

    init(): void {
        const cols: string[] = [];
        for (let i = 1; i < 21; i++) {
            cols.push(`Column ${i}`);
        }
        const toolbar = new OverflowToolbar({
            content: [
                new ToolbarSpacer(),
                new Button({ icon: "sap-icon://multiselect-all", type: "Transparent" }),
                new Button({ icon: "sap-icon://multiselect-none", type: "Transparent" })
            ]
        });
        this.setAggregation("_toolbar", toolbar);
        const searchField = new SearchField({
            width: "100%"
        });
        this.setAggregation("_columnSearch", searchField);
        const colList = new List({
            items: cols.map(c => {
                const itemTitle = new Title({ text: c });
                itemTitle.addStyleClass("deveposQdrt-ColumnsPanel__List__Item__Title");
                // const leftContentBox = new HBox({
                //     alignItems: "Center",
                //     items: [new CheckBox(), itemTitle]
                // });
                const itemActions = new HBox({
                    items: [new Button({ icon: "sap-icon://decline", type: "Transparent" })]
                });
                itemActions.addStyleClass("deveposQdrt-ColumnsPanel__List__Item__Actions");
                const li = new CustomListItem({
                    type: "Active",
                    content: new FlexBox({
                        alignItems: "Center",
                        items: [itemTitle, itemActions],
                        justifyContent: "SpaceBetween"
                    })
                });
                li.addStyleClass("deveposQdrt-ColumnsPanel__List__Item");
                return li;
            }),
            mode: "MultiSelect",

            dragDropConfig: [
                new DragInfo({ sourceAggregation: "items" }),
                new DropInfo({ targetAggregation: "items", dropLayout: "Horizontal" })
            ]
        });
        const listScroller = new ScrollContainer({ content: colList, height: "100%", vertical: true });
        listScroller.addStyleClass("deveposQdrt-ColumnsPanel__List");
        this.setAggregation("_listScroller", listScroller);
    }
    onBeforeRendering(): void {
        if (this._firstTimeRendering) {
            const searchField = this.getAggregation("_columnSearch") as SearchField;
            searchField.setPlaceholder(
                ((this.getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle).getText(
                    "entity_columnsPanel_searchFld_prompt"
                )
            );
            this._firstTimeRendering = false;
        }
    }
}
