var loopback = require('loopback');

var Memory = loopback.Memory;
var Remote = require('../..');

/**
 * App helper
 */
module.exports.REST_APP = function(port) {
  var app = loopback();
  app.set('host', '127.0.0.1');
  if (port) app.set('port', port);
  app.use(loopback.rest());
  app.locals.handler = app.listen();
  return app;
};

/**
 * Datasource helpers
 */
module.exports.MEMORY_DS = function() {
  return loopback.createDataSource({connector: Memory});
}
module.exports.REMOTE_DS = function(remoteApp) {
  return loopback.createDataSource({
    url: 'http://' + remoteApp.get('host') + ':' + remoteApp.get('port'),
    connector: Remote
  });
}

/**
 * Model helper
 *
 * Used to create models based on a set of options
 * - optinally associates to an app
 * - optionall links to an app
 */
module.exports.MODEL = function(o) {
  var Model = loopback.PersistedModel.extend(o.parent, o.properties, o.options);
  if (o.app) o.app.model(Model);
  if (o.datasource) Model.attachTo(o.datasource);
  return Model;
}