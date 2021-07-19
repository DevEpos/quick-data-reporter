import { DataPreview, ValueHelpRequest } from "../model/ServiceModel";
import ajaxUtil from "./ajaxUtil";

const BASE_URL = `/sap/zqdrtrest/valueHelpData`;
/**
 * Service to retrieve information about value helps
 */
export default class ValueHelpService {
    /**
     * Retrieves value help metadata for a field in a DB entity
     *
     * @param valueHelpRequest the request information to fetch value help data
     * @returns promise with metadata result of the found valuehelp
     */
    async retrieveValueHelpData(valueHelpRequest: ValueHelpRequest): Promise<DataPreview> {
        const csrfToken = await ajaxUtil.fetchCSRF();
        const response = await ajaxUtil.send(`${BASE_URL}`, {
            method: "POST",
            data: JSON.stringify(valueHelpRequest),
            csrfToken
        });
        return response?.data;
    }
}
