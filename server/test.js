// DEVELOPMENT ONLY
// used for testing small chunks of code

/*
var fs = require("fs");

var clusters = [];
clusters.push({
    id: "1",
    name: "Polica",
    type: "zigbee",
    url: "http://194.249.231.26:9004/communicator"
});
clusters.push({
    id: "X1",
    name: "Test IPv6",
    type: "ipv6",
    url: "e6hermes.ijs.si"
});
clusters.push({
    id: "2",
    name: "Vojkova",
    type: "zigbee",
    url: "http://194.249.231.26:9001/communicator"
});
clusters.push({
    id: "3",
    name: "Industrial zone",
    type: "zigbee",
    url: "?"
});
clusters.push({
    id: "4",
    name: "City centre",
    type: "zigbee",
    url: "?"
});
clusters.push({
    id: "5",
    name: "KabelNet",
    type: "zigbee",
    url: "?"
});
clusters.push({
    id: "6",
    name: "JSI",
    type: "zigbee",
    url: "?"
});


var settings_content = fs.readFileSync("./test_data/data_from_excel_files.json");
var data = JSON.parse(settings_content);
console.log("done");

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

var all = 0;
var snc_ok = 0;
var snr_ok = 0;
var sne_ok = 0;

data.nodes.forEach(function (item) {

    fix_prefix(item, "snc", "VESNA-");
    fix_prefix(item, "snr", "VESNA-");
    fix_prefix(item, "sne", "VESNA-");

    fix_last_split(item, "snc");
    fix_last_split(item, "snr");
    fix_last_split(item, "sne");

    all++;
    if (find_component(data.components, "id", item.snc)) {
        snc_ok++;
    } else if (item.snc && item.snc != "") {
        data.components.push(parse_new_component(item.snc));
    }

    if (find_component(data.components, "id", item.snr)) {
        snr_ok++;
    } else if (item.snr && item.snr != "") {
        data.components.push(parse_new_component(item.snr));
    }

    if (find_component(data.components, "id", item.sne)) {
        sne_ok++;
    } else if (item.sne && item.sne != "") {
        data.components.push(parse_new_component(item.sne));
    }

});

data.cluters = clusters;

fs.writeFileSync("./test_data/data_from_excel_files_out.json", JSON.stringify(data, null, "  "));

console.log("all=" + all);
console.log("snc_ok=" + snc_ok);
console.log("snr_ok=" + snr_ok);
console.log("sne_ok=" + sne_ok);
*/

/*
var coap = require("./coap");

var init_data = {
id: "1001",
url: "e6hermes.ijs.si",
xnodes: [
{ id: "45", network_addr: "2001:1470:ff80:e61:212:4b00:6:7670" }
]
};

var comm = new coap.CoapHtmlCommunicator();
comm.init(init_data, function (err1) {
comm.getNodes(function (err2, data2) {
console.log("2", err2, data2);
comm.getNode("45", function (err3, data3) {
console.log("3", err3, data3);
comm.getSensors("45", function (err4, data4) {
console.log("4", err4, data4);
comm.getSensor("45", "temperature/1", function (err5, data5) {
console.log("5", err5, data5);
comm.getSensorData("45", "temperature/1", function (err6, data6) {
console.log("6", err6, data6);
comm.getSensor("45", "humidity/1", function (err51, data51) {
console.log("51", err51, data51);
comm.getSensorData("45", "humidity/1", function (err61, data61) {
console.log("61", err61, data61);
});
});
});
});
});
});
});
});
*/

/*
var xutil = require("./xutil");
var s = "</.well-known/core>;ct=40,</test/chunks>;title=\"Blockwise demo\";rt=\"Data\",</sensors/temperature/1>;title=\"Temperature SHT21\",</sensors/humidity/1>;title=\"Rhumidity SHT21\",</test/push>;title=\"Periodic demo\";obs,</test/path>;title=\"Sub-resource demo\",</actuators/toggle>;title=\"Red LED\";rt=\"Control\" ";

var xsensors = [];
var ids = [];
var lines = s.split("</");
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
console.log(xsensors);
console.log(ids);
*/

/*
var s = "lkj/sdf/sdf";
console.log(s);

var xs = s.replace(/\//g, "\\");
console.log(xs);
*/
/*

var test2 = require("./test2");

test2.a = 12;
test2.xyz();
*/



/*
var d = new Date(1367879720);
console.log(d);
*/
/*

function xy(a){
a.b = 56;
//a = { b : 56 };
}

var x = {c:"hu"};
xy(x);
console.log(x);
*/

/*
var fs = require('fs');

var xutil = require("./xutil");
//var zigbee = require("./zigbee");
var scanner = require("./scanner");
var db_syncer = require("./db_syncer");

var final = function (err, data) {
console.log(err);
console.log(JSON.stringify(data, null, "   "));
};


var d1=new Date();
console.log(d1.toString('yyyy-MM-dd'));    
*/

/*
//////////////////////////////////////////////////////////////////////////

var dummy_bl = {
update_node: function (data, callback) {
console.log("update_node", data);
callback(null, null);
},
get_nodes: function (data, callback) {
console.log("get_nodes", data);

var data = [
{ id: 152, network_addr: "62", status: "active", mac: "?", firmware: "?", bootloader: "" },
{ id: 153, network_addr: "67", status: "active", mac: "?", firmware: "?", bootloader: "" }
];

callback(null, data);
},
get_sensors_for_node: function (req, callback) {
console.log("get_sensors_for_node", JSON.stringify(req, null, "   "));
var sensors =
[ {       id: "1",type: "sht",  name: "sht12",description: ""}];
//  [
//   { id: "SHT21-humidity", type: "SHT21", name: "humidity", description: "" },
//   { id: "PN532-rfid", type: "pn532", name: "rfid", description: "" },
//   { id: "SHT21-temperature", type: "SHT21", name: "temperature", description: "" }
//];
callback(null, sensors);
},
update_sensors_for_node: function (req, callback) {
console.log("update_sensors_for_node", JSON.stringify(req, null, "   "));
callback();
}
};

var in_file = __dirname + "/test_data/network_scan1.json";





fs.readFile(in_file, function (err, data) {
if (err) {
final(err);
} else {
var settings = JSON.parse(data);

db_syncer.sync_cluster(dummy_bl, settings, final);
//final(err, settings);
}
});

*/



//////////////////////////////////////////////////////////////////////////


//var data = { 
//    id: '10005',
//    name: 'Polica',
//    type: 'zigbee',
//    url: 'http://194.249.231.26:9004/communicator'
//};

//scanner.scan_cluster(data, final);
