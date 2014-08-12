/*****************************************************************************/
/* Client App Namespace  */
/*****************************************************************************/
_.extend(App, {
	graphHeight: 400,
	axisPadding: 35,
	candleGap: 2,
	textSize: 10,
	fontFamily: "Verdana",
	upColour: "#2f7ed8", 
	downColour: "silver",
	timeFormats: [
		{step: 1000, format: "H:mm:ss"},
		{step: 5000, format: "H:mm:ss"},
		{step: 10000, format: "H:mm:ss"},
		{step: 30000, format: "H:mm:ss"},
		{step: 60000, format: "H:mm"},
		{step: 300000, format: "H:mm"},
		{step: 600000, format: "H:mm"},
		{step: 1800000, format: "H:mm"},
		{step: 3600000, format: "ddd H:mm"},
		{step: 7200000, format: "ddd H:mm"},
		{step: 14400000, format: "ddd H:mm"},
		{step: 43200000, format: "ddd H:mm"},
		{step: 86400000, format: "ddd Do"},	
		{step: 604800000, format: "ddd Do MMM"},	
		{step: 2592000000, format: "ddd Do MMM"}	
		]
});

App.helpers = {
};

_.each(App.helpers, function (helper, key) {
  Handlebars.registerHelper(key, helper);
});