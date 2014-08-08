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
	}

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

TradingRoom.StreamSubscription = function(connection, ticker, options) {

	options = options || {};

	if (!remote) throw new Meteor.Error(400, "No remote defined");
	if (!ticker) throw new Meteor.Error(400, "No ticker supplied");

	var _this = this,
		interval = options.interval || 10000,
		limit = options.limit || 500,
		filter = { time: { $gte: new Date(new Date().getTime() - limit * interval * 2) } }; 

	this.Candles = new Meteor.Collection('candles', connection.remote);
	this.LastTrade = new Meteor.Collection('lasttrade', connection.remote);

	this.subHandle = connection.remote.subscribe('pricedata', ticker, filter, interval);

	this.stop = function() {
		_this.subHandle.stop();
	}

}