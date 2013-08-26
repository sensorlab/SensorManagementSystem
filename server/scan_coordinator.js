// top level code for scanning, loops over all scanable clusters

var async = require("async");
var scanner = require("./scanner");
//var scanner = require("./scanner_mock");

///////////////////////////////////////////////////

var bl;
var db_syncer;

function init(options, callback) {
    bl = options.bl;
    db_syncer = options.db_syncer;
    callback();
}

//////////////////////////////////////////////////

function call_scanner_for_single_cluster(cluster_data, callback) {
    scanner.scan_cluster(cluster_data, function (err, data) {
        if (err) return callback(err);
        db_syncer.sync_cluster(bl, data, callback);
    });
}

function process_single_cluster(cluster_data, callback) {
    bl.get_nodes({ data: { cluster: cluster_data.id} }, function (err, nodes) {
        if (err) return callback(err);
        var node_data = [];
        nodes.forEach(function (item) {
            node_data.push({ id: item.id, network_addr: item.network_addr });
        });

        cluster_data.xnodes = node_data;
        call_scanner_for_single_cluster(cluster_data, callback);
    });
}

function scan(db_syncer, cluster_id, callback) {
    console.log("Starting scan...");
    var query = { scan: true };
    if (cluster_id) {
        query = { id: cluster_id };
        console.log("For cluster " + cluster_id);
    }

    bl.get_clusters({ data: query }, function (err, data) {
        if (err) return callback(err);
        console.log("Found " + data.length + " cluster(s) to scan.");
        var scanned_cnt = 0;
        var calls = [];
        var errors = [];
        data.forEach(function (item) {
            calls.push(function (callback2) {
                process_single_cluster(item, function (err2) {
                    callback2(null, err2);
                });
            });
        });
        async.series(calls, function (err3, results) {
            if (err3) return callback(err3);
            callback(null, results);
        });
    });
};

//////////////////////

exports.init = init;
exports.scan = scan;