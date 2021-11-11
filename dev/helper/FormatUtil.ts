import { FieldMetadata } from "../model/types";

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
    static getWidth(fieldMeta: FieldMetadata, maxWidth = 30, minWidth = 3): string {
        let width = fieldMeta.maxLength;

        if (fieldMeta.type === "DateTime" || fieldMeta.type === "DateTimeOffset") {
            width = 12;
        } else if (fieldMeta.type === "Date") {
            // Force set the width to 9em for date fields
            width = 9;
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
            // Add additional .75 em (~12px) to avoid showing ellipsis in some cases!
            width += 0.75;
            // use a max initial width of 30em (default)
            if (width > maxWidth) {
                width = maxWidth;
            } else if (width < minWidth) {
                // use a min width of 3em (default)
                width = minWidth;
            }
        }
        if (!width) {
            // For Boolean fields - Use min width as the fallabck, in case no width could be derived.
            if (fieldMeta.type === "Boolean") {
                width = minWidth;
            } else {
                // use the max width as the fallback width of the column, if no width can be derived
                width = maxWidth;
            }
        }
        return width + "em";
    }
}
