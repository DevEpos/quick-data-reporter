import ajaxUtil from "./util/ajaxUtil";
import { DataPreview, EntityMetadata } from "../model/ServiceModel";

const BASE_SRV_URL = "/sap/zqdrtrest/entities/{type}/{name}";

/**
 * Service to get meta data information about database entities
 */
export default class EntityService {
    /**
     * Retrieves metadata for entity
     * @param type type of the entity
     * @param name the name of the entity
     * @returns Promise with object from the response
     */
    async getMetadata(type: string, name: string): Promise<EntityMetadata> {
        const response = await ajaxUtil.send(
            `${BASE_SRV_URL.replace("{type}", type).replace("{name}", name)}/metadata`,
            {
                method: "GET"
            }
        );
        return response?.data;
    }

    /**
     * Retrieves entity data
     * @param type type of the entity
     * @param entity the name of the entity
     * @returns the object from the response if response was ok
     */
    async getEntityData(type: string, entity: string): Promise<DataPreview> {
        const csrfToken = await ajaxUtil.fetchCSRF();
        const response = await ajaxUtil.send(
            `${BASE_SRV_URL.replace("{type}", type).replace("{name}", entity)}/dataPreview`,
            {
                method: "POST",
                csrfToken
            }
        );
        return response?.data;
    }
}
