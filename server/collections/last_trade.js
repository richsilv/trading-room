LastTrade = new Meteor.Collection('lasttrade');

/*
 * Add query methods like this:
 *  LastTrade.findPublic = function () {
 *    return LastTrade.find({is_public: true});
 *  }
 */

LastTrade.allow({
  insert: function (userId, doc) {
    return false;
  },

  update: function (userId, doc, fieldNames, modifier) {
    return true;//(fieldNames.indexOf('latency') > -1 && fieldNames.length === 1);
  },

  remove: function (userId, doc) {
    return false;
  }
});

LastTrade.deny({
  insert: function (userId, doc) {
    return true;
  },

  update: function (userId, doc, fieldNames, modifier) {
    return false;
  },

  remove: function (userId, doc) {
    return true;
  }
});
