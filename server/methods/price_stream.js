/*****************************************************************************/
/* StartStream Methods */
/*****************************************************************************/

Meteor.methods({
 /*
  * Example:
  *  '/app/start_stream/update/email': function (email) {
  *    Users.update({_id: this.userId}, {$set: {'profile.email': email}});
  *  }
  *
  */

 	'app/start_stream': function(ticker, options) {

  		var options = options || {},
  			lastTick = TickData.findOne({ticker: ticker}, {sort: {time: -1}}),
    		emitterOptions = {
    			seedPrice: lastTick ? lastTick.mid : null,
    			spread: null,
    			delay: options.delay,
    			stdDev: options.stDev
    		},
    		rateObject = new FakeRates(ticker, emitterOptions);

    	rateObject.emitter.on('price', function(p) {
    		TickData.insert(p);
    	});

    	TickEmitters.push(rateObject);

    	return rateObject._id;

  	},

  	'app/stop_stream': function(id) {

  		var count = 0;

  		_.where(TickEmitters, {_id: id}).forEach(function(emitter) { count += emitter.stop(); } );

  		return count;

  	},

  	'app/delete_ticks': function(ticker, filter) {

  		return TickData.remove(_.extend(filter || {}, {ticker: ticker}));

  	}

});
