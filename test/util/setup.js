var loopback = require('loopback');
var Remote = require('../..');

module.exports.APP = function() {
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

function createModel(base, o) {
  var RemoteModel = base.extend(o.parent, o.properties, o.options);
  if (o.app) o.app.model(RemoteModel);
  if (o.datasource) RemoteModel.attachTo(o.datasource);
  return RemoteModel;
}

module.exports.MODEL = function(o) {
  return createModel(loopback.PersistedModel, o);
}

module.exports.BARE_MODEL = createModel;
