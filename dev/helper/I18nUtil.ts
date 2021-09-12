import ResourceBundle from "sap/base/i18n/ResourceBundle";

let resourceBundle: ResourceBundle;

/**
 * Sets the resource bundle of the application
 * @param bundle the bundle with the application i18n texts
 */
export function setResourceBundle(bundle: ResourceBundle): void {
    resourceBundle = bundle;
}

/**
 * Utility object to retrieve translatable texts of the application.
 * This object is only to be used outside controller classes, as they
 * have access to the app resource bundle via the component
 */
export default {
    /**
     * Retrieves a translatable text from the currently set resource bundle
     * @param textId the id of the translatable text
     * @param args optional array with placeholder arguments
     * @returns the translated text in the current language
     */
    getText(textId: string, args?: any[]): string {
        return resourceBundle?.getText(textId, args);
    }
};
