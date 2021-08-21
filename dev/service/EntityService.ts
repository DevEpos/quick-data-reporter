import ajaxUtil from "./ajaxUtil";
import {
    QueryResult,
    DbEntity,
    EntityMetadata,
    EntityVariant,
    EntityType,
    ValueHelpMetadata,
    FieldMetadata
} from "../model/ServiceModel";

const BASE_SRV_URL = "/sap/zqdrtrest/entities";
const SUB_ENTITY_SRV_URL = `${BASE_SRV_URL}/{type}/{name}`;

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
            `${SUB_ENTITY_SRV_URL.replace("{type}", type).replace("{name}", name)}/metadata`,
            {
                method: "GET"
            }
        );
        if (response?.data?.fields) {
            const metadata: EntityMetadata = {
                fields: (response.data.fields as Record<string, any>[]).map(f => Object.assign(new FieldMetadata(), f))
            };

            if (response.data.parameters) {
                metadata.parameters = (response.data.parameters as Record<string, any>[]).map(f =>
                    Object.assign(new FieldMetadata(), f)
                );
            }

            return metadata;
        } else {
            return null;
        }
    }

    /**
     * Retrieves entity data
     * @param type type of the entity
     * @param entity the name of the entity
     * @returns the object from the response if response was ok
     */
    async getEntityData(type: string, entity: string): Promise<QueryResult> {
        const csrfToken = await ajaxUtil.fetchCSRF();
        const response = await ajaxUtil.send(
            `${SUB_ENTITY_SRV_URL.replace("{type}", type).replace("{name}", entity)}/queryResult`,
            {
                method: "POST",
                csrfToken
            }
        );
        return response?.data;
    }

    /**
     * Retrieves value help metadata for a field in a DB entity
     *
     * @param entityName the name of an entity (DB table/DB view/CDS view)
     * @param entityType the type of the entity
     * @param field the name of the field for which the value help metatdata should be retrieved
     * @returns promise with metadata result of the found valuehelp
     */
    async getValueHelpMetadata(entityName: string, entityType: EntityType, field: string): Promise<ValueHelpMetadata> {
        const response = await ajaxUtil.send(
            `${SUB_ENTITY_SRV_URL.replace("{type}", entityType).replace("{name}", entityName)}/valueHelpMetadata`,
            {
                method: "GET",
                data: { field }
            }
        );
        return response?.data;
    }

    /**
     * Retrieves variants for entity
     * @param type type of the entity
     * @param name the name of the entity
     * @returns Promise of entity variants
     */
    async getVariants(type: string, name: string): Promise<EntityVariant[]> {
        const response = await ajaxUtil.send(
            `${SUB_ENTITY_SRV_URL.replace("{type}", type).replace("{name}", name)}/variants`,
            {
                method: "GET"
            }
        );
        return response?.data;
    }

    /**
     * Searches for DB entities
     * @param filterValue filter value to search entities
     * @returns Promise with response result
     */
    async findEntities(filterValue: string): Promise<DbEntity[]> {
        const response = await ajaxUtil.send(`${BASE_SRV_URL}?$top=50&filter=${filterValue}`);
        return response?.data;
    }
}
