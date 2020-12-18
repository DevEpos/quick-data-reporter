sap.ui.define(
	[
		"sap/ui/base/ManagedObject",
		"sap/ui/core/mvc/Controller",
		"devepos/qdrt/controller/App.controller"
	],
	function(ManagedObject, Controller, AppController) {
		"use strict";

		// noinspection JSUnusedGlobalSymbols
		QUnit.module("Test model modification", {
			beforeEach: function() {
				this.oAppController = new AppController();
				this.oViewStub = new ManagedObject({});
				sinon.stub(Controller.prototype, "getView").returns(this.oViewStub);
			},

			afterEach: function() {
				Controller.prototype.getView.restore();
				this.oViewStub.destroy();
			}
		});

		QUnit.test("A model should be created.", function(assert) {
			this.oAppController.onInit();
			var oModel = this.oAppController.getView().getModel();
			assert.ok(oModel, "Model correctly filled");
		});
	}
);
