import ActionSheet from "sap/m/ActionSheet";
import Button from "sap/m/Button";
import Event from "sap/ui/base/Event";
import JSONModel from "sap/ui/model/json/JSONModel";
import models from "../model/models";
import BaseController from "./BaseController";

/**
 * Controller for the root view
 * @namespace devepos.qdrt.controller
 */
export default class AppController extends BaseController {
    private _viewModel: JSONModel;
    private _currentThemeId: string;
    private _themes: { key: string; text: string }[];
    onInit(): void {
        super.onInit();
        this._currentThemeId = "sap_fiori_3";
        this._themes = [
            // no reason to put the theme texts in i18n because they will not be translated
            { key: "sap_fiori_3", text: "Quartz Light" },
            { key: "sap_fiori_3_dark", text: "Quartz Dark" },
            { key: "sap_belize", text: "Belize" },
            { key: "sap_belize_plus", text: "Belize Deep" },
            { key: "sap_fiori_3_hcb", text: "High Contrast Black" },
            { key: "sap_fiori_3_hcw", text: "High Contrast White" }
        ];
        this._viewModel = models.createViewModel({});
        this.getView().setModel(this._viewModel, "ui");
    }

    /**
     * Handles theme switch
     * @param event the event object
     */
    onThemeSwitch(event: Event): void {
        const themeActionSheet = new ActionSheet({
            buttons: this._themes.map(theme => {
                const themeButton = new Button({
                    text: theme.text,
                    press: () => {
                        themeActionSheet.close();
                        this._currentThemeId = theme.key;
                        setTimeout(() => {
                            sap.ui.getCore().applyTheme(theme.key);
                        }, 0);
                    }
                });
                if (theme.key === this._currentThemeId) {
                    themeButton.addStyleClass("deveposQdrtActiveTheme");
                }
                return themeButton;
            }),
            afterClose: () => {
                themeActionSheet.destroy();
            }
        });
        const source = event.getSource();
        if (source) {
            themeActionSheet.openBy(source);
        }
    }
}
