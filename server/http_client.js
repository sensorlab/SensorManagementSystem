// functions for HTTP communication

var http = require('http');

////////////////////////////////////////////////////

function HttpClient() { };

HttpClient.prototype.get_data = function (url, callback) {
    var self = this;
    http.get(url, function (res) {
        var finished = false;
        var received_data = "";
        res.on('data', function (chunk) {
            if (finished)
                return;
            received_data += chunk;
            finished = true;
            callback(null, received_data);
        });
    }).on('error', function (e) {
        callback(e);
    });
}

HttpClient.prototype.post_data = function (server, port, path, body, callback) {
    var self = this;

    var post_data = "";
    if (typeof body === "string") {
        post_data = body;
    } else if (typeof body === "object") {
        post_data = JSON.stringify(body);
    } else {
        callback(new Error("Body is not an object or a string"));
    }

    var post_options = {
        host: server,
        port: "" + port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            callback(null, chunk);
        });
        res.on('error', function (err) {
            callback(err);
        });
    });

    post_req.write(post_data);
    post_req.end();
}

////////////////////////////////////////////////////

exports.HttpClient = HttpClient;