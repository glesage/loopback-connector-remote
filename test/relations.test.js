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
    ctx.remoteDatasource = helper.createRemoteDataSource(ctx.serverApp);
    ctx.RemoteModel = helper.createModel({
      name: 'TestModel',
      app: ctx.remoteApp,
      datasource: ctx.remoteDatasource
    });

    ctx.ServerRelationModel = helper.createModel({
      name: 'RelationModel',
      app: ctx.serverApp,
      datasource: ctx.serverDatasource
    });

    ctx.RemoteRelationModel = helper.createModel({
      name: 'RelationModel',
      app: ctx.remoteApp,
      datasource: ctx.remoteDatasource
    });

    ctx.ServerRelationModel.belongsTo(ctx.ServerModel, {foreignKey: 'testModelId', as: 'TestModel'});
    ctx.RemoteRelationModel.belongsTo(ctx.RemoteModel, {foreignKey: 'testModelId', as: 'TestModel'});

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

  it('should find all instances of the ServerRelationModel', function(done) {
    ctx.ServerRelationModel.create([{id: 1, serverModelId: 1}, {id: 2}],
        function(err, instances) {
      ctx.ServerRelationModel.find({}, function(err, instances) {
        assert(instances.length, 1);
        ctx.ServerRelationModel.destroyAll(done);
      });
    });
  });

  it('should find all instances of the RemoteRelationModel', function(done) {
    ctx.RemoteRelationModel.create([{id: 1, serverModelId: 1}, {id: 2}],
        function(err, instances) {
      ctx.RemoteRelationModel.find({}, function(err, instances) {
        assert(instances.length, 1);
        ctx.RemoteRelationModel.destroyAll(done);
      });
    });
  });

  it('should find all instances w/ relations of the ServerRelationModel',
      function(done) {
    ctx.ServerRelationModel.create([{id: 1, serverModelId: 1}, {id: 2}],
        function(err, instances) {
      ctx.ServerRelationModel.find({include: 'TestModel'}, function(err, instances) {
        instances = JSON.parse(JSON.stringify(instances));
        assert(instances.length, 2);
        instances.forEach(function(i) {
          if (i.id === 1) assert(i.TestModel);
        });
        done();
      });
    });
  });
});