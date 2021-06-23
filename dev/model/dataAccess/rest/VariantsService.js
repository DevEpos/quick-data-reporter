import ajaxUtil from "../util/ajaxUtil";

const SERVICE_URL = "/sap/zqdrtrest/entities/{type}/{name}/variants";

/**
 * Service for accessing view/table variants of db entities
 * @alias devepos.qdrt.model.dataAccess.rest.VariantsService
 */
export default class VariantsService {
    /**
     * Retrieves variants for entity
     * @param {String} type type of the entity
     * @param {String} name the name of the entity
     * @returns {Promise<Object>}
     */
    async getVariants(type, name) {
        const CSRFToken = await ajaxUtil.fetchCSRF();
        const response = await ajaxUtil.send(`${SERVICE_URL.replace("{type}", type).replace("{name}", name)}`, {
            data: {},
            CSRFToken
        });
        return response?.data;
    }
}
