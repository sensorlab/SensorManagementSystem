
var console_consts = {
    black: '\u001b[30m',
    red: '\u001b[31m',    
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    cyan: '\u001b[36m',
    gray: '\u001b[37m',
    reset: '\u001b[0m'
}

var tester = {

    module: function (title) {
        console.log("-----------------------------------------------");
        console.log("Testing module " + title);
        console.log("-----------------------------------------------");
    },

    done: function () {

    },

    test: function (title, func) {
        console.log("Test " + title);
        try {
            func(tester);
        } catch (e) {
            console.error(console_consts.red + '******** error', e, console_consts.reset);
        }
    },

    is_null: function(what, msg){
        var res = (what === null || what == undefined);
        if (res) {
        } else {
            if (msg != null) {
                console.log(console_consts.red + "Test failed: " + msg + console_consts.reset);
            } else {
                console.log(console_consts.red + "Test failed." + console_consts.reset);
            }
        }
    },

    equal: function (actual, expected, msg) {
        var res = (actual === expected);
        if (actual instanceof Date)
            res = (actual.valueOf() === expected.valueOf());
        if (res) {
        } else {
            if (msg != null) {
                console.log(console_consts.red + "Test failed: " + msg + console_consts.reset);
            } else {
                console.log(console_consts.red + "Test failed." + console_consts.reset);
            }
        }
    },

    ok: function (cond, msg) {
        if (cond) {
        } else {
            if (msg != null) {
                console.log(console_consts.red + "Test failed: " + msg + console_consts.reset);
            } else {
                console.log(console_consts.red + "Test failed: " + console_consts.reset);
            }
        }
    }
}

exports.get_tester = function () { return tester; }