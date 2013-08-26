Sensor Management System
==========================

This document provides administrator's manual. See user's manual for basic help.

Implementation
--------------

The application is implemented using the following technologies:

- [Node.js](http://nodejs.org/) for server-side business logic
	- `express` for HTTP server functionality 
- [Mongodb](http://www.mongodb.org/) for database (NoSQL type)
- Pure HTML client with AJAX (JSON) calls to server
	- using [JQuery](http://jquery.com/) for basic DOM manipulation, as well as for AJAX calls 
	- using [Bootstrap](http://getbootstrap.com/) for GUI composition and effects
	- using [Knockout.js](http://knockoutjs.com/) for MVVM mechanism 

##Database collections (tables)

The system uses the following collections inside Mongodb database:

###clusters 

List of clusters

- **comment** - string - user comment for this cluster
- **id** - string - ID for this cluster, unique within this database 
- **last\_scan** - datetime - when was this cluster last scanned
- **name** - name of this cluster
- **scan** - boolean - if true then this cluster will be scanned 
- **tag** - string - used to identify the cluster to the communicator (not unique within the database)
- **type** - string - "zigbee" or "ipv6" are supported
- **url** - string - URL of communicator for this cluster (zigbee type only)

###component

List of registered components that can be associated with nodes

- **id** - string - component's ID, created with concatenating other parts of its data (e.g. VESNA-SNR-TRX-V1.1.4-snr-221012-01-006)
- **type** - string - component's type (e.g. snr, snc, sne, ...)
- **product\_number** - string - product number
- **series** - string - series
- **serial\_number** - string - serial\_number 
- **status** - string - "ok", "error", "in\_repair"
- **project** - string - project where this component is used
- **commment** - string - user's comment for this component 

###history

Single table that contains history records for all objects (clusters, nodes, users, components).

- **node** - numeric - node ID if node was involved
- **cluster** - string - cluster ID if cluster was involved
- **user** - string - username if user was involved
- **status** - string new status of the node (if applicable)
- **code** - string - type of change
- **ts** - datetime - time stamp when this change occured
- **title** - string - generated title of the event
- **description** - string - generated description of the event
- **sys\_data** - JSON - sub-object containing request data
- **component** - string - component ID if node was involved

###logins

List of successful logins into the system

- **user** - string - username of the user that has logged in successfully
- **ts** - datetime - time stamp of the event
- **ip** - string - IP from user logged in
- **last\_action** - datetime - when was last activity detected for this login 
- **terminated** - boolean flag is this login (session) is terminated and should not be used anymore

###nodes

List of nodes

- **id** - numeric - node's ID inside this system
- **name** - string - human-readable name of the node
- **location** - string - human-readable location of the node, entered by user
- **loc\_lat** - numeric - latitude
- **loc\_lon** - numeric - longitude
- **cluster** - string - cluster ID to which this node belongs
- **status** - string - "active", "inactive", "unreachable", "unknown", "in\_repair"
- **setup** - string - for administration purposes
- **scope** - string - for administration purposes
- **project** - string - for administration purposes
- **user\_comment** - string - user's comment for the node
- **box\_label** - string - label on the box for this node
- **serial\_no** - string serial number
- **mac** - string - MAC for this node
- **network\_addr** - string - network address for this node (used when communicating with the node)
- **network\_addr2** - string - short network address for this node (optional)
- **firmware** - string - node's firmware version
- **bootloader** - string - node's bootloader version
- **role** - string - "device" or "gateway"
- **sensors** - array of JSON objects - sensors that are reported on this node
	- **id** - string - sensor ID
	- **type** - string - sensor type
	- **name** - string - sensor name
	- **description** - string - sensor description
- **components** - array of string - list of components (their IDs) that are used on this node
- **last\_scan** - datetime - when was this node last scanned
- **sn** - string - serial number ?

###sensor\_history

Measurement history

- **sensor** - string - sensor ID inside the node
- **node** - numeric - node ID
- **ts** - datetime - time stamp of the measurement
- **sys\_data** - JSON - can be sub-object containing additional data. empty for now.
- **value** - numeric - measurement's result

###users

List of users

- **username** - string - what user is identified with inside the system
- **full\_name** - string - name of the user for display purposes
- **pwd\_hash** - string - salted password hash
- **status** - string - "active", "inactive", "locked"
- **last\_login** - datetime - when did this user last log into the system
- **bad\_login\_cnt** - numeric - how many times did user enter bad password
- **type** - string - "normal" or "admin"

## Commands

###Production commands

To run the system, use the following command line

	node top.js

This will start the web server, by default running on port 3000. To see other options, run command line:

	node top.js help


To run scan of all clusters and their nodes, run:

	node top.js scan

To run scan of single cluster and its nodes, run:

	node top.js scan <cluster_id>

###For development only

The following command should only be run in development environment, since they change the data inside the system.

To clear database data (for **development purposes**), run:

	node top.js clean

To fill database with dummy data (for **development purposes**), run:

	node top.js fill_dummy_data

To dump database data to console (for **development purposes**), run:

	node top.js dump

##System settings

System settings are stored inside `settings.json` file. An example is given below:

	{
	    "web": {
	        "port": 3000,
	        "use_auth": true
	    },
	    "database": {
	        "url": "sms"
	    },
	    "scan": {
	        "node_unreachable_after" : "2 d",
	        "autodiscover": true
	    },
	    "archive": {
	        "enabled": false,
	        "dir": "./archive",
	        "format": "json",
	        "scan_history" : "20 h",
	        "edit_history" : "20 h",
	        "measurement_history": "20 h"
	    },
	    "notify": {
	        "enabled": false,
	        "server": "localhost",
	        "port": 3345,
	        "path_after_sensor_scan" : "/",
	        "path_after_node_change" : "/",
	        "path_after_sensor_change" : "/",
	        
	        "after_node_change" : true,
	        "after_sensor_scan" : true,
	        "after_sensor_change" : true
	    }
	}

Section `web` contains settings that controls the how the system runs. 

Section `database` tells the system where the `Mongodb` database resides.

Section `scan` used when system scans the clusters and nodes.

Section `archive` is used to tell the system how the archiving should be done.

Section `notify` is used to enable the post-change progressive notification for outside systems. See `Videk integration` below.


Adding new statuses
---------------------

Look inside `enums.js` file and add new enumeration values for the following types:

- component types
- component statuses
- node statuses
- node roles
- user types
- user statuses
- cluster types


Technicalities
--------------

###Zigbee network

This type of network has some specifics:

- Communicates over "REST-like" API - not strictly REST but close enough.
- Only one call to any function is permitted at the time
	- This means there will often be "COMMUNICATION IN PROGRESS" errors because of concurrency collisions
- Gateway node 
	- must exist (it is added automatically when cluster of this type is defined)
	- has network address 0 (system doesn't prohibit you to change it later)



##Videk integration


### Specification

(from Carolina's email on 26.4.2013)

Related to the Videk API, I was wondering whether implementing the following is feasible:

1. JSON containing all the ids of the nodes `http://localhost:9889/nodeIds`

2. JSON containing the node info (ID, Name, Cluster, Status, Long, Lat) `http://localhost:9889/nodeInfo?nodeId=123`

3. JSON containing all the data about the node (ID, Name, Cluster, Status, Long, Lat, Role, Scope, project, user comments, network address, mac, serial no, firmware, bootloader, set-up, box label, components) `http://localhost:9889/nodeData?nodeId=123`

4. JSON containing all the data about the sensors on the node () `http://localhost:9889/sensorData?nodeId=123`

5. JSON containing sensorNode and sensorID and measurement `http://localhost:9889/sensorData?nodeId=123`

Remarks:

- 1 should have only pull implementation
- 2-4 should have both push and pull implementations
- 5 should be push


###Pull scenario

URL for HTTP requests for pulling data from SMS should be in the following form:

http://`server`:`port`/api/`action`

or

http://`server`:`port`/api/`action`/`id`

or

http://`server`:`port`/api/`action`/`id`/sensor/`id2`

where:

- **server** - name of the server or its IP
- **post** - TCP port where SMS is running
- **action** - action to invoke, see below
- **id** - (optional) id of the node that we want to retrieve data for
- **id2** - (optional) id of the sensor that we want to retrieve data for

The response will contain the requested data in JSON format. See below for specific examples. 

Data items might not always follow the order that is presented here.

####Action "nodeIds"

    http://server:port/api/nodeIds

Getting list of all IDs of all nodes

Response example:


    {
		"ids": [1,2,3,4,5,6,7,8]
	}

####Action "nodeInfo"

    http://server:port/api/nodeInfo/id

Getting basic information about specific node.

Response example:

    {
    	"id" : 152, 
		"name" : "Test node", 
		"cluster" : "10005",
		"status" : "active",
		"long" : 46.660187, 
		"lat" : 15.958939
    }

####Action "nodeData"


    http://server:port/api/nodeData/id

Getting all information about specific node.

Response example:

    {
    	"id" : 152, 
		"name" : "Test node", 
		"cluster" : "10005",
		"status" : "active",
		"long" : 46.660187, 
		"lat" : 15.958939,
		"role" : "device",
		"scope" : "",
		"project" : "",
		"user_comment" : "",
		"network_address" : "62",
		"network_address2" : "62",
		"mac" : "63",
		"serial_number" : "-",
		"firmware" : "1.00",
		"bootloader" : "",
		"setup" : "",
		"box_label" : "",
		"components" : [
			"VESNA-snr-TRX-V0.0.1-201336-001-451",
			"VESNA-snc-TRX-V0.0.1-201336-001-452",
			"VESNA-sne-TRX-V0.0.1-201336-001-453",
		]
    }

####Action "sensorInfo"

    http://server:port/api/sensorInfo/152

Getting all the data about the sensors on the node.

Response example:

    {
    	"sensors" : [
			{
				"id" : "SHT21-temperature",
				"type" : "SHT21",
				"observed_phenomenon" : "temperature",
				"description" : ""
			},
			{
				"id" : "SHT21-humidity",
				"type" : "SHT21",
				"observed_phenomenon" : "humidity",
				"description" : ""
			}
		]
    }

####Action "sensorData"

    http://server:port/api/sensorData/152/sensor/SHT21-temperature

Getting measurement data from a specific sensor on a specific node.

Response example:

    {
    	"node_id" : 152, 
		"sensor_id" : "SHT21-temperature",
		"measurement" : 25.7
    }

###Push scenario

Push scenario is achieved by enabling notification inside the `settings.json` file. When enabled, the following actions are executed and forwarded to provided URLs:

- action **sensorData** - called after sensor scan
- action **nodeData** - called after node change
- action **sensorInfo** - called afetr sensor change

##Scan

When system scans single cluster (either Zigbee or IPv6), it produces the "report" object. It is subsequently used to update the main data inside the database.

###Schema

Schema of a response from a cluster scan

	[O]
		cluster [O]
			id [S]
			last_scan [D]
			name [S]
			type [S]
			url [S]
			xnodes [A][O]
				id [S]
				network_addr [S]
		node_addresses [A][S]
		nodes [A][O]
			node_addr [S]
			node_id [S]
			data [O]
				id [S]
        		mac [S]
        		firmware [S]
        		location [O]
          			lon [N]
          			lat [N]
				description [S]
				network_addr [S]
			sensor_ids [A][S]
			sensors [A] [O]
				id [S]
				data [O]
					type [S]
					measured-phenomenon [S]
					unit [S]
					sampling-rate [S]
					description [S]
				data_val [N]

###Example

	{
	  "cluster": {
		"_id": "5199fb54abc274d818000035",
		"id": "10005",
		"last_scan": "2013-05-29T13:28:53.666Z",
		"name": "Polica",
		"type": "zigbit",
		"url": "http://194.249.231.26:9004/communicator",
		"xnodes": [
		  {
			"id": 16,
			"network_addr": "0"
		  }
		]
	  },
	  "node_addresses": [
		"62",
		"0"
	  ],
	  "nodes": [
		{
		  "node_addr": "62",
		  "node_id": null,
		  "data": {
			"id": null,
			"mac": "63",
			"firmware": "1.00",
			"location": {
			  "lat": 46.660187,
			  "lon": 15.958939
			},
			"description": "Globtel indoor node with temperature , humidity sensor and RFID reader.",
			"network_addr": "62"
		  },
		  "sensor_ids": [
			"SHT21-temperature",
			"SHT21-humidity",
			"PN532-rfid"
		  ],
		  "sensors": [
			{
			  "id": "SHT21-temperature",
			  "data": {
				"type": "SHT21",
				"measured-phenomenon": "temperature",
				"unit": "degrees celsium",
				"sampling-rate": "0",
				"description": "No description available."
			  },
			  "data_val": 25.4
			},
			{
			  "id": "SHT21-humidity",
			  "data": {
				"type": "SHT21",
				"measured-phenomenon": "humidity",
				"unit": "percent",
				"sampling-rate": "0",
				"description": "No description available."
			  },
			  "data_val": 35.6
			},
			{
			  "id": "PN532-rfid",
			  "data": {
				"type": "pn532",
				"measured-phenomenon": "rfid",
				"unit": "none",
				"sampling-rate": "cannot be set",
				"description": "rfid reader for access managment"
			  },
			  "data_val_err": {}
			}
		  ]
		},
		{
		  "node_addr": "0",
		  "node_id": 16,
		  "data": {
			"id": null,
			"mac": "1",
			"firmware": "1.00",
			"location": {
			  "lat": 46.660187,
			  "lon": 15.958939
			},
			"description": "opcomm coordinator",
			"network_addr": "0"
		  },
		  "sensor_ids": [],
		  "sensors": []
		}
	  ]
	}