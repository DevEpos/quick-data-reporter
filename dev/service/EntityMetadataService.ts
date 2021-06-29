import ajaxUtil from "./util/ajaxUtil";
import { IEntityMetadata } from "../model/ServiceModel";

const SERVICE_URL = "/sap/zqdrtrest/entities/{type}/{name}/metadata";

/**
 * Service to get meta data information about database entities
 * @alias devepos.qdrt.model.dataAccess.rest.EntityMetadataService
 */
export default class EntityMetadataService {
    /**
     * Retrieves metadata for entity
     * @param type type of the entity
     * @param name the name of the entity
     * @returns Promise with object from the response
     */
    async getMetadata(type: string, name: string): Promise<IEntityMetadata> {
        const response = await ajaxUtil.send(`${SERVICE_URL.replace("{type}", type).replace("{name}", name)}`, {
            method: "GET"
        });
        return response?.data;
    }
}
