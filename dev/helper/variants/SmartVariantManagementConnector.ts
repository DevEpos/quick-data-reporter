import Log from "sap/base/Log";
import Input from "sap/m/Input";
import Select from "sap/m/Select";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagementUi2 from "sap/ui/comp/smartvariants/SmartVariantManagementUi2";
import Control from "sap/ui/core/Control";

interface FilterWithValues {
    name: string;
    values: string[];
}

type FilterGroupItemEntries = Record<string, Control>;

/**
 * Connector for attaching a {@link SmartVariantManagementUi2} control to
 * a {@link FilterBar} control.
 *
 * @nonui5
 */
export default class SmartVariantManagementConnector {
    private _filterBar: FilterBar;
    private _smartVariantManagement: SmartVariantManagementUi2;

    constructor(filterBar: FilterBar, smartVariantManagement: SmartVariantManagementUi2) {
        this._filterBar = filterBar;
        this._smartVariantManagement = smartVariantManagement;
    }

    /**
     * Connects the filterbar to the variantsmanagement
     */
    connectFilterBar(): void {
        const persInfo = new PersonalizableInfo({
            type: "filterBar",
            keyName: "persistencyKey"
        });
        persInfo.setControl(this._filterBar);

        this._filterBar.registerFetchData(this._fetchDataCallback.bind(this));
        this._filterBar.registerApplyData(this._applyDataCallback.bind(this));
        this._filterBar.attachAfterVariantLoad(this._onAfterVariantLoad.bind(this));

        this._smartVariantManagement.addPersonalizableControl(persInfo);
        this._smartVariantManagement.initialise();
    }

    private _fetchDataCallback(version: any) {
        const filters: FilterWithValues[] = [];
        for (const filterGroupItem of this._filterBar.getFilterGroupItems()) {
            const filter = <FilterWithValues>{
                name: filterGroupItem.getName(),
                values: []
            };
            // somehow the return value of .getControl() is void and not sap.ui.core.Control
            const control = filterGroupItem.getControl() as unknown as Control;
            if (control.isA("sap.m.Input")) {
                filter.values.push((control as Input).getValue());
            } else if (control.isA("sap.m.Select")) {
                filter.values.push((control as Select).getSelectedKey());
            }
            filters.push(filter);
        }
        return JSON.stringify(filters);
    }

    private _applyDataCallback(variantDataJson: string, version: string) {
        if (variantDataJson && variantDataJson !== "") {
            try {
                const filters = JSON.parse(variantDataJson) as FilterWithValues[];
                const filterGroupItems: FilterGroupItemEntries = {};
                this._filterBar
                    .getFilterGroupItems()
                    .forEach(fgi => (filterGroupItems[fgi.getName()] = fgi.getControl() as unknown as Control));
                // apply found filters to filterbar
                for (const filter of filters) {
                    if (filter?.values?.length <= 0) {
                        continue;
                    }
                    const filterControl = filterGroupItems[filter.name];
                    if (!filterControl) {
                        continue;
                    }
                    if (filterControl.isA("sap.m.Input")) {
                        (filterControl as Input).setValue(filter.values[0]);
                    } else if (filterControl.isA("sap.m.Select")) {
                        (filterControl as Select).setSelectedKey(filter.values[0]);
                    }
                }
            } catch (ex) {
                Log.error("Error during parsing filters from variant");
            }
        }
    }

    private _onAfterVariantLoad() {
        this._filterBar.fireSearch();
    }
}
