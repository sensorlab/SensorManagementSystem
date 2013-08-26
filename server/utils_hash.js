// hashing utilities

var crypto = require('crypto');

function create_pwd_hash(p, algo) {
    if (!algo) {
        algo = "sha512";
    }
    var shasum = crypto.createHash(algo);
    shasum.update(p);
    return shasum.digest('hex');
}

///////////////////////////////////////////////

exports.create_pwd_hash = create_pwd_hash;