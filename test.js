﻿"use strict";

const Collection = require('./collection.js');

var collection = new Collection();
collection.Load();



console.log(collection.Query(['year', '1998']));


//console.log(buildFilter(search));
//console.log(dc.query().filter(buildFilter(search)).values());