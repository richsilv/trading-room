/*****************************************************************************/
/* Home: Event Handlers and Helpers */
/*****************************************************************************/
Template.Home.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.Home.helpers({
  /*
   * Example: 
   *  items: function () {
   *    return Items.find();
   *  }
   */
});

Template.candleData.helpers({

  candleObjects: function() {

    console.log(this);

    var queryOptions = (this.data && this.data.maxCandles) ? {limit: this.data.maxCandles} : {};
        candSet = Candles.find( {}, _.extend( queryOptions, {sort: {timeStamp: -1}}) ).fetch();

    if (!candSet.length) return [];

    var spacing = (Session.get('graphWidth') - 50) / ((this.data && this.data.maxCandles) || candSet.length),
        width = spacing - 4,
        high = _.max(candSet, function(c) {return c.high;}).high,
        low = _.min(candSet, function(c) {return c.low;}).low,
        ratio = 350 / (high - low);

    return _.map(candSet, function(c, i) {

      var blow = Math.min(c.open, c.close),
          bhigh = Math.max(c.open, c.close),
          colour = (c.open > c.close) ? "grey" : "lightblue",
          x = 25 + (i * spacing),
          bx = 25 + (i * spacing) - (width / 2),
          lh = 25 + (high - c.high) * ratio,
          ll = Math.max(25 + (high - c.low) * ratio, lh + 1),
          bl = Math.max((bhigh - blow) * ratio, 1),
          bh = 25 + (high - bhigh) * ratio;

      return {
        x: x,
        bx: bx,
        w: width,
        ll: ll,
        bl: bl,
        bh: bh,
        lh: lh,
        colour: colour
      }
    }); 
  },

  candles: function() {
    return Candles.find({}).fetch();
  },

  graphWidth: function() {
    return Session.get('graphWidth');
  }

});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/
Template.candleData.created = function() {

};

Template.Home.created = function () {
};

Template.Home.rendered = function () {
};

Template.Home.destroyed = function () {
};
