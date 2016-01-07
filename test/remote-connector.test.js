var SETUP = require('./util/setup');
var assert = require('assert');

describe('RemoteConnector', function() {
  var remoteApp;

  beforeEach(function(done) {
    remoteApp = SETUP.REST_APP();
    this.ServerModel = SETUP.MODEL({parent: 'TestModel', app: remoteApp});
    SETUP.LISTEN(this, remoteApp, 'remote', done);
  });

  it('should support the save method', function(done) {
    var calledServerCreate = false;
    var RemoteModel = SETUP.MODEL({parent: 'TestModel', datasource: this.remote});
    var ServerModel = this.ServerModel;

    ServerModel.create = function(data, cb) {
      calledServerCreate = true;
      data.id = 1;
      cb(null, data);
    }

    ServerModel.setupRemoting();

    var m = new RemoteModel({foo: 'bar'});
    m.save(function(err, instance) {
      if (err) return done(err);
      assert(instance instanceof RemoteModel);
      assert(calledServerCreate);
      assert(instance);
      done();
    });
  });

  it('should support aliases', function(done) {
    var RemoteModel = SETUP.MODEL({parent: 'TestModel', datasource: this.remote});
    var ServerModel = this.ServerModel;

    ServerModel.upsert = function(id, cb) {
      done();
    };

    RemoteModel.updateOrCreate({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
    });
  });
});

describe('Custom Path', function() {

  before(function(done) {
    this.server = SETUP.REST_APP();

    SETUP.MEMORY_MODEL({parent: 'TestModel',
      app: this.server,
      options: {
        http: {path: '/custom'}
      }
    });

    SETUP.LISTEN(this, this.server, 'remote', done);
  });

  it('should support http.path configuration', function(done) {
    var RemoteModel = SETUP.MODEL({parent: 'TestModel',
      datasource: this.remote,
      options: {
        dataSource: 'remote',
        http: {path: '/custom'}
      }
    });

    RemoteModel.create({}, function(err, instance) {
      if (err) return done(err);
      assert(instance);
      done();
    });
  });
});