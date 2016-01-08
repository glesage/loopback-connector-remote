var TaskEmitter = require('strong-task-emitter');
var assert = require('assert');
var helper = require('./helper');  

describe('Relations Tests', function() {
  var ctx = this;

  before(function(done) {
    ctx.serverApp = helper.createRestAppAndListen(3001);
    ctx.serverDatasource = helper.createMemoryDataSource();
    ctx.ServerModel = helper.createModel({
      name: 'TestModel',
      app: ctx.serverApp,
      datasource: ctx.serverDatasource
    });
    ctx.remoteApp = helper.createRestAppAndListen(3002);
    ctx.RemoteModel = helper.createModel({
      name: 'TestModel',
      app: ctx.remoteApp,
      datasource: helper.createRemoteDataSource(ctx.serverApp)
    });

    ctx.RelationModel = helper.createModel({
      name: 'RelationModel',
      app: ctx.serverApp,
      datasource: ctx.serverDatasource,
      options: {
        relations: {
          'foo':
          {
              type: 'belongsTo',
              model: 'TestModel',
              foreignKey: 'TestModelId'
          }
        }
      }
    });

    ctx.ServerModel.create({id: 1}, done);
  });

  after(function() {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
  });

  it('should find all instances of the ServerModel', function(done) {
    ctx.ServerModel.find({}, function(err, instances) {
      assert(instances.length, 1);
      done();
    });
  });

  it('should find all instances of the RemoteModel', function(done) {
    ctx.RemoteModel.find({}, function(err, instances) {
      assert(instances.length, 1);
      done();
    });
  });

  it('should find all instances of the RelationModel', function(done) {
    ctx.RelationModel.create([{id: 1, serverModelId: 1}, {id: 2}],
        function(err, instances) {
      ctx.RelationModel.find({}, function(err, instances) {
        assert(instances.length, 1);
        ctx.RelationModel.destroyAll(done);
      });
    });
  });

  it('should find all instances w/ relations of the RelationModel',
      function(done) {
    ctx.RelationModel.create([{id: 1, serverModelId: 1}, {id: 2}],
        function(err, instances) {
      ctx.RelationModel.find({include: 'foo'}, function(err, instances) {
        assert(instances.length, 2);
        instances.forEach(function(i) {
          if (i.id === 1) assert(i.foo.length, 1);
        });
        done();
      });
    });
  });
});