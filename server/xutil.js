
function parse_connection_string(src) {
    var res = {};
    if (!src) return res;
    if (typeof src !== "string") return res;
    src = src.trim();
    var sets = src.split(";");
    sets.forEach(function (item) {
        var i = item.indexOf("=");
        if (i > 0) {
            var s1 = item.substring(0, i);
            var s2 = item.substring(i + 1);
            if (s2.substring(0, 1) === "\"" && s2.substring(s2.length - 1) === "\"") {
                s2 = s2.substring(1, s2.length - 1);
            }
            res[s1] = s2;
        }
    });
    return res;
}

////////////////////////////////////////////////////////////////////////////////////

function pack_array(arr) {
    return arr.filter(function (val) { return (val != null); });
};

function check_match(rec, query) {
    var ok = true;
    for (var f in query) {
        if (rec[f] != query[f]) {
            ok = false;
            break;
        }
    }
    return ok;
};

function override_members(source, destination, inject_if_missing) {
    if (inject_if_missing === null) {
        inject_if_missing = false;
    }
    if (inject_if_missing) {
        var fields = Object.getOwnPropertyNames(source);
        for (var i in fields) {
            var f = fields[i];
            destination[f] = source[f];
        }
    } else {
        var fields = Object.getOwnPropertyNames(destination);
        for (var i in fields) {
            var f = fields[i];
            if (source[f] !== undefined) {
                destination[f] = source[f];
            }
        }
    }
    return destination;
}

function is_null_or_empty(x) {
    return (x === null || x === undefined);
}
function get_diff_fields(new_rec, old_rec) {
    var res = {};
    var fields = Object.getOwnPropertyNames(old_rec);
    var fields_new = Object.getOwnPropertyNames(new_rec);
    for (var i in fields) {
        var f = fields[i];
        var found = false;
        for (var j in fields_new) {
            found = found || (f == fields_new[j]);
        }
        if (!found) continue;
        
        var is_change = false;

        if (is_null_or_empty(old_rec[f])) {
            is_change = !is_null_or_empty(new_rec[f]);
        } else {
            if (is_null_or_empty(new_rec[f])) {
                is_change = true;
            } else {
                is_change = (new_rec[f] !== old_rec[f]);
            }   
        }
        if (is_change){
            res[f] = new_rec[f];
        }
    }
    return res;
}

function remove_empty_members(obj) {
    for (var i in obj) {
        if (obj[i] === "" || obj[i] === null || obj[i] === undefined)
            delete obj[i];
    };
    return obj;
}

// prefix int with leading zeros
function pad(num, size) {
    return ('0000000000000000000000000000' + num).substr(-size);
}

function create_map(array, id_member) {
    id_member = id_member || "code";
    var res = {};
    for (var i in array) {
        var obj = array[i];
        res[obj[id_member]] = obj;
    }
    return res;
}

function parse_rest_request(url) {
    var i1 = url.indexOf("?");
    var true_url = url;
    var resource = undefined;
    if (i1 > 0) {
        true_url = url.substr(0, i1);
        resource = url.substr(i1 + 1);
    }

    var parts = true_url.split("/");
    var result = {
        $url: url,
        $true_url: true_url,
        $resource: resource
    };
    var skip_first = (true_url.substr(0, 1) == "/");
    for (var i = (skip_first ? 1 : 0); i < parts.length; i = i + 2) {
        if (i == parts.length - 1) {
            result["$data"] = parts[i];
            result[parts[i]] = null;
        } else {
            var part1 = parts[i];
            var part2 = parts[i + 1];
            result[part1] = part2;
        }
    }

    return result;
}

function xcall(func, data, cb_err, cb_ok) {
    func(data, function (err, xdata) {
        if (err) return cb_err(err);
        cb_ok(xdata);
    });
}

////////////////////////////////////////////////////////////////////////

function remove_time(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function now() {
    return new Date();
}
function today() {
    return remove_time(remove_time.now());
}

function subtract_window(origin, offset) {
    var dd = origin.valueOf();
    var ofs = parse_window(offset);
    var res = new Date(dd - ofs);
    return res;
}

function add_window(origin, offset) {
    var dd = origin.valueOf();
    var ofs = parse_window(offset);
    var res = new Date(dd + ofs);
    return res;
}

function parse_window(window_def) {
    var strs = window_def.split(" ");
    var num = parseFloat(strs[0]);
    var unit = 0;
    switch (strs[1].toLowerCase()) {
        case "s": unit = 1000; break;
        case "m": unit = 60 * 1000; break;
        case "h": unit = 60 * 60 * 1000; break;
        case "d": unit = 24 * 60 * 60 * 1000; break;
        case "w": unit = 7 * 24 * 60 * 60 * 1000; break;
        default: throw new Error('Invalid input string: ' + window_def);
    };
    return num * unit;
}

function nextTick(func) {
    process.nextTick(func);
}

function ask(question, format, callback) {
 var stdin = process.stdin, stdout = process.stdout;
 
 stdin.resume();
 stdout.write(question + ": ");
 
 stdin.once('data', function(data) {
   data = data.toString().trim();
 
   if (format.test(data)) {
     callback(data);
   } else {
     stdout.write("It should match: "+ format +"\n");
     ask(question, format, callback);
   }
 });
}

/////////////////////////////////////////////////////////////

exports.parse_connection_string = parse_connection_string;
exports.xcall = xcall;
exports.pack_array = pack_array;
exports.check_match = check_match;
exports.override_members = override_members;
exports.remove_empty_members = remove_empty_members;
exports.get_diff_fields = get_diff_fields;
exports.pad = pad;
exports.create_map = create_map;
exports.parse_rest_request = parse_rest_request;

exports.remove_time = remove_time;
exports.now = now;
exports.today = today;
exports.subtract_window = subtract_window;
exports.add_window = add_window;
exports.nextTick = nextTick;
exports.parse_window = parse_window;

exports.ask = ask;

///////////////////////////////////////////////
// unit-test section

exports.unit_tests = function (test) {
    test.module("XUtil");

    test.test("parse_connection_string 1", function (test) {
        var s = "a=1;b=3";
        var res = parse_connection_string(s);
        test.equal(res.a, "1", "a");
        test.equal(res.b, "3", "b");
    });

    test.test("parse_connection_string 2", function (test) {
        var s = null;
        var res = parse_connection_string(s);
        test.equal(JSON.stringify(res), "{}", "res");
    });

    test.test("parse_connection_string 3", function (test) {
        var s = "a=1;ggg;b=3";
        var res = parse_connection_string(s);
        test.equal(res.a, "1", "a");
        test.equal(res.b, "3", "b");
        test.is_null(res.ggg, "ggg");
    });

    test.test("parse_connection_string 4", function (test) {
        var s = "a=1;v=\"nji\";b=3";
        var res = parse_connection_string(s);
        test.equal(res.a, "1", "a");
        test.equal(res.b, "3", "b");
        test.equal(res.v, "nji", "v");
    });


    test.test("parse_rest_request 1", function (test) {
        var s = "/v/1/node/67/connection?id=56";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "/v/1/node/67/connection", "$true_url");

        test.equal(res.$data, "connection", "$data");
        test.equal(res.$resource, "id=56", "$resource");
        test.equal(res.v, "1", "v");
        test.equal(res.node, "67", "node");
    });

    test.test("parse_rest_request 2", function (test) {
        var s = "v/1/node/67/connection?id=56";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "v/1/node/67/connection", "$true_url");

        test.equal(res.$data, "connection", "$data");
        test.equal(res.$resource, "id=56", "$resource");
        test.equal(res.v, "1", "v");
        test.equal(res.node, "67", "node");
    });

    test.test("parse_rest_request 3", function (test) {
        var s = "v/1/node/67?id=56";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "v/1/node/67", "$true_url");

        test.equal(res.$data, undefined, "$data");
        test.equal(res.$resource, "id=56", "$resource");
        test.equal(res.v, "1", "v");
        test.equal(res.node, "67", "node");
    });

    test.test("parse_rest_request 4", function (test) {
        var s = "v/1/node/67";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "v/1/node/67", "$true_url");

        test.equal(res.$data, undefined, "$data");
        test.equal(res.$resource, undefined, "$resource");
        test.equal(res.v, "1", "v");
        test.equal(res.node, "67", "node");
    });

    test.test("parse_rest_request 5", function (test) {
        var s = "/sensorInfo?nodeId=56";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "/sensorInfo", "$true_url");
        test.equal(res.$data, "sensorInfo", "$data");
        test.equal(res.$resource, "nodeId=56", "$resource");
        test.equal(res.sensorInfo, null, "sensorInfo");
    });

    test.test("parse_rest_request 6", function (test) {
        var s = "/sensorInfo/56";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "/sensorInfo/56", "$true_url");

        test.equal(res.$data, undefined, "$data");
        test.equal(res.$resource, undefined, "$resource");
        test.equal(res.sensorInfo, "56", "sensorInfo");
    });

    test.test("parse_rest_request 7", function (test) {
        var s = "/nodeIds";
        var res = parse_rest_request(s);

        test.equal(res.$url, s, "$url");
        test.equal(res.$true_url, "/nodeIds", "$true_url");

        test.equal(res.$data, "nodeIds", "$data");
        test.equal(res.$resource, undefined, "$resource");
        test.equal(res.nodeIds, null, "nodeIds");
    });

    /////////////////////////////////////////////

    test.test("Remove time", function (test) {
        var d1 = new Date(2012, 12, 21, 13, 45, 23);
        var d2 = new Date(2012, 12, 21, 0, 0, 0);
        var d3 = remove_time(d1);
        //console.log(d1);
        //console.log(d2);
        //console.log(d3);
        test.equal(d3, d2);
    });

    /////////////////////////////////////////////

    test.test("Parse day - simple", function (test) {
        test.equal(parse_window("1 d"), 24 * 60 * 60 * 1000);
    });
    test.test("Parse hour - simple", function (test) {
        test.equal(parse_window("1 h"), 60 * 60 * 1000);
    });
    test.test("Parse minute - simple", function (test) {
        test.equal(parse_window("1 m"), 60 * 1000);
    });
    test.test("Parse second - simple", function (test) {
        test.equal(parse_window("1 s"), 1000);
    });
    test.test("Parse week - simple", function (test) {
        test.equal(parse_window("1 w"), 7 * 24 * 60 * 60 * 1000);
    });

    /////////////////////////////////////////////

    test.test("Parse day - complex", function (test) {
        test.equal(parse_window("2 d"), 2 * 24 * 60 * 60 * 1000);
    });
    test.test("Parse hour - complex", function (test) {
        test.equal(parse_window("1.5 h"), 1.5 * 60 * 60 * 1000);
    });
    test.test("Parse minute - complex", function (test) {
        test.equal(parse_window("12 m"), 12 * 60 * 1000);
    });
    test.test("Parse second - complex", function (test) {
        test.equal(parse_window("34 s"), 34 * 1000);
    });
    test.test("Parse week - complex", function (test) {
        test.equal(parse_window("13.5 w"), 13.5 * 7 * 24 * 60 * 60 * 1000);
    });

    /////////////////////////////////////////////

    var origin = new Date("2012-04-01T15:45:53");

    test.test("Add offset - complex1", function (test) {
        var res = add_window(origin, "2 d");
        var target = new Date("2012-04-03T15:45:53");
        test.equal(res, target);
    });

    test.test("Add offset - complex2", function (test) {
        var res = add_window(origin, "2.5 d");
        var target = new Date("2012-04-04T03:45:53");
        test.equal(res, target);
    });

    test.done();
};

