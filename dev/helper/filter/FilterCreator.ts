import { DisplayFormat, FieldMetadata, FilterCond, FilterOperator } from "../../model/ServiceModel";

import Token from "sap/m/Token";
import P13nConditionPanel from "sap/m/P13nConditionPanel";
import Log from "sap/base/Log";

type FilterCondConfig = { re: RegExp; template: string };

const conditionMap: { [operator: string]: FilterCondConfig } = {
    [FilterOperator.EQ]: {
        re: /^=(.+)$/,
        template: "=$0"
    },
    [FilterOperator.NE]: {
        re: /^!\(=(.+)\)$/,
        template: "!(=$0)"
    },
    [FilterOperator.GE]: {
        re: /^>=(.+)$/,
        template: ">=$0"
    },
    [FilterOperator.GT]: {
        re: /^>(.+)$/,
        template: ">$0"
    },
    [FilterOperator.LE]: {
        re: /^<=(.+)$/,
        template: "<=$0"
    },
    // needs to be earlier than LT, otherwise <empty> will be matched by LT
    [FilterOperator.Empty]: {
        re: /^<empty>$/i,
        template: "<empty>"
    },
    [FilterOperator.LT]: {
        re: /^<(.+)$/,
        template: "<$0"
    },
    [FilterOperator.BT]: {
        re: /^(.+)\.{3}(.+)$/,
        template: "$0..$1"
    },
    [FilterOperator.Contains]: {
        re: /^\*(.+)\*$/,
        template: "*$0*"
    },
    [FilterOperator.StartsWith]: {
        re: /^([^\\*].*)\*$/,
        template: "*$0"
    },
    [FilterOperator.EndsWith]: {
        re: /^\*(.*[^\\*])$/,
        template: "$0*"
    },
    [FilterOperator.NotEmpty]: {
        re: /^!\(<empty>\)$/i,
        template: "!(<empty>)"
    },
    // has to be the last entry, because its regex is the most wide
    [FilterOperator.Auto]: {
        re: /^([^!\\(\\)\\*<>].*[^*]?)$/,
        template: "$0"
    }
};

/**
 * Map of possible operators by data type
 */
const typeFilterOperationMap: Record<string, string[]> = {
    Date: [
        FilterOperator.EQ,
        FilterOperator.BT,
        FilterOperator.LT,
        FilterOperator.LE,
        FilterOperator.GT,
        FilterOperator.GE,
        FilterOperator.Empty,
        FilterOperator.NE,
        FilterOperator.NotEmpty
    ],
    Time: [
        FilterOperator.EQ,
        FilterOperator.BT,
        FilterOperator.LT,
        FilterOperator.LE,
        FilterOperator.GT,
        FilterOperator.GE
    ]
};

/**
 * Creator for filter conditions / tokens
 */
export default class FilterCreator {
    private _value: string;
    private _fieldName: string;
    private _fieldMetadata: FieldMetadata;

    constructor(fieldName: string, fieldMetadata: FieldMetadata) {
        this._fieldName = fieldName;
        this._fieldMetadata = fieldMetadata;
    }

    /**
     * Sets the value to be used for filter/token creation
     * @param value the new value
     */
    setValue(value: string): void {
        this._value = value;
    }

    /**
     * Creates a filter condition from the given value.
     * The value can contain special prefix/suffix - like "<=, <, >, >=, !()" which determines the
     * filter operation
     * @returns the created filter condition
     */
    createFilter(): FilterCond {
        const filterCond = {
            keyField: this._fieldName,
            exclude: false
        } as FilterCond;
        let filterCondConfig: FilterCondConfig;
        let filterOpMatch: RegExpMatchArray;
        let value1: string;
        let value2: string;

        if (!this._value || this._value === "") {
            return null;
        }

        const validFilterOperations = typeFilterOperationMap[this._fieldMetadata.type] || Object.keys(conditionMap);

        for (const filterOperation of validFilterOperations) {
            filterCondConfig = conditionMap[filterOperation];
            filterOpMatch = this._value.match(filterCondConfig.re);

            if (filterOpMatch) {
                filterCond.operation = filterOperation;
                this._adjustOperation(filterCond);

                if (filterOpMatch.length > 1) {
                    value1 = filterOpMatch[1];

                    if (filterOpMatch.length > 2) {
                        value2 = filterOpMatch[2];
                    }
                }
                break;
            } else {
                filterCondConfig = null;
            }
        }
        if (!filterCondConfig) {
            Log.error(`No appropriate filter operator for value "${this._value}" found`);
            return null;
        }

        if (filterCond.operation !== FilterOperator.Empty) {
            filterCond.value1 = this._validate(value1);
            filterCond.value2 = this._validate(value2);
        }

        return filterCond;
    }

    /**
     * Creates a token for the passed filter condition
     * @param filterCond the filter condition as base for the token
     * @param existingTokens any existing tokens in the multi input control
     * @param tokenKey optional key for a token - overrides token determination from existingTokens array
     * @returns the created token
     */
    createToken(filterCond: FilterCond, existingTokens?: Token[], tokenKey?: string): Token {
        // without filter condition no token creation is possible
        if (!filterCond || (!filterCond.value1 && filterCond.operation !== FilterOperator.Empty)) {
            return null;
        }
        const token = new Token({
            key: tokenKey || this._getTokenKey(existingTokens),
            text: this._getTokenText(filterCond)
        });

        if (existingTokens?.length) {
            if (existingTokens.find(t => t.getText() === token.getText())) {
                return null;
            }
        }

        const { value1, value2, exclude, operation, keyField } = filterCond;

        token.data("range", {
            value1,
            value2,
            exclude,
            operation,
            keyField,
            __quickFilter: true
        });

        return token;
    }

    private _adjustOperation(filterCond: FilterCond) {
        if (filterCond.operation === FilterOperator.NotEmpty) {
            filterCond.exclude = true;
            filterCond.operation = FilterOperator.Empty;
        } else if (filterCond.operation === FilterOperator.NE) {
            filterCond.exclude = true;
            filterCond.operation = FilterOperator.EQ;
        } else if (filterCond.operation === FilterOperator.Auto) {
            filterCond.operation = FilterOperator.EQ;
        }
    }

    private _getTokenKey(existingTokens?: Token[]): string {
        if (!existingTokens || existingTokens.length === 0) {
            return "range_0";
        } else {
            const keys = existingTokens.map(t => t.getKey());
            let rangeIndex = 0;
            let key = "";
            do {
                key = `range_${rangeIndex++}`;
            } while (keys.includes(key));
            return key;
        }
    }

    private _getTokenText(filterCond: FilterCond): string {
        return P13nConditionPanel.getFormatedConditionText(
            filterCond.operation,
            this._formatValue(filterCond.value1),
            this._formatValue(filterCond.value2),
            filterCond.exclude
        );
    }

    /**
     * Validates and returns the parsed value
     * @param value value to validate
     * @returns the parsed value adhereing to the internal representation of the type
     * @throws {sap.ui.model.ParseException|sap.ui.model.ValidateException}
     */
    private _validate(value: string): string {
        if (!value || value === "") {
            return null;
        }
        if (this._fieldMetadata.displayFormat === DisplayFormat.UpperCase) {
            value = value.toUpperCase();
        }

        const type = this._fieldMetadata.typeInstance;
        const parsedValue = type.parseValue(value, "string");
        type.validateValue(parsedValue) as any;
        return parsedValue;
    }

    private _formatValue(value: string): string {
        if (!value || value === "") {
            return null;
        }
        return this._fieldMetadata.typeInstance.formatValue(value, "string");
    }
}
