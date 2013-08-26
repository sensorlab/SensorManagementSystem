// Utility functions for importing data from existing Excel files
//////////////////////////////////////////////////////////

var utils_hash = require("./utils_hash");
var xutil = require("./xutil");
var enums = require('./enums').get_enums();
var fs = require("fs");

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
// users

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

///////////////////////////////////////////////////////////////////////////////////////////////////
// clusters

data.clusters.push({
    id: "10005",
    name: "Polica",
    type: "zigbee",
    scan: true,
    comment: "",
    url: "http://194.249.231.26:9004/communicator"
});
data.clusters.push({
    id: "X1",
    name: "Test IPv6",
    type: "ipv6",
    scan: true,
    comment: "",
    url: "e6hermes.ijs.si"
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
    id: "3",
    name: "Industrial zone",
    type: "zigbee",
    scan: false,
    comment: "",
    url: "?"
});
data.clusters.push({
    id: "4",
    name: "City centre",
    type: "zigbee",
    scan: false,
    comment: "",
    url: "?"
});
data.clusters.push({
    id: "5",
    name: "KabelNet",
    type: "zigbee",
    scan: false,
    comment: "",
    url: "?"
});
data.clusters.push({
    id: "10006",
    name: "JSI",
    type: "zigbee",
    scan: false,
    comment: "",
    url: "http://194.249.231.26:9005/communicator"
});

var cluster_map = {};
data.clusters.forEach(function (item) {
    item.tag = (item.type == "zigbee" ? item.id : "");
    cluster_map[item.id] = item;
    cluster_map[item.name] = item;
});

//////////////////////////////////////////////////////////////////////////////////////////
// import excel data

function fix_prefix(item, field, prefix) {
    prefix2 = prefix.toLowerCase();
    if (item && item[field] && item[field] !== "" && item[field].substr(0, prefix.length).toLowerCase() != prefix2) {
        item[field] = prefix + item[field];
    }
}

function fix_last_split(item, field) {
    if (item && item[field] && item[field] !== "" && item[field].length >= 6) {
        var s = item[field];
        var s1 = s.substr(s.length - 6, 1);
        if (s1 != "-") return;
        var s2 = s.substr(s.length - 5, 5);
        var pattern = /\d\d\d\d\d/;
        if (pattern.test(s2)) {
            var s3 = s2.substr(0, 2);
            var s4 = s2.substr(2, 3);
            item[field] = s.substr(0, s.length - 6) + "-" + s3 + "-" + s4;
        }
    }
}

function find_component(collection, field, target) {
    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];
        if (item && item[field] && item[field] == target) {
            return true;
        }
    }
    return false;
}

function parse_new_component(id) {
    // SNR-MOD-V1.1.1-240412-01-029
    var slen = "-240412-01-029".length;
    var pattern = /\-\d\d\d\d\d\d\-\d\d\-\d\d\d/;

    var type = id.substr(6, 3).toLowerCase();
    var prod_num = id;
    var prod = "?";
    var series = "?";
    var sn = "?";
    var s = id.substr(id.length - slen, slen);
    if (pattern.test(s)) {
        var start = id.length - slen;
        var prod_num = id.substr(0, start);
        var prod = id.substr(start + 1, 6);
        var series = id.substr(start + 1 + 6 + 1, 2);
        var sn = id.substr(start + 1 + 6 + 1 + 2 + 1, 3);
    }

    var obj = {
        "id": id,
        "type": type,
        "product_number": prod_num,
        "production": prod,
        "series": series,
        "serial_number": sn,
        "status": "ok",
        "comment": "Generated automatically from Excel data for CREW boxes"
    };
    return obj;
}

//////////////////////////////////////////////////////////////////////////////////////////

var settings_content = fs.readFileSync("./test_data/data_from_excel_files.json");
var datax = JSON.parse(settings_content);

var all = 0;
var snc_ok = 0;
var snr_ok = 0;
var sne_ok = 0;

var zigbee_node_tmpl = {
    id: -1,
    name: "Node",
    location: "", loc_lat: 0, loc_lon: 0,
    cluster: "10003", cluster_title: "Vojkova",
    status: "unknown", setup: "", scope: "", project: "", user_comment: "", box_label: "?", serial_no: "?",
    mac: "X", network_addr: "X", network_addr2: "X", firmware: "?", bootloader: "?", role: "device",
    sensors: []
};

var curr_id = 1;

datax.nodes.forEach(function (item) {

    fix_prefix(item, "snc", "VESNA-");
    fix_prefix(item, "snr", "VESNA-");
    fix_prefix(item, "sne", "VESNA-");

    fix_last_split(item, "snc");
    fix_last_split(item, "snr");
    fix_last_split(item, "sne");

    all++;
    if (find_component(datax.components, "id", item.snc)) {
        snc_ok++;
    } else if (item.snc && item.snc != "") {
        datax.components.push(parse_new_component(item.snc));
    }

    if (find_component(datax.components, "id", item.snr)) {
        snr_ok++;
    } else if (item.snr && item.snr != "") {
        datax.components.push(parse_new_component(item.snr));
    }

    if (find_component(datax.components, "id", item.sne)) {
        sne_ok++;
    } else if (item.sne && item.sne != "") {
        datax.components.push(parse_new_component(item.sne));
    }

    item.role = (item.network_addr == 0 ? "gateway" : "device");

    var xnode = JSON.parse(JSON.stringify(zigbee_node_tmpl));
    xutil.override_members(item, xnode, false);
    xnode.id = curr_id++;
    xnode.name = "Node " + xnode.id;
    xnode.cluster = cluster_map[item.cluster].id;
    xnode.cluster_title = cluster_map[item.cluster].name;
    xnode.loc_lat = item.lat;
    xnode.loc_lon = item.lon;
    xnode.network_addr2 = xnode.network_addr;
    xnode.components = [];
    if (item.snc && item.snc !== "") xnode.components.push(item.snc);
    if (item.snr && item.snr !== "") xnode.components.push(item.snr);
    if (item.sne && item.sne !== "") xnode.components.push(item.sne);
    data.nodes.push(xnode);
});

datax.components.forEach(function (item) {
    data.components.push({
        id: item.id,
        type: item.type,
        product_number: item.product_number,
        production: item.production,
        series: item.series,
        serial_number: item.serial_number,
        status: item.status,
        project: "",
        comment: item.comment
    });
});
fs.writeFileSync("./test_data/data_from_excel_files_out.json", JSON.stringify(datax, null, "  "));
fs.writeFileSync("./test_data/data_from_excel_files_out2.json", JSON.stringify(data, null, "  "));

console.log("all=" + all);
console.log("snc_ok=" + snc_ok);
console.log("snr_ok=" + snr_ok);
console.log("sne_ok=" + sne_ok);

////////////////////////////

exports.get_dummy_data = function () { return data; }



