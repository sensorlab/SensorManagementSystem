Sensor Management System
==========================

This document provides user's and administrator's manual.

Introduction
------

**Sensor management system** keeps track of sensors nodes that are deployed on the field. 
It also keeps track of components that are included into nodes. 

Concepts
--------

###Component

Components are combined and put together to form nodes. The list of components is maintained manually. They are entered in a batch, since this is how they are being handled. 

Each individual component can be used in at most one node. The system will warn the user of such collision and refuse such data to be saved.
 
###Node

Node is the main entity that this system cares about. Nodes contain sensors that collect data, they are parts of clusters and they communicate with the central system.

###Sensor

Each nodes can have several sensors attached to it that collect data about different phenomena (temperature, humidity, pressure, etc.). These sensors are entered automatically when system scans the nodes for their data.

Data from sensors is also retrieved automatically by the system.

###Cluster

Nodes are organized into clusters. Depending on their types, these clusters can be just an organizational grouping of nodes or they can defined strict communication protocols are accessing individual nodes.

Each node belongs to one cluster.

