var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Playing          = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
    
};

Playing.update     = function update()
{

};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;