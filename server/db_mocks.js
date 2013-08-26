// DEVELOPMENT ONLY
// mock database inside memory, probably not operational anymore

var utils_hash = require("./utils_hash");
var db_dummy_data = require("./db_dummy_data");
var xutil = require('./xutil');

////////////////////////////////////////////////////////////////////////////////////////

var data = db_dummy_data.get_dummy_data();

/////////////////////////////////////////////////////////////////////////////////

function check_match(rec, query) {
    var ok = true;
    for (var f in query) {
        if (rec[f] !== query[f]) {
            ok = false;
            break;
        }
    }
    return ok;
};

function pack_array(arr) {
    return arr.filter(function (val) {
        return (val != null);
    });
};

/////////////////////////////////////////////////////////////////////////////////

function get_max_node_id(callback) {
    var res = "0";
    for (var i = 0; i < data.nodes.length; i++) {
        if (data.nodes[i].id > res) {
            res = data.nodes[i].id;
        }
    }
    callback(null, res);
};

function add_node(rec, callback) {
    data.nodes.push(rec);
    callback(null, {});
};

function update_node(id, rec, callback) {
    for (var i = 0; i < data.nodes.length; i++) {
        if (data.nodes[i].id === rec.id) {
            data.nodes[i] = rec;
            callback(null, {});
        }
    }
    for (var i = 0; i < data.nodes.length; i++) {
        if (data.nodes[i].id === id) {
            xutil.override_members(rec, data.nodes[i], false);
            callback(null, {});
            break;
        }
    }
    callback(new Error("Node with specified ID not found: " + rec.id));
};

function get_node(id, callback) {
    for (var i = 0; i < data.nodes.length; i++) {
        if (data.nodes[i].id === id) {
            callback(null, data.nodes[i]);
        }
    }
    callback(new Error("Node with specified ID not found: " + id));
};

function get_node_history(id, callback) {
    var res = [];
    var query = {
        node: id
    };
    for (var i = 0; i < data.history.length; i++) {
        if (check_match(data.history[i], query))
            res.push(data.history[i]);
    }
    callback(null, res);
};

function get_nodes(query, callback) {
    var res = [];
    for (var i = 0; i < data.nodes.length; i++) {
        if (check_match(data.nodes[i], query))
            res.push(data.nodes[i]);
    }
    callback(null, res);
};

function get_node_clusters(callback) {
    var res = [];
    var resx = {};
    for (var i = 0; i < data.nodes.length; i++) {
        var cl = data.nodes[i].cluster;
        if (resx[cl] == undefined) {
            res.push(cl);
            resx[cl] = cl;
        }
    }
    callback(null, res);
}

////////////////////////////////////////////////////////////////////////////////

function add_component(rec, callback) {
    data.components.push(rec);
    callback(null, {});
};

function update_component(id, rec, callback) {
    for (var i = 0; i < data.components.length; i++) {
        if (data.components[i].id === rec.id) {
            data.components[i] = rec;
            callback(null, {});
        }
    }
    for (var i = 0; i < data.components.length; i++) {
        if (data.components[i].id === id) {
            xutil.override_members(rec, data.components[i], false);
            callback(null, {});
            break;
        }
    }
    callback(new Error("Component with specified ID not found: " + rec.id));
};

function get_component(id, callback) {
    for (var i = 0; i < data.components.length; i++) {
        if (data.components[i].id === id) {
            callback(null, data.components[i]);
            return;
        }
    }
    callback(new Error("Component with specified ID not found: " + id));
};

function get_component_history(id, callback) {
    var res = [];
    var query = {
        component: id
    };
    for (var i = 0; i < data.history.length; i++) {
        if (check_match(data.history[i], query))
            res.push(data.history[i]);
    }
    callback(null, res);
};

function get_components(query, callback) {
    var res = [];
    for (var i = 0; i < data.components.length; i++) {
        if (check_match(data.components[i], query))
            res.push(data.components[i]);
    }
    callback(null, res);
};

////////////////////////////////////////////////////////////////////////////////

function add_cluster(rec, callback) {
    data.clusters.push(rec);
    callback(null, {});
};

function update_cluster(id, rec, callback) {
    get_cluster(id, function (err, xdata) {
        if (err) {
            callback(err);
        } else {
            xutil.override_members(rec, xdata, false);
            callback(null, {});
        }
    });
};

function get_cluster(id, callback) {
    for (var i = 0; i < data.clusters.length; i++) {
        if (data.clusters[i].id === id) {
            callback(null, data.clusters[i]);
            return;
        }
    }
    callback(new Error("Cluster with specified ID not found: " + id));
};

function get_clusters(query, callback) {
    var res = [];
    for (var i = 0; i < data.clusters.length; i++) {
        if (check_match(data.clusters[i], query))
            res.push(data.clusters[i]);
    }
    callback(null, res);
};

function get_cluster_history(id, callback) {
    var res = [];
    var query = {
        cluster: id
    };
    for (var i = 0; i < data.history.length; i++) {
        if (check_match(data.history[i], query)) {
            res.push(data.history[i]);
            if (res.length >= 30)
                break;
        }
    }
    callback(null, res);
};

////////////////////////////////////////////////////////////////////////////////

function get_sensor(node_id, id, callback) {
    for (var j = 0; j < data.nodes.length; j++) {
        var node = data.nodes[j];
        if (node.id != node_id)
            continue;
        for (var i = 0; i < node.sensors.length; i++) {
            if (node.sensors[i].id === id) {
                callback(null, node.sensors[i]);
                return;
            }
        }
    }
    callback(new Error("Sensor with specified ID not found: node=" + node_id + ", id=" + id));
};

function get_sensors_for_node(node_id, callback) {
    get_node(node_id, function (err, node) {
        if (err == null) {
            callback(null, node.sensors);
        } else {
            callback(err);
        }
    });
};

function get_sensor_history(node_id, id, callback) {
    var res = [];
    var query = {
        node: node_id,
        sensor: id
    };
    for (var i = 0; i < data.sensor_history.length; i++) {
        if (check_match(data.sensor_history[i], query))
            res.push(data.sensor_history[i]);
    }
    callback(null, res);
};

function update_sensors_for_node(node_id, sensors, callback) {
    get_node(node_id, function (err, data) {
        if (err) return callback(err);
        data.sensors = sensors;
        callback();
    });
}

function add_sensor(node_id, rec, callback) {
    get_node(node_id, function (err, data) {
        if (err) return callback(err);
        data.sensors.push(rec);
        callback(null, {});
    });
};

function update_sensor(node_id, rec, callback) {
    get_sensor(node_id, rec.id, function (err, data) {
        if (err) return callback(err);
        xutil.override_members(rec, data, false);
        callback(null, {});
    });
};

function remove_sensor(node_id, id, callback) {
    for (var j = 0; j < data.nodes.length; j++) {
        var node = data.nodes[j];
        if (node.id != node_id)
            continue;
        for (var i = 0; i < node.sensors.length; i++) {
            if (node.sensors[i].id === id) {
                node.sensors[i] = null;
                node.sensors = node.sensors.filter(function (val) {
                    return (val != null);
                });
                callback(null, {});
                return;
            }
        }
    }
    callback(new Error("Sensor with specified ID not found: node=" + node_id + ", id=" + id));
    // var target = null;
    // for (var i = 0; i < data.sensors.length; i++) {
    // if (data.sensors[i].id === rec.id) {
    // target = i;
    // }
    // }
    // if (target) {
    // data.sensors[i] = null;
    // data.sensors = data.sensors.filter(function (val) {
    // return (val != null);
    // });
    // callback(null, {});
    // } else {
    // callback(new Error("Sensor with specified ID not found: " + id));
    // }
};

//////////////////////////////////////////////////////////////////

function new_history(rec, callback) {
    data.history.push(rec);
    callback(null, {});
};

function new_user(rec, callback) {
    data.users.push(rec);
    callback(null, {});
};

function update_user(username, rec, callback) {
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].username === username) {
            xutil.override_members(rec, data.users[i], false);
            callback(null, {});
            break;
        }
    }
    callback(new Error("User with specified username not found: " + rec.username));
};

function get_username_map(callback) {
    var res = [];
    for (var i = 0; i < data.users.length; i++) {
        var obj = data.users[i];
        res.push({
            username: obj.username,
            full_name: obj.full_name
        });
    }
    callback(null, res);
};

function get_user(username, callback) {
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].username === username) {
            var res = JSON.parse(JSON.stringify(data.users[i]));
            res.pwd_hash = null;
            // remove password hash from result
            callback(null, res);
            return;
        }
    }
    callback(new Error("User with specified username not found: " + username));
};

function get_user_pwd(username, callback) {
    for (var i = 0; i < data.users.length; i++) {
        var obj = data.users[i];
        if (obj.username === username && obj.status === "active") {
            callback(null, obj.pwd_hash);
            return;
        }
    }
    callback(new Error("User with specified username not found: " + username));
};

function get_user_history(username, callback) {
    var res = [];
    var query = {
        user: username
    };
    for (var i = 0; i < data.history.length; i++) {
        if (check_match(data.history[i], query))
            res.push(data.history[i]);
    }
    callback(null, res);
};

function get_users(query, callback) {
    var res = [];
    for (var i = 0; i < data.users.length; i++) {
        if (check_match(data.users[i], query))
            res.push(data.users[i]);
    }
    var res2 = JSON.parse(JSON.stringify(res));
    res2.forEach(function (item) {
        item.pwd_hash = null;
    });
    // remove password hash from result
    callback(null, res2);
};

////////////////////////////////////////////////

function get_logins(username, callback) {
    var res = [];
    for (var i = 0; i < data.logins.length; i++) {
        var obj = data.logins[i];
        if (obj.user === username)
            res.push(obj);
    }
    callback(null, res);
}

function new_login(username, ip, callback) {
    var res = null;
    var now = new Date();
    var query = {
        user: username,
        ip: ip,
        terminated: false
    };
    for (var i = 0; i < data.logins.length; i++) {
        if (check_match(data.logins[i], query)) {
            if (data.logins[i].last_action >= now - 30 * 60 * 1000) {
                res = data.logins[i];
                break;
            }
        }
    }
    if (!res) {
        data.logins.push({
            user: username,
            ts: now,
            ip: ip,
            last_action: now,
            terminated: false
        });
    } else {
        res.last_action = now;
    }
    callback(null, {});
}

/////////////////////////////////////////////////////

function get_node_stats(callback) {
    var res = {
        all: 0,
        active: 0
    };
    for (var i = 0; i < data.nodes.length; i++) {
        res.all++;
        var obj = data.nodes[i];
        if (obj.status == "active") {
            res.active++;
        }
    }
    res.active_percent = Math.round(100 * res.active / res.all, 1);
    callback(null, res);
}

function get_sensor_stats(callback) {
    var res = {
        all: 0,
        active: 0
    };
    for (var j = 0; j < data.nodes.length; j++) {
        var node = data.nodes[j];
        for (var i = 0; i < node.sensors.length; i++) {
            res.all++;
            var obj = node.sensors[i];
            if (obj.enabled) {
                res.active++;
            }
        }
    }
    res.active_percent = Math.round(100 * res.active / res.all, 1);
    callback(null, res);
}

function get_user_stats(callback) {
    var res = {
        all: 0,
        active: 0,
        admins: 0
    };
    for (var i = 0; i < data.users.length; i++) {
        res.all++;
        var obj = data.users[i];
        if (obj.status == "active") {
            res.active++;
        }
        if (obj.type == "admin") {
            res.admins++;
        }
    }
    callback(null, res);
}

function get_cluster_stats(callback) {
    var res_map = {};
    for (var i = 0; i < data.nodes.length; i++) {
        var obj = data.nodes[i];
        console.log(obj);
        var cluster = obj.cluster;
        if (res_map[cluster] == undefined) {
            res_map[cluster] = {
                title: cluster,
                nodes: 0,
                nodes_active: 0,
                nodes_activep: 0,
                sensors: 0,
                sensors_active: 0,
                sensors_activep: 0
            };
        }
        var xres = res_map[cluster];
        xres.nodes++;
        if (obj.status == "active") {
            xres.nodes_active++;
        }
    }
    var res = [];
    for (var i in res_map) {
        var xobj = res_map[i];
        xobj.nodes_activep = Math.round(100 * xobj.nodes_active / xobj.nodes, 1);
        res.push(xobj);
    }
    callback(null, res);
}

/////////////////////////////////////////////////////////////////////////////////

function init(options, callback) {
    callback();
};

function dump(callback) {
    console.log(JSON.stringify(data, null, "   "));
    callback();
}

///////////////////////////////////////////////////////////////////////

exports.init = init;
exports.dump = dump;
exports.new_history = new_history;

exports.add_component = add_component;
exports.update_component = update_component;
exports.get_component = get_component;
exports.get_component_history = get_component_history;
exports.get_components = get_components;

exports.add_cluster = add_cluster;
exports.update_cluster = update_cluster;
exports.get_cluster = get_cluster;
exports.get_clusters = get_clusters;
exports.get_cluster_history = get_cluster_history;

exports.add_node = add_node;
exports.update_node = update_node;
exports.get_node = get_node;
exports.get_node_history = get_node_history;
exports.get_nodes = get_nodes;
exports.get_node_clusters = get_node_clusters;
exports.get_sensor = get_sensor;
exports.get_sensors_for_node = get_sensors_for_node;
exports.get_sensor_history = get_sensor_history;
exports.update_sensors_for_node = update_sensors_for_node;
exports.add_sensor = add_sensor;
exports.update_sensor = update_sensor;
exports.remove_sensor = remove_sensor;
exports.new_user = new_user;
exports.update_user = update_user;
exports.get_user = get_user;
exports.get_username_map = get_username_map;
exports.get_user_pwd = get_user_pwd;
exports.get_user_history = get_user_history;
exports.get_users = get_users;
exports.new_login = new_login;
exports.get_logins = get_logins;
exports.get_node_stats = get_node_stats;
exports.get_sensor_stats = get_sensor_stats;
exports.get_user_stats = get_user_stats;
exports.get_cluster_stats = get_cluster_stats;
