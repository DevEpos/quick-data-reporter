import { IEntityVariant } from "../model/ServiceModel";
import ajaxUtil from "./util/ajaxUtil";

const SERVICE_URL = "/sap/zqdrtrest/entities/{type}/{name}/variants";

/**
 * Service for accessing view/table variants of db entities
 * @alias devepos.qdrt.model.dataAccess.rest.VariantsService
 */
export default class VariantsService {
    /**
     * Retrieves variants for entity
     * @param type type of the entity
     * @param name the name of the entity
     * @returns Promise of entity variants
     */
    async getVariants(type: string, name: string): Promise<IEntityVariant[]> {
        const response = await ajaxUtil.send(`${SERVICE_URL.replace("{type}", type).replace("{name}", name)}`, {
            method: "GET"
        });
        return response?.data;
    }
}
