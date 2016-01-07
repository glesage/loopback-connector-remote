var SETUP = require('./util/setup');
var assert = require('assert');

describe('RemoteConnector', function() {
  var context = this;

  before(function(done) {
    context.serverApp = SETUP.REST_APP(3001);
    context.ServerModel = SETUP.MODEL({parent: 'TestModel',
      app: context.serverApp,
      datasource: SETUP.MEMORY_DS()
    });

    context.remoteApp = SETUP.REST_APP(3002);
    context.RemoteModel = SETUP.MODEL({parent: 'TestModel',
      app: context.remoteApp,
      datasource: SETUP.REMOTE_DS(context.serverApp)
    });
    done();
  });

  after(function(done)
  {
    context.serverApp.locals.handler.close();
    context.remoteApp.locals.handler.close();
    context.ServerModel = null;
    context.RemoteModel = null;
    done();
  });

  it('should support the save method', function(done) {
    var calledServerCreate = false;

    context.ServerModel.create = function(data, cb, callback) {
      calledServerCreate = true;
      data.id = 1;
      if (callback) callback(null, data);
      else cb(null, data);
    }

    var m = new context.RemoteModel({foo: 'bar'});
    m.save(function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof context.RemoteModel);
      assert(calledServerCreate);
      done();
    });
  });

  it('should support aliases', function(done) {
    var calledServerUpsert = false;
    context.ServerModel.upsert = function(id, cb) {
      calledServerUpsert = true;
      cb();
    };

    context.RemoteModel.updateOrCreate({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      assert(instance instanceof context.RemoteModel);
      assert(calledServerUpsert);
      done();
    });
  });
});

describe('Custom Path', function() {
  var context = this;

  before(function(done) {
    context.serverApp = SETUP.REST_APP(3001);
    context.ServerModel = SETUP.MODEL({parent: 'TestModel',
      app: context.serverApp,
      datasource: SETUP.MEMORY_DS(),
      options: {
        http: {path: '/custom'}
      }
    });

    context.remoteApp = SETUP.REST_APP(3002);
    context.RemoteModel = SETUP.MODEL({parent: 'TestModel',
      app: context.remoteApp,
      datasource: SETUP.REMOTE_DS(context.serverApp),
      options: {
        dataSource: 'remote',
        http: {path: '/custom'}
      }
    });
    done();
  });

  after(function(done)
  {
    context.serverApp.locals.handler.close();
    context.remoteApp.locals.handler.close();
    context.ServerModel = null;
    context.RemoteModel = null;
    done();
  });

  it('should support http.path configuration', function(done) {
    context.RemoteModel.create({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      done();
    });
  });
});