const numericTypes = ["Byte", "Single", "Double", "Int16", "Int32", "Int64", "SByte", "Decimal"];

/**
 * Factory for creating type instances
 */
export default class TypeUtil {
    /**
     * Returns a generic type for a given type
     * @param typeName name of a type (e.g. String)
     */
    static generalizeType(typeName: string): string {
        if (numericTypes.includes(typeName)) {
            return "Numeric";
        } else {
            return typeName;
        }
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
