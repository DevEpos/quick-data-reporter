import { FilterOperator } from "../../model/ServiceModel";
import TypeUtil from "../../model/TypeUtil";

export type FilterOperatorRegExp = { re: RegExp; template: string };

class FilterOperatorConfig {
    operatorKey: string;
    private _include: FilterOperatorRegExp;
    private _exclude?: FilterOperatorRegExp;

    constructor(operatorKey: string, include: FilterOperatorRegExp, exclude?: FilterOperatorRegExp) {
        this.operatorKey = operatorKey;
        this._include = include;
        this._exclude = exclude;
    }

    getMatches(value: string): RegExpMatchArray {
        if (value?.startsWith("!(")) {
            return this._exclude?.re.exec(value);
        } else {
            return this._include.re.exec(value);
        }
    }
}

const allConditionsMap: { [operator: string]: FilterOperatorConfig } = {
    [FilterOperator.EQ]: new FilterOperatorConfig(
        FilterOperator.EQ,
        {
            re: /^=(.+)$/,
            template: "=$0"
        },
        {
            re: /^!\(=(.+)\)$/,
            template: "!(=$0)"
        }
    ),
    [FilterOperator.GE]: new FilterOperatorConfig(
        FilterOperator.GE,
        {
            re: /^>=(.+)$/,
            template: ">=$0"
        },
        {
            re: /^!\(>=(.+)\)$/,
            template: "!(>=$0)"
        }
    ),
    [FilterOperator.GT]: new FilterOperatorConfig(
        FilterOperator.GT,
        {
            re: /^>(.+)$/,
            template: ">$0"
        },
        {
            re: /^!\(>(.+)\)$/,
            template: "!(>$0)"
        }
    ),
    [FilterOperator.LE]: new FilterOperatorConfig(
        FilterOperator.LE,
        {
            re: /^<=(.+)$/,
            template: "<=$0"
        },
        {
            re: /^!\(<=(.+)\)$/,
            template: "!(<=$0)"
        }
    ),
    // needs to be earlier than LT, otherwise <empty> will be matched by LT
    [FilterOperator.Empty]: new FilterOperatorConfig(
        FilterOperator.Empty,
        {
            re: /^<empty>$/i,
            template: "<empty>"
        },
        {
            re: /^!\(<empty>(.+)\)$/,
            template: "!(<empty>)"
        }
    ),
    [FilterOperator.LT]: new FilterOperatorConfig(
        FilterOperator.LT,
        {
            re: /^<(.+)$/,
            template: "<$0"
        },
        {
            re: /^!\(<(.+)\)$/,
            template: "!(<$0)"
        }
    ),
    [FilterOperator.BT]: new FilterOperatorConfig(
        FilterOperator.BT,
        {
            re: /^(.+)\.{3}(.+)$/,
            template: "$0..$1"
        },
        {
            re: /^!\((.+)\.{3}(.+)\)$/,
            template: "!($0..$1)"
        }
    ),
    [FilterOperator.Contains]: new FilterOperatorConfig(
        FilterOperator.Contains,
        {
            re: /^\*(.+)\*$/,
            template: "*$0*"
        },
        {
            re: /^!\(\*(.+)\*\)$/,
            template: "!(*$0*)"
        }
    ),
    [FilterOperator.StartsWith]: new FilterOperatorConfig(
        FilterOperator.StartsWith,
        {
            re: /^([^\\*].*)\*$/,
            template: "$0*"
        },
        {
            re: /^!\(([^\\*].*)\*\)$/,
            template: "!($0*)"
        }
    ),
    [FilterOperator.EndsWith]: new FilterOperatorConfig(
        FilterOperator.EndsWith,
        {
            re: /^\*(.*[^\\*])$/,
            template: "*$0"
        },
        {
            re: /^!\(\*(.*[^\\*])\)$/,
            template: "!(*$0)"
        }
    ),
    // has to be the last entry, because its regex is the most wide
    [FilterOperator.Auto]: new FilterOperatorConfig(FilterOperator.Auto, {
        re: /^([^!\\(\\)\\*<>].*[^*]?)$/,
        template: "$0"
    })
};

/**
 * Map of possible operators by data type
 */
const typeFilterOperationMap: Record<string, string[]> = {
    Date: [
        FilterOperator.EQ,
        FilterOperator.GE,
        FilterOperator.GT,
        FilterOperator.LE,
        FilterOperator.Empty,
        FilterOperator.LT,
        FilterOperator.BT,
        FilterOperator.Auto
    ],
    Time: [
        FilterOperator.EQ,
        FilterOperator.GE,
        FilterOperator.GT,
        FilterOperator.LE,
        FilterOperator.LT,
        FilterOperator.BT,
        FilterOperator.Auto
    ],
    Numeric: [
        FilterOperator.EQ,
        FilterOperator.BT,
        FilterOperator.LT,
        FilterOperator.LE,
        FilterOperator.GT,
        FilterOperator.GE,
        FilterOperator.Auto
    ]
};

export default class FilterOperatorConfigurations implements Iterable<FilterOperatorConfig> {
    private _operatorKeys: string[];
    /**
     * Retrieves conditions object for a given type
     * @param type type name (e.g. String, Time, ...)
     * @returns conditions object for a given type
     */
    static getOperatorsForType(type: string, onlyExclude?: boolean): FilterOperatorConfigurations {
        let operators: string[];
        if (TypeUtil.isNumeric(type)) {
            operators = typeFilterOperationMap.Numeric.slice();
        } else {
            operators = typeFilterOperationMap[type]?.slice() ?? Object.keys(allConditionsMap);
        }
        if (onlyExclude) {
            operators = operators.filter(op => op !== FilterOperator.Auto);
        }
        return new FilterOperatorConfigurations(operators);
    }

    constructor(operatorKeys: string[]) {
        this._operatorKeys = operatorKeys;
    }

    [Symbol.iterator](): Iterator<FilterOperatorConfig> {
        let index = 0;

        return {
            next: () => {
                if (index < this._operatorKeys.length) {
                    return { value: allConditionsMap[this._operatorKeys[index++]], done: false };
                } else {
                    return { done: true, value: null };
                }
            }
        };
    }
}
