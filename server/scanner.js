// top-level code for scanning single cluster

var async = require("async");
var zb = require("./zigbee");
var coap = require("./coap");

function get_communication_object(data) {
    if (data.type === "zigbee") {
        return new zb.ZigBeeCommunicator();
    } else if (data.type === "ipv6") {
        return new coap.CoapHtmlCommunicator();
    } else if (data.type === "dummy") {
        return new zb.DummyCommunicator();
    } else {
        throw new Error("Unsupported cluster type for scanning: " + data.type);
    }
}


function scan_single_sensor(comm, node, sensor, callback) {
    console.log("Scanning single sensor ", node.node_addr, sensor.id);
    comm.getSensor(node.node_addr, sensor.id, function (err, res) {
        if (err) {
            sensor.data_err = err;
            return callback(null);
        }
        sensor.data = res;
        console.log("Scanning single sensor's data ");
        comm.getSensorData(node.node_addr, sensor.id, function (err2, res2) {
            if (err2) {
                sensor.data_val_err = err2;
            } else {
                sensor.data_val = res2;
            }
            callback(null);
        });
    });
}

function scan_node(comm, node, callback) {
    console.log("Scanning node ", node.node_addr);
    comm.getNode(node.node_addr, function (err, res) {
        if (err) {
            node.data_err = err;
            return callback();
        }
        if (!res) {
            node.data_err = new Error("No data received");
            return callback();
        }
        if (res.ERROR) {
            node.data_err = new Error(res.ERROR);
            return callback();
        }
        node.data = res;

        comm.getSensors(node.node_addr, function (err, res) {
            if (err) {
                node.sensor_ids_err = err;
                return callback();
            }
            node.sensor_ids = res || [];
            node.sensors = [];
            var calls = [];
            node.sensor_ids.forEach(function (item) {
                if (item === "") return;
                var sensor = { id: item };
                node.sensors.push(sensor);
                calls.push(function (callback2) {
                    scan_single_sensor(comm, node, sensor, function (err, res) {
                        callback2();
                    })
                });
            });
            async.series(calls, function (err2, data2) {
                if (err2) {
                    // sensors could not be retrieved
                    // mark whole node as error
                    node.data_err = err2;
                    node.data = null;
                    node.sensor_ids = null;
                    node.sensors = null;
                }
                callback();
            });
        });

    });
}

function find_node_id_via_network_addr(network_addr, nodes) {
    var res = null;
    nodes.forEach(function (item) {
        if (item.network_addr == network_addr) res = item.id;
    });
    return res;
}

function scan_cluster(cluster_data, callback) {

    console.log("Scanning cluster ", cluster_data.name, cluster_data.id);

    var comm = get_communication_object(cluster_data);
    comm.init(cluster_data, function (err) {
        if (err) return callback(err);

        comm.getNodes(function (err2, node_addresses) {
            if (err2) return callback(err2);
            console.log("Found " + node_addresses.length + " nodes... ");
            var all_data = {
                cluster: cluster_data,
                node_addresses: node_addresses,
                nodes: []
            };
            var calls = [];
            all_data.node_addresses.forEach(function (node_addr) {
                calls.push(function (callback2) {
                    var node = { node_addr: node_addr, node_id: find_node_id_via_network_addr(node_addr, cluster_data.xnodes) };
                    all_data.nodes.push(node);
                    scan_node(comm, node, function (err, res) {
                        callback2(null); // errors are collected within node object, here we just let things roll on
                    });
                });
            });
            async.series(calls, function (err3, results) {
                if (err3) return callback(err3);
                callback(null, all_data);
            });
        });

    });
}

////////////////////////////////////////////////////////////////

exports.scan_cluster = scan_cluster;