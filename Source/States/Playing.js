var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');
var FamousEngine       = require('../../Libraries/MixedMode/src/famous/core/Engine');

var Playing          = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	this.container = document.getElementById('playing');
 	FamousEngine.createContext(this.container);
};

Playing.update     = function update()
{
	FamousEngine.step();
};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;