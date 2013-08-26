// HTTP server for SMS

var express = require('express');
var util = require('util');
var xutil = require('./xutil');
var consts_str = "Carvic.Consts = " + JSON.stringify(require('./enums').get_enums()); // "pre-compiled" constants
var fs = require('fs');
var path = require('path');
var MongoStore = require('connect-mongo')(express);

///////////////////////////////////////////////////////////////////////////
// Module variables

var port = 3000;
var bl = null;
var db_url = null;
var db_syncer = null;
var scan_coordinator = null;

// cached pages

var help_content = null;
var login_content = null;
var root_content = null;

// optional middleware handlers
var body_parser = express.bodyParser();
var json_parser = express.json();
var basic_auth = express.basicAuth(function (user, pass, callback) {
    bl.verify_user(user, pass, callback);
});

var static_file_handler2 = function (req, res, next) {
    var s = req.url.split("?");
    var fn = __dirname + '/client' + s[0];

    var ext = path.extname(s[0]).toLowerCase();
    if (ext === ".html") {
        if (!req.session.is_authenticated) {
            return res.redirect("/login");
        }
    }
    if (fs.existsSync(fn)) {
        return res.sendfile(fn);
    }
    next();
}

////////////////////////////////////////////////////////////////////////////

function log_url(req, res, next) {
    console.log("[url]", req.url, req.method, (req.session ? req.session.is_authenticated : "unknown"));
    next();
};

function preprocess_api_calls(req, res, next) {
    if (req.url.indexOf("/api/") == 0) {
        // rest-like url parser
        var tmp_url = req.url.substr(4);
        req.body = xutil.parse_rest_request(tmp_url);
        req.body.action = "rest";

        // perform HTTP authentication
        basic_auth(req, res, function (err) {
            //console.log("#1", err);
            if (err) return next(err);
            //console.log("#2", req.remoteUser);
            req.session.is_authenticated = true;
            req.session.user = req.remoteUser;
            next();
        });
    } else if (req.url === "/handler" || req.url.indexOf("/handler?") === 0) {
        json_parser(req, res, next);
    } else {
        body_parser(req, res, next);
    }
};

//function handle_login(req, res, next) {
//    if (req.url !== "/login") return next();
//    
//    if (req.method.toLowerCase() == 'post') {
//        //passport.authenticate('local', { failureRedirect: '/login', failureFlash: true })
//        //function(req, res) {    res.redirect('/');  })
//        var form = new formidable.IncomingForm();
//        form.parse(req, function (err, fields, files) {
//            //res.writeHead(200, { 'content-type': 'text/plain' });
//            //res.write('received upload:\n\n');
//            //res.end(util.inspect({ fields: fields, files: files }));
//            console.log("1");
//            var rr = passport.authenticate('local', { failureRedirect: '/login', failureFlash: true });
//            console.log("2", rr.toString());
//            res.redirect('/admin.html');
//        });
//    } else if (login_content) {
//        res.setHeader("Content-Type", "text/html");
//        res.end(login_content);
//    } else {
//        res.statusCode = 404;
//        res.write('404 sorry not found');
//        res.end();
//    }
//}

//function handle_logout(req, res, next) {
//    if (req.url !== "/logout") return next();
//    req.logout();
//    res.redirect('/');
//}

//function handle_help(req, res, next) {
//    if (req.url == "/help" || req.url.indexOf("/help?") == 0) {
//        res.setHeader("Content-Type", "text/html");
//        res.end(help_content);
//    } else {
//        next();
//    }
//}

function ensure_authenticated(req, res, next) {
    if (req.session.is_authenticated) { return next(); }
    res.redirect('/login');
}

function main_handler(req, res, next) {
    if (!req.body) return next(new Error("Unknown request body"));

    //console.log(req.body);
    var cmd = req.body;
    if (!cmd.action) return next(new Error("Unknown request - missing action"));

    cmd.session = { // attach user stuff 
        user: req.session.user,
        ip: req.connection.remoteAddress
    };

    bl.new_login(cmd.session.user, cmd.session.ip, function (err) {
        if (err) return next(err);

        var action = cmd.action;
        if (action == "scan") {
            if (cmd.data && cmd.data.id) {
                scan_coordinator.scan(db_syncer, cmd.data.id, function () { });
            } else {
                scan_coordinator.scan(db_syncer, null, function () { });
            }
            res.end("{}"); // return immidiatelly
        } else if (bl[action]) {
            // requests that map directly to exported function on BL are called here
            bl[action](cmd, function (err, result) {
                if (err) {
                    var error_msg = err.message || err.err;
                    var res_str = JSON.stringify({ error: { message: error_msg} }, null, "    ");
                    //console.log(res_str);
                    res.end(res_str);
                    //res.end(JSON.stringify({ error: {message:error_msg} }, null, "    "));
                } else {
                    var res_str = JSON.stringify(result, null, "    ");
                    //console.log(res_str);
                    res.end(res_str);
                }
            });
        } else {
            next(new Error("Unknown action"));
        }
    });
}

// main HTTP server function
function run() {

    console.log("Running HTTP server at port " + port);
    var app = express();
    app.configure(function () {
        app.use(express.favicon("client/img/favicon.ico"));
        app.use(express.logger('dev'));
        app.use(express.cookieParser());
        //app.use(express.session({ secret: 'jcvsnasdovhjdsfanbdwkjv' }));
        app.use(express.session({ secret: 'jcvsnasdovhjdsfanbdwkjv', store: new MongoStore({ db: db_url }) }));
        app.use(log_url);
        app.use(static_file_handler2);
        app.use(preprocess_api_calls);
        app.use(app.router);
    });

    // routes 

    app.get('/', function (req, res) {
        res.setHeader("Content-Type", "text/html");
        res.end(root_content);
    });

    app.get('/consts.js', function (req, res) {
        res.setHeader("Content-Type", "application/javascript");
        res.end(consts_str);
    });

    app.get('/login', function (req, res) {
        res.setHeader("Content-Type", "text/html");
        res.end(login_content);
    });

    app.post('/login', function (req, res, next) {
        bl.verify_user(req.body.username, req.body.password, function (err, user) {
            if (err) {
                bl.get_user({ data: { username: req.body.username} }, function (err, data) {
                    var msg = "";
                    if (err) {
                        msg = "Login failed";
                    } else {
                        msg = "User cannot login - wrong password or user inactive.";
                    }
                    res.redirect('/login?msg=' + encodeURI(msg));
                });
            } else {
                req.session.is_authenticated = true
                req.session.user = user;
                res.redirect('/admin.html');
            }
        });
    });

    app.get('/logout', function (req, res) {
        req.session.destroy();
        res.redirect('/login');
    });

    app.get('/help', function (req, res) {
        res.setHeader("Content-Type", "text/html");
        res.end(help_content);
    });

    app.post('/handler', ensure_authenticated, main_handler);
    app.get('/api/*', main_handler);
    //app.post('/api/*', main_handler);

    // ok, start the server

    app.listen(port);
}

///////////////////////////////////////////////////////////////////////////////////

function init(options, callback) {
    bl = options.bl;
    if (options.web.port) {
        port = options.web.port;
    }
    if (options.database && options.database.url) {
        db_url = options.database.url;
    }
    scan_coordinator = options.scan_coordinator;
    db_syncer = options.db_syncer;

    //prepare help file
    console.log("Caching help file...");
    var md_content = fs.readFileSync("./docs/docs.md") + "";
    var html_frame = fs.readFileSync("./client/help.htmlx") + "";
    var md_parser = require("marked");
    help_content = html_frame.replace("${main_content}", md_parser(md_content));

    // prepare login file
    console.log("Caching login page...");
    login_content = fs.readFileSync("./client/login.html");

    // prepare root file
    console.log("Caching root page...");
    root_content = fs.readFileSync("./client/index.html");

    callback();
}

//////////////////////////////////////////////////////////////////

exports.init = init;
exports.run = run;