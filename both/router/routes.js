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
    data: {foor: "bar"},
    template: 'Home',
    waitOn: function() {
      Meteor.subscribe('pricedata', {}, this.params.interval ? parseInt(this.params.interval, 10) : 10000);
    }
  });
});
