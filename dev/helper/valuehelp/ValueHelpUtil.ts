import { FieldMetadata, ValueHelpField, ValueHelpMetadata, ValueHelpType } from "../../model/ServiceModel";
import I18nUtil from "../I18nUtil";

/**
 * Utility object for value helps
 */
export default class ValueHelpUtil {
    /**
     * Retrieves metadata information to call a ranges only value help
     * @param fieldMeta metadata of field where no explicit value help is defined
     */
    static getNoVhMetadata(fieldMeta: FieldMetadata): ValueHelpMetadata {
        return {
            fields: [{ ...fieldMeta }],
            outputFields: [fieldMeta.name],
            tokenKeyField: fieldMeta.name
        } as ValueHelpMetadata;
    }
    /**
     * Returns the metadata of a field which has a value help of
     * type {@link ValueHelpType.DomainFixValues}
     *
     * @param fieldMeta metadata of field which has domain fix values value help
     * @returns metadata for the domain fix value help
     */
    static getDomainFixValuesVhMetadata(fieldMeta: FieldMetadata): ValueHelpMetadata {
        return {
            valueHelpName: fieldMeta.rollname,
            type: ValueHelpType.DomainFixValues,
            targetField: fieldMeta.name,
            tokenKeyField: "fixValue",
            tokenDescriptionField: "description",
            fields: [
                Object.assign(new ValueHelpField(), {
                    maxLength: fieldMeta.maxLength,
                    displayFormat: fieldMeta.displayFormat,
                    type: "String",
                    name: "fixValue",
                    description: fieldMeta.description
                } as ValueHelpField),
                Object.assign(new ValueHelpField(), {
                    maxLength: 40,
                    type: "String",
                    name: "description",
                    description: I18nUtil.getText("vhDialog_domainSH_descriptionCol_text")
                } as ValueHelpField)
            ],
            outputFields: ["fixValue", "description"]
        };
    }
}
