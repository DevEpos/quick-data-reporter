import EntityState from "./EntityState";

/**
 * Keeps singleton instances of states
 */
export default class StateRegistry {
    private static _entityState: EntityState;
    /**
     * Singleton
     */
    // eslint-disable-next-line
    private constructor() {}
    /**
     * Retrieves the current entity state
     * @returns the current entity state
     */
    static getEntityState(): EntityState {
        if (!StateRegistry._entityState) {
            StateRegistry._entityState = new EntityState();
        }
        return StateRegistry._entityState;
    }
}
