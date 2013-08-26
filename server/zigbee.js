// this file contains code that communicates with (scans) Zigbee cluster

var parser = require("./parser");
var http_client_lib = require("./http_client");

var ZigBeeCommunicator = function () {
    var self = this;

    // private members
    var tmpl_gateway = "description";
    var tmpl_neighbors = "radio/neighbors";
    var tmpl_node = "nodes?{id}/description";
    var tmpl_sensors = "nodes?{id}/sensors";
    var tmpl_sensor = "nodes?{id}/sensors/{sensor}?metadata";
    var tmpl_sensor_data = "nodes?{id}/sensors/{sensor}?data";

    var initialized = false;
    var url_template = "?cluster={cluster}&method=get&resource=";
    var http_client = new http_client_lib.HttpClient();

    // public methods

    self.init = function (data, callback) {
        if (!data.tag) {
            callback(new Error("ZigBee communicator initialization - missing cluster tag"));
            return;
        }
        if (!data.url) {
            callback(new Error("ZigBee communicator initialization - missing communicator url"));
            return;
        }

        //encodeURIComponent
        url_template = data.url + url_template.replace("{cluster}", data.tag);
        //http_client = new http_client.HttpClient();
        initialized = true;
        callback(null);
    };

    // returns array of node ids
    self.getNodes = function (callback) {
        if (!initialized)
            return callback(new Error("ZigBee communicator was not initialized"));

        var req = tmpl_neighbors;
        var url = url_template + encodeURIComponent(req);

        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            //console.log(res);
            var network_addresses = parser.parse_neighbors(res);
            network_addresses.push("0");
            callback(null, network_addresses);
        });
    };

    // get node data as object
    self.getNode = function (network_address, callback) {
        if (!initialized)
            return callback(new Error("ZigBee communicator was not initialized"));

        var req = (network_address === "0" ? tmpl_gateway : tmpl_node.replace("{id}", network_address));
        var url = url_template + encodeURIComponent(req);

        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            var starts_with_stars = (res.substring(0, 2) == "**");
            var obj = (starts_with_stars ? {} : parser.parse_obj(res));
            if (obj.id) {
                obj.network_addr = obj.id;
                obj.id = null;
            }
            callback(null, obj);
        });
    };

    // get array of sensors for single node
    self.getSensors = function (network_address, callback) {
        if (!initialized)
            return callback(new Error("ZigBee communicator was not initialized"));

        if (network_address === "0") {
            callback(null, []); // gateway has no sensors
        } else {
            var req = tmpl_sensors.replace("{id}", network_address);
            var url = url_template + encodeURIComponent(req);

            http_client.get_data(url, function (err, res) {
                if (err) return callback(err);
                var starts_with_stars = (res.substring(0, 2) == "**");
                var list = (starts_with_stars ? [] : parser.parse_list(res));
                callback(null, list);
            });
        }
    };

    // get metadata for specific sensor on a specific node
    self.getSensor = function (network_address, sensor_name, callback) {
        if (!initialized)
            return callback(new Error("ZigBee communicator was not initialized"));

        var req = tmpl_sensor.replace("{id}", network_address).replace("{sensor}", sensor_name);
        var url = url_template + encodeURIComponent(req);

        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            callback(null, parser.parse_obj(res));
        });
    };

    // get data for specific sensor on a specific node
    self.getSensorData = function (network_address, sensor_name, callback) {
        if (!initialized)
            return callback(new Error("ZigBee communicator was not initialized"));

        var req = tmpl_sensor_data.replace("{id}", network_address).replace("{sensor}", sensor_name);
        var url = url_template + encodeURIComponent(req);

        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            var res_arr = res.split(":");
            if (res_arr.length !== 2) return callback(new Error("Bad response from node 1: " + res));
            if (res_arr[0] === "ERROR") return callback(new Error("Bad response from node 2: " + res));
            callback(null, parseFloat(res_arr[1]));
        });
    };
};

//////////////////////////////////////////////////////////

var DummyCommunicator = function () {
    var self = this;

    var initialized = false;

    var data = {
        node_ids: [],
        nodes: {},
        sensor_ids: {},
        sensors: {}
    };

    for (var i = 1; i < 3; i++) {
        var node_id = "" + i;
        data.node_ids.push(node_id);
        data.nodes[node_id] = {
            id: node_id,
            title: "node " + node_id
        };
        data.sensor_ids[node_id] = [];
        data.sensors[node_id] = {};
        for (var j = 1; j < 4; j++) {
            var sensor_id = node_id + "-" + j;
            data.sensor_ids[node_id].push(sensor_id);
            data.sensors[node_id][sensor_id] = {
                id: sensor_id,
                title: "sensor " + sensor_id
            };
        }
    }

    // public methods

    self.init = function (data, callback) {
        initialized = true;
        callback(null);
    };

    // returns array of node ids
    self.getNodes = function (callback) {
        process.nextTick(function () {
            callback(null, data.node_ids);
        });
    };

    // get node data as object
    self.getNode = function (node_id, callback) {
        process.nextTick(function () {
            callback(null, data.nodes[node_id]);
        });
    };

    // get array of sensors for single node
    self.getSensors = function (node_id, callback) {
        process.nextTick(function () {
            callback(null, data.sensor_ids[node_id]);
        });
    };

    // get metadata for specific sensor on a specific node
    self.getSensor = function (node_id, sensor_name, callback) {
        process.nextTick(function () {
            callback(null, data.sensors[node_id][sensor_name]);
        });
    };

    // get data for specific sensor on a specific node
    self.getSensorData = function (node_id, sensor_name, callback) {
        process.nextTick(function () {
            callback(null, 24.01);
        });
    };
};


//////////////////////////////////////////////////////////

exports.ZigBeeCommunicator = ZigBeeCommunicator;
exports.DummyCommunicator = DummyCommunicator;