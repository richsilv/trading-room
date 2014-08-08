TickEmitterData = new Meteor.Collection();
/*
 * Add query methods like this:
 *  Candles.findPublic = function () {
 *    return Candles.find({is_public: true});
 *  }
 */

/*
Deps.autorun(function(c) {

	if (Session.get('ticker') && Subs[Session.get('ticker')] && Subs[Session.get('ticker')].ready()) {
		LastTrade.find({ticker: Session.get('ticker')}).observeChanges({
			changed: function(id, fields) {
				fields.timeStamp && console.log(new Date().getTime() - fields.timeStamp.getTime());
				// fields.timeStamp && LastTrade.update({_id: id}, {$set: {latency: new Date().getTime() - fields.timeStamp.getTime()}});
			}
		});
	}

});*/
