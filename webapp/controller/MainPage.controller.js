sap.ui.define(
    [
        "jQuery.sap.global",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/m/IconTabFilter",
        "./BaseController",
        "../util/systemUtil",
        "../util/ajaxUtil"
    ],
    (jQuery, JSONModel, MessageToast, MessageBox, IconTabFilter, BaseController, SystemUtil, AjaxUtil) => {
        const VIEW_MODEL = "viewModel";
        const ANALYSIS_FILTER_PREFIX = "ANL:";
        /**
         * Main Page controller
         *
         * @alias devepos.qdrt.controller.MainPage
         */
        return BaseController.extend("devepos.qdrt.controller.MainPage", {
            onInit() {
                this._openEntityMap = new Map();
                this._viewModel = new JSONModel({ currentEntity: { name: "" } });
                this.setModel(this._viewModel, VIEW_MODEL);
                this.onSearchForEntities({
                    mParams: {
                        query: "demo*"
                    },
                    getParameter(id) {
                        return this.mParams[id];
                    }
                });
            },

            onCloseAnalysis(event) {},

            onCloseAllEntities(event) {
                const openAnalysesToClose = [];
                const tabBar = this._getAnalysisTabBar();
                const items = tabBar.getItems();
                items?.forEach(item => {
                    if (!(item instanceof IconTabFilter)) {
                        return;
                    }
                    if (item.getKey().startsWith(ANALYSIS_FILTER_PREFIX)) {
                        openAnalysesToClose.push(item.getId());
                    }
                });
                const closeItems = () => {
                    openAnalysesToClose.forEach(id => {
                        tabBar.removeItem(id);
                    });
                    this._openEntityMap.clear();
                };
                if (openAnalysesToClose.length > 0) {
                    const bundle = this.getResourceBundle();
                    MessageBox.confirm(bundle.getText("message_question_closeAllTabs"), {
                        title: bundle.getText("message_title_confirm"),
                        onClose: actionId => {
                            if (actionId === MessageBox.Action.OK) {
                                closeItems();
                            }
                        }
                    });
                }
            },

            /**
             * Opens pressed db entity as new "tab" in icon tab
             * @param {Object} event press event object
             */
            onOpenEntity(event) {
                const tabBar = this._getAnalysisTabBar();
                const item = event.getSource();
                const dbEntity = this._viewModel.getObject(item.getBindingContextPath());
                if (dbEntity) {
                    const newEntityKey = `${ANALYSIS_FILTER_PREFIX}${dbEntity.name}:${Date.now()}`;
                    const newEntityTab = new IconTabFilter({
                        design: sap.m.IconTabFilterDesign.Horizontal,
                        key: newEntityKey,
                        text: dbEntity.name,
                        icon: dbEntity.typeIcon,
                        tooltip: `${dbEntity.name}\n${dbEntity.description}`
                    });
                    // attach browser event to show custom context menu to tab filter
                    newEntityTab.addEventDelegate({
                        oncontextmenu: e => {
                            e.preventDefault();
                            const bundle = this.getResourceBundle();
                            const menu = new sap.m.Menu({
                                items: [
                                    new sap.m.MenuItem({
                                        icon: "sap-icon://refresh",
                                        text: bundle.getText("analysisTab_contextmenu_refresh")
                                    }),
                                    new sap.m.MenuItem({
                                        icon: "sap-icon://decline",
                                        text: bundle.getText("analysisTab_contextmenu_close"),
                                        startsSection: true,
                                        press: e => {
                                            tabBar.removeItem(newEntityTab);
                                            this._openEntityMap.delete(newEntityKey);
                                        }
                                    })
                                ]
                            });
                            menu.openBy(newEntityTab);
                        }
                    });
                    tabBar.addItem(newEntityTab);
                    this._openEntityMap.set(newEntityKey, {
                        name: dbEntity.name,
                        type: dbEntity.type,
                        description: dbEntity.description,
                        packageName: dbEntity.packageName
                    });

                    tabBar.setSelectedKey(newEntityKey);

                    // update current entity property
                    const entityInfo = this._openEntityMap.get(newEntityKey);
                    this._viewModel.setProperty("/currentEntity", entityInfo);
                }
            },
            onEntitySelect(event) {
                const entityKey = event.getParameter("key");
                if (entityKey) {
                    const entityInfo = this._openEntityMap.get(entityKey);
                    this._viewModel.setProperty("/currentEntity", entityInfo);
                }
            },

            async onSearchForEntities(event) {
                const filterValue = event.getParameter("query");
                if (!filterValue) {
                    return;
                }

                const filterTable = this.getView().byId("foundEntitiesTable");

                filterTable.setBusy(true);
                const response = await AjaxUtil.fetch(
                    {
                        url: `/sap/zqdrt/rest/entities/vh?$top=50&filter=${filterValue}`
                    },
                    true
                );
                filterTable.setBusy(false);

                if (response.status === 200) {
                    const bundle = this.getResourceBundle();
                    for (const entity of response.data) {
                        if (entity.type) {
                            switch (entity.type) {
                                case "C":
                                    entity.typeIcon = "sap-icon://customer-view";
                                    entity.typeTooltip = bundle.getText("dbEntity_type_cds");
                                    break;
                                case "T":
                                    entity.typeIcon = "sap-icon://grid";
                                    entity.typeTooltip = bundle.getText("dbEntity_type_table");
                                    break;
                                case "V":
                                    entity.typeIcon = "sap-icon://table-view";
                                    entity.typeTooltip = bundle.getText("dbEntity_type_view");
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                    this._viewModel.setProperty("/foundEntities", response.data);
                } else {
                    this._viewModel.setProperty("/foundEntities", []);
                }
            },
            _getAnalysisTabBar() {
                return this.getView().byId("analysisTabBar");
            },
            _getFreeEntityKey(entityName) {}
        });
    }
);
