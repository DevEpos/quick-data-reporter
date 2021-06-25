import ajaxUtil from "../util/ajaxUtil";

const SERVICE_URL = "/sap/zqdrtrest/entities/vh";

/**
 * Service to search for database entities
 * @alias devepos.qdrt.model.dataAccess.rest.EntitySearchService
 */
export default class EntitySearchService {
    /**
     * Searches for DB entities
     * @param filterValue filter value to search entities
     * @returns Promise with response result
     */
    async searchDbEntities(filterValue: string): Promise<any> {
        const response = await ajaxUtil.send(`${SERVICE_URL}?$top=50&filter=${filterValue}`);
        return response?.data;
    }
}
