// DEVELOPMENT ONLY
// dummy data,used for testing/development, inserted into database at start-up

var utils_hash = require("./utils_hash");
var xutil = require("./xutil");
var enums = require('./enums').get_enums();

////////////////////////////////////////////////////////////////////////////////////////

var cluster_cnt = 2;
var node_cnt = 15;
var component_cnt = 50;
var component_per_node = 2;
var history_len = 2;

////////////////////////////////////////////////////////////////////////////////////////

var data = {};
var now = new Date(new Date() - 2 * 24 * 60 * 60 * 1000);


data.history = [];
data.clusters = [];
data.nodes = [];
data.components = [];
data.sensor_history = [];

data.users = [];
data.logins = [];

//////////////////////////////////////////////////

var user_template = {
    username: "vik",
    full_name: "Viktor Jovanoski",
    pwd_hash: utils_hash.create_pwd_hash("vik"),
    status: "active", // active, inactive, locked
    last_login: new Date(),
    last_bad_login: new Date(),
    bad_login_cnt: 0,
    type: "admin" // normal, admin
};
var user_str = JSON.stringify(user_template);
var dummy_users = ["ado", "blaz", "bostjan", "klemen", "mare", "marko", "matevz", "miha", "tomaz", "vik"];
dummy_users.forEach(function (item) {
    var new_user = JSON.parse(user_str);
    new_user.username = item;
    new_user.full_name = item;
    new_user.pwd_hash = utils_hash.create_pwd_hash(item);
    data.users.push(new_user);
});

for (var j = 0; j < data.users.length; j++) {
    var user = data.users[j];
    for (var i = 0; i < node_cnt; i++) {
        data.logins.push({
            user: user.username,
            ts: new Date(now - i * 13 * 60000),
            ip: "127.0.0." + (i * 7 % 3),
            last_action: new Date(now - i * 13 * 60000),
            terminated: false
        });
    };
};

//////////////////////////////////////////////////

for (var i = 0; i < cluster_cnt; i++) {
    var cl_type = enums.ClusterTypesArray[i % enums.ClusterTypesArray.length];
    data.clusters.push({
        id: "1100" + i,
        name: "Cluster " + i,
        type: cl_type.code,
        scan: false,
        comment: "",
        url: (cl_type.uses_gateway ? "http://192:168:1:" + i + "/communicator" : "")
    });
}
data.clusters.push({
    id: "10005",
    name: "Polica",
    type: "zigbee",
    scan: true,
    comment: "",
    url: "http://194.249.231.26:9004/communicator"
});
data.clusters.push({
    id: "10003",
    name: "Vojkova",
    type: "zigbee",
    scan: true,
    comment: "",
    url: "http://194.249.231.26:9001/communicator"
});
data.clusters.push({
    id: "X1",
    name: "Test IPv6",
    type: "ipv6",
    scan: true,
    comment: "",
    url: "e6hermes.ijs.si"
});
data.clusters.forEach(function (item) {
    item.tag = (item.type == "zigbee" ? item.id : "");
});

//////////////////////////////////////////////////
var cluster_gateways = {};
for (var i = 0; i < node_cnt; i++) {

    var cluster = data.clusters[(i % cluster_cnt + 1) % cluster_cnt];

    var is_gateway = false;
    if (!cluster_gateways[cluster.id]) {
        cluster_gateways[cluster.id] = true;
        is_gateway = true;
    };

    data.nodes.push({
        // text stuff
        id: i,
        name: "Name of this node " + i,
        location: (i % 3 == 2 ? "City center" : "Industrial zone"),
        loc_lat: 45.12121 + (i * 0.028356),
        loc_lon: 45.6453 + (i * 0.04121),
        cluster: cluster.id,
        cluster_title: cluster.name,
        status: (i % 27 != 16 ? "active" : "unreachable"), // active, inactive, unreachable, unknown
        setup: "",
        scope: "",
        project: (i % 4 == 3 ? "some project" : ""),
        user_comment: "",
        box_label: "C55" + (6512 + i),
        serial_no: "S" + i,
        mac: "234:234:34FF6:" + i,
        network_addr: (cluster.gateway_ip == "" ? "122.32.43." + i : i + 4),
        network_addr2: (cluster.gateway_ip == "" ? "122.32.43." + i : i + 4),
        firmware: "xx",
        bootloader: "xx",
        role: (is_gateway ? "gateway" : "device")
    });
}

var zigbee_node_tmpl = {
    id: -1,
    name: "Node",
    location: "", loc_lat: 0, loc_lon: 0,
    cluster: "10003", cluster_title: "Vojkova",
    status: "unknown", setup: "", scope: "", project: "", user_comment: "", box_label: "?", serial_no: "?",
    mac: "X", network_addr: "X", network_addr2: "X", firmware: "?", bootloader: "?", role: "device"
};

var curr_node_id = node_cnt + 1;

/////////////////////////////////////
// Polica

data.nodes.push({
    id: curr_node_id++,
    name: "opcomm coordinator",
    location: "",
    loc_lat: 15.958939,
    loc_lon: 46.660187,
    cluster: "10005",
    cluster_title: "Polica",
    status: "active",
    setup: "",
    scope: "",
    project: "",
    user_comment: "",
    box_label: "?",
    serial_no: "?",
    mac: "1",
    network_addr: "0",
    network_addr2: "0",
    firmware: "1.00",
    bootloader: "?",
    role: "gateway"
});

data.nodes.push({
    id: curr_node_id++,
    name: "Node 61",
    location: "",
    loc_lat: 15,
    loc_lon: 46,
    cluster: "10005",
    cluster_title: "Polica",
    status: "unknown",
    setup: "",
    scope: "",
    project: "",
    user_comment: "",
    box_label: "?",
    serial_no: "?",
    mac: "62",
    network_addr: "61",
    network_addr2: "61",
    firmware: "?",
    bootloader: "?",
    role: "device"
});

data.nodes.push({
    id: curr_node_id++,
    name: "Node 62",
    location: "",
    loc_lat: 15.958939,
    loc_lon: 46.660187,
    cluster: "10005",
    cluster_title: "Polica",
    status: "unknown",
    setup: "",
    scope: "",
    project: "",
    user_comment: "",
    box_label: "?",
    serial_no: "?",
    mac: "63",
    network_addr: "62",
    network_addr2: "62",
    firmware: "1.00",
    bootloader: "?",
    role: "device"
});

/////////////////////////////////////////////////////
// Vojkova

data.nodes.push({
    id: curr_node_id++,
    name: "opcomm coordinator",
    location: "",
    loc_lat: 0,
    loc_lon: 0,
    cluster: "10003",
    cluster_title: "Vojkova",
    status: "active",
    setup: "",
    scope: "",
    project: "",
    user_comment: "",
    box_label: "?",
    serial_no: "?",
    mac: "1",
    network_addr: "0",
    network_addr2: "0",
    firmware: "1.00",
    bootloader: "?",
    role: "gateway"
});

var node_ids_vojkova = [1, 51, 52, 53, 54];

for (var i = 0; i < node_ids_vojkova.length; i++) {
    var xnode = JSON.parse(JSON.stringify(zigbee_node_tmpl));
    xnode.id = curr_node_id++;
    xnode.name = "Node " + xnode.id;
    xnode.cluster = "10003";
    xnode.cluster_title = "Vojkova";
    xnode.mac = node_ids_vojkova[i] + 1;
    xnode.network_addr = node_ids_vojkova[i];
    xnode.network_addr2 = node_ids_vojkova[i];
    data.nodes.push(xnode);
}

///////////////////////////////////////////////////////
// Test IPv6

data.nodes.push({
    id: curr_node_id++,
    name: "Node 1",
    location: "",
    loc_lat: 0,
    loc_lon: 0,
    cluster: "X1",
    cluster_title: "Test IPv6",
    status: "unknown",
    setup: "",
    scope: "",
    project: "",
    user_comment: "",
    box_label: "?",
    serial_no: "?",
    mac: "0",
    network_addr: "2001:1470:ff80:e61:212:4b00:6:7670",
    network_addr2: "2001:1470:ff80:e61:212:4b00:6:7670",
    firmware: "",
    bootloader: "",
    role: "device"
});

/////////////////////////////////////////////////////
// node history

for (var j = 0; j < data.nodes.length; j++) {
    var node = data.nodes[j];
    for (var i = 0; i < history_len; i++) {
        data.history.push({
            node: node.id,
            cluster: node.cluster,
            user: data.users[i % data.users.length].username,
            status: "active",
            code: (i % 11 === 0 ? "user_change" : "node_change"),
            ts: new Date((new Date()) - i * 13 * 60000),
            title: "Something changed",
            description: "Details of this change " + i,
            sys_data: {
                ip: "127.0.0." + i,
                user: "user1"
            }
        });
    };
};

for (var j = 0; j < data.nodes.length; j++) {
    var node = data.nodes[j];
    node.sensors = [];

    node.sensors.push({
        id: "" + (j * 3 + 0),
        type: "sht21",
        name: "temp",
        description: ""
    });
    node.sensors.push({
        id: "" + (j * 3 + 1),
        type: "sht21",
        name: "hum",
        description: ""
    });
    node.sensors.push({
        id: "" + (j * 3 + 2),
        type: "pn532",
        name: "rfid",
        description: ""
    });
};

for (var i = 0; i < data.nodes.length; i++) {
    var node = data.nodes[i];
    for (var j = 0; j < node.sensors.length; j++) {
        var sensor = node.sensors[j];
        for (var k = 0; k < history_len; k++) {
            data.sensor_history.push({
                sensor: sensor.id,
                node: node.id,
                ts: new Date((new Date()) - k * 13 * 60000),
                sys_data: {
                    value: k,
                    title: "Some title " + k
                },
                value: i * j * k % 17 + 3
            });
        };
    };
};


for (var i = 0; i < component_cnt; i++) {
    var type = (i % 7 === 0 ? "sne" : (i % 3 === 0 ? "snr" : "snc"));
    var status = (i % 27 === 0 ? "error" : (i % 15 === 3 ? "in_repair" : "ok"));
    var pn = "VESNA-" + type + "-TRX-V0.0.1";
    var p = "" + now.getFullYear() + now.getMonth() + now.getDay();
    var s = xutil.pad(i % 4, 3);
    var sn = xutil.pad(i, 3);
    var id = pn + "-" + p + "-" + s + "-" + sn;
    data.components.push({
        id: id,
        type: type,
        product_number: pn,
        production: p,
        series: s,
        serial_number: sn,
        status: status,
        project: "",
        comment: ""
    });
    for (var j = 0; j < history_len; j++) {
        data.history.push({
            node: null,
            component: id,
            user: (i % 4 == 0 ? data.users[i % data.users.length].username : null),
            status: null,
            code: "component_change",
            ts: new Date((new Date()) - j * 13 * 60000),
            title: "Something changed",
            description: "Details of this change " + j,
            sys_data: {}
        });
    };
};

var component_index = 0;
for (var i = 0; i < data.nodes.length; i++) {
    var node = data.nodes[i];
    node.components = [];
    for (var j = 0; j < component_per_node; j++) {
        node.components.push(data.components[component_index++].id);
    }
}

//////////////////////////////////////////////

exports.get_dummy_data = function () {
    return data;
};
