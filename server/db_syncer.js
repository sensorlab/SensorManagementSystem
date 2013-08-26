// this code updates database data after scan produced new data

var async = require("async");
var fs = require('fs');
var enums = require('./enums').get_enums();
var xutil = require('./xutil');

////////////////////////////////////////////////////////////////////////////////////

var autodiscover = false;
var node_unreachable_after = "6 h";

////////////////////////////////////////////////////////////////////////////////////

function sync_node(bl, scanned_data, db_data, callback) {
    if (!scanned_data.data) {
        return callback(new Error("No data found when scanning node: " + db_data.id));
    }

    var req = {
        data: { id: db_data.id },
        session: { user: "system", ip: "localhost" }
    };

    req.data.status = "active";
    if (scanned_data.data.mac)
        req.data.mac = scanned_data.data.mac;
    if (scanned_data.data.firmware)
        req.data.firmware = scanned_data.data.firmware;
    if (scanned_data.data.bootloader)
        req.data.bootloader = scanned_data.data.bootloader;
    if (scanned_data.data.location && scanned_data.data.location.lon)
        req.data.loc_lon = scanned_data.data.location.lon;
    if (scanned_data.data.location && scanned_data.data.location.lat)
        req.data.loc_lat = scanned_data.data.location.lat;
    //?db_data.description
    //?db_data.role
    //?db_data.network_addr
    //?db_data.serial_no

    bl.mark_node_scan(db_data.id, db_data.cluster, function (errx) {
        if (errx) return callback(errx);

        bl.update_node(req, function (err) {
            if (err) return callback(err);
            var req2 = { data: { node: db_data.id} };
            bl.get_sensors_for_node(req2, function (err2, data2) {
                if (err2) return callback(err2);
                var sensors = [];
                scanned_data.sensors.forEach(function (item) {
                    var a = {
                        id: item.id,
                        type: item.data.type,
                        name: item.data["measured-phenomenon"],
                        description: item.description || ""
                    };
                    if (a.id && (!a.type || !a.name)) {
                        var parts = a.id.split("-");
                        if (parts.length > 1) {
                            a.type = parts[0];
                            a.name = a.id.substring(a.type.length + 1);
                        } else {
                            a.type = a.id;
                            a.name = a.id;
                        }
                    }
                    sensors.push(a);
                    if (item.data_val) {
                        var measurement = {
                            sensor: item.id,
                            node: db_data.id,
                            ts: new Date(),
                            sys_data: {},
                            value: item.data_val
                        };
                        bl.add_sensor_measurement(measurement, function () { }); // just simple insert
                    }
                });
                sensors = sensors.sort(function (a, b) { return a.name > b.name; });
                sensors_str = JSON.stringify(sensors);
                sensors_db_str = JSON.stringify(data2);

                if (sensors_str != sensors_db_str) {
                    console.log("Sensors changed for node " + db_data.id);
                    var req3 = {
                        data: {
                            node_id: db_data.id,
                            cluster: db_data.cluster,
                            sensors: sensors
                        },
                        session: { user: "system", ip: "localhost" }
                    };
                    bl.update_sensors_for_node(req3, callback);
                } else {
                    // do nothing
                    console.log("Sensors unchanged for node " + db_data.id);
                    callback();
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////

function mark_unreachable_nodes(bl, cluster_id, callback) {
    // for cluster find last scan
    bl.get_cluster({ data: { id: cluster_id} }, function (err, data) {
        if (err) return callback(err);

        var last_scan = xutil.subtract_window(data.last_scan, node_unreachable_after);

        // find nodes where last scan is "too old"
        var query = {
            cluster: cluster_id,
            status: "active",
            last_scan: { $lt: last_scan }
        };
        bl.get_nodes({ data: query }, function (err2, data2) {
            var calls = [];
            data2.forEach(function (item) {
                calls.push(function (callback2) {
                    console.log("Deactivating node " + item.id);
                    var upd_rec = {
                        id: item.id,
                        status: "unreachable"
                    };
                    var req = {
                        data: upd_rec,
                        session: { user: "system", ip: "localhost" }
                    };
                    bl.update_node(req, function (err, res) {
                        callback(null);
                    });
                });
            });
            async.parallel(calls, callback());
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////

// create new node and return its db record

function create_newly_discovered_node(bl, node_addr, cluster, callback) {
    //console.log("create_newly_discovered_node", node_addr, cluster);
    var req = {
        action: 'add_node',
        data: {
            name: 'Node ' + node_addr,
            status: 'unknown',
            cluster: cluster,
            loc_lon: 0,
            loc_lat: 0,
            sn: '',
            mac: 0,
            network_addr: node_addr,
            network_addr2: node_addr,
            firmware: '',
            bootloader: '',
            setup: '',
            role: 'device',
            scope: '',
            project: '',
            location: '',
            user_comment: 'Node created with autodiscovery',
            box_label: '',
            components: [],
            sensors: []
        },
        session: { user: "system", ip: "localhost" }
    };
    bl.add_node(req, function (err, data) {
        if (err) return callback(err);
        //console.log("create_newly_discovered_node1", data);
        var req2 = {
            action: 'get_node',
            data: { id: data.id },
            session: { user: "system", ip: "localhost" }
        };
        bl.get_node(req2, function (err2, data2) {
            if (err2) return callback(err2);
            //console.log("create_newly_discovered_node2", data2);
            callback(null, data2);
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////

function sync_cluster(bl, scanned_data, callback) {
    var req = {
        data: { cluster: scanned_data.cluster.id },
        session: { user: "system", ip: "localhost" }
    };

    // write log file - async
    fs.writeFile("./logs/out_" + (new Date().getTime()) + ".txt", JSON.stringify(scanned_data, null, "  "), null, function () { });

    bl.mark_cluster_scan(req.data.cluster, function () { }); // runasync, always succeed

    bl.get_nodes(req, function (err, data) {
        if (err) return callback(err);

        var calls = [];

        data.forEach(function (item) {
            // find data from scanner
            var matches = scanned_data.nodes.filter(function (item2) {
                return item.network_addr === item2.node_addr;
            });
            if (matches.length > 0) {
                // push sync call to queue
                calls.push(function (callback2) {
                    sync_node(bl, matches[0], item, function (err2, res2) {
                        callback2(null);
                    });
                });
            };
        });

        // add missing nodes
        if (autodiscover) {
            scanned_data.nodes.forEach(function (item) {
                // find data from database
                var matches = data.filter(function (item2) {
                    return item2.network_addr === item.node_addr;
                });
                if (matches.length == 0) {
                    // first add new node, then sync its data
                    calls.push(function (callback2) {
                        create_newly_discovered_node(bl, item.node_addr, scanned_data.cluster.id, function (err3, data3) {
                            if (err3) return callback(err3);
                            sync_node(bl, item, data3, function (err2, res2) {
                                callback2(null);
                            });
                        });
                    });
                }
            });
        }
        async.parallel(calls, function (err2, data2) {
            // TODO error checking?
            mark_unreachable_nodes(bl, req.data.cluster, callback);
        });
    });
}

function init(options, callback) {
    if (options && options.scan) {
        if (options.scan) {
            if (options.scan.node_unreachable_after) {
                node_unreachable_after = options.scan.node_unreachable_after;
            }
            if (options.scan.autodiscover) {
                autodiscover = options.scan.autodiscover;
            }
        }
    }
    callback();
}

////////////////////////////////////////////////////////////////////////////////////

exports.init = init;
exports.sync_cluster = sync_cluster;