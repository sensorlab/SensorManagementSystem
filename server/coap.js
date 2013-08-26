// This code communicates with HTTP wrapper for COAP (developed by Ado)

var parser = require("./parser");
var xutil = require("./xutil");
var http_client_lib = require("./http_client");

var CoapHtmlCommunicator = function () {
    var self = this;

    var tmpl_url = "http://{bridge}/coap/_13/get/";
    var tmpl_list = "coap://[{ipv6}]/.well-known/core";
    var tmpl_data = "coap://[{ipv6}]/sensors/{sensor}/data";
    var tmpl_metadata = "coap://[{ipv6}]/sensors/{sensor}/metadata";

    //var url1 = "http://e6hermes.ijs.si/coap/_13/get/";
    //var url2 = "coap://[2001:1470:ff80:e61:212:4b00:6:7670]/sensors/temperature/1/data";

    // private members

    var initialized = false;
    var http_client = new http_client_lib.HttpClient();
    var cluster_data = null;

    // public methods

    self.init = function (cdata, callback) {
        if (!initialized) {
            if (!cdata.id) {
                callback(new Error("CoapHtml communicator initialization - missing cluster id"));
                return;
            }
            if (!cdata.xnodes) {
                callback(new Error("CoapHtml communicator initialization - missing node list with IPs"));
                return;
            }
            cluster_data = cdata;

            tmpl_url = tmpl_url.replace("{bridge}", cdata.url);
            tmpl_list = tmpl_url + tmpl_list.replace(/\//g, "\\");
            tmpl_data = tmpl_url + tmpl_data.replace(/\//g, "\\");
            tmpl_metadata = tmpl_url + tmpl_metadata.replace(/\//g, "\\");


            initialized = true;
            console.log("CoapHtml communicator initialized.");
        }
        callback(null);
    };

    self.find_node = function (network_address) {
        var res = null;
        cluster_data.xnodes.forEach(function (item) {
            if (item.network_addr === network_address) {
                res = item;
            }
        });
        return res;
    }

    // returns array of node ids
    self.getNodes = function (callback) {
        if (!initialized)
            return callback(new Error("CoapHtml communicator was not initialized"));

        var res = [];
        cluster_data.xnodes.forEach(function (item) { res.push(item.network_addr); });
        callback(null, res);
    };

    // get node data as object
    self.getNode = function (network_address, callback) {
        if (!initialized)
            return callback(new Error("CoapHtml communicator was not initialized"));
        var node = self.find_node(network_address);
        if (!node)
            return callback(new Error("CoapHtml communicator - node's network address not found in node list: " + network_address));
        callback(null, node);
    };

    // get array of sensors for single node
    self.getSensors = function (network_address, callback) {
        if (!initialized)
            return callback(new Error("CoapHtml communicator was not initialized"));
        var node = self.find_node(network_address);
        if (!node)
            return callback(new Error("CoapHtml communicator - node's network address not found in node list: " + network_address));
        var ipv6 = node.network_addr;

        var url = tmpl_list;
        url = url.replace("{ipv6}", ipv6);


        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            //console.log("getSensors", res);
            var xsensors = [];
            var ids = [];
            var lines = res.split("</");
            lines.forEach(function (item) {
                var target = "sensors/";
                if (item.indexOf(target) === 0) {
                    var i = item.indexOf(">");
                    if (i > 0) {
                        var url = item.substring(target.length, i);
                        var sdata = item.substring(i + 1);
                        if (sdata.substring(sdata.length - 1) === ",")
                            sdata = sdata.substring(0, sdata.length - 1);
                        var sets = xutil.parse_connection_string(sdata);
                        var title = sets.title;
                        xsensors.push({ id: url, title: title });
                        ids.push(url);
                    };
                }
            });
            node.xsensors = xsensors; // store retrieved data into node
            //console.log("&", JSON.stringify(cluster_data));
            callback(null, ids);
        });
    };

    // get metadata for specific sensor on a specific node
    self.getSensor = function (network_address, sensor_name, callback) {
        //console.log("getSensor", node_id, sensor_name);
        if (!initialized)
            return callback(new Error("CoapHtml communicator was not initialized"));

        var node = self.find_node(network_address);
        if (!node)
            return callback(new Error("CoapHtml communicator - node not found in node list: " + network_address));
        var ipv6 = node.network_addr;

        var url = tmpl_metadata;
        url = url.replace("{ipv6}", ipv6);
        url = url.replace("{sensor}", sensor_name.replace(/\//g, "\\"));
        //console.log("getSensor", url);

        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            //console.log("getSensor", res);
            callback(null, parser.parse_obj(res));
        });
    };

    // get data for specific sensor on a specific node
    self.getSensorData = function (network_address, sensor_name, callback) {
        //console.log("getSensorData", node_id, sensor_name);
        if (!initialized)
            return callback(new Error("CoapHtml communicator was not initialized"));

        var node = self.find_node(network_address);
        if (!node)
            return callback(new Error("CoapHtml communicator - node not found in node list: " + network_address));
        var ipv6 = node.network_addr;

        var url = tmpl_data;
        url = url.replace("{ipv6}", ipv6);
        url = url.replace("{sensor}", sensor_name.replace(/\//g, "\\"));

        http_client.get_data(url, function (err, res) {
            if (err) return callback(err);
            //console.log("getSensorData", res);
            callback(null, parseFloat(res));
        });
    };
};


//////////////////////////////////////////////////////////

exports.CoapHtmlCommunicator = CoapHtmlCommunicator;