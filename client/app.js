/*****************************************************************************/
/* Client App Namespace  */
/*****************************************************************************/
_.extend(App, {
});

App.helpers = {
};

_.each(App.helpers, function (helper, key) {
  Handlebars.registerHelper(key, helper);
});

Session.set('graphWidth', 800);
Session.set('graphHeight', 400);
Session.set('axisPadding', 35);
Session.set('ticker', 'EURUSD');
