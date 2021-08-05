import Boolean from "sap/ui/model/odata/type/Boolean";
import Byte from "sap/ui/model/odata/type/Byte";
import DateTime from "sap/ui/model/odata/type/DateTime";
import Date1 from "sap/ui/model/odata/type/Date";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import Decimal from "sap/ui/model/odata/type/Decimal";
import Double from "sap/ui/model/odata/type/Double";
import Single from "sap/ui/model/odata/type/Single";
import Guid from "sap/ui/model/odata/type/Guid";
import Int16 from "sap/ui/model/odata/type/Int16";
import Int32 from "sap/ui/model/odata/type/Int32";
import Int64 from "sap/ui/model/odata/type/Int64";
import SByte from "sap/ui/model/odata/type/SByte";
import String from "sap/ui/model/odata/type/String";
import Time from "sap/ui/model/odata/type/Time";
import ODataType from "sap/ui/model/odata/type/ODataType";

const typeMap: Record<string, typeof ODataType> = {
    Boolean,
    Byte,
    Date: Date1,
    DateTime,
    DateTimeOffset,
    Decimal,
    Double,
    Single,
    Float: Single,
    Guid,
    Int16,
    Int32,
    Int64,
    SByte,
    String,
    Time
};

const numericTypes = ["Byte", "Single", "Double", "Int16", "Int32", "Int64", "SByte"];

/**
 * Factory for creating type instances
 */
export default class TypeFactory {
    /**
     * Creates new type instance of for the given type
     * @param name the name of a service type
     * @param formatOptions optional object with formatting options
     * @param constraints optional object with constraints, e.g. "maxLength"
     * @returns the created type instance or <code>null</code> if none could be determined
     */
    static getType(name: string, formatOptions?: object, constraints?: object): ODataType {
        let type: ODataType = null;

        const typeConstructor = typeMap[name];
        if (typeConstructor) {
            type = new typeConstructor(formatOptions, constraints);
        }
        return type;
    }

    /**
     * Returns <code>true</code> if the given type is a numeric type
     * @param typeName the name of a type
     * @returns <code>true</code> if the given type is a numeric type
     */
    static isNumeric(typeName: string): boolean {
        return numericTypes.includes(typeName);
    }
}
