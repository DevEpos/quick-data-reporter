import { ValueHelpMetadata, DataPreview } from "../model/ServiceModel";
import ajaxUtil from "./ajaxUtil";

const BASE_URL = `/sap/zqdrtrest/valuehelpdata`;
/**
 * Service to retrieve information about value helps
 */
export default class ValueHelpService {
    /**
     * Retrieves value help metadata for a field in a DB entity
     *
     * @param valueHelpMetadata the metadata for the value help
     * @returns promise with metadata result of the found valuehelp
     */
    async retrieveValueHelpData(valueHelpMetadata: ValueHelpMetadata): Promise<DataPreview> {
        const csrfToken = await ajaxUtil.fetchCSRF();
        const response = await ajaxUtil.send(`${BASE_URL}`, {
            method: "POST",
            data: valueHelpMetadata,
            csrfToken
        });
        return response?.data;
    }
}
