sap.ui.define(["sap/ui/test/Opa5"], function(Opa5) {
	"use strict";

	Opa5.createPageObjects({
		onTheAppPage: {
			assertions: {
				iShouldSeeTheAppPage: function() {
					// noinspection JSUnusedGlobalSymbols
					return this.waitFor({
						viewName: "App",
						success: function() {
							Opa5.assert.ok(true, "The app view was successfully displayed");
						},
						errorMessage: "The app view was not displayed"
					});
				}
			}
		}
	});
});
