var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var fs = require('fs');


var options = {
  auth: {
    api_user: 'arki7n',
    api_key: '123Def@ult'
  }
}

var client = nodemailer.createTransport(sgTransport(options));

module.exports = client;
