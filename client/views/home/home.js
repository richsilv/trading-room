/*****************************************************************************/
/* Home: Event Handlers and Helpers */
/*****************************************************************************/
errors = new ReactiveDict(),
    selections = new ReactiveDict();

Handlebars.registerHelper('error', function(key) {

  return errors.get(key);

});

Handlebars.registerHelper('up', function(key) {

  return this.direction > 0;

});

Handlebars.registerHelper('down', function(key) {

  return this.direction < 0;

});

Template.Home.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.Home.helpers({

});

Template.connections.helpers({

  liveConnections: function() {
    return _.values(TradingRoom.connections.keys());
  }

});

Template.connections.events({

  'click #connectButton, submit': function() {

    var url = $('#connectURL').val();

    if (!url) {
      connectionError.set('Invalid URL');
      return false;
    }

    try {
      new TradingRoom.RemoteConnection( url );
      errors.set('connection', null);
    }

    catch (e) {
      errors.set('connections', e);
    }

    finally {
     return false;
    }  

  },

  'click #connection, change #connection': function(event) {

    selections.set('connection', $(event.target).val());

  }

});

Template.streams.helpers({

  liveStreams: function() {

    var connectionId = selections.get('connection'),
        connection = TradingRoom.connections.get(connectionId);

    return connection ? connection.TickEmitterData.find() : [];

  }

});

Template.streams.events({

  'click .stream': function(event) {

    selections.set('stream', $(event.currentTarget).attr('value'));
    $('.stream').removeClass('callout');
    $(event.target).addClass('callout');

  }

});

Template.priceData.helpers({

  stream: function() {

    var connectionId = selections.get('connection'),
        streamId = selections.get('stream'),
        connection = TradingRoom.connections.get(connectionId);

    if (connection && streamId)
      return connection.TickEmitterData.findOne(streamId);

  },

  priceSeries: function() {

    return _.map(TradingRoom.priceData.keys(), function(data) { return _.extend({latency: data.latency}, data.LastTrade.findOne()); });

  }

});

Template.priceData.events({

  'click #priceDataButton, submit form': function() {

    var connectionId = selections.get('connection'),
        streamId = selections.get('stream'),
        connection = TradingRoom.connections.get(connectionId),
        interval = parseInt($('#priceDataInterval').val(), 10),
        maxCandles = parseInt($('#priceDataMaxCandles').val(), 10);

    if (connection && streamId && interval && maxCandles) {
      var stream = connection.TickEmitterData.findOne({_id: streamId});
      if (stream) {
        var candlesColl = Random.id(),
            lastTradeColl = Random.id(),
            thisLastTradeCollection = new Meteor.Collection(lastTradeColl, connection.remote);
        TradingRoom.priceData.set(streamId, {
            connectionId: connectionId,
            streamId: streamId,
            Candles: new Meteor.Collection(candlesColl, connection.remote),
            LastTrade: thisLastTradeCollection,
            subscription: connection.remote.subscribe('pricedata', candlesColl, lastTradeColl, stream.ticker, interval, { time: {$gte: new Date(new Date().getTime() - (interval * maxCandles * 1.2))} }),
            latency: 0
        });
        thisLastTradeCollection.find().observeChanges({
          changed: function(id, fields) {
            if (fields.timeStamp) {
              TradingRoom.priceData.values[streamId].latency = new Date().getTime() - fields.timeStamp;
              TradingRoom.priceData.dep.changed();
            }
          }
        });
      }
    }
    return false;

  }

})

Template.candleData.helpers({

  candleObjects: function() {

/*    var GAP = 4;

    var maxCandles = Session.get('maxCandles');
    var queryOptions = maxCandles ? {limit: maxCandles} : {};
        candSet = Candles.find( {}, _.extend( queryOptions, {sort: {timeStamp: -1}}) ).fetch(),
        candLength = candSet.length,
        axisPadding = Session.get('axisPadding') || 0;

    if (!candLength) return [];

    var spacing = (Session.get('graphWidth') - axisPadding * 2) / (maxCandles || candLength),
        width = spacing - GAP,
        high = _.max(candSet, function(c) {return c.high;}).high,
        low = _.min(candSet, function(c) {return c.low;}).low,
        ratio = (Session.get('graphHeight') - axisPadding * 2) / (high - low),
        checkMarks = makeCheckMarks(low, high);

    return {
      candles: _.map(candSet, function(c, j, l) {

        var i = candLength - j - 1,
            blow = Math.min(c.open, c.close),
            bhigh = Math.max(c.open, c.close),
            colour = (c.open > c.close) ? "grey" : "lightblue",
            x = axisPadding + (i * spacing) + ((spacing - 1) / 2),
            bx = axisPadding + (i * spacing) + (GAP / 2),
            lh = axisPadding + (high - c.high) * ratio,
            ll = Math.max(axisPadding + (high - c.low) * ratio, lh + 1),
            bl = Math.max((bhigh - blow) * ratio, 1),
            bh = axisPadding + (high - bhigh) * ratio;

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
      }),

      checkMarks: {
        y: checkMarks.map(function(x) { return { val: x, pos: 25 + (high - x) * ratio }; })
      }

    }*/
  },

  candles: function() {
    // return Candles.find({}).fetch();
  },

  graphWidth: function() {
    return Session.get('graphWidth');
  },

  graphHeight: function() {
    return Session.get('graphHeight');
  },

  axisGap: function() {
    return (Session.get('axisPadding') || 5) - 5;
  },

  axisNegGap: function() {
    return (-Session.get('axisPadding') || -5) + 5;
  },

  addAttr: function(attr, add) {
    return attr + add;
  }

});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/

Template.Home.created = function () {
};

Template.Home.rendered = function () {
};

Template.Home.destroyed = function () {
};

makeCheckMarks = function(low, high) {

    var distance = Math.pow( 10, Math.floor( Math.log( ( high - low ) / 3 ) / Math.LN10 ) ),
        factor = Math.round(1 / distance);
        base = Math.ceil( low * factor ) / factor,
        checkMarks = [];

    for (var mark = base; mark <= high; mark += distance) {
      checkMarks.push(Math.round( mark * factor ) / factor);
    }

    return checkMarks;

};