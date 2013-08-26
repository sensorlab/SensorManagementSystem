// database access in hidden inside this file, only functions are exposed (mocking is possible)

var mongojs = require('mongojs');
var xutil = require('./xutil');
var async = require("async");
var fs = require('fs');

//////////////////////////////////////////////////////////////////////////////////////////////
// This is DAL module for this system
//////////////////////////////////////////////////////////////////////////////////////////////

var db = null;
var db_url = "carvic"; // "username:password@example.com/mydb"

var do_archive = false;
var archive_dt_scan = null;
var archive_dt_edit = null;
var archive_dt_measurement = null;
var archive_dir = null;
var archive_format = null;

var collection_users = "users";
var collection_logins = "logins";
var collection_components = "components";
var collection_clusters = "clusters";
var collection_nodes = "nodes";
var collection_history = "history";
var collection_sensor_history = "sensor_history";

var collections = [
    collection_users,
    collection_logins,
    collection_components,
    collection_clusters,
    collection_nodes,
    collection_history,
    collection_sensor_history
];


//////////////////////////////////////////////////////////////////////////////

function dump_inner(cols, callback) {
    if (cols.length == 0) {
        callback();
    } else {
        var col = cols.pop();
        db[col].find({}, function (err, docs) {
            if (err) return callback2(err);
            console.log("=======================================================================================");
            console.log(col + " cnt: " + docs.length);
            console.log("=======================================================================================");
            docs.forEach(function (d) { console.log(JSON.stringify(d)); });
            dump_inner(cols, callback);
        });
    }
}

function dump(collection_name, callback) {

    var collections_to_dump = [];
    for (var i in collections) {
        var col = collections[i];
        if (collection_name != null && col !== collection_name)
            continue;
        collections_to_dump.push(col);
    }

    dump_inner(collections_to_dump, callback);
};

function clean_inner(cols, callback) {
    if (cols.length == 0) {
        callback();
    } else {
        var col = cols.pop();
        db[col].remove(function () {
            clean_inner(cols, callback);
        });
    }
}

function clean(callback) {
    var collections_to_clean = [];
    for (var i in collections) {
        var col = collections[i];
        collections_to_clean.push(col);
    }
    clean_inner(collections_to_clean, callback);
}

function fill_dummy_data(callback) {
    //var data = require("./db_dummy_data").get_dummy_data();
    var data = require("./import_excel_data").get_dummy_data();

    var inserts = [];

    var loop = function (arr, col) {
        arr.forEach(function (item) {
            inserts.push({ col: col, data: item });
        });
    }

    loop(data.components, collection_components);
    loop(data.clusters, collection_clusters);
    loop(data.nodes, collection_nodes);
    loop(data.sensor_history, collection_sensor_history);
    loop(data.users, collection_users, true);
    loop(data.logins, collection_logins);
    loop(data.history, collection_history);

    var calls = [];
    inserts.forEach(function (item) {
        calls.push(function (callback2) {
            db[item.col].insert(item.data, callback2);
        });
    });

    async.series(calls, function (err) {
        console.log(err);
        console.log("Done.");
        callback();
    });
}

/////////////////////////////////////////////////////////////////////////////////
function init(options, callback) {

    db = mongojs.connect(options.database.url, collections);
    console.log("Connected to database " + options.database.url);

    // set up unique constraints
    db[collection_users].ensureIndex({ username: 1 }, { unique: true, sparse: true });
    db[collection_components].ensureIndex({ id: 1 }, { unique: true, sparse: true });
    db[collection_clusters].ensureIndex({ id: 1 }, { unique: true, sparse: true });
    db[collection_nodes].ensureIndex({ id: 1 }, { unique: true, sparse: true });
    db[collection_nodes].ensureIndex({ network_addr: 1, cluster: 2 }, { unique: true, sparse: true });
    //db[collection_sensor_types].ensureIndex({ name: 1 }, { unique: true, sparse: true });

    // set up indexes
    db[collection_history].ensureIndex({ user: 1, ts: -1 });
    db[collection_history].ensureIndex({ node: 1, ts: -1 });
    db[collection_history].ensureIndex({ ts: -1 });
    db[collection_sensor_history].ensureIndex({ sensor: 1, ts: -1 });

    // make correction of corrupted data
    db[collection_users].update({ type: null }, { $set: { type: "normal"} });
    db[collection_users].update({ full_name: null }, { $set: { full_name: "Unknown"} });

    // archive settings
    var now = xutil.now();
    do_archive = (options.archive !== null && options.archive !== undefined);
    archive_dt_scan = (options.archive.scan_history != null ? xutil.subtract_window(now, options.archive.scan_history) : null);
    archive_dt_edit = (options.archive.edit_history != null ? xutil.subtract_window(now, options.archive.edit_history) : null);
    archive_dt_measurement = (options.archive.measurement_history != null ? xutil.subtract_window(now, options.archive.measurement_history) : null);
    archive_dir = options.archive.dir || "./archive";
    archive_fname_tmpl = options.archive.fname_tmpl || "arch_{tab}_{dt}.json";
    archive_format = options.archive.format || "json";

    callback();
};

function close(callback) {
    db.close(callback);
}

/////////////////////////////////////////////////////////////////////////////////

function get_history(query, skip, limit, callback) {
    db[collection_history]
        .find(query)
        .sort({ ts: -1 })
        .limit(limit)
        .skip(skip, function (err, docs) {
            if (err) return callback(err);
            callback(null, docs);
        });
}

function get_history_count(query, callback) {
    db[collection_history]
        .find(query)
        .count(function (err, cnt) {
            if (err) return callback(err);
            callback(null, cnt);
        });
}

/////////////////////////////////////////////////////////////////////////////////

function add_cluster(rec, callback) {
    db[collection_clusters].insert(rec, function (err, res) {
        callback(err, {});
    });
};

function update_cluster(id, rec, callback) {
    var query = { id: id };
    db[collection_clusters].update(query, { $set: rec }, null, function (err, res) {
        callback(err);
    });
};

function delete_cluster(id, callback) {
    db[collection_clusters].remove({ id: id }, callback);
};

function get_cluster(id, callback) {
    var query = { id: id };
    db[collection_clusters].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else if (!docs || docs.length === 0) {
            callback(new Error("Cluster with specified id not found: " + id));
        } else {
            callback(null, docs[0]);
        }
    });
};


function get_clusters(query, callback) {
    db[collection_clusters].find(query, function (err, docs) {
        if (err) return callback(err);
        callback(null, docs);
    });
};

function get_cluster_history(id, callback) {
    var query = { cluster: id };
    get_history(query, 0, 30, callback);
}

/////////////////////////////////////////////////////////////////////////////////

function add_component(rec, callback) {
    db[collection_components].insert(rec, function (err, res) {
        callback(err, {});
    });
};

function update_component(id, rec, callback) {
    var query = { id: id };
    db[collection_components].update(query, { $set: rec }, null, function (err, res) {
        callback(err, {});
    });
};

function delete_component(id, callback) {
    db[collection_components].remove({ id: id }, callback);
};

function get_component(id, callback) {
    var query = { id: id };
    db[collection_components].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else if (!docs || docs.length === 0) {
            callback(new Error("component with specified id not found: " + id));
        } else {
            callback(null, docs[0]);
        }
    });
};

function get_component_history(id, callback) {
    var query = { component: id };
    get_history(query, 0, 30, callback);
};


function get_components(query, callback) {
    db[collection_components].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else {
            callback(null, docs);
        }
    });
};

function get_components2(query, skip, limit, callback) {
    db[collection_components]
        .find(query)
        .sort({ ts: -1 })
        .limit(limit)
        .skip(skip, function (err, docs) {
            if (err) return callback(err);
            callback(null, docs);
        });
};

function get_components2_count(query, callback) {
    db[collection_components]
        .find(query)
        .count(function (err, cnt) {
            if (err) return callback(err);
            callback(null, cnt);
        });
};

////////////////////////////////////////////////////////////////////////////////


function add_node(rec, callback) {
    db[collection_nodes].insert(rec, function (err, res) {
        callback(err, {});
    });
};

function update_node(id, rec, callback) {
    var query = { id: id };
    db[collection_nodes].update(query, { $set: rec }, null, function (err, res) {
        callback(err, {});
    });
};

function delete_node(id, callback) {
    db[collection_nodes].remove({ id: id }, function (err) {
        if (err) return callback(err);
        db[collection_sensor_history].remove({ node: id }, callback);
    });
};

function get_node(id, callback) {
    var query = { id: id };
    db[collection_nodes].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else if (!docs || docs.length === 0) {
            callback(new Error("Node with specified id not found: " + id));
        } else {
            callback(null, docs[0]);
        }
    });
};

function get_node_history(id, callback) {
    var query = { node: id };
    get_history(query, 0, 30, callback);
};

function get_nodes2(query, skip, limit, callback) {
    db[collection_nodes]
        .find(query)
        .sort({ ts: -1 })
        .limit(limit)
        .skip(skip, function (err, docs) {
            if (err) return callback(err);
            callback(null, docs);
        });
};

function get_nodes2_count(query, callback) {
    db[collection_nodes]
       .find(query)
       .count(function (err, cnt) {
           if (err) return callback(err);
           callback(null, cnt);
       });
};

function get_nodes(query, callback) {
    db[collection_nodes].find(query, function (err, docs) {
        if (err) return callback(err);
        callback(null, docs);
    });
};

function get_node_ids(callback) {
    db[collection_nodes].distinct("id", function (err, docs) {
        if (err) return callback(err);
        callback(null, docs);
    });
};

function get_node_clusters(callback) {
    db[collection_nodes].distinct('cluster', function (err, docs) {
        if (err) return callback(err);
        callback(null, docs);
    });
};

////////////////////////////////////////////////////////////////////////////////


function get_sensor(node_id, id, callback) {
    get_node(node_id, function (err, data) {
        if (err) {
            callback(err);
        } else {
            for (var i = 0; i < data.sensors.length; i++) {
                if (data.sensors[i].id === id) {
                    callback(null, node.sensors[i]);
                    return;
                }
            }
            callback(new Error("Sensor with specified ID not found: node=" + node_id + ", id=" + id));
        }
    });
};

function get_sensors_for_node(node_id, callback) {
    get_node(node_id, function (err, node) {
        if (err) return callback(err);
        callback(null, node.sensors);
    });
};

function get_sensor_history(node_id, id, callback) {
    var query = { sensor: id, node: node_id };
    db[collection_sensor_history].find(query).sort({ ts: -1 }).limit(30).toArray(function (err, docs) {
        if (err) return callback(err);
        callback(null, docs);
    });
};

function update_sensors_for_node(node_id, sensors, callback) {
    var query = { id: node_id };
    db[collection_nodes].update(query, { $set: { sensors: sensors} }, null, function (err, res) {
        callback(err, {});
    });
};

function add_sensor_measurement(rec, callback) {
    db[collection_sensor_history].insert(rec, function (err, res) {
        callback(err, {});
    });
}

//////////////////////////////////////////////////////////////////

function new_history(rec, callback) {
    //console.log(collection_history, rec);
    db[collection_history].insert(rec, function (err, res) {
        callback(err, {});
    });
};


function new_user(rec, callback) {
    db[collection_users].insert(rec, function (err, res) {
        callback(err, {});
    });
};

function update_user(username, rec, callback) {
    var query = { username: username };
    db[collection_users].update(query, { $set: rec }, null, function (err, res) {
        callback(err, {});
    });
};

function get_user(username, callback) {
    var query = { username: username };
    db[collection_users].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else if (!docs || docs.length === 0) {
            callback(new Error("User with specified username not found: " + username));
        } else {
            callback(null, docs[0]);
        }
    });
};

function get_user_pwd(username, callback) {
    var query = { username: username, status: "active" };
    db[collection_users].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else if (!docs || docs.length === 0) {
            callback(new Error("User with specified username not found: " + username));
        } else {
            callback(null, docs[0].pwd_hash);
        }
    });
};

function get_username_map(callback) {
    db[collection_users].find({}, { username: 1, full_name: 1 }, function (err, docs) {
        if (err) return callback(err);
        callback(null, docs);
    });
};

function get_user_history(username, callback) {
    var query = { user: username };
    get_history(query, 0, 30, callback);
};

function get_users(query, callback) {
    db[collection_users].find(query).sort({ username: 1 }, function (err, docs) {
        if (err) return callback(err);
        docs.forEach(function (item) { item.pwd_hash = null; }); // remove password hash from result
        callback(null, docs);
    });
};

function delete_user(username, callback) {
    db[collection_users].remove({ username: username }, callback);
};

////////////////////////////////////////////////

function get_logins(username, callback) {
    var query = { user: username };
    db[collection_logins].find(query).sort({ ts: -1 }).limit(20).toArray(function (err, docs) {
        if (err) {
            callback(err);
        } else {
            callback(null, docs);
        }
    });
}

function new_login(username, ip, callback) {
    var minutes_length = 10;
    var ts_limit = new Date(new Date().getTime() - minutes_length * 60000);

    var query = { user: username, ip: ip, terminated: false, last_action: { $gt: ts_limit} };
    db[collection_logins].find(query, function (err, docs) {
        if (err) {
            callback(err);
        } else if (!docs || docs.length == 0) {
            var rec = {
                user: username,
                ts: new Date(),
                ip: ip,
                last_action: new Date(),
                terminated: false
            };
            db[collection_logins].insert(rec, function (err, saved) {
                if (err) {
                    callback(err);
                } else if (!saved) {
                    callback(new Error("User's login record could not be saved."));
                } else {
                    callback(null, {});
                }
            });
        } else {
            var rec = docs[0];
            rec.last_action = new Date();
            db[collection_logins].update({ _id: rec._id }, { $set: { last_action: rec.last_action} }, null, function (err, saved) {
                if (err) {
                    callback(err);
                } else if (!saved) {
                    callback(new Error("User's login record could not be saved."));
                } else {
                    callback(null, {});
                }
            });
        }
    });
}

/////////////////////////////////////////////////////

function get_max_node_id(callback) {
    db[collection_nodes].find().sort({ id: -1 }).limit(1, function (err, docs) {
        if (err) {
            callback(err);
        } else if (docs.length > 0) {
            callback(null, docs[0].id);
        } else {
            callback(new Error("Node list is empty"));
        }
    });
}

function get_node_stats(callback) {
    var res = {
        all: 0,
        active: 0
    };
    db[collection_nodes].find({}, function (err, docs) {
        docs.forEach(function (item) {
            res.all++;
            if (item.status === "active") {
                res.active++;
            }
        });
        res.active_percent = Math.round(100 * res.active / res.all, 1);
        callback(null, res);
    });
}

function get_sensor_stats(callback) {
    var res = {
        all: 0,
        active: 0
    };

    db[collection_nodes].aggregate(
    [
        { $unwind: "$sensors" },
        { $group: { _id: 1, number: { $sum: 1}} }
    ], function (err, docs) {
        res.all = (docs.length > 0 ? docs[0].number : 0);
        callback(null, res);
    });
}

function get_user_stats(callback) {
    var res = {
        all: 0,
        active: 0,
        admins: 0
    };
    db[collection_users].find({}, function (err, docs) {
        docs.forEach(function (item) {
            res.all++;
            if (item.status === "active") {
                res.active++;
            }
            if (item.type === "admin") {
                res.admins++;
            }
        });
        callback(null, res);
    });
}


function get_cluster_stats(callback) {

    db[collection_nodes].aggregate(
        [{ $group: { _id: "$cluster", nodes: { $sum: 1}}}],
        function (err, docs) {
            db[collection_nodes].aggregate([
                { $match: { status: 'active'} },
                { $group: { _id: "$cluster", nodes: { $sum: 1}} }
                ],
            function (err, docs2) {
                docs.forEach(function (item) {
                    item.title = item._id;
                    item.id = item._id;
                    item.nodes_active = 0;

                    docs2.forEach(function (item2) {
                        if (item._id === item2._id) {
                            item.nodes_active = item2.nodes;
                        }
                    });
                    item.nodes_activep = 100 * item.nodes_active / item.nodes;
                    item._id = undefined;
                    item.sensors = 0;
                    item.sensors_active = 0;
                    item.sensors_activep = 0;
                });

                callback(null, docs);
            }
            )
        }
    );
}

///////////////////////////////////////////////////////////////////////

var scan_codes = ["node_scan", "cluster_scan"];

function archive_single_tab(col_name, query, fname, callback) {
    //console.log("archive_single_tab", col_name);
    db[col_name].find(query, function (err, docs) {
        //console.log("archive_single_tab", docs.length);
        fs.writeFile(fname, JSON.stringify(docs), null, function (err) {
            if (err) return callback(err);
            db[col_name].remove(query, callback);
        });
    });
}

function archive_sensors(file_name, callback) {
    if (archive_dt_measurement != null) {
        archive_single_tab(collection_sensor_history, { ts: { $lt: archive_dt_measurement} }, file_name + "_sensor_history", callback);
    } else {
        callback();
    }
}

function archive_edits(file_name, callback) {
    if (archive_dt_edit != null) {
        archive_single_tab(
            collection_history,
            { ts: { $lt: archive_dt_edit }, code: { $nin: scan_codes} },
            file_name + "_edit_history",
            callback);
    } else {
        callback();
    }
}

function archive_scans(file_name, callback) {
    if (archive_dt_measurement != null) {
        archive_single_tab(
            collection_history,
            { ts: { $lt: archive_dt_scan }, code: { $in: scan_codes} },
            file_name + "_sensor_history",
            callback);
    } else {
        callback();
    }
}

function archive(callback) {
    if (!do_archive) return callback();

    if (!fs.existsSync(archive_dir)) {
        fs.mkdirSync(archive_dir);
    }

    var file_name = archive_dir + "/archive";

    var res = [];
    var archive_callback = function (err) {
        res.push(err);
        if (res.length === 3) {
            for (var i = 0; i < res.length; i++) {
                if (res[i])
                    return callback(res[i]);
            }
            callback();
        }
    }
    archive_scans(file_name, archive_callback);
    archive_sensors(file_name, archive_callback);
    archive_edits(file_name, archive_callback);
}

///////////////////////////////////////////////////////////////////////

exports.dump = dump;
exports.clean = clean;
exports.fill_dummy_data = fill_dummy_data;
exports.init = init;
exports.close = close;
exports.archive = archive;

exports.new_history = new_history;

exports.add_cluster = add_cluster;
exports.update_cluster = update_cluster;
exports.delete_cluster = delete_cluster;
exports.get_cluster = get_cluster;
exports.get_clusters = get_clusters;
exports.get_cluster_history = get_cluster_history;

exports.add_component = add_component;
exports.update_component = update_component;
exports.delete_component = delete_component;
exports.get_component = get_component;
exports.get_component_history = get_component_history;
exports.get_components = get_components;
exports.get_components2 = get_components2;
exports.get_components2_count = get_components2_count;

exports.get_node_ids = get_node_ids;
exports.get_max_node_id = get_max_node_id;
exports.add_node = add_node;
exports.update_node = update_node;
exports.delete_node = delete_node;
exports.get_node = get_node;
exports.get_node_history = get_node_history;
exports.get_nodes = get_nodes;
exports.get_nodes2 = get_nodes2;
exports.get_nodes2_count = get_nodes2_count;
exports.get_node_clusters = get_node_clusters;

exports.get_sensor = get_sensor;
exports.get_sensors_for_node = get_sensors_for_node;
exports.get_sensor_history = get_sensor_history;
exports.update_sensors_for_node = update_sensors_for_node;
exports.add_sensor_measurement = add_sensor_measurement;

//exports.add_sensor = add_sensor;
//exports.update_sensor = update_sensor;
//exports.remove_sensor = remove_sensor;

exports.new_user = new_user;
exports.update_user = update_user;
exports.delete_user = delete_user;
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

exports.get_history = get_history;
exports.get_history_count = get_history_count;