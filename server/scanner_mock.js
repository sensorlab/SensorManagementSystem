var fs = require('fs');

//////////////////////////////////////////////////////////////////
// DEVELOPMENT/DEBUGGING ONLY
// the code in this file is used to skip real scan and just provide
// the data from the file.

function scan_cluster(cluster_data, callback) {    
    var in_file = __dirname + "/test_data/out_ijs_e6_coap.json";
    fs.readFile(in_file, function (err, data) {
        if (err) return callback(err);
        var data_obj = JSON.parse(data);
        callback(null, data_obj);
    });
}

////////////////////////////////////////////////////////////////

exports.scan_cluster = scan_cluster;