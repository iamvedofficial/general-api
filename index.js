const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const route = require('./app/module/user/route');
const config = require('./config/config');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/api/v1',route);



app.listen(config.port, () => console.log(`App started on port: ${config.port}`));