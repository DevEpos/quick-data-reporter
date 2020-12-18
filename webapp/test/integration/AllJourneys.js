sap.ui.define([
    'sap/ui/test/opaQunit',
    "sap/ui/test/Opa5",
    "devepos/qdrt/test/integration/pages/Page"
], function (opaTest, Opa5) {
    "use strict";

    Opa5.extendConfig({
        viewNamespace: "devepos.qdrt.view",
        arrangements: new Opa5({
            startMyApp: function () { //-> for headless testing
                this.iStartMyUIComponent({
                    componentConfig: {
                        name: "devepos.qdrt",
                        async: true
                    }
                });
            },
            closeMyApp: function () { //-> for headless testing
                this.iTeardownMyUIComponent();
            }
        })
    });

    QUnit.module("Welcome Journey");

    opaTest("Should see the page", function (Given, When, Then) {

        // start the app
        Given.startMyApp();

        // assert welcome view is shown
        Then.onTheAppPage.iShouldSeeTheAppPage();

        // validate categories list size
        Given.closeMyApp();
    });
});
