// the top level code for SMS

var db = require("./db");
//var db = require("./tests/db_mocks");

var scan_coordinator = require("./scan_coordinator");
var agenda = require('./agenda_server');
var db_syncer = require("./db_syncer");
var bl = require("./bl");
var notifier = require("./notifier");
var server = require("./server");
var util = require('util');
var xutil = require('./xutil');
var fs = require('fs');

////////////////////////////////////////////////////
// parse command line

var options = {};

var settings_content = fs.readFileSync("settings.json");
options = JSON.parse(settings_content);

if (options.web && options.web.use_auth !== null) {
    options.web.use_auth = true;
}
options.cmd = "run"; // deafult command

if (process.argv.length >= 3)
    options.cmd = process.argv[2];
options.argv = process.argv;

if (options.cmd === "help") {

    console.log("");
    console.log("Usage: node top.js <cmd>");
    console.log("");
    console.log('<cmd> is optional, by default it means "run"');
    console.log("Command can be one of the following:");
    console.log("run - runs HTTP server that serves web page");
    console.log("archive - archives old records from the database into archive files");
    console.log("dump - dumps database data to console");
    console.log("clean - deletes database data");
    console.log("fill_dummy_data - inserts dummy data into database");
    console.log("unit_tests - perform unit tests");

} else if (options.cmd === "unit_tests") {

    var tester = require('./tests/cv_tester').get_tester();
    require("./parser").unit_tests(tester);
    require("./xutil").unit_tests(tester);

} else {

db.init(options, function (err) {
    if (err) return console.log(err);
    options.db = db;
    bl.init(options, function (err2) {
        if (err2) return console.log(err2);
        options.bl = bl;
        notifier.init(options, function (err2x) {
            if (err2x) return console.log(err2x);
            db_syncer.init(options, function (err6) {
                if (err6) throw err6;
                options.db_syncer = db_syncer;
                scan_coordinator.init(options, function (err7) {
                    if (err7) throw err7;
                    options.scan_coordinator = scan_coordinator;
                    agenda.init(options, function (err9) {
                        if (err9) throw err9;
                        options.agenda = agenda;
                        if (options.cmd == "run") {
                            server.init(options, function (err3) {
                                if (err3) return console.log(err);
                                server.run(bl);
                            });
                        } else if (options.cmd == "dump") {
                            var collection_name = null;
                            if (process.argv.length >= 4)
                                collection_name = process.argv[3];
                            db.dump(collection_name, function () {
                                db.close();
                                console.log("Done");
                            });
                        } else if (options.cmd == "archive") {
                            db.archive(function () {
                                db.close();
                                console.log("Done");
                            });
                        } else if (options.cmd == "clean") {
                            xutil.ask("Are you sure that you want to delete ALL data from the database?\nWARNING: This can't be undone!\nAnswer with [y/n]", /.+/, function (val) {
                                if (val == "y" || val == "Y") {
                                    db.clean(function () {
                                        db.close();
                                        console.log("Done");
                                    });
                                } else {
                                    db.close();
                                    console.log("Aborted");
                                };
                            });
                        } else if (options.cmd == "fill_dummy_data") {
                            if (db.fill_dummy_data) {
                                db.fill_dummy_data(function () {
                                    db.close();
                                    console.log("Done");
                                });
                            } else {
                                console.log("Done");
                            };
                        } else if (options.cmd == "init") {
                            xutil.ask("Are you sure that you want to insert start data to database? Use node top.js clean first to delete all old data.\nWARNING: This can't be undone!\nAnswer with [y/n]", /.+/, function (val) {
                                if (val == "y" || val == "Y") {
                                    db.init_sms(function () {
                                        db.close();
                                        console.log("Done");
                                    });
                                } else {
                                    db.close();
                                    console.log("Aborted");
                                };
                            });
                        } else if (options.cmd == "scan") {
                            var cluster_id = null;
                            if (options.argv.length >= 4) {
                                cluster_id = options.argv[3];
                            }
                            scan_coordinator.scan(db_syncer, cluster_id, function (err8) {
                                db.close();
                                if (err8) throw err8;
                                console.log("Done.");
                            })
                        } else {
                            db.close();
                            console.log("Unknown command-line command: " + options.cmd);
                        }
                    });
                });
            });
        });
    });
});
}
