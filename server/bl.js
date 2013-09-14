// "business logic" - all smart stuff is happening here, except scanning

var async = require("async");
var utils_hash = require("./utils_hash");
var xutil = require('./xutil');
var db = null;

///////////////////////////////////////////////////////////////////////

var username_map = {};
var cluster_map = {};
var node_map = {};
var page_size_global = 15;

///////////////////////////////////////////////////////////////////////

var notify_after_node_change = null;
var notify_after_sensor_scan = null;
var notify_after_sensor_change = null;

exports.set_notify_after_node_change = function (callback) { notify_after_node_change = callback };
exports.set_notify_after_sensor_scan = function (callback) { notify_after_sensor_scan = callback };
exports.set_notify_after_sensor_change = function (callback) { notify_after_sensor_change = callback; }

///////////////////////////////////////////////////////////////////////

function init(options, callback) {
    db = options.db;
    upgrade(function (err) {
        if (err) return callback(err);
        load_username_map(function () {
            load_cluster_map(function () {
                load_node_map(function () {
                    callback();
                });
            });
        });
    });
}

function verify_user(u, p, callback) {
    db.get_user_pwd(u, function (err, pwd) {
        if (err) {
            console.log("Error while verifying user: " + err.message);
            callback(err);
        } else {
            var h = utils_hash.create_pwd_hash(p);
            if (h !== pwd) {
                callback(new Error("Invalid password"));
                // TODO increase bad_login_cnt, lock user ?
            } else {
                callback(null, u);
                db.update_user(u, { last_login: new Date(), bad_login_cnt: 0 }, function () { });
            }
        }
    });
}

function is_user_admin(username, callback_if_error) {
    return (username && username_map[username] && username_map[username].type === "admin");
}
function error_not_admin(username) {
    return new Error("User '" + username + "' is not an administrator.");
}

function upgrade(callback) {
    // add field "tag" to collection "clusters"
    db.get_clusters({}, function (err, data) {
        if (err) return callback(err);
        data.forEach(function (item) {
            var do_update = false;
            var new_rec = {};
            if (item.scan === null || item.scan === undefined) {
                new_rec.scan = false;
                do_update = true;
            }
            if (item.tag === null || item.tag === undefined) {
                new_rec.tag = item.id;
                do_update = true;
            }
            if (item.comment === null || item.comment === undefined) {
                new_rec.comment = "";
                do_update = true;
            }
            if (do_update)
                db.update_cluster(item.id, new_rec, function () { });
        });
        if (callback) {
            callback(null);
        }
    });
}



function load_username_map(callback) {
    db.get_users({}, function (err, data) {
        if (err) {
            console.log("Error while loading user cache: " + err.message);
            if (callback)
                callback(err);
        } else {
            username_map = {};
            data.forEach(function (item) {
                username_map[item.username] = item;
            });
            if (callback)
                callback(null);
        }
    });
}

function load_cluster_map(callback) {
    db.get_clusters({}, function (err, data) {
        if (err) {
            console.log("Error while loading cluster cache: " + err.message);
            if (callback)
                callback(err);
        } else {
            cluster_map = {};
            data.forEach(function (item) {
                cluster_map[item.id] = item;
            });
            if (callback)
                callback(null);
        }
    });
}

function load_node_map(callback) {
    db.get_nodes({}, function (err, data) {
        if (err) {
            console.log("Error while loading node cache: " + err.message);
            if (callback)
                callback(err);
        } else {
            node_map = {};
            data.forEach(function (item) {
                node_map[item.id] = item;
            });
            if (callback)
                callback(null);
        }
    });
}

function regexp_quote(str) {
    return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

function create_regexp(s, split_on_spaces, no_prefix) {
    s = regexp_quote(s);
    if (no_prefix) {
        s = "^" + s;
    }
    if (split_on_spaces) {
        var strs = s.split(" ");
        var s = strs.join(".*");
        return new RegExp(s, "i");
    } else {
        return new RegExp(s, "i");
    }
}

function create_regexp2(req, query, where, prop_name) {
    if (req[prop_name] && req[prop_name].length > 0) {
        if (req[prop_name][0] == "*") {
            var s = "/" + regexp_quote(req[prop_name].substr(1)) + "/i.test(this." + prop_name + ")";
            where.push(s);
        } else {
            query[prop_name] = req[prop_name];
        }
    }
}

///////////////////////////////////////////////////////////////////////

exports.init = init;
exports.test_x = function (data, callback) {
    callback(null, { a: 654, b: true });
};

exports.verify_user = verify_user;

exports.new_login = function (username, ip, callback) {
    db.new_login(username, ip, function (err) {
        callback(err);
    });
};

/////////////////////////////////////////////////

exports.lookup_component = function (req, callback) {
    var query = {
        id: create_regexp(req.data.search_str, true)
    };
    db.get_components(query, function (err, data) {
        if (err) {
            callback(err);
        } else {
            var res = [];
            data.forEach(function (item) { res.push(item.id); });
            callback(err, res);
        }
    });
};

exports.cluster_list = function (req, callback) {
    db.get_node_clusters(function (err, data) {
        callback(err, data);
    });
};

exports.get_cluster_stats = function (req, callback) {
    db.get_cluster_stats(function (err, data) {
        if (err) return callback(err);

        data.forEach(function (item) {
            if (cluster_map[item.id])
                item.title = cluster_map[item.id].name;
        });

        callback(err, data);
    });
};


exports.change_pwd = function (req, callback) {
    var username = req.session.user;

    if (req.data.username) {
        if (!is_user_admin(req.session.user))
            return callback(new Error("Current user (" + req.session.user + ") is not admin and cannot change other user's password."));
        username = req.data.username;
    }
    var rec = {
        pwd_hash: utils_hash.create_pwd_hash(req.data.pwd)
    };
    db.update_user(username, rec, function (err, data2) {
        callback(err, {});
    });
};

exports.change_my_full_name = function (req, callback) {
    //console.log(req);
    var rec = {
        full_name: req.data.full_name
    };
    db.update_user(req.session.user, rec, function (err, data2) {
        var h = {
            node: null,
            user: req.session.user,
            status: null,
            code: "user_change",
            ts: new Date(),
            title: "User '" + req.session.user + "' changed his full name",
            description: "User '" + req.session.user + "' changed his full name to '" + req.data.full_name + "'",
            sys_data: rec
        };
        db.new_history(h, callback);
        load_username_map();
    });
};

exports.get_current_user = function (req, callback) {
    db.get_user(req.session.user, function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, { username: data.username, full_name: data.full_name, type: data.type });
        }
    });
};

exports.new_user = function (req, callback) {
    var rec = req.data;
    var rec2 = {
        username: rec.username,
        full_name: rec.full_name,
        pwd_hash: utils_hash.create_pwd_hash(rec.pwd),
        status: "active",
        last_login: new Date(),
        last_bad_login: new Date(),
        bad_login_cnt: 0,
        type: rec.type
    };
    rec.pwd = null;
    db.new_user(rec2, function (err, data) {
        var h = {
            node: null,
            user: rec2.username,
            status: rec2.status,
            code: "user_change",
            ts: new Date(),
            title: "User '" + rec2.full_name + "' created",
            description: "User '" + rec2.full_name + "' (" + rec2.username + ") was created",
            sys_data: rec
        };
        db.new_history(h, callback);
        load_username_map();
    });
};

exports.update_user = function (req, callback) {
    var rec = req.data;
    var rec2 = { full_name: "", status: "", type: "" };
    xutil.override_members(rec, rec2, false);
    xutil.remove_empty_members(rec2);    
    db.get_user(rec.username, function (err, data) {
        if (err) return callback(err);
        var changes = [];
        for (var i in rec2) {
            changes.push("" + i + " [" + data[i] + " -> " + rec2[i] + "]");
        }
        db.update_user(rec.username, rec2, function (err, data2) {
            var h = {
                node: null,
                user: rec.username,
                status: rec2.status,
                code: "user_change",
                ts: new Date(),
                title: "User '" + data.full_name + "' updated",
                description: "User '" + data.full_name + "' (" + rec.username + ") was updated - " + changes.join(", "),
                sys_data: rec
            };
            db.new_history(h, callback);
            load_username_map();
        });
    });
};

exports.delete_user = function (req, callback) {
    var username = req.data.username;
    db.get_user(username, function (err, data) {
        if (err) return callback(err);
        db.delete_user(username, function (err, data2) {
            var user_full_name = username_map[req.session.user].full_name;
            var h = {
                node: null,
                user: username,
                status: "deleted",
                code: "user_change",
                ts: new Date(),
                title: "User '" + data.full_name + "' deleted",
                description: "User '" + data.full_name + "' (" + username + ") was deleted by " + user_full_name,
                sys_data: req
            };
            db.new_history(h, callback);
            load_username_map();
        });
    });
};

//////////////////////////////////////////////////////////////////

exports.add_node = function (req, callback) {
    db.get_max_node_id(function (err, max_id) {
        if (err) return callback(err);
        
		var rec = req.data;
		rec.id = Number(max_id) + 1;
		db.add_node(req.data, function (err2, data2) {
			if (err2) return callback(err2);
			var h = {
				node: rec.id,
				cluster: rec.cluster,
				user: req.session.user,
				status: rec.status,
				code: "node_change",
				ts: new Date(),
				title: "Node '" + rec.name + "' (" + rec.id + ") created",
				description: "Node '" + rec.name + "' (" + rec.id + ") was successfully created.",
				sys_data: rec
			};

			db.new_history(h, function (err) {
				if (err) return callback(err);
				callback(null, { id: rec.id });
			});
			if (notify_after_node_change) {
				notify_after_node_change(rec.id);
			}
			load_node_map();
		});
    });
};

exports.get_last_node = function (req, callback) {
    db.get_max_node_id(function (err, data) {
        db.get_node(data, callback);
    });
}

exports.get_nodes = function (req, callback) {
    db.get_nodes(req.data, function (err, data) {
        if (err) return callback(err);
        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            if (cluster_map[obj.cluster])
                obj.cluster_name = cluster_map[obj.cluster].name;
        }
        callback(err, data);
    });
};

exports.get_nodes2 = function (req, callback) {
    var query = {};
    var where = [];
    //if (req.data.id && req.data.id.length > 0) {
    //    if (req.data.id[0] == "*") {
    //        var s = "/" + req.data.id.substr(1) + "/.test(this.id)";
    //        where.push(s);
    //    } else {
    //        query.id = Number(req.data.id);
    //    }
    //}
    create_regexp2(req.data, query, where, "id");
    if (query.id) query.id = Number(query.id);

    if (req.data.name) query.name = create_regexp(req.data.name);
    if (req.data.scope) query.scope = create_regexp(req.data.scope);
    if (req.data.project) query.project = create_regexp(req.data.project);
    if (req.data.setup) query.setup = req.data.setup;
    if (req.data.box_label) query.box_label = create_regexp(req.data.box_label);
    if (req.data.cluster) query.cluster = req.data.cluster;
    if (req.data.status) query.status = req.data.status;
    create_regexp2(req.data, query, where, "network_addr");
    create_regexp2(req.data, query, where, "mac");
    if (req.data.firmware) query.firmware = req.data.firmware;
    if (req.data.bootloader) query.bootloader = req.data.bootloader;
    if (req.data.comment) query.user_comment = create_regexp(req.data.comment);

    if (where.length > 0) {
        query["$where"] = where.join(" && ");
    }
    console.log("#", query);

    var page_size = page_size_global;
    req.data.page = req.data.page || 0;
    var skip = page_size * req.data.page;

    db.get_nodes2(query, skip, page_size, function (err, data) {
        if (err) return callback(err);
        for (var i = 0; i < data.length; i++) {
            var obj = data[i];
            if (cluster_map[obj.cluster])
                obj.cluster_name = cluster_map[obj.cluster].name;
        }
        db.get_nodes2_count(query, function (err2, data2) {
            if (err2) callback(err2);
            var res = {
                records: data,
                count: data2,
                page_size: page_size,
                start_index: skip,
                end_index: skip + data.length
            };
            callback(null, res);
        });
    });
};

exports.get_node = function (req, callback) {
    db.get_node(Number(req.data.id), function (err, data) {
        if (err) return callback(err);
        if (cluster_map[data.cluster])
            data.cluster_name = cluster_map[data.cluster].name;
        callback(err, data);
    });
};

exports.check_component_for_multiple_nodes = function (req, callback) {
    var comp = req.data.component;
    var query = {
        "components": comp
    };
    db.get_nodes(query, function (err, nodes) {
        if (err) return callback(err);
        var res = [];
        nodes.forEach(function (item) {
            res.push({
                node_id: item.id,
                node_name: item.name,
                cluster: item.cluster,
                cluster_name: (cluster_map[item.cluster] ? cluster_map[item.cluster].name : "")
            });
        });
        callback(null, res);
    });
};

exports.get_nodes_with_same_components = function (req, callback) {
    var node_id = Number(req.data.node);
    db.get_node(node_id, function (err, data) {
        if (err) return callback(err);
        var comps = data.components;
        var res = [];
        var calls = [];
        data.components.forEach(function (comp) {
            var query_inner = {
                "id": { $ne: node_id },
                "components": comp
            };
            calls.push(function (callback2) {
                db.get_nodes(query_inner, function (err2, nodes) {
                    if (err2) {
                        res.push({ id: comp, other_nodes_cnt: 0 });
                    } else {
                        res.push({ id: comp, other_nodes_cnt: nodes.length });
                    }
                    callback2(null);
                });
            });
        });
        async.parallel(calls, function (err3, data3) {
            if (err3) return callback(err3);
            callback(null, res);
        });
    });
};

exports.get_node_history = function (req, callback) {
    db.get_node_history(req.data.id, function (err, data) {
        if (err) {
            callback(err);
        } else {
            data.forEach(function (item) {
                if (username_map[item.user]) {
                    item.user_full_name = username_map[item.user].full_name;
                } else {
                    item.user_full_name = item.user;
                }
            });
            callback(null, data);
        }
    });
};

exports.update_node = function (req, callback) {
    var rec = req.data;
    db.get_node(rec.id, function (err, data) {
        var rec2 = xutil.get_diff_fields(rec, data); // detect simple field changes        
        if (JSON.stringify(rec.components) == JSON.stringify(data.components)) { // components are trickier
            rec2.components = null;
        }
        rec2.sensors = null; // sensors are not updated via this function
        xutil.remove_empty_members(rec2);
        var changes = [];
        for (var i in rec2) {
            if (rec2[i] !== undefined && rec2[i] !== null) {
                changes.push("" + i + " [" + data[i] + " -> " + rec2[i] + "]");
                //changes.push("" + i + " = " + rec2[i]);
            }
        }

        if (changes.length > 0) {
            db.update_node(rec.id, rec2, function (err, data2) {
                if (err) return callback(err);
                var node_name = rec2.name || data.name;
                var h = {
                    node: rec.id,
                    cluster: data.cluster,
                    user: req.session.user,
                    status: rec2.status,
                    code: "node_change",
                    ts: new Date(),
                    title: "Node '" + node_name + "' (" + rec.id + ") updated",
                    description: "Node '" + node_name + "' (" + rec.id + ") was successfuly updated - " + changes.join(", "),
                    sys_data: rec
                };

                db.new_history(h, callback);
                if (notify_after_node_change) {
                    notify_after_node_change(rec.id);
                }
                load_node_map();
            });
        } else {
            // no changes, don't update the database needlessly
            callback();
        }
    });
};

exports.delete_node = function (req, callback) {
    if (!is_user_admin(req.session.user))
        return callback(error_not_admin(req.session.user));
    var node_id = Number(req.data.id);

    var node_name = "";
    var cluster = "";
    var user_full_name = username_map[req.session.user].full_name;

    if (node_map[node_id]) {
        var node_obj = node_map[node_id];
        node_name = node_obj.name;
        cluster = node_obj.cluster;
    }

    db.delete_node(node_id, function (err) {
        if (err) return callback(err);
        var h = {
            node: node_id,
            cluster: cluster,
            user: req.session.user,
            status: "deleted",
            code: "node_change",
            ts: new Date(),
            title: "Node '" + node_name + "' (" + node_id + ") deleted",
            description: "Node '" + node_name + "' (" + node_id + ") was successfuly deleted by " + user_full_name,
            sys_data: req
        };

        db.new_history(h, callback);
        if (notify_after_node_change) {
            notify_after_node_change(node_id);
        }
        load_node_map();
    });
}

//////////////////////////////////////////////////////////////////

exports.get_components = function (req, callback) {
    var query = req.data;
    if (query.product_number) query.product_number = create_regexp(query.product_number, true);
    db.get_components(query, callback);
};

exports.get_components2 = function (req, callback) {
    //console.log("#", req);
    var query = {};
    var where = [];
    if (req.data.type) query.type = req.data.type;
    //if (req.data.product_number) query.product_number = req.data.product_number;
    create_regexp2(req.data, query, where, "product_number");

    if (req.data.serial_number) query.serial_number = create_regexp(req.data.serial_number);
    if (req.data.production) query.production = create_regexp(req.data.production);
    if (req.data.series) query.series = create_regexp(req.data.series);
    if (req.data.project) query.project = create_regexp(req.data.project);
    if (req.data.status) query.status = req.data.status;
    if (req.data.comment) query.comment = create_regexp(req.data.comment);

    var page_size = page_size_global;
    req.data.page = req.data.page || 0;
    var skip = page_size * req.data.page;

    if (where.length > 0) {
        query["$where"] = where.join(" && ");
    }
    //console.log("#", query);

    db.get_components2(query, skip, page_size, function (err, data) {
        if (err) return callback(err);
        db.get_components2_count(query, function (err2, data2) {
            if (err2) callback(err2);
            var res = {
                records: data,
                count: data2,
                page_size: page_size,
                start_index: skip,
                end_index: skip + data.length
            };
            callback(null, res);
        });
    });
};



exports.get_component = function (req, callback) {
    db.get_component(req.data.id, function (err, data) {
        if (err) {
            callback(err);
        } else {
            var comp_data = data;
            var query_inner = {
                "components": req.data.id
            };
            db.get_nodes(query_inner, function (err, nodes) {
                if (err) {
                    callback(err);
                } else {
                    var tmp = [];
                    for (var i = 0; i < nodes.length; i++) {
                        var node = nodes[i];
                        tmp.push({
                            id: node.id,
                            name: node.name,
                            cluster: node.cluster,
                            cluster_name: (cluster_map[node.cluster] ? cluster_map[node.cluster].name : "")
                        });
                    }
                    comp_data.nodes = tmp;
                    callback(null, comp_data);
                }
            });
        };
    })
};

exports.get_component_history = function (req, callback) {
    db.get_component_history(req.data.id, callback)
};

exports.update_component = function (req, callback) {
    var rec = req.data;
    db.get_component(rec.id, function (err, data) {
        if (err) return callback(err);
        var rec2 = xutil.get_diff_fields(rec, data);
        //xutil.remove_empty_members(rec2);
        var changes = [];
        for (var i in rec2) {
            if (rec2[i] !== undefined && rec2[i] !== null) {
                //changes.push("" + i + " = " + rec2[i]);
                changes.push("" + i + " [" + data[i] + " -> " + rec2[i] + "]");
            }
        }
        var new_id = create_component_id(
            rec2.product_number || data.product_number,
            rec2.type || data.type,
            rec2.production || data.production,
            rec2.series || data.series,
            rec2.serial_number || data.serial_number);
        if (new_id != data.id) {
            rec2.id = new_id;
            changes.push("" + i + " [" + data.id + " -> " + rec2.id + "]");
        }
        console.log(rec);        console.log(data); console.log(rec2);

        db.update_component(rec.id, rec2, function (err2, data2) {
            if (err2) return callback(err2);
            var h = {
                component: rec.id,
                user: req.session.user,
                status: rec2.status,
                code: "component_change",
                ts: new Date(),
                title: "Component '" + rec.id + "' updated",
                description: "Component '" + rec.id + "' was updated - " + changes.join(", "),
                sys_data: rec
            };
            db.new_history(h, function (err3, data3) {
                if (err3) return callback(err3);

                // create another history record for new component id
                var h2 = {
                    component: rec2.id,
                    user: req.session.user,
                    status: rec2.status,
                    code: "component_change",
                    ts: new Date(),
                    title: "Component '" + rec2.id + "' updated",
                    description: "Component '" + rec2.id + "' was updated - " + changes.join(", "),
                    sys_data: rec
                };
                db.new_history(h2, function (err4, data4) {
                    callback(err4, { id: new_id });
                });
            });
        });
    });
};

exports.delete_component = function (req, callback) {
    var id = req.data.id;
    db.get_component(id, function (err, data) {
        if (err) return callback(err);
        db.delete_component(id, function (err, data2) {
            var user_full_name = username_map[req.session.user].full_name;
            var h = {
                component: id,
                user: req.session.user,
                status: "deleted",
                code: "component_change",
                ts: new Date(),
                title: "Component '" + id + "' deleted",
                description: "Component '" + id + "' was deleted by " + user_full_name,
                sys_data: req
            };
            db.new_history(h, callback);
        });
    });
};

function create_component_id(pn, type, p, s, sn) {
    return [pn, type, p, s, sn].join("-");
}
exports.add_components = function (req, callback) {
    var data = req.data;
    data.sn_to = Number(data.sn_to);
    data.sn_from = Number(data.sn_from);
    var sn_len = Math.max(("" + data.sn_to).length, 3);
    var ok_comps = [];
    var err_comps = [];
    var new_comp_count = data.sn_to - data.sn_from + 1;

    for (var i = data.sn_from; i <= data.sn_to; i++) {
        var sn = xutil.pad(i, sn_len);
        var new_id = create_component_id(data.pn, data.type, data.p, data.s, sn);
        var new_rec = {
            id: new_id,
            type: data.type,
            product_number: data.pn,
            production: data.p,
            series: data.s,
            serial_number: sn,
            status: "ok",
            project: "",
            comment: ""
        };
        db.add_component(new_rec, function (err, res) {
            if (err) {
                //console.log("#", err);
                err_comps.push({ id: new_id, err: err, msg: "" + new_id + ". " + err });
            } else {
                //console.log("#", "ok");
                ok_comps.push(new_id);
                var h = {
                    component: new_rec.id,
                    user: req.session.user,
                    status: new_rec.status,
                    code: "component_change",
                    ts: new Date(),
                    title: "Component '" + new_rec.id + "' created",
                    description: "Component '" + new_rec.id + "' was created.",
                    sys_data: new_rec
                };
                db.new_history(h, function (err, res) { });
            }
            if (new_comp_count == err_comps.length + ok_comps.length) {
                if (err_comps.length > 0) {
                    var err_msg = "Error(s) occured while generating new components. Error count = " + err_comps.length + ". First message = " + err_comps[0].msg;
                    callback(new Error(err_msg));
                } else {
                    callback(null, {});
                }
            }
        });
    }
};

//////////////////////////////////////////////////////////////////

exports.get_clusters = function (req, callback) {
    var query = {};
    if (req.data.id && req.data.id.length > 0) {
        if (req.data.id[0] == "*") {
            var s = "/" + req.data.id.substr(1) + "/.test(this.id)";
            query["$where"] = s;
        } else {
            query.id = req.data.id;
        }
    }
    if (req.data.tag) query.tag = create_regexp(req.data.tag);
    if (req.data.name) query.name = create_regexp(req.data.name);
    if (req.data.type) query.type = req.data.type;

    db.get_clusters(query, callback);
};

exports.get_cluster = function (req, callback) {
    db.get_cluster(req.data.id, callback)
};

exports.update_cluster = function (req, callback) {
    var rec = req.data;
    db.get_cluster(rec.orig_id, function (err, data) {
        if (err) return callback(err);
        //console.log("#", rec, data);

        var rec2 = xutil.get_diff_fields(rec, data);
        //xutil.remove_empty_members(rec2);
        var changes = [];
        for (var i in rec2) {
            if (rec2[i] !== undefined && rec2[i] !== null || data[i] !== undefined && data[i] !== null) {
                changes.push("" + i + " [" + data[i] + " -> " + rec2[i] + "]");
            }
        }
        //console.log("##", rec2);
        db.update_cluster(rec.orig_id, rec2, function (xerr) {
            //console.log("###", xerr);
            if (xerr) return callback(xerr);

            load_cluster_map();
            var cluster_name = rec2.name || data.name;
            var h = {
                cluster: rec.orig_id,
                user: req.session.user,
                status: "",
                code: "cluster_update",
                ts: new Date(),
                title: "Cluster '" + cluster_name + "' (" + rec.orig_id + ") was updated",
                description: "Cluster '" + cluster_name + "' (" + rec.orig_id + ") was updated - " + changes.join(", "),
                sys_data: {}
            };
            exports.new_history(h, callback);
            load_cluster_map();
        });

    });
};

exports.delete_cluster = function (req, callback) {
    var id = req.data.id;
    db.get_cluster(id, function (err, data) {
        if (err) return callback(err);
        db.get_nodes({ cluster: id }, function (err2, data2) {
            if (err2) return callback(err);
            if (data2.length > 0) return callback(new Error("Cannot delete cluster - nodes are assigned to it."));
            db.delete_cluster(id, function (xerr) {
                if (xerr) return callback(xerr);
                var user_full_name = username_map[req.session.user].full_name;
                var cluster_name = data.name;
                var h = {
                    cluster: id,
                    user: req.session.user,
                    status: "deleted",
                    code: "cluster_delete",
                    ts: new Date(),
                    title: "Cluster '" + cluster_name + "' (" + id + ") was deleted",
                    description: "Cluster '" + cluster_name + "' (" + id + ") was deleted by " + user_full_name,
                    sys_data: req
                };
                exports.new_history(h, callback);
                load_cluster_map();
            });
        });
    });
};

exports.add_cluster = function (req, callback) {
    if (req.data.type == "zigbee" && (!req.data.tag || req.data.tag == "")) return callback(new Error("Tag of new cluster cannot be empty"));
    if (!req.data.name) return callback(new Error("Name of new cluster cannot be empty"));

    // generate unique id for cluster, using cluster cache
    var id = 1;
    while (id < 10000) {
        var found = false;
        var xid = id + "";
        for (var prop in cluster_map) {
            var cl = cluster_map[prop];
            if (cl.id == xid) {
                found = true;
                break;
            }
        }
        if (!found) break;
        id++;
    }
    req.data.id = id + "";

    db.add_cluster(req.data, function (err) {
        if (err) return callback(err);
		
        load_cluster_map();

        var h = {
            cluster: req.data.id,
            user: req.session.user,
            status: "",
            code: "cluster_add",
            ts: new Date(),
            title: "Cluster '" + req.data.name + "' (" + req.data.id + ") was created",
            description: "Cluster '" + req.data.name + "' (" + req.data.id + ") was created",
            sys_data: {}
        };

        exports.new_history(h, function (err2) {
            if (err2) return callback(err2);

            if (req.data.type != "zigbee") return callback(null, h);

            // for zigbee cluster already define first node with network address 0
            var zero_node = {
                name: "Gateway node",
                status: "unknown",
                cluster: req.data.id,
                loc_lon: 0,
                loc_lat: 0,
                sn: "",
                mac: 0,
                network_addr: 0,
                network_addr2: 0,
                firmware: "",
                bootloader: "",
                setup: "",
                role: "gateway",
                scope: "",
                project: "",
                location: "",
                user_comment: "",
                box_label: "",
                components: [],
                sensors: []
            };
            exports.add_node({ data: zero_node, session: req.session }, callback);
        });
    });
};

exports.get_cluster_history = function (req, callback) {
    db.get_cluster_history(req.data.id, callback);
};


exports.mark_cluster_scan = function (cluster_id, callback) {
    rec = { last_scan: new Date() };
    db.update_cluster(cluster_id, rec, function (err) {
        var cluster_str = "'" + (cluster_map[cluster_id] ? cluster_map[cluster_id].name : "") + "' (" + cluster_id + ")";
        var h = {
            cluster: cluster_id,
            user: "system",
            status: "",
            code: "cluster_scan",
            ts: new Date(),
            title: "Cluster " + cluster_str + " scanned",
            description: "Cluster " + cluster_str + " was successfully scanned",
            sys_data: {}
        };
        exports.new_history(h, callback);
    });
}


exports.mark_node_scan = function (node_id, cluster_id, callback) {
    //console.log("mark_node_scan", node_id, cluster_id);
    var rec = { last_scan: new Date() };
    db.update_node(node_id, rec, function (err) {
        //console.log("mark_node_scan#2", err);
        if (err) return callback(err);
        var node_name = (node_map[node_id] ? node_map[node_id].name : node_id);
        var cluster_name = (cluster_map[cluster_id] ? cluster_map[cluster_id].name : cluster_id);
        var node_str =
            "'" + node_name + "' (" + node_id + ")" +
            " from cluster '" + cluster_name + "' (" + cluster_id + ")";
        var h = {
            node: node_id,
            cluster: cluster_id,
            user: "system",
            status: "",
            code: "node_scan",
            ts: new Date(),
            title: "Node " + node_str + " scanned",
            description: "Node " + node_str + " was successfully scanned",
            sys_data: {}
        };
        exports.new_history(h, callback);
    });
}

///////////////////

exports.get_sensors_for_node = function (req, callback) {
    db.get_sensors_for_node(req.data.node, callback)
};
exports.get_sensor_history = function (req, callback) {
    db.get_sensor_history(req.data.node, req.data.id, callback)
};

exports.update_sensors_for_node = function (req, callback) {
    db.update_sensors_for_node(req.data.node_id, req.data.sensors, function (err, data2) {
        if (err) return callback(err);
        var h = {
            node: req.data.node_id,
            cluster: req.data.cluster,
            user: req.session.user,
            status: "",
            code: "sensors_change",
            ts: new Date(),
            title: "Sensors updated",
            description: "Node " + req.data.node_id + " was updated - sensors were changed",
            sys_data: req.data.sensors
        };

        db.new_history(h, callback);
    });
}

exports.new_history = function (rec, callback) {
    db.new_history(rec, callback);
}

exports.add_sensor_measurement = function (rec, callback) {
    db.add_sensor_measurement(rec, function (err) {
        if (err) return callback(err);
        if (notify_after_sensor_scan) {
            notify_after_sensor_scan(rec);
        }
        callback();
    });
}

////////////////////////

exports.get_users = function (req, callback) {
    db.get_users(req.data.id, callback);
};
exports.get_user = function (req, callback) {
    db.get_user(req.data.username, callback);
};
exports.get_user_history = function (req, callback) {
    db.get_user_history(req.data.username, callback);
};
exports.get_logins = function (req, callback) {
    db.get_logins(req.data.username, callback);
};

//////////////////////

exports.get_node_stats = function (req, callback) {
    db.get_node_stats(callback);
};
exports.get_sensor_stats = function (req, callback) {
    db.get_sensor_stats(callback);
};
exports.get_user_stats = function (req, callback) {
    db.get_user_stats(callback);
};

//////////////////////

exports.get_history = function (req, callback) {
    var query = {};
    var page_size = page_size_global;

    req.data.page = req.data.page || 0;
    var skip = page_size * req.data.page;

    if (req.data.node) query.node = req.data.node;
    if (req.data.component) query.component = req.data.component;
    if (req.data.user) query.user = req.data.user;
    if (req.data.cluster) query.cluster = req.data.cluster;
    if (req.data.keywords) query.description = create_regexp(req.data.keywords, true);

    if (req.data.ts_from || req.data.ts_to) {
        query.ts = {};
        if (req.data.ts_from) {
            query.ts.$gte = new Date(req.data.ts_from);
        }
        if (req.data.ts_to) {
            query.ts.$lte = new Date(req.data.ts_to);
        }
    }
    db.get_history(query, skip, page_size, function (err, data) {
        if (err) callback(err);
        data.forEach(function (item) {
            if (item.cluster && cluster_map[item.cluster])
                item.cluster_name = cluster_map[item.cluster].name;
        });

        db.get_history_count(query, function (err2, data2) {
            if (err2) callback(err2);
            var res = {
                records: data,
                count: data2,
                page_size: page_size,
                start_index: skip,
                end_index: skip + data.length
            };
            callback(null, res);
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////

exports.rest_nodeInfo = function (node_id, callback) {
    db.get_node(node_id, function (err, data) {
        if (err) return callback(err);
        var res = {
            id: data.id,
            name: data.name,
            cluster: data.cluster,
            status: data.status,
            long: data.loc_lon,
            lat: data.loc_lat
        };
        callback(null, res);
    });
}

exports.rest_nodeData = function (node_id, callback) {
    db.get_node(node_id, function (err, data) {
        if (err) return callback(err);
        var res = {
            id: data.id,
            name: data.name,
            cluster: data.cluster,
            status: data.status,
            long: data.loc_lon,
            lat: data.loc_lat,
            role: data.role,
            scope: data.scope,
            project: data.project,
            user_comment: data.user_comment,
            network_address: data.network_address,
            network_address2: data.network_address2,
            mac: data.mac,
            serial_number: data.serial_number,
            firmware: data.firmware,
            bootloader: data.bootloader,
            setup: data.setup,
            box_label: data.box_label,
            components: data.components
        };
        callback(null, res);
    });
}

exports.rest_sensorInfo = function (node_id, callback) {
    db.get_node(node_id, function (err, data) {
        if (err) return callback(err);
        var res_array = [];
        data.sensors.forEach(function (item) {
            res_array.push({
                id: item.id,
                type: item.type,
                name: item.name,
                description: item.description
            })
        });
        var res = { sensors: res_array };
        callback(null, res);
    });
}

exports.rest_sensorData = function (node_id, sensor_id, callback) {
    db.get_sensor_history(node_id, sensor_id, function (err, data) {
        if (err) return callback(err);
        if (data.length === 0) return callback(null, {});
        var datax = data[0];
        var res = {
            node_id: node_id,
            sensor_id: sensor_id,
            measurement: datax.value,
            ts: datax.ts
        };
        callback(null, res);
    });
}

exports.rest = function (req, callback) {
    if (req.v && req.node && req.$data === "connection") {
        xutil.xcall(db.get_node, Number(req.node), callback, function (data1) {
            xutil.xcall(db.get_cluster, data1.cluster, callback, function (data2) {
                var res = {
                    id: data1.id,
                    network_address: data1.network_addr,
                    connection: data2.type
                };
                if (data2.url && data2.url !== "") {
                    res.cluster_id = data2.id;
                    res.communicator_url = data2.url;
                }
                callback(null, res);
            });
        });
    } else if (req.$data === "nodeIds") {
        db.get_node_ids(function (err, data) {
            if (err) return callback(err);
            var res = { ids: data };
            callback(null, res);
        });
    } else if (req.nodeInfo) {
        exports.rest_nodeInfo(parseInt(req.nodeInfo), callback);
    } else if (req.nodeData) {
        exports.rest_nodeData(parseInt(req.nodeData), callback);
    } else if (req.sensorInfo) {
        exports.rest_sensorInfo(parseInt(req.sensorInfo), callback);
    } else if (req.sensorData && req.sensor) {
        exports.rest_sensorData(parseInt(req.sensorData), req.sensor, callback);
    } else {
        callback(new Error("Unsupported REST request: " + req.$url));
    }
};

/////////////////////////////////////////////

exports.archive = function (callback) {
    db.archive(callback);
}