import ajaxUtil from "../util/ajaxUtil";

const ENTITY_DP_SERVICE_URL = "/sap/zqdrtrest/entities/{type}/{name}/dataPreview";
const FREESTYLE_DP_SERVICE_URL = "/sap/zqdrtrest/freestyleDataPreview";
/**
 * Service for getting data preview content
 *
 * @alias devepos.qdrt.model.dataAccess.rest.DataPreviewService
 */
export default class DataPreviewService {
    /**
     * Retrieves entity data
     * @param {String} type type of the entity
     * @param {String} entity the name of the entity
     * @returns {Promise<Object>}
     */
    async getEntityData(type, entity) {
        const CSRFToken = await ajaxUtil.fetchCSRF();
        return ajaxUtil.send(`${ENTITY_DP_SERVICE_URL.replace("{type}", type).replace("{name}", entity)}`, {
            data: {},
            method: "POST",
            CSRFToken
        });
    }
}
