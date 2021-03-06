const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const route = require('./app/module/user/route');
const businessRoute = require("./app/module/business/route");
const config = require('./config/config');
const path = require("path");

app.use(express.static(path.join(__dirname, 'public')));

global.appRoot = path.resolve(__dirname);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/api/v1',route);
app.use('/api/v1/business', businessRoute);



app.listen(config.port, () => console.log(`App started on port: ${config.port}`));