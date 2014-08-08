HomeController = RouteController.extend({
  waitOn: function () {
  },

  data: function () {
  	return {
  		graphSub: Session.get('graphSub')
  	}
  },

  action: function () {
    this.render();
  }
});
