var loopback = require('loopback');
var Remote = require('../..');

/**
 * App helpers
 */
module.exports.REST_APP = function() {
  var app = loopback();
  app.set('host', '127.0.0.1');
  app.use(loopback.rest());
  return app;
};

module.exports.LISTEN = function(test, app, remoteName, cb) {
  app.listen(0, function() {
    test[remoteName] = loopback.createDataSource({
      host: app.get('host'),
      port: app.get('port'),
      connector: Remote
    });
    cb();
  });
}

/**
 * Model helpers
 *
 * Used to create models based on a set of options
 * - optinally associates to an app
 * - optionall links to an app
 */
function makeModel(o) {
  var RemoteModel = loopback.PersistedModel.extend(o.parent, o.properties, o.options);
  if (o.app) o.app.model(RemoteModel);
  if (o.datasource) RemoteModel.attachTo(o.datasource);
  return RemoteModel;
}
module.exports.MODEL = function(o) {
  return makeModel(o);
}
module.exports.MEMORY_MODEL = function(o) {
  o.datasource = loopback.createDataSource({
    connector: loopback.Memory
  });
  return makeModel(o);
}