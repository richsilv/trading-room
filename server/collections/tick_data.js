TickData = new Meteor.Collection('tick_data');

TickEmitters = [];

/*
 * Add query methods like this:
 *  TickData.findPublic = function () {
 *    return TickData.find({is_public: true});
 *  }
 */

TickData.allow({
  insert: function (userId, doc) {
    return false;
  },

  update: function (userId, doc, fieldNames, modifier) {
    return false;
  },

  remove: function (userId, doc) {
    return false;
  }
});

TickData.deny({
  insert: function (userId, doc) {
    return true;
  },

  update: function (userId, doc, fieldNames, modifier) {
    return true;
  },

  remove: function (userId, doc) {
    return true;
  }
});
