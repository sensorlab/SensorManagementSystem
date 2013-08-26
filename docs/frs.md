Specification
============= 

Description
-----------

Sensorlab project manages several hundred of sensor nodes, each containing 
several sensors (temperature, humidity, brightness, ...). 
These nodes are deployed in several locations in Slovenia. Some nodes are connected (organized) into clusters, 
but in the future this is not a design or deployment requirement.

Nodes can be accessed via HTTP protocol. Sensor values as well as node hardware data can be accessed from central server over the internet.

Nodes are manually installed and set up by special technicians. They enter node data 
into the firmware and then into special spreadsheet. Some of the data is stored inside the node and 
can be accessed via HTTP requests, while other data is only present in the sensor-node registry.

Project goals
------------

Senser Management System (`SMS`) will be developed to keep record and track health of the installed sensor nodes.

###Technical requirement

- Runs on Linux, if possible also on Windows
- Uses MySQL for storage of data
	- *Data access layer* (`DAL`) should be created in order to abstract the core of the system from its storage. This should enable a rapid switch to an alternative database provider (e.g. MongoDb) in case of performance issues.
- Provides web interface for all types of users
	- Pages are viewable on normal computer screen
	- Certain pages are viewable on smartphone displays

Expected performance parameters:

- Handles registry of several hundred sensor nodes
- Retrieval of data from up to 100 sensors per second at peak times

###Users

Main user groups are:

- **Hardware guys** - `HG`  - they physically install sensors and nodes on location. 
They also enter the information about these nodes to central system.
- **Sensor users** - `SU` - they use sensors for their own experiments. Nodes are accessed directly and generally this usage is not supported or monitored by the SMS.
- **Sensor administrators** - `SA` - they keep track of sensors.

User Scenarios
--------------

###(0) New hardware was produced and is brought to the lab (for development, installation, etc).

- This hardware is typically a component of a sensor node  but not a full node. It can be a core board SNC, extension, SNE or something else. Most of these modules are then assembled to form a complete system (sensor node).
- There should be a way to keep track of this hardware (how many, what code, who took them - name of the person). It seems we also have another Excel file where we write this (I didn't know when we met).
- It should be easy to add the new components. The component code is formed of four strings product number (e.g. VESNA-SNC-STM32-V1.1.1), production date (240412), series (01) and serial no (001) - see attached Excel file.

###(1) Hardware guy installs new node on-site

1. Firmware for the new node is prepared with some data baked into it. Can happen on location or in the lab.
2. Node is manually installed on location.
3. `HG` opens `SMS` web page, logs in and opens "New node entry" page
4. He enters minimal required set of data fields.
5. The system enters new node into registry. SMS checks uniqueness of entered data and warns about or prohibits invalid combinations.
6. The system data inside the node is accessed via HTTP and filled into database. (fallback strategy: all data is entered manually)

###(2) SMS monitors health of a node

1. Special time-scheduled task contacts each node and checks it status and sensor data
2. Status and sensor data is entered into main database

###(3) Administrator browses node history

1. Administrator can search node registry using different search criteria
	- Location
	- Hardware IDs
	- Network ID
2. For individual node a special page will display current status and node history
	- Related nodes (reused hardware parts or same location or some other criteria) will be easily accessible.

###(4) Administrator changes node data

On individual node's page a special section will enable administrator to edit node's data.

###(5) External system enters "Node used by" record

A simple HTTP request from external system will record an event of type: 

`User X is using node Y on yyyy-mm-ddThh:mm:ss`

###(7) Sensor data is forwarded to external storage system

Periodically (or automatically upon retrieval from sensors) the sensor data is forwarded to external system for analysis and storage.

###(8) Sensor data is garbage-collected

Periodically, the data is deleted using settable time-bound criteria (when it falls out of certain time-window):

- Sensor measurements
- Sensor health (status)

###(9) User administration

Administrator must be able to browse/add/edit/delete list of users.

###(10) Google maps stuff

Special page that displays node location using Google maps

Pages
-----

- System dashboard (only `SA`)
- List of nodes (everybody)
	- Search by location
	- Search by hardware
	- Search by 
- Single node dashboard (everybody)
	- displays history of changes
	- displays history for health
	- display location
- Single node insert (everybody)
- Single node edit (everybody)
- List of users (only `SA`)
- Single user insert (only `SA`)
- Single user edit (only `SA`)
- Single user dashboard (only `SA`)
