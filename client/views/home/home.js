/*****************************************************************************/
/* Home: Event Handlers and Helpers */
/*****************************************************************************/
errors = new ReactiveDict(),
    selections = new ReactiveDict();

Handlebars.registerHelper('error', function(key) {

  return errors.get(key);

});

Handlebars.registerHelper('or', function(x, y) {

  return x || y;

});

Handlebars.registerHelper('up', function(key) {

  return this.direction > 0;

});

Handlebars.registerHelper('down', function(key) {

  return this.direction < 0;

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

    return _.map(TradingRoom.priceData.keys(), function(data) { return _.extend({latency: data.latency, priceDataId: data.candlesId}, data.LastTrade.findOne()); });

  }

});

Template.priceData.events({

  'click #priceDataButton, submit form': function() {

    var connectionId = selections.get('connection'),
        streamId = selections.get('stream'),
        interval = parseInt($('#priceDataInterval').val(), 10),
        maxCandles = parseInt($('#priceDataMaxCandles').val(), 10);

    new TradingRoom.PriceDataSub(connectionId, streamId, interval, maxCandles);

    return false;

  },

  'click .priceSeries.panel': function(event) {

    TradingRoom.priceData.values[this.priceDataId].liveChart = true;
    TradingRoom.priceData.dep.changed();

  },

  'click .cancelButton': function(event) {

    TradingRoom.priceData.get(this.priceDataId).stop();
    return false;

  }

});

Template.charts.helpers({

  charts: function() {
    return TradingRoom.priceData.getFilter({liveChart: true});
  }

});

Template.chart.helpers({

  candleObjects: function() {

    var GAP = App.candleGap,
        chartCanvas = UI._templateInstance().find('.chartCanvas'),
        maxCandles = 0,
        queryOptions = maxCandles ? {limit: maxCandles} : {};
        candSet = this.Candles.find( {}, _.extend( queryOptions, {sort: {timeStamp: -1}}) ).fetch(),
        candLength = candSet.length,
        axisPadding = App.axisPadding || 0,
        graphWidth = chartCanvas ? $(chartCanvas).width() : 300,
        graphHeight = App.graphHeight;

    if (!candLength) return [];

    var spacing = (graphWidth - axisPadding * 2) / (maxCandles || candLength),
        width = spacing - GAP,
        high = _.max(candSet, function(c) {return c.high;}).high,
        low = _.min(candSet, function(c) {return c.low;}).low,
        ratio = (graphHeight - axisPadding * 2) / (high - low),
        checkMarks = makeCheckMarks(low, high);

    return {
      candles: _.map(candSet, function(c, j, l) {

        var i = candLength - j - 1,
            blow = Math.min(c.open, c.close),
            bhigh = Math.max(c.open, c.close),
            colour = (c.open > c.close) ? App.downColour : App.upColour,
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

    }
  },

  graphHeight: function() {
    return App.graphHeight;
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

Template.chart.events({

  'click .cancelButton': function() {

      TradingRoom.priceData.values[this.candlesId].liveChart = false;
      TradingRoom.priceData.dep.changed();

  }

})

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