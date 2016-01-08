var TaskEmitter = require('strong-task-emitter');
var assert = require('assert');
var helper = require('./helper');  

describe('Relations Tests', function() {
  var ctx = this;

  // Create base models
  before(function() {
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
  });

  // Create relation models
  before(function() {
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

    ctx.ServerModel.hasMany(ctx.ServerRelationModel,
      {foreignKey: 'fooId', as: 'foo'}
    );
    ctx.ServerRelationModel.belongsTo(ctx.ServerModel,
      {foreignKey: 'fooId', as: 'foo'}
    );
  });

  // Create model insances
  before(function(done) {
    var taskEmitter = new TaskEmitter();
      taskEmitter
        .task(ctx.ServerModel, 'create', {id: 1})
        .task(ctx.RemoteModel, 'create', {id: 2})
        .task(ctx.ServerRelationModel, 'create', {id: 1})
        .task(ctx.ServerRelationModel, 'create', {id: 2})
        .task(ctx.ServerRelationModel, 'create', {id: 3, fooId: 1})
        .task(ctx.RemoteRelationModel, 'create', {id: 4, fooId: 2})
        .on('done', done);
  });

  after(function() {
    ctx.serverApp.locals.handler.close();
    ctx.remoteApp.locals.handler.close();
    ctx.serverDatasource = null;
    ctx.remoteDatasource = null;
    ctx.ServerModel = null;
    ctx.RemoteModel = null;
    ctx.ServerRelationModel = null;
    ctx.RemoteRelationModel = null;
  });

  it('should find all instances of the ServerModel', function(done) {
    ctx.ServerModel.find({}, function(err, instances) {
      assert(instances.length === 2);
      done();
    });
  });

  it('should find all instances of the RemoteModel', function(done) {
    ctx.RemoteModel.find({}, function(err, instances) {
      assert(instances.length === 2);
      done();
    });
  });

  it('should find all instances of the ServerRelationModel', function(done) {
    ctx.ServerRelationModel.find({}, function(err, instances) {
      assert(instances.length === 4);
      done();
    });
  });

  it('should find all instances of the RemoteRelationModel', function(done) {
    ctx.RemoteRelationModel.find({}, function(err, instances) {
      assert(instances.length === 4);
      done();
    });
  });

  it('should find all relations of the ServerRelationModel',
      function(done) {
    ctx.ServerRelationModel.find({include: 'foo'}, function(err, instances) {
      instances = JSON.parse(JSON.stringify(instances));
      assert(instances.length === 4);
      instances.forEach(function(i) {
        if (i.id === 3 || i.id === 4) assert(i.foo);
      });
      done();
    });
  });

  it('should find all relations of the RemoteRelationModel',
      function(done) {
    ctx.RemoteRelationModel.find({include: 'foo'}, function(err, instances) {
      instances = JSON.parse(JSON.stringify(instances));
      assert(instances.length === 4);
      instances.forEach(function(i) {
        if (i.id === 3 || i.id === 4) assert(i.foo);
      });
      done();
    });
  });

  it('should find all relations of the RemoteRelationModel redefined',
      function(done) {
    ctx.RemoteModel.hasMany(ctx.RemoteRelationModel,
      {foreignKey: 'fooId', as: 'foo'}
    );
    ctx.RemoteRelationModel.belongsTo(ctx.RemoteModel,
      {foreignKey: 'fooId', as: 'foo'}
    );
    ctx.RemoteRelationModel.find({include: 'foo'}, function(err, instances) {
      instances = JSON.parse(JSON.stringify(instances));
      assert(instances.length === 4);
      instances.forEach(function(i) {
        if (i.id === 3 || i.id === 4) assert(i.foo);
      });
      done();
    });
  });
});