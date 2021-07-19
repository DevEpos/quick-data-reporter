import { EntityColMetadata, ValueHelpMetadata, ValueHelpType } from "../../model/ServiceModel";

/**
 * Utility object for value helps
 */
export default class ValueHelpUtil {
    /**
     * Retrieves metadata information to call a ranges only value help
     * @param fieldMeta metadata of field where no explicit value help is defined
     */
    static getNoVhMetadata(fieldMeta: EntityColMetadata): ValueHelpMetadata {
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
    static getDomainFixValuesVhMetadata(fieldMeta: EntityColMetadata): ValueHelpMetadata {
        return {
            valueHelpName: fieldMeta.rollname,
            type: ValueHelpType.DomainFixValues,
            targetField: fieldMeta.name,
            tokenKeyField: "fixValue",
            tokenDescriptionField: "description",
            fields: [
                {
                    length: fieldMeta.length,
                    type: "String",
                    name: "fixValue",
                    description: fieldMeta.description
                },
                {
                    length: 40,
                    type: "String",
                    name: "description",
                    description: "Description"
                }
            ],
            outputFields: ["fixValue", "description"]
        };
    }
}
