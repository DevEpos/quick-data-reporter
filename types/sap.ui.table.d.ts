declare module "sap/ui/table/Table" {
    export default interface Table {
        /**
         * Internal method to enable a timout during moving the scrollbar
         * in the table
         * @private
         */
        _setLargeDataScrolling(enable: boolean): boolean;
    }
}
