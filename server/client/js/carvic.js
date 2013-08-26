////////////////////////////////////////////////////////////////////

var Carvic = {
    Model: {
        HasErrors: ko.observable(""),
        ErrorMsg: ko.observable("")
    }
};
var now = new Date();

////////////////////////////////////////////////////////////////////

Carvic.Model.StdData = function () {
    var self = this;
    self.Error = ko.observable("");
    self.HasErrors = ko.observable(false);
    self.CurrentUserFullname = ko.observable("");
    self.CurrentUsername = ko.observable("");
    self.CurrentUserTooltip = ko.computed(function () {
        return "Logged in: " + self.CurrentUserFullname() + " (" + self.CurrentUsername() + ")"; ateen
    }, self);
    self.CurrentUserType = ko.observable("normal");
    self.CurrentUserIsAdmin = ko.observable(false);
};

////////////////////////////////////////////////////////////////////

Carvic.Utils = {

    CheckIfEmpty: function (obj, err_msg, errors) {
        if (!obj || obj === "") {
            errors.push(err_msg);
        }
    },

    AddUsersLink: function () {
        if ($("#liUsers").length == 0)
            $("#ulNav").append('<li><a href="users.html"><i class="icon-group"></i> Users</a></li>');
    },

    LoadClusterList: function (receiver, callback) {
        var query = {};
        Carvic.Utils.Post({ action: "get_clusters", data: query }, function (data) {
            Carvic.Utils.ClusterLookupCache = []
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                receiver.push({ code: obj.id, title: obj.name });
                Carvic.Utils.ClusterLookupCache.push(obj.name);
            }
            if (callback) callback();
        });
    },

    LoadUserList: function (receiver) {
        var query = {};
        Carvic.Utils.Post({ action: "get_users", data: query }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                receiver.push({ code: obj.username, title: obj.full_name });
            }
        });
    },

    ConnectInputWithDesc: function (selector) {
        $(selector).on('focus', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $collapse = $this.next();
            $collapse.collapse('toggle');
        });
        $(selector).on('blur', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $collapse = $this.next();
            $collapse.collapse('toggle');
        });
    },

    ClusterLookupCache: null,
    ClusterLookup: function (s, callback) {
        if (Carvic.Utils.ClusterLookupCache != null) {
            callback(Carvic.Utils.ClusterLookupCache);
        } else {
            var req = {
                action: "cluster_list",
                data: {}
            };
            Carvic.Utils.Post(req, function (data) {
                Carvic.Utils.ClusterLookupCache = data;
                callback(Carvic.Utils.ClusterLookupCache);
            });
        }
    },

    ComponentLookup: function (s, callback) {
        var req = {
            action: "lookup_component",
            data: { search_str: s }
        };
        Carvic.Utils.Post(req, function (data) {
            callback(data);
        });
    },

    Logout: function () {
        var url = "" + document.location;
        document.location = "/logout";
    },

    SetCurrentUser: function (parent, callback) {
        parent.StdData = new Carvic.Model.StdData();
        var req = {
            action: "get_current_user",
            data: {}
        };
        Carvic.Utils.Post(req, function (data) {
            parent.StdData.CurrentUserFullname(data.full_name);
            parent.StdData.CurrentUsername(data.username);
            parent.StdData.CurrentUserType(data.type);
            parent.StdData.CurrentUserIsAdmin((data.type == "admin"));
            if (data.type == "admin") {
                Carvic.Utils.AddUsersLink();
            }
            if (callback)
                callback();
        });
    },

    ParseDate: function (s, default_value) {
        default_value = default_value || null;
        var parts = s.split(".");
        if (parts.length != 3)
            return default_value;
        var y = Number(parts[2]);
        var m = Number(parts[1]);
        var d = Number(parts[0]);
        if (y === NaN || m === NaN || d === NaN)
            return default_value;
        return new Date(y, m - 1, d);
    },

    GetDatePart: function (d) {
        var curr_date = d.getDate();
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();
        return new Date(curr_year, curr_month, curr_date);
    },

    FormatDate: function (d) {
        if (d === undefined || !d) return "";
        var curr_date = d.getDate();
        var curr_month = d.getMonth() + 1;
        var curr_year = d.getFullYear();
        return Carvic.Utils.Pad(curr_date, 2) + "." + Carvic.Utils.Pad(curr_month, 2) + "." + curr_year;
    },

    FormatDateTime: function (d) {
        if (d === undefined || !d) return "";
        var curr_hour = d.getHours();
        var curr_minute = d.getMinutes();
        var curr_second = d.getSeconds();
        return Carvic.Utils.FormatDate(d) + " " + curr_hour + ":" + Carvic.Utils.Pad(curr_minute, 2) + ":" + Carvic.Utils.Pad(curr_second, 2);
    },

    FormatDateTime2: function (d) {
        if (d === undefined || !d) return "";
        var curr_hour = d.getHours();
        var curr_minute = d.getMinutes();
        return Carvic.Utils.FormatDate(d) + " " + curr_hour + ":" + Carvic.Utils.Pad(curr_minute, 2);
    },

    FormatMoney: function (amt) {
        var decPlaces = 2;
        var thouSeparator = ".";
        var decSeparator = ",";
        var n = amt;
        var decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
        var decSeparator = decSeparator == undefined ? "." : decSeparator;
        var thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
        var sign = n < 0 ? "-" : "";
        var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
        var j = (j = i.length) > 3 ? j % 3 : 0;
        return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    },

    CreateMap: function (array, id_member) {
        var res = {};
        for (var i in array) {
            var obj = array[i];
            res[obj[id_member]] = obj;
        }
        return res;
    },

    CheckMatch: function (rec, query) {
        var ok = true;
        for (var f in query) {
            if (rec[f] !== query[f]) {
                ok = false;
                break;
            }
        }
        return ok;
    },

    GetMatches: function (query, array) {
        var res = [];
        for (var i in array) {
            var obj = array[i];
            if (Carvic.Utils.CheckMatch(obj, query)) {
                res.push(obj);
            }
        }
        return res;
    },

    Post: function (obj, callback, error_callback) {
        $.ajax({
            type: 'POST',
            url: '/handler',
            data: JSON.stringify(obj),
            contentType: "application/json; charset=utf-8",
            success: function (result) {
                var result_data = JSON.parse(result);
                if (result_data.error == null) {
                    Carvic.Model.HasErrors(false);
                    callback(result_data);
                } else {
                    Carvic.Model.ErrorMsg(result_data.error.message);
                    Carvic.Model.HasErrors(true);
                    if (error_callback) {
                        error_callback(Carvic.Model.ErrorMsg());
                    } else {
                        alert(Carvic.Model.ErrorMsg());
                    }
                }
            },
            error: function (obj, status, err) {
                Carvic.Model.HasErrors(true);
                Carvic.Model.ErrorMsg("" + (err || status));
                if (error_callback) {
                    error_callback(Carvic.Model.ErrorMsg());
                } else {
                    alert(Carvic.Model.ErrorMsg());
                }
            },
            dataType: "text",
            processData: false
        });
    },

    GetUrlParam: function (name) {
        var regularExp = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var searchResults = regularExp.exec(window.location.href);
        if (searchResults != null) return searchResults[1];
        return null;
    },

    // prefix int with leading zeros
    Pad: function (num, size) {
        return ('0000000000000000000' + num).substr(-size);
    }
};

////////////////////////////////////////////////////////////////////
// Model for user list

Carvic.Model.UsersModel = function () {

    var self = this;

    self.UserList = ko.observableArray();
    self.ResultCount = ko.computed(function () {
        return (self.UserList() == undefined ? 0 : self.UserList().length);
    }, self);

    self.NewUserUsername = ko.observable("new1");
    self.NewUserFullName = ko.observable("New user");
    self.NewUserPwd1 = ko.observable();
    self.NewUserPwd2 = ko.observable();
    self.NewUserType = ko.observable();

    self.UserTypesArray = Carvic.Consts.UserTypesArray;
    self.UserTypes = ko.observableArray(self.UserTypesArray);
    self.UserTypesMap = Carvic.Consts.UserTypesMap;

    self.NewUserType(self.UserTypes()[1]);

    self.UserStatusesArray = Carvic.Consts.UserStatusesArray;
    self.UserStatuses = ko.observableArray(self.UserStatusesArray);
    self.UserStatusesMap = Carvic.Consts.UserStatusesMap;

    self.NewUserEditing = ko.observable(false);
    self.NewUserEdit = ko.observable({
        FullName: ko.observable(""),
        Status: ko.observable(""),
        Type: ko.observable("")
    });

    self.NewUserStartEditing = function () {
        self.NewUserEditing(true);
    }
    self.NewUserCancelEditing = function () {
        self.NewUserEditing(false);
    }

    self.LoadUsers = function () {
        self.UserList.removeAll();
        var query = {};
        Carvic.Utils.Post({ action: "get_users", data: query }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.UserList.push({
                    Username: obj.username,
                    FullName: obj.full_name,
                    Status: obj.status,
                    Type: obj.type,
                    LastLogin: new Date(Date.parse(obj.last_login)),
                    LastBadLogin: new Date(Date.parse(obj.last_bad_login)),
                    BadLoginCount: obj.bad_login_cnt
                });
            }
        });
    };

    self.ShowUserDetails = function (curr_user) {
        window.location = "user.html?u=" + curr_user.Username;
    };

    self.SaveNewUser = function () {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NewUserFullName(), "Full name cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewUserUsername(), "Username cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewUserPwd1() !== self.NewUserPwd1(), "Entered password don't match", errors);
        if (errors.length > 0) {
            var s = "Cannot save user:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        var req = {
            action: "new_user",
            data: {
                username: self.NewUserUsername(),
                full_name: self.NewUserFullName(),
                type: self.NewUserType().code,
                pwd: self.NewUserPwd1()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            self.ShowUserDetails({ Username: req.data.username });
        });
    };
};

////////////////////////////////////////////////////////////////////
// Model for user details

Carvic.Model.UserModel = function () {

    var self = this;

    self.ShowLogins = ko.observable(false);
    self.ShowChanges = ko.observable(true);
    self.CurrentUser = ko.observable({
        Username: ko.observable(""),
        FullName: ko.observable(""),
        StatusStr: ko.observable(""),
        Status: ko.observable(""),
        TypeStr: ko.observable(""),
        Type: ko.observable(""),
        LastLogin: (new Date()),
        LastBadLogin: (new Date()),
        BadLoginCount: 0,
        LoginHistory: [],
        History: []
    });
    self.CurrentUserBackup = {};

    self.EditUserPwd1 = ko.observable();
    self.EditUserPwd2 = ko.observable();

    self.UserTypesArray = Carvic.Consts.UserTypesArray;
    self.UserTypes = ko.observableArray(self.UserTypesArray);
    self.UserTypesMap = Carvic.Consts.UserTypesMap;

    self.UserStatusesArray = Carvic.Consts.UserStatusesArray;
    self.UserStatuses = ko.observableArray(self.UserStatusesArray);
    self.UserStatusesMap = Carvic.Consts.UserStatusesMap;

    self.CurrentUserEditing = ko.observable(false);
    self.CurrentUserEditingPwd = ko.observable(false);
    self.CurrentUserEdit = ko.observable({
        FullName: ko.observable(""),
        Status: ko.observable(""),
        Type: ko.observable("")
    });

    self.CurrentUserStartEditing = function () {
        self.CurrentUserEdit().FullName(self.CurrentUser().FullName());
        self.CurrentUserEdit().Status(Carvic.Utils.GetMatches({ code: self.CurrentUser().Status() }, self.UserStatusesArray)[0]);
        self.CurrentUserEdit().Type(Carvic.Utils.GetMatches({ code: self.CurrentUser().Type() }, self.UserTypesArray)[0]);
        self.CurrentUserEditing(true);
    }
    self.CurrentUserStartEditingPwd = function () {
        self.CurrentUserEditingPwd(true);
    }
    self.CurrentUserChangePwd = function () {
        if (self.EditUserPwd1() !== self.EditUserPwd2()) {
            alert("Passwords don't match");
        } else {
            var query = {
                username: self.CurrentUser().Username(),
                pwd: self.EditUserPwd1()
            };
            Carvic.Utils.Post({ action: "change_pwd", data: query }, function (data) {
                self.CurrentUserEditingPwd(false);
            });
        }
    }
    self.CurrentUserSave = function () {

        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.CurrentUserEdit().FullName(), "Full name cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot save user:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        var req = {
            action: "update_user",
            data: { username: self.CurrentUser().Username() }
        };
        if (self.CurrentUserEdit().FullName() !== self.CurrentUser().FullName())
            req.data.full_name = self.CurrentUserEdit().FullName();
        if (self.CurrentUserEdit().Status().code !== self.CurrentUser().Status())
            req.data.status = self.CurrentUserEdit().Status().code;
        if (self.CurrentUserEdit().Type().code !== self.CurrentUser().Type())
            req.data.type = self.CurrentUserEdit().Type().code;

        Carvic.Utils.Post(req, function (data) {
            self.CurrentUserEditing(false);
            self.LoadUser(self.CurrentUser().Username());
        });
    }
    self.CurrentUserCancelEditing = function () {
        self.CurrentUserEditing(false);
    }
    self.CurrentUserCancelEditingPwd = function () {
        self.CurrentUserEditingPwd(false);
    }

    self.LoadUser = function (id) {
        Carvic.Utils.Post({ action: "get_user", data: { username: id} }, function (data) {
            self.CurrentUser({
                Username: ko.observable(data.username),
                FullName: ko.observable(data.full_name),
                StatusStr: ko.observable(self.UserStatusesMap[data.status].title),
                Status: ko.observable(data.status),
                TypeStr: ko.observable(self.UserTypesMap[data.type].title),
                Type: ko.observable(data.type),
                LastLogin: new Date(Date.parse(data.last_login)),
                LastBadLogin: new Date(Date.parse(data.last_bad_login)),
                BadLoginCount: data.bad_login_cnt,
                LoginHistory: ko.observableArray(),
                History: ko.observableArray()
            });
            self.DoShowChanges();
        });
    };

    self.LoadLoginHistory = function () {
        if (self.CurrentUser().LoginHistory().length > 0)
            return;
        self.CurrentUser().LoginHistory.removeAll();
        var req = {
            action: "get_logins",
            data: {
                username: self.CurrentUser().Username()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.CurrentUser().LoginHistory.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Ip: obj.ip,
                    LastAction: new Date(Date.parse(obj.last_action))
                }));
            }
        });
    };

    self.LoadUserHistory = function () {
        if (self.CurrentUser().History().length > 0)
            return;
        self.CurrentUser().History.removeAll();
        var req = {
            action: "get_user_history",
            data: {
                username: self.CurrentUser().Username()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.CurrentUser().History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    Node: obj.node,
                    Css: (obj.code === "node_change" ? "icon-edit" : "icon-check")
                }));
            }
        });
    };

    self.CloseUserDetails = function () {
        window.location = "users.html";
    };

    self.DisableUser = function () {
        self.CurrentUser().Status("inactive");
    };

    self.EnableUser = function () {
        self.CurrentUser().Status("active");
    };

    self.DeleteUser = function () {
        if (confirm("Are you sure that you want to delete this user?")) {
            var req = {
                action: "delete_user",
                data: { username: self.CurrentUser().Username() }
            };
            Carvic.Utils.Post(req, function (data) {
                alert("User successfully deleted.");
                self.CloseUserDetails();
            });
        }
    };

    self.DoShowLogins = function () {
        self.LoadLoginHistory();
        self.ShowLogins(true);
        self.ShowChanges(false);
    };

    self.DoShowChanges = function () {
        self.LoadUserHistory();
        self.ShowLogins(false);
        self.ShowChanges(true);
    }
};

////////////////////////////////////////////////////////////////////
// Model for node search and details

Carvic.Model.NodesModel = function (callback) {

    var self = this;

    self.SearchResult = ko.observableArray();
    self.AdvancedSearch = ko.observable(false);
    self.NodeSearchName = ko.observable("");
    self.NodeSearchId = ko.observable("");
    self.NodeSearchScope = ko.observable("");
    self.NodeSearchProject = ko.observable("");
    self.NodeSearchSetup = ko.observable("");
    self.NodeSearchBoxLabel = ko.observable("");
    self.NodeSearchComment = ko.observable("");
    self.NodeSearchCluster = ko.observable();
    self.NodeSearchClusterList = ko.observableArray();

    self.NodeSearchStatus = ko.observable("");
    self.NodeSearchStatusList = ko.observableArray();
    self.NodeSearchNetworkAddress = ko.observable("");
    self.NodeSearchNetworkAddress2 = ko.observable("");
    self.NodeSearchMAC = ko.observable("");
    self.NodeSearchFirmware = ko.observable("");
    self.NodeSearchBootloader = ko.observable("");

    self.NodeStatusesArray = Carvic.Consts.NodeStatusesArray;
    self.NodeStatuses = ko.observableArray(self.NodeStatusesArray);
    self.NodeStatusesMap = Carvic.Consts.NodeStatusesMap;

    self.CurrPage = ko.observable(0);
    self.PageCount = ko.observable(0);
    self.IncPageEnabled = ko.observable(false);
    self.DecPageEnabled = ko.observable(false);
    self.RecCount = ko.observable(0);

    self.IncPage = function () {
        if (self.CurrPage() < self.PageCount()) {
            self.CurrPage(self.CurrPage() + 1);
            self.SearchInner(false);
        }
    }

    self.DecPage = function () {
        var tmp = self.CurrPage() - 1;
        if (tmp >= 0) {
            self.CurrPage(tmp);
            self.SearchInner(false);
        }
    }
    self.UpdatePageButtons = function () {
        self.IncPageEnabled(self.CurrPage() < self.PageCount());
        self.DecPageEnabled(self.CurrPage() > 0);
    }

    // load cluster list
    Carvic.Utils.LoadClusterList(self.NodeSearchClusterList, callback);

    self.ResultCount = ko.computed(function () {
        return (self.SearchResult() == undefined ? 0 : self.SearchResult().length);
    }, self);

    self.DoAdvancedSearch = function () {
        self.AdvancedSearch(true);
    };

    self.Search = function () {
        self.SearchInner(true);
    }

    self.SearchInner = function (reset_page) {
        if (reset_page) {
            self.CurrPage(0);
            self.PageCount(0);
            self.UpdatePageButtons();
        }
        self.SearchResult.removeAll();

        var query = { page: self.CurrPage() };
        if (self.NodeSearchId() != "") { query.id = self.NodeSearchId(); }
        if (self.NodeSearchName() != "") { query.name = self.NodeSearchName(); }
        if (self.NodeSearchScope() != "") { query.scope = self.NodeSearchScope(); }
        if (self.NodeSearchProject() != "") { query.project = self.NodeSearchProject(); }
        if (self.NodeSearchSetup() != "") { query.setup = self.NodeSearchSetup(); }
        if (self.NodeSearchBoxLabel() != "") { query.box_label = self.NodeSearchBoxLabel(); }
        if (self.NodeSearchComment() != "") { query.comment = self.NodeSearchComment(); }

        if (self.NodeSearchCluster() != "") {
            var s = self.NodeSearchCluster();
            $.each(
                self.NodeSearchClusterList(),
                function (index, val) { 
                if (val.title == s) 
                query.cluster = val.code; }
            );
            //query.cluster = self.NodeSearchCluster();
        }

        if (self.NodeSearchStatus() != "") { query.status = self.NodeSearchStatus(); }
        if (self.NodeSearchNetworkAddress() != "") { query.network_addr = self.NodeSearchNetworkAddress(); }
        if (self.NodeSearchNetworkAddress2() != "") { query.network_addr2 = self.NodeSearchNetworkAddress2(); }
        if (self.NodeSearchMAC() != "") { query.mac = self.NodeSearchMAC(); }
        if (self.NodeSearchFirmware() != "") { query.firmware = self.NodeSearchFirmware(); }
        if (self.NodeSearchBootloader() != "") { query.bootloader = self.NodeSearchBootloader(); }

        Carvic.Utils.Post({ action: "get_nodes2", data: query }, function (data) {
            self.RecCount(data.count);
            self.PageCount(Math.floor(data.count / data.page_size));
            self.UpdatePageButtons();

            for (var i = 0; i < data.records.length; i++) {
                var obj = data.records[i];
                var sensors = [];
                obj.sensors.forEach(function (item) {
                    sensors.push(item.name + " (" + item.type + ")");
                });
                self.SearchResult.push(ko.observable({
                    ID: obj.id,
                    Name: obj.name,
                    Status: ko.observable(obj.status),
                    Cluster: obj.cluster,
                    ClusterName: obj.cluster_name,
                    LON: obj.loc_lon,
                    LAT: obj.loc_lat,
                    //Css: (obj.status == "ok" ? "success" : "")
                    Sensors: sensors.join(", ")
                }));
            }
        });
    };

    self.ShowNodeDetails = function (curr_node) {
        window.location = "node.html?id=" + encodeURI(encodeURI(curr_node.ID));
    };

    self.OpenNewNode = function (curr_node) {
        window.location = "new_node.html";
    };

    self.Search();
}

////////////////////////////////////////////////////////////////////
// Model for single node search and details

Carvic.Model.SingleNodeModel = function () {

    var self = this;

    self.CurrentNodeEditing = ko.observable(false);

    self.NodeClusterList = ko.observableArray();
    Carvic.Utils.LoadClusterList(self.NodeClusterList);

    self.NodeStatusesArray = Carvic.Consts.NodeStatusesArray;
    self.NodeStatuses = ko.observableArray(self.NodeStatusesArray);
    self.NodeStatusesMap = Carvic.Consts.NodeStatusesMap;

    self.NodeRolesArray = Carvic.Consts.NodeRolesArray;
    self.NodeRoles = ko.observableArray(self.NodeRolesArray);
    self.NodeRolesMap = Carvic.Consts.NodeRolesMap;

    self.NodeID = ko.observable("");
    self.NodeName = ko.observable("");
    self.NodeStatus = ko.observable("unknown");
    self.NodeStatusStr = ko.computed(function () { return self.NodeStatusesMap[self.NodeStatus()].title; }, this);
    self.NodeCluster = ko.observable();
    self.NodeClusterName = ko.observable();
    self.NodeClusterUrl = ko.observable();
    self.NodeLON = ko.observable("");
    self.NodeLAT = ko.observable("");
    self.NodeMapUrl = ko.observable("");
    self.NodeSN = ko.observable("");
    self.NodeMAC = ko.observable("");
    self.NodeNetworkAddress = ko.observable("");
    self.NodeNetworkAddress2 = ko.observable("");
    self.NodeFirmware = ko.observable("");
    self.NodeBootloader = ko.observable("");
    self.NodeSetup = ko.observable("");
    self.NodeRole = ko.observable("device");
    self.NodeRoleStr = ko.computed(function () { return self.NodeRolesMap[self.NodeRole()].title; }, this);
    self.NodeScope = ko.observable("");
    self.NodeProject = ko.observable("");
    self.NodeLocation = ko.observable("");
    //self.NodeSource = ko.observable("");
    self.NodeUserComment = ko.observable("");
    self.NodeBoxLabel = ko.observable("");
    self.NodeLastScan = ko.observable();

    self.Sensors = ko.observableArray();
    self.Components = ko.observableArray();
    self.ComponentsError = ko.observable(false);
    self.NodeHistory = ko.observableArray();
    self.OriginalData = {};

    self.CurrentSensor = ko.observable();
    self.ShowHistory = ko.observable(false);
    self.ShowSensorHistory = ko.observable(false);
    self.ShowSensorList = ko.observable(false);
    self.ShowNodeData = ko.observable(true);

    self.NodeEditComponentToAdd = ko.observable();

    self.LoadDataFromObject = function (data) {
        self.NodeID(data.id);
        self.NodeName(data.name);
        self.NodeStatus(data.status);
        self.NodeCluster(data.cluster);
        self.NodeClusterName(data.cluster_name);
        self.NodeClusterUrl("cluster.html?id=" + encodeURI(data.cluster));
        self.NodeLON(data.loc_lon);
        self.NodeLAT(data.loc_lat);
        self.NodeMapUrl("map.html?lat=" + encodeURI(data.loc_lat) + "&lon=" + encodeURI(data.loc_lon) + "&title=" + encodeURI("'" + data.name + "' from cluster " + data.cluster_name));
        self.NodeSN(data.sn);
        self.NodeMAC(data.mac);
        self.NodeNetworkAddress(data.network_addr);
        self.NodeNetworkAddress2(data.network_addr2);
        self.NodeFirmware(data.firmware);
        self.NodeBootloader(data.bootloader);
        self.NodeSetup(data.setup);
        self.NodeRole(data.role);
        self.NodeScope(data.scope);
        self.NodeProject(data.project);
        self.NodeLocation(data.location);
        //self.NodeSource(data.source);
        self.NodeUserComment(data.user_comment);
        self.NodeBoxLabel(data.box_label);
        if (data.last_scan)
            self.NodeLastScan(new Date(Date.parse(data.last_scan)));
        // load list of sensors in async call
        var sensors = data.sensors;

        self.Components.removeAll();
        for (var c in data.components) {
            var cid = data.components[c];
            self.AddNewComponentId(cid);
        }

        Carvic.Utils.Post({ action: "get_sensors_for_node", data: { node: data.id} }, function (data) {
            self.Sensors.removeAll();
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                var obj2 = new Carvic.Model.NodeSensorModel(obj, self);
                self.Sensors.push(ko.observable(obj2));
                if (i == 0) {
                    self.DoShowSensor(obj2.ID);
                }
            }
        });

        self.ComponentsError(false);
        Carvic.Utils.Post({ action: "get_nodes_with_same_components", data: { node: data.id} }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                for (var j = 0; j < self.Components().length; j++) {
                    var comp = self.Components()[j];
                    console.log(comp.Id(), obj.id, comp.Id() == obj.id);
                    if (comp.Id() == obj.id) {
                        comp.OtherNodesCount(obj.other_nodes_cnt);
                        if (obj.other_nodes_cnt > 0)
                            self.ComponentsError(true);
                        continue;
                    }
                }
            }
        });
    };

    self.LoadNode = function (id) {
        Carvic.Utils.Post({ action: "get_node", data: { id: id} }, function (data) {
            self.OriginalData = data;
            self.LoadDataFromObject(data);
        });
    };

    self.RemoveComponent = function (id) {
        self.Components.remove(function (item) {
            return item.Id() == id;
        });
    };
    self.AddNewComponentId = function (id) {
        var obj = {
            Id: ko.observable(id),
            OtherNodesCount: ko.observable(0),
            Url: ko.observable("component.html?id=" + encodeURI(id)),
            RemoveThisComponent: function () { self.RemoveComponent(this.Id()); }
        };
        self.Components.push(obj);
        return obj;
    }
    self.AddNewComponent = function () {
        var id = self.NodeEditComponentToAdd();
        if (id.length > 0) {
            var obj = self.AddNewComponentId(id);

            var req = { action: "check_component_for_multiple_nodes", data: { component: id} };
            Carvic.Utils.Post(req, function (data) {
                if (data.length > 0) {
                    obj.OtherNodesCount(data.length);
                }
            });

            self.NodeEditComponentToAdd("");
        }
    }

    self.DeleteNode = function () {
        if (confirm("Are you sure you want to delete this node? It cannot be undone.")) {
            var req = {
                action: "delete_node",
                data: {
                    id: self.NodeID()
                }
            };
            Carvic.Utils.Post(req, function (data) {
                alert("Node deleted successfully.");
                document.location = "nodes.html";
            });
        }
    }
    self.StartEditNode = function () {
        self.CurrentNodeEditing(true);
    };
    self.EndEditNode = function () {

        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NodeFirmware(), "Firmware cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeNetworkAddress(), "Primary network address cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeNetworkAddress2(), "Alternative network address cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeBootloader(), "Bootloader cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeName(), "Name cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot update  node:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        if (self.NodeNetworkAddress() == "" && self.NodeNetworkAddress2() !== "") {
            alert("Primary network address must also be entered if alternative network address is entered.");
            return;
        }

        var components = [];
        var error_nodes = 0;
        self.Components().forEach(function (item) {
            error_nodes += item.OtherNodesCount();
            components.push(item.Id());
        });
        if (error_nodes > 0) {
            alert("Some components are already associated with other nodes. Please resolve the conflict.");
            return;
        }

        self.CurrentNodeEditing(false);
        var req = {
            action: "update_node",
            data: {
                id: self.NodeID(),
                name: self.NodeName(),
                status: self.NodeStatus(),
                cluster: self.NodeCluster(),
                loc_lon: self.NodeLON(),
                loc_lat: self.NodeLAT(),
                sn: self.NodeSN(),
                mac: self.NodeMAC(),
                network_addr: self.NodeNetworkAddress(),
                network_addr2: self.NodeNetworkAddress2(),
                firmware: self.NodeFirmware(),
                bootloader: self.NodeBootloader(),
                setup: self.NodeSetup(),
                role: self.NodeRole(),
                scope: self.NodeScope(),
                project: self.NodeProject(),
                location: self.NodeLocation(),
                //source: self.NodeSource(),
                user_comment: self.NodeUserComment(),
                box_label: self.NodeBoxLabel(),
                components: components
            }
        };
        Carvic.Utils.Post(req, function (data) {
            self.LoadNode(req.data.id);
            self.NodeHistory.removeAll();
            self.LoadNodeHistory();
        });
    };
    self.CancelEditNode = function () {
        self.LoadDataFromObject(self.OriginalData);
        self.CurrentNodeEditing(false);
    };

    self.ShowNodeDetails = function (curr_node) {
        window.location = "node.html?id=" + encodeURI(curr_node.ID);
    };

    self.CloseNodeDetails = function () {
        window.location = "nodes.html";
    };

    self.LoadNodeHistory = function () {
        if (self.NodeHistory().length > 0)
            return;
        self.NodeHistory.removeAll();
        var req = {
            action: "get_node_history",
            data: {
                id: self.NodeID()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.NodeHistory.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    User: obj.user,
                    UserFullName: obj.user_full_name,
                    Css: (obj.code === "node_change" ? "icon-edit" : "icon-check")
                }));
            }
        });
    };

    self.DoShowHistory = function () {
        self.LoadNodeHistory(false);
        self.ShowHistory(true);
        self.ShowSensorHistory(false);
        self.ShowSensorList(false);
        self.ShowNodeData(false);
    };

    self.DoShowSensors = function () {
        self.ShowHistory(false);
        self.ShowSensorHistory(true);
        self.ShowSensorList(false);
        self.ShowNodeData(false);
    };

    self.DoShowSensor = function (id) {
        for (var i = 0; i < self.Sensors().length; i++) {
            var sensor = self.Sensors()[i]();
            if (sensor.ID === id) {
                if (self.CurrentSensor() != null) {
                    self.CurrentSensor().IsActive(false);
                }
                self.CurrentSensor(sensor);
                self.CurrentSensor().IsActive(true);
                self.CurrentSensor().GetHistory();
                return;
            }
        }
    };

    self.DoShowSensorList = function () {
        self.ShowHistory(false);
        self.ShowSensorHistory(false);
        self.ShowSensorList(true);
        self.ShowNodeData(false);
    };

    self.DoShowData = function () {
        self.ShowHistory(false);
        self.ShowSensorHistory(false);
        self.ShowSensorList(false);
        self.ShowNodeData(true);
    };
}

Carvic.Model.NewNodeModel = function () {

    var self = this;

    self.NodeClusterList = ko.observableArray();
    Carvic.Utils.LoadClusterList(self.NodeClusterList);

    self.NodeID = ko.observable("");
    self.NodeName = ko.observable("");
    self.NodeStatus = ko.observable("unknown");
    self.NodeCluster = ko.observable();
    self.NodeLON = ko.observable("");
    self.NodeLAT = ko.observable("");
    self.NodeSN = ko.observable("");
    self.NodeMAC = ko.observable("");
    self.NodeNetworkAddress = ko.observable("");
    self.NodeNetworkAddress2 = ko.observable("");
    self.NodeFirmware = ko.observable("");
    self.NodeBootloader = ko.observable("");
    self.NodeSetup = ko.observable("");
    self.NodeRole = ko.observable("device");
    self.NodeScope = ko.observable("");
    self.NodeProject = ko.observable("");
    self.NodeLocation = ko.observable("");
    //self.NodeSource = ko.observable("");
    self.NodeUserComment = ko.observable("");
    self.NodeBoxLabel = ko.observable("");
    self.Sensors = ko.observableArray();
    self.Components = ko.observableArray();
    self.NodeHistory = ko.observableArray();
    self.NodeComponentToAdd = ko.observable("");

    self.NodeStatusesArray = Carvic.Consts.NodeStatusesArray;
    self.NodeStatuses = ko.observableArray(self.NodeStatusesArray);
    self.NodeStatusesMap = Carvic.Consts.NodeStatusesMap;

    self.NodeRolesArray = Carvic.Consts.NodeRolesArray;
    self.NodeRoles = ko.observableArray(self.NodeRolesArray);
    self.NodeRolesMap = Carvic.Consts.NodeRolesMap;


    self.RemoveComponent = function (id) {
        self.Components.remove(function (item) {
            return item.Id() == id;
        });
    };
    self.AddNewComponentId = function (id) {
        var obj = {
            Id: ko.observable(id),
            Url: ko.observable("component.html?id=" + encodeURI(id)),
            AlreadyUsed: ko.observable(false),
            RemoveThisComponent: function () { self.RemoveComponent(this.Id()); }
        };
        self.Components.push(obj);
        var req = { action: "check_component_for_multiple_nodes", data: { component: id} };
        Carvic.Utils.Post(req, function (data) {
            if (data.length > 0) {
                obj.AlreadyUsed(true);
            }
        });
    }
    self.AddNewComponent = function () {
        var id = self.NodeComponentToAdd();
        if (id.length > 0) {
            self.AddNewComponentId(id);
            self.NodeComponentToAdd("");
        }
    }

    self.LoadLastNode = function () {
        var req = { action: "get_last_node" };
        Carvic.Utils.Post(req, function (data) {

            //self.NodeID(data.id);
            self.NodeName(data.name);
            self.NodeCluster(data.cluster);
            //self.NodeLON();
            //self.NodeLAT();
            //self.NodeSN ();
            //self.NodeMAC();
            //self.NodeNetworkAddress();
            //self.NodeNetworkAddress2();
            self.NodeFirmware(data.firmware);
            self.NodeBootloader(data.bootloader);
            //self.NodeSetup();
            self.NodeRole(data.role);
            self.NodeScope(data.scope);
            self.NodeProject(data.project);
            self.NodeLocation(data.location);
            //self.NodeSource();
            //self.NodeUserComment();
            //self.NodeBoxLabel();
        });
    }

    self.InsertNode = function () {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NodeFirmware(), "Firmware cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeNetworkAddress(), "Primary network address cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeNetworkAddress2(), "Alternative network address cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeBootloader(), "Bootloader cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NodeName(), "Name cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot create new node:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        if (self.NodeNetworkAddress() == "" && self.NodeNetworkAddress2() !== "") {
            alert("Primary network address must also be entered if alternative network address is entered.");
            return;
        }

        var components = [];
        var error_nodes = 0;
        self.Components().forEach(function (item) {
            if (item.AlreadyUsed()) {
                error_nodes += 1;
            }
            components.push(item.Id());
        });
        if (error_nodes > 0) {
            alert("Some components are already associated with other nodes. Please resolve the conflict.");
            return;
        }

        var req = {
            action: "add_node",
            data: {
                id: self.NodeID(),
                name: self.NodeName(),
                status: self.NodeStatus(),
                cluster: self.NodeCluster(),
                loc_lon: self.NodeLON(),
                loc_lat: self.NodeLAT(),
                sn: self.NodeSN(),
                mac: self.NodeMAC(),
                network_addr: self.NodeNetworkAddress(),
                network_addr2: self.NodeNetworkAddress2(),
                firmware: self.NodeFirmware(),
                bootloader: self.NodeBootloader(),
                setup: self.NodeSetup(),
                role: self.NodeRole(),
                scope: self.NodeScope(),
                project: self.NodeProject(),
                location: self.NodeLocation(),
                //source: self.NodeSource(),
                user_comment: self.NodeUserComment(),
                box_label: self.NodeBoxLabel(),
                components: components,
                sensors: []
            }
        };
        Carvic.Utils.Post(req, function (data) {
            window.location = "node.html?id=" + encodeURI(data.id);
        });
    };
}

function ComponentLookup(s, callback) {
    var res = ["a", "b", "c"];
    callback(res);
}

Carvic.Model.NodeSensorModel = function (obj, parent) {

    var self = this;

    self.Parent = parent;
    self.IsActive = ko.observable(false);

    self.ID = obj.id;
    self.Name = ko.observable(obj.name);
    self.Type = ko.observable(obj.type);
    self.Description = ko.observable(obj.description);
    //self.Enabled = ko.observable(obj.enabled);
    self.History = ko.observableArray();

    self.Show = function () {
        self.Parent.DoShowSensor(self.ID);
    }

    self.GetHistory = function () {
        if (self.History().length > 0)
            return;
        self.History.removeAll();
        var req = {
            action: "get_sensor_history",
            data: {
                id: self.ID,
                node: parent.NodeID()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Value: obj.value
                }));
            }
        });
    };
};

////////////////////////////////////////////////////////////////////
// Model for component search and details

Carvic.Model.ComponentsModel = function () {

    var self = this;

    self.SearchResult = ko.observableArray();
    self.SearchType = ko.observable();
    self.SearchProject = ko.observable("");
    self.SearchComment = ko.observable("");
    self.SearchPN = ko.observable("");
    self.SearchSN = ko.observable("");
    self.SearchP = ko.observable("");
    self.SearchS = ko.observable("");
    self.SearchStatus = ko.observable();
    self.ResultCount = ko.computed(function () {
        return (self.SearchResult() == undefined ? 0 : self.SearchResult().length);
    }, self);

    self.CurrPage = ko.observable(0);
    self.PageCount = ko.observable(0);
    self.IncPageEnabled = ko.observable(false);
    self.DecPageEnabled = ko.observable(false);
    self.RecCount = ko.observable(0);

    self.PageMode = ko.observable("search"); // values: search, new_batch, edit

    self.NewPN = ko.observable("");
    self.NewP = ko.observable("");
    self.NewS = ko.observable("");
    self.NewSN1 = ko.observable("");
    self.NewSN2 = ko.observable("");
    self.NewType = ko.observable();

    self.ComponentTypesArray = Carvic.Consts.ComponentTypesArray;
    self.ComponentTypes = ko.observableArray(self.ComponentTypesArray);
    self.ComponentTypesMap = Carvic.Consts.ComponentTypesMap;

    self.ComponentStatusesArray = Carvic.Consts.ComponentStatusesArray;
    self.ComponentStatuses = ko.observableArray(self.ComponentStatusesArray);
    self.ComponentStatusesMap = Carvic.Consts.ComponentStatusesMap;

    self.IncPage = function () {
        if (self.CurrPage() < self.PageCount()) {
            self.CurrPage(self.CurrPage() + 1);
            self.SearchInner(false);
        }
    }

    self.DecPage = function () {
        var tmp = self.CurrPage() - 1;
        if (tmp >= 0) {
            self.CurrPage(tmp);
            self.SearchInner(false);
        }
    }

    self.UpdatePageButtons = function () {
        self.IncPageEnabled(self.CurrPage() < self.PageCount());
        self.DecPageEnabled(self.CurrPage() > 0);
    }
    self.Search = function () {
        self.SearchInner(true);
    }

    self.SearchInner = function (reset_page) {
        if (reset_page) {
            self.CurrPage(0);
            self.PageCount(0);
            self.UpdatePageButtons();
        }
        self.SearchResult.removeAll();

        var query = { page: self.CurrPage() };
        if (self.SearchType() != undefined) { query.type = self.SearchType(); }
        if (self.SearchPN() != "") { query.product_number = self.SearchPN(); }
        if (self.SearchSN() != "") { query.serial_number = self.SearchSN(); }
        if (self.SearchP() != "") { query.production = self.SearchP(); }
        if (self.SearchS() != "") { query.series = self.SearchS(); }
        if (self.SearchProject() != "") { query.project = self.SearchProject(); }
        if (self.SearchComment() != "") { query.comment = self.SearchComment(); }
        if (self.SearchStatus() != undefined) { query.status = self.SearchStatus(); }

        Carvic.Utils.Post({ action: "get_components2", data: query }, function (data) {
            self.RecCount(data.count);
            self.PageCount(Math.floor(data.count / data.page_size));
            self.UpdatePageButtons();
            for (var i = 0; i < data.records.length; i++) {
                var obj = data.records[i];

                self.SearchResult.push(ko.observable({
                    Type: ko.observable(obj.type),
                    PN: ko.observable(obj.product_number),
                    Status: ko.observable(obj.status),
                    StatusStr: ko.observable(self.ComponentStatusesMap[obj.status].title),
                    P: ko.observable(obj.production),
                    S: ko.observable(obj.series),
                    SN: ko.observable(obj.serial_number),
                    Project: ko.observable(obj.project),
                    Responsible: ko.observable(obj.responsible),
                    Comment: ko.observable(obj.comment),
                    ID: ko.observable(obj.id)
                }));
            }
        });
    };

    self.ShowDetails = function (curr_component) {
        document.location = "component.html?id=" + encodeURI(curr_component.ID());
    };

    self.SaveNewComponents = function (curr_component) {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NewPN(), "Product number cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewP(), "Production date cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewS(), "Series cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewSN1(), "'Serial number from' cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.NewSN2(), "'Serial number to' cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot create new components:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        var d = {
            pn: self.NewPN(),
            type: self.NewType(),
            p: self.NewP(),
            s: self.NewS(),
            sn_from: self.NewSN1(),
            sn_to: self.NewSN2()
        };
        Carvic.Utils.Post({ action: "add_components", data: d }, function (data) {
            self.PageMode("search");
        });
    };

    self.StartAddingNewBatch = function () {
        self.PageMode("new_batch");
    }
    self.CancelAddingNewBatch = function () {
        self.PageMode("search");
    }

    self.Search();
}

Carvic.Model.ComponentModel = function () {

    var self = this;

    self.Editing = ko.observable(false);

    self.Type = ko.observable("");
    self.PN = ko.observable("");
    self.Status = ko.observable();
    self.StatusStr = ko.observable("");
    self.P = ko.observable("");
    self.S = ko.observable();
    self.SN = ko.observable();
    self.Project = ko.observable();
    self.Responsible = ko.observable();
    self.Comment = ko.observable();
    self.ID = ko.observable();
    self.History = ko.observableArray();
    self.Nodes = ko.observableArray();
    self.LastData = {};

    self.ComponentTypesArray = Carvic.Consts.ComponentTypesArray;
    self.ComponentTypes = ko.observableArray(self.ComponentTypesArray);
    self.ComponentTypesMap = Carvic.Consts.ComponentTypesMap;

    self.ComponentStatusesArray = Carvic.Consts.ComponentStatusesArray;
    self.ComponentStatuses = ko.observableArray(self.ComponentStatusesArray);
    self.ComponentStatusesMap = Carvic.Consts.ComponentStatusesMap;

    self.Load = function (id) {
        var query = { id: id };
        Carvic.Utils.Post({ action: "get_component", data: query }, function (data) {

            var obj = data;
            self.Type(obj.type);
            self.PN(obj.product_number);
            self.Status(obj.status);
            self.StatusStr(self.ComponentStatusesMap[obj.status].title);
            self.P(obj.production);
            self.S(obj.series);
            self.SN(obj.serial_number);
            self.Project(obj.project);
            self.Responsible(obj.responsible);
            self.Comment(obj.comment);
            self.ID(obj.id);
            self.LastData = obj;
            for (var j = 0; j < obj.nodes.length; j++) {
                var node = obj.nodes[j];
                self.Nodes.push({
                    Id: node.id,
                    Name: node.name,
                    Cluster: node.cluster,
                    ClusterName: node.cluster_name,
                    Url: "node.html?id=" + encodeURI(node.id),
                    ClusterUrl: "cluster.html?id=" + encodeURI(node.cluster)
                });
            }


            self.LoadHistory();
        });
    };

    self.LoadHistory = function () {
        self.History.removeAll();
        var req = {
            action: "get_component_history",
            data: { id: self.ID() }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    User: obj.user,
                    UserFullName: obj.user_full_name,
                    Css: (obj.code === "component_change" ? "icon-edit" : "icon-check")
                }));
            }
        });
    }

    self.ShowDetails = function (curr_component) {
        self.PageMode("edit");
    };
    self.CancelShowDetails = function (curr_component) {
        self.PageMode("search");
    };

    self.ShowHistory = function (curr_component) { };

    self.SaveComponent = function (curr_component) {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.PN(), "Product number cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.P(), "Production date cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.S(), "Series cannot be empty", errors);
        Carvic.Utils.CheckIfEmpty(self.SN(), "Serial number cannot be empty", errors);
        if (errors.length > 0) {
            var s = "Cannot save component:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }
        var d = { id: self.ID() };
        if (self.LastData.type != self.Type())
            d.type = self.Type();
        if (self.LastData.product_number != self.PN())
            d.product_number = self.PN();
        if (self.LastData.production != self.P())
            d.production = self.P();
        if (self.LastData.series != self.S())
            d.series = self.S();
        if (self.LastData.serial_number != self.SN())
            d.serial_number = self.SN();
        if (self.LastData.status != self.Status())
            d.status = self.Status().code;
        if (self.LastData.project != self.Project())
            d.project = self.Project();
        if (self.LastData.comment != self.Comment())
            d.comment = self.Comment();

        var req = { action: "update_component", data: d };
        Carvic.Utils.Post(req, function (data) {
            //self.Load(data.id);
            document.location = "component.html?id=" + encodeURI(data.id);
        });
        self.Editing(false);
    };
    self.CancelEditing = function () {
        self.Editing(false);
    }
    self.StartEditing = function () {
        self.Editing(true);
    }

    self.DeleteComponent = function () {
        if (confirm("Are you sure that you want to delete this component?")) {
            var req = {
                action: "delete_component",
                data: { id: self.ID() }
            };
            Carvic.Utils.Post(req, function (data) {
                alert("Component successfully deleted.");
                window.location = "components.html";
            });
        }
    };
}

////////////////////////////////////////////////////////////////////
// Model for cluster search and details

Carvic.Model.ClustersModel = function () {

    var self = this;

    self.PageMode = ko.observable("search"); // values: search, new
    self.SearchResult = ko.observableArray();
    self.ResultCount = ko.computed(function () {
        return (self.SearchResult() == undefined ? 0 : self.SearchResult().length);
    }, self);

    self.SearchTag = ko.observable("");
    self.SearchId = ko.observable("");
    self.SearchName = ko.observable("");
    self.SearchType = ko.observable();

    self.NewTag = ko.observable("");
    self.NewName = ko.observable("");
    self.NewUrl = ko.observable("");
    self.NewType = ko.observable();
    self.NewComment = ko.observable("");

    self.ClusterTypesArray = Carvic.Consts.ClusterTypesArray;
    self.ClusterTypes = ko.observableArray(self.ClusterTypesArray);
    self.ClusterTypesMap = Carvic.Consts.ClusterTypesMap;

    self.Search = function () {
        self.SearchResult.removeAll();

        var query = {};
        if (self.SearchTag() != "") query.tag = self.SearchTag();
        if (self.SearchId() != "") query.id = self.SearchId();
        if (self.SearchName() != "") query.name = self.SearchName();
        if (self.SearchType() != null) query.type = self.SearchType();
        Carvic.Utils.Post({ action: "get_clusters", data: query }, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.SearchResult.push(ko.observable({
                    Id: ko.observable(obj.id),
                    Tag: ko.observable(obj.tag),
                    Name: ko.observable(obj.name),
                    Type: ko.observable(obj.type),
                    TypeStr: ko.observable(self.ClusterTypesMap[obj.type].title),
                    Url: ko.observable(obj.url)
                }));
            }
        });
    };

    self.ShowDetails = function (curr_cluster) {
        document.location = "cluster.html?id=" + encodeURI(curr_cluster.Id());
    };

    self.SaveNewCluster = function (curr_component) {
        var errors = [];
        Carvic.Utils.CheckIfEmpty(self.NewType() == "zigbee" && self.NewTag() == "", "Zigbee cluster must have a tag", errors);
        Carvic.Utils.CheckIfEmpty(self.NewName(), "Cluster must have a name", errors);
        if (errors.length > 0) {
            var s = "Cannot save cluster:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        var d = {
            name: self.NewName(),
            tag: self.NewTag(),
            type: self.NewType(),
            url: self.NewUrl(),
            comment: self.NewComment()
        };
        Carvic.Utils.Post({ action: "add_cluster", data: d }, function (data) {
            self.Search();
            self.PageMode("search");
        });
    };

    self.ScanClusters = function () {
        Carvic.Utils.Post({ action: "scan", data: {} }, function (data) {
            alert("Network scan is running in background.");
        });
    }
    self.StartAddingNew = function () {
        self.PageMode("new");
    }
    self.CancelAddingNew = function () {
        self.PageMode("search");
    }
}

Carvic.Model.ClusterModel = function () {

    var self = this;

    self.Editing = ko.observable(false);
    self.History = ko.observableArray();
    self.Nodes = ko.observableArray();

    self.Type = ko.observable();
    self.TypeStr = ko.observable();

    self.Id = ko.observable();
    self.Tag = ko.observable();
    self.Name = ko.observable();
    self.Url = ko.observable();
    self.Scan = ko.observable(false);
    self.Comment = ko.observable();
    self.LastScan = ko.observable();
    self.LastData = {};

    self.ShowNodes = ko.observable(true);
    self.ShowHistory = ko.observable(false);

    self.ClusterTypesArray = Carvic.Consts.ClusterTypesArray;
    self.ClusterTypes = ko.observableArray(self.ClusterTypesArray);
    self.ClusterTypesMap = Carvic.Consts.ClusterTypesMap;

    self.DoShowNodes = function () {
        self.ShowHistory(false);
        self.ShowNodes(true);
    }
    self.DoShowHistory = function () {
        self.ShowHistory(true);
        self.ShowNodes(false);
    }

    self.Load = function (id) {
        var query = { id: id };
        Carvic.Utils.Post({ action: "get_cluster", data: query }, function (data) {

            var obj = data;
            self.Type(obj.type);
            self.TypeStr(self.ClusterTypesMap[obj.type].title);
            self.Name(obj.name);
            self.Id(obj.id);
            self.Tag(obj.tag);
            self.Url(obj.url);
            self.Scan(obj.scan);
            self.Comment(obj.comment);
            if (obj.last_scan) {
                self.LastScan(new Date(Date.parse(obj.last_scan)));
            }
            self.LastData = obj;

            self.LoadHistory();
            self.LoadNodes();
        });
    };


    self.LoadNodes = function () {
        // load history
        self.Nodes.removeAll();
        var req = {
            action: "get_nodes",
            data: {
                cluster: self.Id()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.Nodes.push(ko.observable({
                    ID: obj.id,
                    Name: obj.name,
                    Status: ko.observable(obj.status),
                    LON: obj.loc_lon,
                    LAT: obj.loc_lat,
                    Url: "node.html?id=" + encodeURI(obj.id)
                }));
            }
        });
    }

    self.LoadHistory = function () {
        // load history
        self.History.removeAll();
        var req = {
            action: "get_cluster_history",
            data: {
                id: self.Id()
            }
        };
        Carvic.Utils.Post(req, function (data) {
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                self.History.push(ko.observable({
                    Ts: new Date(Date.parse(obj.ts)),
                    Title: obj.title,
                    Description: obj.description,
                    Status: obj.status,
                    Code: obj.code,
                    User: obj.user,
                    UserFullName: obj.user_full_name,
                    Css: (obj.code === "component_change" ? "icon-edit" : "icon-check")
                }));
            }
        });
    }


    self.SaveCluster = function (curr_cluster) {
        var errors = [];
        if (self.Type() == "zigbee") {
            Carvic.Utils.CheckIfEmpty(self.Tag(), "Zigbee cluster must have a tag", errors);
        }
        Carvic.Utils.CheckIfEmpty(self.Name(), "Cluster must have a name", errors);
        if (errors.length > 0) {
            var s = "Cannot save cluster:";
            errors.forEach(function (item) { s += "\n- " + item });
            alert(s);
            return;
        }

        var d = { orig_id: self.LastData.id };
        if (self.LastData.type != self.Type())
            d.type = self.Type();
        if (self.LastData.tag != self.Tag())
            d.tag = self.Tag();
        if (self.LastData.name != self.Name())
            d.name = self.Name();
        if (self.LastData.url != self.Url())
            d.url = self.Url();
        if (self.LastData.scan != self.Scan())
            d.scan = self.Scan();
        if (self.LastData.comment != self.Comment())
            d.comment = self.Comment();

        var req = { action: "update_cluster", data: d };
        Carvic.Utils.Post(req, function (data) {
            self.LoadHistory();
        });
        self.Editing(false);
    };
    self.CancelEditing = function () {
        self.Editing(false);
    }
    self.StartEditing = function () {
        self.Editing(true);
    }
    self.ScanCluster = function () {
        Carvic.Utils.Post({ action: "scan", data: { id: self.Id()} }, function (data) {
            alert("Network scan is running in background.");
        });
    }
    self.DeleteCluster = function () {
        if (self.Nodes().length > 0) {
            alert("Cannot delete cluster - nodes are assigned to it.");
            return;
        }
        if (!confirm("Are you sure that you want to delete this cluster?")) return;

        var req = {
            action: "delete_cluster",
            data: { id: self.Id() }
        };
        Carvic.Utils.Post(req, function (data) {
            alert("Cluster successfully deleted.");
            window.location = "clusters.html";
        });
    };
}

////////////////////////////////////////////////////////////////////
// Model for cluster search and details

Carvic.Model.HistoryModel = function () {

    var self = this;

    self.SearchResult = ko.observableArray();

    self.User = ko.observable("");
    self.UserList = ko.observableArray();
    self.Component = ko.observable("");
    self.Node = ko.observable("");
    self.Cluster = ko.observable("");
    self.ClusterList = ko.observableArray();
    self.Keywords = ko.observable("");

    self.CurrPage = ko.observable(0);
    self.PageCount = ko.observable(0);
    self.IncPageEnabled = ko.observable(false);
    self.DecPageEnabled = ko.observable(false);
    self.RecCount = ko.observable(0);

    self.From = ko.observable("");
    self.To = ko.observable("");

    Carvic.Utils.LoadClusterList(self.ClusterList);
    Carvic.Utils.LoadUserList(self.UserList);

    self.IncPage = function () {
        if (self.CurrPage() < self.PageCount()) {
            self.CurrPage(self.CurrPage() + 1);
            self.SearchInner(false);
        }
    }

    self.DecPage = function () {
        var tmp = self.CurrPage() - 1;
        if (tmp >= 0) {
            self.CurrPage(tmp);
            self.SearchInner(false);
        }
    }

    self.UpdatePageButtons = function () {
        self.IncPageEnabled(self.CurrPage() < self.PageCount());
        self.DecPageEnabled(self.CurrPage() > 0);
    }
    self.Search = function () {
        self.SearchInner(true);
    }
    self.SearchInner = function (reset_page) {
        if (reset_page) {
            self.CurrPage(0);
            self.PageCount(0);
            self.UpdatePageButtons();
        }
        self.SearchResult.removeAll();
        var query = { page: self.CurrPage() };

        if (self.User() != "") query.user = self.User();
        if (self.Component() != "") query.component = self.Component();
        if (self.Node() != "") query.node = Number(self.Node());
        if (self.Cluster() != "") query.cluster = self.Cluster();
        if (self.Keywords() != "") query.keywords = self.Keywords();
        var d1 = self.From();
        if (d1 && d1 != "") query.ts_from = Carvic.Utils.ParseDate(d1);
        var d2 = self.To();
        if (d2 && d2 != "") query.ts_to = Carvic.Utils.ParseDate(d2);

        Carvic.Utils.Post({ action: "get_history", data: query }, function (data) {
            self.RecCount(data.count);
            self.PageCount(Math.floor(data.count / data.page_size));
            self.UpdatePageButtons();
            for (var i = 0; i < data.records.length; i++) {
                var obj = data.records[i];
                obj.component = obj.component || "";
                obj.component_url = (obj.component ? "component.html?id=" + encodeURI(obj.component) : null);
                obj.cluster = obj.cluster || "";
                obj.cluster_name = obj.cluster_name || "";
                obj.cluster_url = (obj.cluster ? "cluster.html?id=" + encodeURI(obj.cluster) : null);
                obj.node = obj.node || "";
                obj.node_url = (obj.node ? "node.html?id=" + encodeURI(obj.node) : null);
                obj.ts = new Date(obj.ts);
                self.SearchResult.push(ko.observable(obj));
            }
        });
    };

    self.Search();
}

////////////////////////////////////////////////////////////////////
// Model for personal settings

Carvic.Model.SettingsModel = function () {

    var self = this;

    self.CurrentFullName = ko.observable();
    self.NewPwd1 = ko.observable();
    self.NewPwd2 = ko.observable();
    self.Msg = ko.observable("");
    self.MsgType = ko.observable("");

    self.SaveNewFullName = function () {
        var query = {
            full_name: self.CurrentFullName()
        };
        Carvic.Utils.Post({ action: "change_my_full_name", data: query }, function (data) {
            self.Msg("Full name changed successfully");
        });
    };

    self.ChangePassword = function () {
        if (self.NewPwd1() !== self.NewPwd2()) {
            self.Msg("Passwords don't match");
            self.MsgType("error");
        } else {
            var query = {
                pwd: self.NewPwd1()
            };
            Carvic.Utils.Post({ action: "change_pwd", data: query }, function (data) {
                self.Msg("Password changed successfully");
            });
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////

Carvic.Model.Refresh = function () {

}

Carvic.ReloadStats = function () {
    var req1 = { action: "get_node_stats" };
    Carvic.Utils.Post(req1, function (data) {
        Carvic.Model.Stats().Nodes().all(data.all);
        Carvic.Model.Stats().Nodes().active(data.active);
        Carvic.Model.Stats().Nodes().active_percent(data.active_percent);
    });
    var req2 = { action: "get_sensor_stats" };
    Carvic.Utils.Post(req2, function (data) {
        Carvic.Model.Stats().Sensors().all(data.all);
        Carvic.Model.Stats().Sensors().active(data.active);
        Carvic.Model.Stats().Sensors().active_percent(data.active_percent);
    });
    var req3 = { action: "get_user_stats" };
    Carvic.Utils.Post(req3, function (data) {
        Carvic.Model.Stats().Users().all(data.all);
        Carvic.Model.Stats().Users().active(data.active);
        Carvic.Model.Stats().Users().admins(data.admins);
    });

    var req4 = { action: "get_cluster_stats" };
    Carvic.Utils.Post(req4, function (data) {
        for (var i in data) {
            var obj = data[i];
            obj.url = "cluster.html?id=" + encodeURI(obj.id);
            obj.nodes_activep = Math.round(100 * obj.nodes_activep) / 100;
            obj.sensors_activep = Math.round(100 * obj.sensors_activep) / 100;
            Carvic.Model.Stats().Clusters.push(obj);
        }
    });
}

/////////////////////////////////////////////////////////////////////

Carvic.InitAdminPage = function () {
    Carvic.Model.Admin = {};
    Carvic.Utils.SetCurrentUser(Carvic.Model.Admin);
}

Carvic.InitUserList = function () {
    Carvic.Model.Users = new Carvic.Model.UsersModel();
    Carvic.Model.Users.LoadUsers(); // here it is ok to perform search on page load
    Carvic.Utils.SetCurrentUser(Carvic.Model.Users);
}

Carvic.InitSingleUser = function () {
    Carvic.Model.User = new Carvic.Model.UserModel();
    var id = Carvic.Utils.GetUrlParam("u");
    if (id)
        Carvic.Model.User.LoadUser(id);
    else
        Carvic.Model.User.LoadUser(5);
    Carvic.Utils.SetCurrentUser(Carvic.Model.User);
}

Carvic.InitComponentList = function () {
    Carvic.Model.Components = new Carvic.Model.ComponentsModel();
    //Carvic.Model.Components.Search(); // this is too expensive
    Carvic.Utils.SetCurrentUser(Carvic.Model.Components);
}
Carvic.InitHistoryList = function () {
    Carvic.Model.History = new Carvic.Model.HistoryModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.History);
}


Carvic.InitSingleComponentList = function () {
    var id = Carvic.Utils.GetUrlParam("id");
    Carvic.Model.Component = new Carvic.Model.ComponentModel();
    Carvic.Model.Component.Load(id);
    Carvic.Utils.SetCurrentUser(Carvic.Model.Component);
}

Carvic.InitClusterList = function () {
    Carvic.Model.Clusters = new Carvic.Model.ClustersModel();
    Carvic.Model.Clusters.Search(); // here it is ok to perform search on page load
    Carvic.Utils.SetCurrentUser(Carvic.Model.Clusters);
}

Carvic.InitSingleCluster = function () {
    var id = Carvic.Utils.GetUrlParam("id");
    Carvic.Model.Cluster = new Carvic.Model.ClusterModel();
    Carvic.Model.Cluster.Load(id);
    Carvic.Utils.SetCurrentUser(Carvic.Model.Cluster);
}

Carvic.InitNodeList = function (callback) {
    Carvic.Model.Nodes = new Carvic.Model.NodesModel(callback);
    Carvic.Utils.SetCurrentUser(Carvic.Model.Nodes);
}

Carvic.InitSingleNode = function () {
    Carvic.Model.SingleNode = new Carvic.Model.SingleNodeModel();
    var id = Carvic.Utils.GetUrlParam("id");
    if (id)
        Carvic.Model.SingleNode.LoadNode(id);
    else
        Carvic.Model.SingleNode.LoadNode(5);
    Carvic.Utils.SetCurrentUser(Carvic.Model.SingleNode);
}

Carvic.InitNewNode = function () {
    Carvic.Model.NewNode = new Carvic.Model.NewNodeModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.NewNode);
}

Carvic.InitStats = function () {
    Carvic.Model.Stats = ko.observable({
        Nodes: ko.observable({
            all: ko.observable(),
            active: ko.observable(),
            active_percent: ko.observable()
        }),
        Sensors: ko.observable({
            all: ko.observable(),
            active: ko.observable(),
            active_percent: ko.observable()
        }),
        Users: ko.observable({
            all: ko.observable(),
            active: ko.observable(),
            admins: ko.observable()
        }),
        Clusters: ko.observableArray()
    });
    Carvic.Utils.SetCurrentUser(Carvic.Model.Stats());
    Carvic.ReloadStats();
}

Carvic.InitSettings = function () {
    Carvic.Model.Settings = new Carvic.Model.SettingsModel();
    Carvic.Utils.SetCurrentUser(Carvic.Model.Settings, function () {
        Carvic.Model.Settings.CurrentFullName(Carvic.Model.Settings.StdData.CurrentUserFullname());
    });
}