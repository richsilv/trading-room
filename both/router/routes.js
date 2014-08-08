/*****************************************************************************/
/* Client and Server Routes */
/*****************************************************************************/
Router.configure({
  layoutTemplate: 'MasterLayout',
  loadingTemplate: 'Loading',
  notFoundTemplate: 'NotFound',
  templateNameConverter: 'upperCamelCase',
  routeControllerNameConverter: 'upperCamelCase'
});

Router.map(function () {
  /*
    Example:
      this.route('home', {path: '/'});
  */
  this.route('home', {
    path: '/',
    onBeforeAction: function() {
      Session.set('maxCandles', parseInt(this.params.limit, 10) || 500);
      Session.set('interval', parseInt(this.params.interval, 10) || 10000);
    }
  });
});
