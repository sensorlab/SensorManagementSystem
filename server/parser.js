// parser for zigbee responses

function contains_any(s, substrings) {
    var res = false;
    substrings.forEach(function (item) {
        if (s.indexOf(item) > 0) {
            res = true;
        }
    });
    return res;
}

function detect_errors(s) {
    return contains_any(s, ["\r\nERROR", "\r\nCORRUPTED-DATA", "\r\nJUNK-INPUT"]);
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

////////////////////////////////////////////////


function parse_loc(s) {
    var i1 = s.indexOf(",");
    if (i1 >= 0) {
        var v1 = s.substring(0, i1);
        var v2 = s.substring(i1 + 1).replace("\r", "");

        if (!isNumber(v1) || !isNumber(v2))
            return null;

        var res = {};
        res.lat = Number(v1);
        res.lon = Number(v2);        
        return res;
    }
    return null;
}

function parse_list(s) {
    if (detect_errors(s)) {
        return null;
    }
    var res = [];
    var lines = s.split("\n");
    for (var i in lines) {
        var ss = lines[i];
        var val = ss.replace("\r", "");
        if (val !== "")
            res.push(val);
    }
    return res;
}

function parse_obj(s) {
    if (detect_errors(s)) {
        return null;
    }
    var res = {};
    var lines = s.split("\n");
    for (var i in lines) {
        var ss = lines[i].trim();
        var i1 = ss.indexOf(":");
        if (i1 >= 0) {
            var name = ss.substring(0, i1);
            var val = ss.substring(i1 + 1).replace("\r", "");
            if (name === "location") {
                val = parse_loc(val);
            }
            res[name] = val;
        }
    }
    return res;
}

function parse_neighbors(s) {
    if (detect_errors(s)) {
        return null;
    }
    var res = [];
    var lines = s.split("\n");
    var found_header_row = false;
    lines.forEach(function (item) {
        if (!found_header_row) {
            if (item.indexOf("|") > 0)
                found_header_row = true;
        } else {
            var cells = item.split("|");
            if (cells.length >= 4)
                res.push(cells[3].trim());
        }
    });
    return res;
}


///////////////////////////////////////////////

exports.parse_neighbors = parse_neighbors;
exports.parse_loc = parse_loc;
exports.parse_list = parse_list;
exports.parse_obj = parse_obj;

///////////////////////////////////////////////
// unit-test section

exports.unit_tests = function (test) {
    test.module("Parser");

    test.test("Parse neighbors 1", function (test) {
        var s = [
            "ZigBit got number of neighbors",
            "Number of neighbors: 1",
            "ZigBit got neighbor table",
            "Number |  Node role | Extended Address | Network Address | Relationship | Depth",
            "1 | 1 | 000000000000003F | 62 | 3 | 0",
            ""].join("\r\n");
        var res = parse_neighbors(s);
        test.equal(res.length, 1, "Length");
        test.equal(res[0], "62", "Value");
    });

    test.test("Parse neighbors 2", function (test) {
        var s = [
            "ZigBit got number of neighbors",
            "Number of neighbors: 1",
            "ZigBit got neighbor table",
            "Number |  Node role | Extended Address | Network Address | Relationship | Depth",
            "1 | 1 | 000000000000003F | 62 | 3 | 0",
            "1 | 2 | 000000000000013F | 63 | 2 | 0",
            ""].join("\r\n");
        var res = parse_neighbors(s);
        test.equal(res.length, 2, "Length");
        test.equal(res[0], "62", "Value1");
        test.equal(res[1], "63", "Value2");
    });

    test.test("Parse neighbors - error1", function (test) {
        var s = [
            "kr neki",
            "JUNK-INPUT",
            "",
            "OK\r\n"].join("\r\n");
        var res = parse_neighbors(s);
        test.equal(res, null, "obj");
    });

    test.test("Parse neighbors - error2", function (test) {
        var s = [
            "kr neki",
            "CORRUPTED-DATA",
            "",
            "OK\r\n"].join("\r\n");
        var res = parse_neighbors(s);
        test.equal(res, null, "obj");
    });

    /////////////////////

    test.test("Parse list 1", function (test) {
        var s = [
            "kr neki",
            "OK"].join("\r\n");
        var res = parse_list(s);
        test.equal(res.length, 2, "length");
        test.equal(res[0], "kr neki", "Value1");
        test.equal(res[1], "OK", "Value2");
    });
    test.test("Parse list - error", function (test) {
        var s = [
            "kr neki",
            "CORRUPTED-DATA",
            "OK"].join("\r\n");
        var res = parse_list(s);
        test.equal(res, null, "obj");
    });

    /////////////////////

    test.test("Parse object 1", function (test) {
        var s = [
            "kr neki",
            "OK"].join("\r\n");
        var res = parse_obj(s);
        test.equal(JSON.stringify(res), "{}", "obj");
    });

    test.test("Parse object 2", function (test) {
        var s = [
            "a:123",
            "b:abc",
            "kr neki",
            "OK"].join("\r\n");
        var res = parse_obj(s);
        test.equal(typeof (res), "object", "obj");
        test.equal(res.a, "123", "obj.a");
        test.equal(res.b, "abc", "obj.b");
    });

    test.test("Parse object 3", function (test) {
        var s = [
            "type:SHT21",
            " measured-phenomenon:temperature",
            " unit:degrees celsius",
            " description:temperature in N403"].join("\r\n");
        var res = parse_obj(s);
        test.equal(typeof (res), "object", "obj");
        test.equal(res.type, "SHT21", "obj.type");
        test.equal(res["measured-phenomenon"], "temperature", "obj.measured-phenomenon");
        test.equal(res.unit, "degrees celsius", "obj.unit");
        test.equal(res.description, "temperature in N403", "obj.description");
    });

    test.test("Parse object - error", function (test) {
        var s = [
            "kr neki",
            "CORRUPTED-DATA",
            "OK"].join("\r\n");
        var res = parse_obj(s);
        test.equal(res, null, "obj");
    });

    ///////////////////////

    test.test("Parse loc 1", function (test) {
        var s = "123,567";
        var res = parse_loc(s);
        test.equal(typeof (res), "object", "obj");
        test.equal(res.lon, 123, "obj.lon");
        test.equal(res.lat, 567, "obj.lat");
    });

    test.test("Parse loc 2", function (test) {
        var s = "123.987,567.321";
        var res = parse_loc(s);
        test.equal(typeof (res), "object", "obj");
        test.equal(res.lon, 123.987, "obj.lon");
        test.equal(res.lat, 567.321, "obj.lat");
    });

    test.test("Parse loc - error 1", function (test) {
        var s = "a";
        var res = parse_loc(s);
        test.equal(res, null, "obj");
    });

    test.test("Parse loc - error 2", function (test) {
        var s = "a,b";
        var res = parse_loc(s);
        test.equal(res, null, "obj");
    });

    test.done();
};

