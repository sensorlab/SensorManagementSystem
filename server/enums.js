/////////////////////////////////////////////////////////////////////////////////////
// This file contains enumerations that are used by client- and servide-side code.
//
// Warning:
// When editing these enumerations, be sure to take backward compatibility 
// into consideration.
/////////////////////////////////////////////////////////////////////////////////////

var xutil = require("./xutil");

/////////////////////////////////////////////////////////////////////////////////////

var Enums = {

    ComponentTypesArray: [
        { code: "snr", title: "SNR" },
        { code: "snc", title: "SNC" },
        { code: "sne", title: "SNE" },
        { code: "rpi", title: "Raspberry PI" },
        { code: "oth", title: "Other" }
    ],

    ComponentStatusesArray: [
        { code: "ok", title: "OK" },                   // componenty is "healthy"
        {code: "error", title: "Error" },             // permanent malfunction
        {code: "in_repair", title: "In repair"}      // reparable malfunction
    ],

    NodeStatusesArray: [
        { code: "active", title: "Active" },           // normal state
        {code: "inactive", title: "Inactive" },        // manual disabled from scanning
        {code: "unreachable", title: "Unreachable" },  // node was working but is now not accessible
        {code: "unknown", title: "Unknown" },          // node has never been contacted yet
        {code: "in_repair", title: "In repair"}        // node was unmounted and is in repair
    ],

    NodeRolesArray: [
        { code: "device", title: "Device" },
        { code: "gateway", title: "Gateway" },
    ],

    UserTypesArray: [
        { code: "admin", title: "Administrator" },
        { code: "normal", title: "Normal user" }
    ],

    UserStatusesArray: [
        { code: "active", title: "Active" },
        { code: "inactive", title: "Inactive" },
        { code: "locked", title: "Locked" }
    ],

    ClusterTypesArray: [
        { code: "zigbee", title: "ZigBee", uses_gateway: true },
        { code: "ipv6", title: "IPv6", uses_gateway: false }
    ]
};

Enums.ComponentTypesMap = xutil.create_map(Enums.ComponentTypesArray);
Enums.ComponentStatusesMap = xutil.create_map(Enums.ComponentStatusesArray);
Enums.NodeStatusesMap = xutil.create_map(Enums.NodeStatusesArray);
Enums.NodeRolesMap = xutil.create_map(Enums.NodeRolesArray);
Enums.UserTypesMap = xutil.create_map(Enums.UserTypesArray);
Enums.UserStatusesMap = xutil.create_map(Enums.UserStatusesArray);
Enums.ClusterTypesMap = xutil.create_map(Enums.ClusterTypesArray);

/////////////////////////////////////////////////////////////////////////////////////

exports.get_enums = function () { return Enums; };
