import ajaxUtil from "../util/ajaxUtil";

const SERVICE_URL = "/sap/zqdrtrest/entities/vh";

/**
 * Service to search for database entities
 * @alias devepos.qdrt.model.dataAccess.rest.EntitySearchService
 */
export default class EntitySearchService {
    /**
     * Searches for DB entities
     * @param {string} filterValue filter value to search entities
     * @returns {Promise<Object>} Promise with response result
     */
    async searchDbEntities(filterValue) {
        const response = await ajaxUtil.send(`${SERVICE_URL}?$top=50&filter=${filterValue}`);
        return response?.data;
    }
}
