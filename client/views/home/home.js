/*****************************************************************************/
/* Home: Event Handlers and Helpers */
/*****************************************************************************/
var errors = new ReactiveDict(),
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

Handlebars.registerHelper('addAttr', function(x, y) {

  return x + y;

});

/*  addAttr: function() {
    return _.reduce( arguments, function(x, y) { return x + y; }, 0);
  },
*/
Handlebars.registerHelper('neg', function(x) {
   
  return -x;

});

Handlebars.registerHelper('graphDetails', function() {

  var chartCanvas = UI._templateInstance().find('.chartCanvas'),
      axisGap = App.axisPadding || 0,
      graphWidth = chartCanvas ? $(chartCanvas).width() : 300,
      graphHeight = App.graphHeight,
      fontFamily = App.fontFamily,
      textSize = App.textSize;

  return {
    graphWidth: graphWidth,
    halfWidth: graphWidth / 2,
    graphHeight: graphHeight,
    textSize: textSize,
    fontFamily: fontFamily || "Arial",
    halfTextSize: textSize / 2,
    axisGap: axisGap,
    axisNegGap: -axisGap
  }

});

Handlebars.registerHelper('showMe', function(x) {

  console.log(x);

});

Template.connections.helpers({

  liveConnections: function() {
    return _.values(TradingRoom.connections.keys());
  }

});

Template.connections.events({

  'click #connectButton, submit': function() {

    var url = $('#connectURL').val();
    errors.set('connection', TradingRoom.connectURL(url));

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

    return _.map(TradingRoom.priceData.keys(), function(data) { return _.extend({latency: data.latency, priceDataId: data.candlesId, ready: data.subHandle.ready()}, data.LastTrade.findOne()); });

  }

});

Template.priceData.events({

  'click #priceDataButton, submit form': function() {

    var connectionId = selections.get('connection'),
        streamId = selections.get('stream'),
        interval = parseInt($('#priceDataInterval').val(), 10),
        maxCandles = parseInt($('#priceDataMaxCandles').val(), 10);

    var newStream = new TradingRoom.PriceDataSub(connectionId, streamId, interval, maxCandles);
    newStream.yAxis = _.reduce(App.timeFormats, function(x, i) {return (interval * maxCandles) / 7 > i.step ? i : x}, {step: 1000, format: "H:mm:ss"});

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
        maxCandles = this.maxCandles,
        queryOptions = maxCandles ? {limit: maxCandles} : {};
        candSet = this.Candles.find( {}, _.extend( queryOptions, {sort: {timeStamp: -1}}) ).fetch(),
        candLength = candSet.length,
        axisPadding = App.axisPadding || 0,
        graphWidth = chartCanvas ? $(chartCanvas).width() : 300,
        graphHeight = App.graphHeight,
        lastTrade = this.LastTrade.findOne();

    if (!candLength) return [];

    var spacing = (graphWidth - axisPadding * 2) / (maxCandles || candLength),
        width = spacing - GAP,
        high = _.max(candSet, function(c) {return c.high;}).high,
        low = _.min(candSet, function(c) {return c.low;}).low,
        ratio = (graphHeight - axisPadding * 2) / (high - low),
        checkMarks = makeCheckMarks(low, high),
        yAxis = this.yAxis,
        liveCandleId = this.liveCandle._id,
        yAxisDetails = makeYAxis(candSet[candSet.length - 1].timeStamp.getTime(), candSet[0].timeStamp.getTime(), yAxis, axisPadding, graphWidth);

    return {
      candles: _.map(candSet, function(c, j, l) {

        var i = candLength - j - 1,
            blow = Math.min(c.open, c.close),
            bhigh = Math.max(c.open, c.close),
            x = axisPadding + (i * spacing) + ((spacing - 1) / 2),
            bx = axisPadding + (i * spacing) + (GAP / 2),
            lh = axisPadding + (high - c.high) * ratio,
            ll = Math.max(axisPadding + (high - c.low) * ratio, lh + 1),
            bl = Math.max((bhigh - blow) * ratio, 1),
            bh = axisPadding + (high - bhigh) * ratio,
            liveCandle = (c._id === liveCandleId);

        return {
          liveCandle: liveCandle,
          _id: c._id,
          x: x,
          bx: bx,
          w: width,
          ll: ll,
          bl: bl,
          bh: bh,
          lh: lh,
          time: moment(c.timeStamp).format(yAxis.format),
          high: c.high.toFixed(4),
          low: c.low.toFixed(4),
          open: c.open.toFixed(4),
          close: c.close.toFixed(4),
          colour: c.open > c.close
        }
      }),

      checkMarks: {
        y: checkMarks.map(function(x) { return { val: x, pos: 25 + (high - x) * ratio }; })
      },

      lastPrice: lastTrade ? lastTrade.price.toFixed(4) : "0",

      lastPriceLevel: axisPadding + (high - (lastTrade ? lastTrade.price : 0)) * ratio,

      lastTradeColour: lastTrade ? ["#d64a4a", "grey", "#2bc62b"][lastTrade.direction + 1] : "grey",

      yAxis: yAxisDetails

    }
  }

});

Template.chart.events({

  'click .cancelButton': function() {

      TradingRoom.priceData.values[this.candlesId].liveChart = false;
      TradingRoom.priceData.dep.changed();

  },

});

var changeCount = 0;

Template.candle.helpers({

  liveCandleDep: function() {

    UI._parentData(1).liveCandle.dep.depend();
    console.log("live candle changed", changeCount++);
    return this.liveCandle ? "live" : null;

  }

});

Template.candle.events({

  'mouseover .candle': function() {

    var priceData = UI._parentData(1);
    if (priceData) {
     priceData.liveCandle._id = this._id;
     priceData.liveCandle.dep.changed();
   }

  },

  'mouseout .candle': function() {

    var priceData = UI._parentData(1);
    if (priceData) {
     priceData.liveCandle._id = null;
     priceData.liveCandle.dep.changed();
   }

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

makeYAxis = function(low, high, spacing, axisPadding, graphWidth) {

  var spread = high - low,
      ratio = (graphWidth - (axisPadding * 2)) / spread,
      times = [],
      textSize = App.textSize;

  for (var t = Math.ceil(low / spacing.step) * spacing.step; t < high; t += spacing.step) {
    times.push({
      label: moment(t).format(spacing.format),
      position: axisPadding + (t - low) * ratio,
      offset: -textSize * spacing.format.length * 0.6 / 2
    });
  }

  return times;

}