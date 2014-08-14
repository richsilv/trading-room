Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
    }
}

ReactiveObj = function(def) {

	var _this = this;
	this.values = def || {};
	this.dep = new Deps.Dependency;

	this.get = function(key) {
		_this.dep.depend();
		return _this.values[key];
	};

	this.getIndex = function(index) {
		var key = Object.keys(_this.values)[index];
		return _this.get(key);
	};

	this.getFilter = function(filter) {
		_this.dep.depend();
		return _.where(_.values(_this.values), filter);
	};

	this.set = function(key, value) {
		_this.values[key] = value;
		_this.dep.changed();
	};

	this.unset = function(key) {
		delete _this.values[key];
		_this.dep.changed();
	}

	this.setMulti = function(object) {
		_.extend(_this.values, object);
		_this.dep.changed();
	}

	this.keys = function() {
		_this.dep.depend();
		return _this.values;
	}

}

TradingRoom = {
	connections: new ReactiveObj(),
	priceData: new ReactiveObj()
};

TradingRoom.connectURL = function(url) {

	var error

    if (!url) {
      connectionError.set('Invalid URL');
      return false;
    }

    try {
      new TradingRoom.RemoteConnection( url );
    }

    catch (e) {
      error = e;
    }

    finally {
     return error;
    }

}

TradingRoom.RemoteConnection = function(url) {

	var _this = this;

	this._id = Random.id();
	this.url = url;
	this.remote = DDP.connect(url);
	this.TickEmitterData = new Meteor.Collection('tickemitterdata', this.remote);
	this.subHandle = this.remote.subscribe('emitterdata');

	TradingRoom.connections.set(this._id, this);

	this.stop = function() {
		_this.subHandle.stop();
		_this.remote.disconnect();
		TradingRoom.connections.unset(_this._id);
	}

}

TradingRoom.PriceDataSub = function(connectionId, streamId, interval, maxCandles) {

	interval = interval || 10000;
	maxCandles = maxCandles || 50;

	var connection = TradingRoom.connections.get(connectionId);
	if (!connection) throw new Meteor.Error(400, "Bad connection id");

	var stream = connection.TickEmitterData.findOne({_id: streamId});
	if (!stream) throw new Meteor.Error(400, "Bad stream id");

	var _this = this,
		filter = { time: { $gte: new Date(new Date().getTime() - maxCandles * interval * 1.2) } },
		candlesColl = Random.id(),
        lastTradeColl = Random.id(),
		thisLastTradeCollection = new Meteor.Collection(lastTradeColl, connection.remote),
		thisCandlesCollection = new Meteor.Collection(candlesColl, connection.remote);
    
    _.extend(this, {
        connectionId: connectionId,
        streamId: streamId,
        candlesId: candlesColl,
        Candles: thisCandlesCollection,
        maxCandles: maxCandles,
        interval: interval,
        LastTrade: thisLastTradeCollection,
        subHandle: connection.remote.subscribe('pricedata', candlesColl, lastTradeColl, stream.ticker, interval, { time: {$gte: new Date(new Date().getTime() - (interval * maxCandles * 1.2))} }),
        latency: 0,
        liveCandle: {
        	_id: null,
        	dep: new Deps.Dependency()
        }
    });

    TradingRoom.priceData.set(candlesColl, this);

    thisLastTradeCollection.find().observeChanges({
      	changed: function(id, fields) {
        	if (fields.timeStamp) {
          		_this.latency = new Date().getTime() - fields.timeStamp;
        	}
      	}
    });

	TradingRoom.priceData.dep.changed();

	this.stop = function() {
		_this.subHandle.stop();
		TradingRoom.priceData.unset(candlesColl);
	}

}

TradingRoom.priceData.selectChart = function(id) {

	_.each(this.values, function(priceData) {
		priceData.selected = (priceData.candlesId === id);
	});
	this.organiseCharts();

}

TradingRoom.priceData.organiseCharts = function() {

	var shownSelected = false,
		chartList = _.where(this.values, { liveChart: true }),
		charts = chartList.length || 1,
		otherSpacing = (App.fullWidth - (App.graphBuffer * 2) - App.graphWidth) / charts,
		xPosition = (charts > 1) ? App.graphBuffer : App.graphBuffer + (otherSpacing / 2),
		hiddenAngle = 60 - (charts * 5);

	_.each(chartList, function(priceData, i) {
		var chartStyle = {};
		if (priceData.selected) {
			chartStyle['margin-left'] = xPosition.toString() + "px";
			xPosition += App.graphWidth;
			shownSelected = true;
			hiddenAngle = -hiddenAngle;
		}
		else {
			chartStyle['transform-origin'] = shownSelected ? "100% 50%" : "0% 50%";
			chartStyle['transform'] = "perspective(500px) rotate3d(0, 1, 0, " + hiddenAngle + "deg)";
			chartStyle['margin-left'] = xPosition.toString() + "px";
			xPosition += otherSpacing * ( shownSelected ? Math.cos(hiddenAngle * Math.PI / 180) : 1 );
			hiddenAngle += hiddenAngle > 0 ? 25 / charts : -25 / charts;
		}
		priceData.chartStyle = chartStyle;
	});

	this.dep.changed();

}