var loopback = require('loopback');
var defineModelTestsWithDataSource = require('./util/model-tests');
var SETUP = require('./util/setup');
var assert = require('assert');

describe('RemoteConnector', function() {
  var remoteApp;
  var remote;

  defineModelTestsWithDataSource({
    beforeEach: function(done) {
      var test = this;
      remoteApp = SETUP.APP();
      SETUP.LISTEN(test, remoteApp, 'dataSource', done);
    },
    onDefine: function(Model) {
      SETUP.BARE_MODEL(Model, {parent: Model.modelName,app: remoteApp,
        datasource: loopback.createDataSource({
          connector: loopback.Memory
        })
      });
    }
  });

  beforeEach(function(done) {
    remoteApp = this.remoteApp = SETUP.APP();
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
    m.save(function(err, inst) {
      assert(inst instanceof RemoteModel);
      assert(calledServerCreate);
      done();
    });
  });

  it('should support aliases', function(done) {
    var RemoteModel = SETUP.MODEL({parent: 'TestModel', datasource: this.remote});
    var ServerModel = this.ServerModel;

    ServerModel.upsert = function(id, cb) {
      done();
    };

    RemoteModel.updateOrCreate({}, function(err, inst) {
      if (err) return done(err);
    });
  });
});

describe('Custom Path', function() {

  before(function(done) {
    this.server = SETUP.APP();

    SETUP.MODEL({parent: 'TestModel',
      app: this.server,
      datasource: loopback.createDataSource({
        connector: loopback.Memory
      }),
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
      if (err) return assert(err);
      done();
    });
  });
});