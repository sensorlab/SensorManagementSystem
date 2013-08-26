////////////////////////////////////////////////////////////////////

var Carvic = {}
var today = new Date();

Carvic.Model = {};

////////////////////////////////////////////////////////////////////


Carvic.Model.NodeSearchResult = ko.observableArray([]);

Carvic.Model.CurrentNode = ko.observable({
    ID: 44,
    Name: "Name " + 44,
    Status: ko.observable(44 % 4 == 0 ? "Unknown" : "Active"),
    Cluster: "Cluster " + (44 % 2),
    LON: 45 + 0.04343 * 44,
    LAT: 12 + 0.04343 * (44 % 4),
    Enabled: ko.observable(true)
});
//Carvic.Model.ShowCurrentNode = ko.observable(false);
Carvic.Model.ShowNodeUserHistory = ko.observable(true);


Carvic.Model.NodeSearchLON = ko.observable(0);
Carvic.Model.NodeSearchLAT = ko.observable(0);
Carvic.Model.NodeSearchName = ko.observable("");
Carvic.Model.NodeSearchId = ko.observable("");

////////////////////////////////////////////////////////////////////

Carvic.Model.UserList = ko.observableArray([]);
//Carvic.Model.ShowCurrentUser = ko.observable(false);
Carvic.Model.ShowCurrentUserLogins = ko.observable(false);
Carvic.Model.CurrentUser = ko.observable({
    ID: 99,
    Username: "username_" + 99,
    FullName: "User " + 99,
    Status: ko.observable(99 % 4 == 0 ? "Inactive" : (99 % 7 == 0 ? "Locked" : "Active")),
    Type: (99 % 6 == 0 ? "Admin" : "Normal"),
    LastLogin: (new Date()),
    LastBadLogin: (new Date()),
    BadLoginCount: (99 + 13 % 17 == 0 ? 2 : 0),
    LoginHistory: [],
    History: []
});

////////////////////////////////////////////////////////////////////

Carvic.Model.error = ko.observable("");
Carvic.Model.has_errors = ko.observable(false);

////////////////////////////////////////////////////////////////////

Carvic.Utils = {};

Carvic.Utils.FormatDate = function (d) {
    var curr_date = d.getDate();
    var curr_month = d.getMonth() + 1;
    var curr_year = d.getFullYear();
    return curr_date + "." + curr_month + "." + curr_year;
};
Carvic.Utils.FormatDateTime = function (d) {
    var curr_hour = d.getHours();
    var curr_minute = d.getMinutes();
    var curr_second = d.getSeconds();
    return Carvic.Utils.FormatDate(d) + " " + curr_hour + ":" + curr_minute + ":" + curr_second;
};

Carvic.Utils.FormatMoney = function (amt) {
    var decPlaces = 2;
    var thouSeparator = ".";
    var decSeparator = ",";
    var n = amt,
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
    decSeparator = decSeparator == undefined ? "." : decSeparator,
    thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
    sign = n < 0 ? "-" : "",
    i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};

Carvic.Utils.Post = function (obj, callback) {
    $.ajax({
        type: 'POST',
        url: '/',
        data: JSON.stringify(obj),
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            if (result.error == null) {
                var result_data = JSON.parse(result);
                callback(result_data);
            } else {
                Carvic.Model.error(result.error.message + "<br/>" + result.location);
                Carvic.Model.has_errors(true);
            }
        },
        dataType: "text",
        processData: false
    });
}

Carvic.Utils.GetUrlParam = function (name) {
    var searchChars = "[\\?&]" + name + "=([^&#]*)";
    var regularExp = new RegExp(searchChars);
    var searchResults = regularExp.exec(window.location.href);
    if (searchResults != null) return searchResults[1];
    return null;
}

/////////////////////////////////////////////////////////////////////

Carvic.Model.LoadUsers = function () {
    Carvic.Model.UserList().length = 0;

    for (var i = 0; i < 10; i++) {
        Carvic.Model.UserList.push({
            ID: i,
            Username: "username_" + i,
            FullName: "User " + i,
            Status: ko.observable(i % 4 == 0 ? "Inactive" : (i % 7 == 0 ? "Locked" : "Active")),
            Type: (i % 6 == 0 ? "Admin" : "Normal"),
            LastLogin: (new Date()),
            LastBadLogin: (new Date()),
            BadLoginCount: (i + 13 % 17 == 0 ? 2 : 0),
            LoginHistory: [
                { When: (new Date()), What: "Logged in from 138.232.1.34" },
                { When: (new Date()), What: "Logged in from 138.232.1.34" },
                { When: (new Date()), What: "Logged in from 138.232.1.34" }
            ],
            History: [
                { When: (new Date()), What: "Activated by admin1", Status: "info" },
                { When: (new Date()), What: "Edited", Status: "info" },
                { When: (new Date()), What: "Locked due to invalid password limit", Status: "warning" },
                { When: (new Date()), What: "Activated by admin2", Status: "info" }
            ]
        });
    }
}

Carvic.Model.ShowUserDetails = function (curr_user) {
    //alert("Redirecting to page for user " + curr_user.ID);
    window.location = "user.html?id=" + curr_user.ID;
    //Carvic.Model.CurrentUser(curr_user);
    //Carvic.Model.ShowCurrentUser(true);
}

/////////////////////////////////////////////////////////////////////////////////

Carvic.Model.LoadUser = function (id) {
    var i = id;
    Carvic.Model.CurrentUser({
        ID: i,
        Username: ko.observable("username_" + i),
        FullName: ko.observable("User " + i),
        Status: ko.observable(i % 4 == 0 ? "Inactive" : (i % 7 == 0 ? "Locked" : "Active")),
        Type: (i % 6 == 0 ? "Admin" : "Normal"),
        LastLogin: (new Date()),
        LastBadLogin: (new Date()),
        BadLoginCount: (i + 13 % 17 == 0 ? 2 : 0),
        LoginHistory: [
                { When: (new Date()), What: "Logged in from 138.232.1.34" },
                { When: (new Date()), What: "Logged in from 138.232.1.34" },
                { When: (new Date()), What: "Logged in from 138.232.1.34" }
            ],
        History: [
                { When: (new Date()), What: "Activated by admin1", Status: "info" },
                { When: (new Date()), What: "Edited", Status: "info" },
                { When: (new Date()), What: "Locked due to invalid password limit", Status: "warning" },
                { When: (new Date()), What: "Activated by admin2", Status: "info" }
            ]
    });

}


Carvic.Model.CloseUserDetails = function () {
    //Carvic.Model.ShowCurrentUser(false);
    //alert("redirect to user list");
    window.location = "users.html";
}
Carvic.Model.DisableUser = function () {
    Carvic.Model.CurrentUser().Status("Inactive");
}
Carvic.Model.EnableUser = function () {
    Carvic.Model.CurrentUser().Status("Active");
}
Carvic.Model.CurrentUserShowLogins = function () {
    Carvic.Model.ShowCurrentUserLogins(true);
}
Carvic.Model.CurrentUserShowChanges = function () {
    Carvic.Model.ShowCurrentUserLogins(false);
}

/////////////////////////////////////////////////////////////////////

Carvic.Model.SearchNodes = function () {
    Carvic.Model.NodeSearchResult().length = 0;

    for (var i = 0; i < 10; i++) {
        Carvic.Model.NodeSearchResult.push(ko.observable({
            ID: i,
            Name: "Name " + i,
            Status: ko.observable(i % 4 == 0 ? "Unknown" : "Active"),
            Cluster: "Cluster " + (i % 2),
            LON: 45 + 0.04343 * i,
            LAT: 12 + 0.04343 * (i % 4),
            Enabled: ko.observable(true)
        }));
    }
}

Carvic.Model.LoadNode = function (id) {
    var i = id;
    Carvic.Model.CurrentNode({
        ID: i,
        Name: ko.observable("Name " + i),
        Status: ko.observable(i % 4 == 0 ? "Unknown" : "Active"),
        Cluster: ko.observable("Cluster " + (i % 2)),
        LON: ko.observable(45 + 0.04343 * i),
        LAT: ko.observable(12 + 0.04343 * (i % 4)),
        Enabled: ko.observable(true)
    });
}

Carvic.Model.ShowNodeDetails = function (curr_node) {
    window.location = "node.html?id=" + curr_node.ID;
    //Carvic.Model.CurrentNode(curr_node);
    //Carvic.Model.ShowCurrentNode(true);
}
Carvic.Model.CloseNodeDetails = function () {
    window.location = "nodes.html";
    //Carvic.Model.ShowCurrentNode(false);
}
Carvic.Model.DisableNode = function () {
    Carvic.Model.CurrentNode().Enabled(false);
    Carvic.Model.CurrentNode().Status("Inactive");
}
Carvic.Model.EnableNode = function () {
    Carvic.Model.CurrentNode().Enabled(true);
    Carvic.Model.CurrentNode().Status("Not detected yet");
}

Carvic.Model.CurrentNodeShowHistory = function () {
    Carvic.Model.ShowNodeUserHistory(true);
}
Carvic.Model.CurrentNodeShowSensors = function () {
    Carvic.Model.ShowNodeUserHistory(false);
}





Carvic.Model.InsertNew = function () {
    var req = { action: "insert", for_insert: {} };

    var ds = Carvic.Model.pay_date();
    req.for_insert.y = parseInt(ds.substring(0, 4));
    req.for_insert.m = parseInt(ds.substring(5, 7));
    req.for_insert.d = parseInt(ds.substring(8, 10));
    req.for_insert.u = Carvic.Model.pay_user();
    req.for_insert.a = parseFloat(Carvic.Model.pay_amt());
    alert(JSON.stringify(req));

    Carvic.Utils.Post(req, function (result_data) {
        alert("Done");
        Carvic.Model.Refresh();
    });

}

Carvic.Model.CloseMonth = function () {
    Carvic.Utils.Post({ action: "retrieve" }, function (result_data) {
        alert("Done");
        Carvic.Model.Refresh();
    });
}

Carvic.Model.SendMails = function () {

}

Carvic.Model.Refresh = function () {
    //Carvic.Utils.Post({ action: "open" }, function (result_data) {
    //    Carvic.Model.OpenBal().length = 0;
    //    Carvic.Model.Users().length = 0;
    //    for (i in result_data) {
    //        var x = result_data[i];
    //        x.as = Carvic.Utils.FormatMoney(x.a);
    //        x.ufn = x.u;
    //        Carvic.Model.OpenBal.push(x);
    //        Carvic.Model.Users.push(x.u);
    //    };
    //});
}


/////////////////////////////////////////////////////////////////////

Carvic.Init = function () {
    Carvic.Model.Refresh();
    Carvic.Model.SearchNodes();
    Carvic.Model.LoadUsers();
}

Carvic.InitUserList = function () {
    Carvic.Model.LoadUsers();
}

Carvic.InitSingleUser = function () {
    var id = Carvic.Utils.GetUrlParam("id");
    if (id)
        Carvic.Model.LoadUser(id);
    else
        Carvic.Model.LoadUser(5);
}

Carvic.InitNodeList = function () {
    Carvic.Model.SearchNodes();
}

Carvic.InitSingleNode = function () {
    var id = Carvic.Utils.GetUrlParam("id");
    if (id)
        Carvic.Model.LoadNode(id);
    else
        Carvic.Model.LoadNode(5);
}
