//agenda code
var db = null;
var db_syncer = null;
var agenda = null;
var Agenda = require('agenda');
var scan = require("./scan_coordinator");

function init(options, callback) {
  agenda = new Agenda({db: {address: options.database.url}});
  db = options.db;
  db_syncer = options.db_syncer;
  start( function () {
    callback();
  });
}
exports.init = init;

function start (callback) {
  agenda.on('ready', function() {
    agenda.purge(function(err, numRemoved) {});
    db.get_clusters({}, function (err, data) {
      if (err) return callback(err);
      data.forEach(function (item) {
        if(item.scan == true){
          if(item.scheduling === "recur_scheduling") {
            agenda.define(item.id,function(job, done) {
              scan.scan(db_syncer, item.id, function() {
                done();
              });
            });
            agenda.every(item.interval + " " + item.intervalUnit,item.id);
          }
          else if(item.scheduling === "time_scheduling") {
            agenda.define(item.id,function(job, done){
              scan.scan(db_syncer, item.id, function() {
                done();
              });
            });
            var job = agenda.create(item.id);
            var tmp = item.time.split(":");
            job.repeatEvery(tmp[1] + " " + tmp[0] + ' * * *',item.id);
            job.schedule("at " + item.time);
            job.save();
          }
        }
      });
    });
    agenda.start();
  });

  if (callback) callback();
}

exports.update_job = function(rec){
  agenda.cancel({name: rec.id}, function(err, numRemoved) {
  });
  if(rec.scan == true){
    if(rec.scheduling === "recur_scheduling") {
      agenda.define(rec.id,function(job, done) {
        scan.scan(db_syncer, rec.id, function() {
          done();
        });
      });
      agenda.every(rec.interval + " " + rec.intervalUnit,rec.id);
    }
    else if(rec.scheduling === "time_scheduling") {
      agenda.define(rec.id,function(job, done){
        scan.scan(db_syncer, rec.id, function() {
          done();
        });
      });
      var job = agenda.create(rec.id);
      var tmp = rec.time.split(":");
      job.repeatEvery(tmp[1] + " " + tmp[0] + ' * * *',rec.id);
      job.schedule("at " + rec.time);
      job.save();
    }
  }
}

exports.delete_job = function(rec){
  agenda.cancel({name: rec.id}, function(err, numRemoved) {
  });
}
