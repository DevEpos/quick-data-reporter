import { EntityColMetadata } from "../model/ServiceModel";

/**
 * Utility concerning formatting like e.g. getting the width for a
 * table column via metadata
 */
export default class FormatUtil {
    /**
     * Returns the width from the metadata attributes. min-width if there is no width specified
     *
     * @param fieldMeta Field metadata for the table field
     * @param maxWidth The max width (optional, default 30)
     * @param minWidth The min width (optional, default 3)
     * @returns width of the filter field in em
     */
    static getWidth(fieldMeta: EntityColMetadata, maxWidth = 30, minWidth = 3): string {
        let width = "" + fieldMeta.length;
        let widthNumeric: number;

        // Force set the width to 9em for date fields
        if (fieldMeta.type === "DateTime" || fieldMeta.type === "Date") {
            width = "9em";
        } else if (width) {
            // // Use Max width for description&Id and descriptionOnly use-case to accommodate description texts better on the UI
            // if (
            //     fieldMeta.type === "Edm.String" &&
            //     fieldMeta.description &&
            //     fieldMeta.displayBehaviour &&
            //     (fieldMeta.displayBehaviour === "descriptionAndId" || fieldMeta.displayBehaviour === "descriptionOnly")
            // ) {
            //     width = "Max";
            // }

            // // Use max width if "Max" is set in the metadata or above
            // if (width === "Max") {
            //     width = maxWidth + "";
            // }
            widthNumeric = parseInt(width);
            if (!isNaN(widthNumeric)) {
                // Add additional .75 em (~12px) to avoid showing ellipsis in some cases!
                widthNumeric += 0.75;
                // use a max initial width of 30em (default)
                if (widthNumeric > maxWidth) {
                    widthNumeric = maxWidth;
                } else if (widthNumeric < minWidth) {
                    // use a min width of 3em (default)
                    widthNumeric = minWidth;
                }
                width = widthNumeric + "em";
            } else {
                // if NaN reset the width so min width would be used
                width = null;
            }
        }
        if (!width) {
            // For Boolean fields - Use min width as the fallabck, in case no width could be derived.
            if (fieldMeta.type === "Boolean") {
                width = minWidth + "em";
            } else {
                // use the max width as the fallback width of the column, if no width can be derived
                width = maxWidth + "em";
            }
        }
        return width;
    }
}
