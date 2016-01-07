var SETUP = require('./util/setup');
var assert = require('assert');
var TaskEmitter = require('strong-task-emitter');

describe('Model Tests', function() {
  var context = this;

  beforeEach(function(done) {
    context.serverApp = SETUP.REST_APP(3001);
    context.ServerModel = SETUP.MODEL({parent: 'TestModel',
      app: context.serverApp,
      datasource: SETUP.MEMORY_DS(),
      properties: SETUP.USER_PROPERTIES
    });

    context.remoteApp = SETUP.REST_APP(3002);
    context.RemoteModel = SETUP.MODEL({parent: 'TestModel',
      app: context.remoteApp,
      datasource: SETUP.REMOTE_DS(context.serverApp),
      properties: SETUP.USER_PROPERTIES
    });
    done();
  });

  afterEach(function(done)
  {
    context.serverApp.locals.handler.close();
    context.remoteApp.locals.handler.close();
    context.ServerModel = null;
    context.RemoteModel = null;
    done();
  });

  describe('Model.create([data], [callback])', function() {
    it("Create an instance of Model with given data and save to the attached data source",
      function(done) {
        context.RemoteModel.create({first: 'Joe', last: 'Bob'}, function(err, user) {
          assert(user instanceof context.RemoteModel);
          done();
        });
      });
  });

  describe('model.save([options], [callback])', function() {
    it("Save an instance of a Model to the attached data source",
      function(done) {
        var joe = new context.RemoteModel({first: 'Joe', last: 'Bob'});
        joe.save(function(err, user) {
          assert(user.id);
          assert(!err);
          assert(!user.errors);
          done();
        });
      });
  });

  describe('model.updateAttributes(data, [callback])', function() {
    it("Save specified attributes to the attached data source",
      function(done) {
        context.ServerModel.create({first: 'joe', age: 100}, function(err, user) {
          assert(!err);
          assert.equal(user.first, 'joe');

          user.updateAttributes({
            first: 'updatedFirst',
            last: 'updatedLast'
          }, function(err, updatedUser) {
            assert(!err);
            assert.equal(updatedUser.first, 'updatedFirst');
            assert.equal(updatedUser.last, 'updatedLast');
            assert.equal(updatedUser.age, 100);
            done();
          });
        });
      });
  });

  describe('Model.upsert(data, callback)', function() {
    it("Update when record with id=data.id found, insert otherwise",
      function(done) {
        context.RemoteModel.upsert({first: 'joe', id: 7}, function(err, user) {
          assert(!err);
          assert.equal(user.first, 'joe');

          context.RemoteModel.upsert({first: 'bob', id: 7}, function(err, updatedUser) {
            assert(!err);
            assert.equal(updatedUser.first, 'bob');
            done();
          });
        });
      });
  });

  describe('Model.deleteById(id, [callback])', function() {
    it("Delete a model instance from the attached data source",
      function(done) {
        context.ServerModel.create({first: 'joe', last: 'bob'}, function(err, user) {
          context.RemoteModel.deleteById(user.id, function(err) {
            context.RemoteModel.findById(user.id, function(err, notFound) {
              assert.equal(notFound, null);
              done();
            });
          });
        });
      });
  });

  describe('Model.findById(id, callback)', function() {
    it("Find an instance by id from the attached data source", function(done) {
      context.ServerModel.create({first: 'michael', last: 'jordan', id: 23}, function() {
        context.RemoteModel.findById(23, function(err, user) {
          assert.equal(user.id, 23);
          assert.equal(user.first, 'michael');
          assert.equal(user.last, 'jordan');
          done();
        });
      });
    });
  });

  describe('Model.count([query], callback)', function() {
    it("Query count of Model instances from both data source", function(done) {
      (new TaskEmitter())
        .task(context.ServerModel,'create', {first: 'jill', age: 100})
        .task(context.RemoteModel, 'create', {first: 'bob', age: 200})
        .task(context.RemoteModel, 'create', {first: 'jan'})
        .task(context.ServerModel, 'create', {first: 'sam'})
        .task(context.ServerModel, 'create', {first: 'suzy'})
        .on('done', function() {
          context.RemoteModel.count({age: {gt: 99}}, function(err, count) {
            assert.equal(count, 2);
            done();
          });
        });
    });
  });
});