const express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var crypto = require('crypto');
var async = require('async');
var jade = require('jade');
var fs = require('fs');
var cors = require('cors');

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var options = {
  auth: {
    api_user: 'arki7n',
    api_key: '123Def@ult'
  }
}
var mailClient = nodemailer.createTransport(sgTransport(options));


var redis = require("redis");
var client = redis.createClient();


mongoose.connect('mongodb://localhost:27017/nodedb', {useNewUrlParser: true});
var db = mongoose.connection;

var UserSchema = new mongoose.Schema(
							{ 
							 username: 'string',
							 email: 'string',
							 password_digest: 'string',
							 role: 'string',
							 status : 'string',
							 confimed : 'string'
							});

var Users = mongoose.model('users', UserSchema);


var emailSchema = new mongoose.Schema({ email: 'string' });
var phoneSchema = new mongoose.Schema({ phone: 'string' });



var LeadSchema = new mongoose.Schema({ email : [emailSchema] , phone:[phoneSchema],added_by:'string' ,first_name:'string',middle_name:'string',last_name:'string',country:'string', state:'string',city:'string' });
var LeadsModel = mongoose.model('lead', LeadSchema);

var UserApiSchema = new mongoose.Schema({ user_id:'string',api_key:'string',expires_at:'string',status:'string',usage_limit:'string' });
var UserApis = mongoose.model('users_api', UserApiSchema);

var UserSignUpSchema = new mongoose.Schema({ user_id:'string', token_id:'string', expires:'string',status:'string', confimed:'string'});
var UserTokenModel = mongoose.model('users_token', UserSignUpSchema);



const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static("./app/public"));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_session',
    secret: 'arki7n',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    },
	store: new MongoStore({
          mongooseConnection: mongoose.connection,
          collection: 'session',
      })

}));


app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_session');        
    }
    next();
});



// Access the session as req.session
app.get('/', function(req, res, next) {
  var html = "<html><head> <style> body { background-image : url('image.png');}</style> </head><body></body></html>";
  res.send(html);
});



app.get('/api', (req,res)=>{
	res.json({
		message: 'Welome to API'
	});
});



app.get('/api/user/:id',(req,res)=>{

	var final_data = [];

	  Users.findOne({_id : req.params.id}).exec(function (err, posts) {	    

	    final_data = posts;

	  });

	// res.json({
	// 	message: req.params.id
	// });

	res.send(final_data);

});


app.post('/login', (req,res)=>{


		var uname = req.body.uname;
		var passwd = req.body.passwd;

		var sessData = req.session;

	    Users.find({username : uname}, function (err, docs) {
	        if (!docs.length){

	        	console.log('user not exists: hi ',uname);
	        }else{                

	        	if(passwd==docs[0].password_digest){


				  	client.hincrby("db:node:user:"+docs[0]._id, 'count', 1);

	        		sessData.user = docs[0]._id;
	        		var day = 60000*60*24;
					sessData.expires = new Date(Date.now() + (30*day));          
					sessData.cookie.maxAge = (30*day);  


	        		res.send(sessData);

	        	}else{
	        		console.log('failed');
	        	}

	        }
	    });



	
});


app.get('/logout', function(req, res, next) {

	    req.session.destroy(function(err) {
	      if(err) {
	        return (err);
	      } else {
	        return res.send('logout');
	      }
	    });
	  
});



app.post('/signup', (req,res)=>{

	var uname = req.body.uname;
	var email = req.body.email;
	var destemail = req.body.email;
	var passwd = req.body.passwd;
	var role = req.body.role;


	    Users.find({username : uname, email : email}, function (err, docs) {
	        if (!docs.length){


				var users = new Users({ username: uname, email: email, password_digest: passwd, status:'0', confimed:'0'});
				users.save(function (err,row) {
				  if (err) return console.log(err);
				  else{

						var rand=Math.floor((Math.random() * 100) + 54);
					    var host=req.get('host');
					    var link="http://"+req.get('host')+"/confirm-account?token_id="+rand;


						var obj = new UserTokenModel({ user_id:row._id, token_id:rand, expires:'86400',status:'0',confimed:'0'});
						obj.save(function (err) {
							  if (err) return console.log(err);
							});



						var templateDir = 'email_templates/';
						var html = jade.renderFile(templateDir+'/signup.jade', {username: uname, activateUrl : link});

						var email = {
						  from: 'toakhileshyadav@gmail.com',
						  to: destemail,
						  subject: 'Confirm Mail Account',
						  text: '',
						  html: html
						};

						mailClient.sendMail(email, function(err, info){
						    if (err ){
						      console.log(err);
						    }
						    else {
						      console.log('Message sent: ' + info.response);
						    }
						});


					res.json({
						status: 'User registered'
					});


				  }
				});





	        }else{       
	        	res.status = 400;         
	            res.json({
	            	status: 'User already Exists'
	            });
	        }
	    });






});


app.get('/confirm-account',(req,res)=>{


	if(req.query.token_id!=undefined){
		var token_id = req.query.token_id;

		UserTokenModel.findOneAndUpdate({token_id : token_id}, {$set:{confimed:"1", status:"1"}}).sort({ field: 'asc', _id: -1 }).exec(function(err, res){
		    if(err){
		        console.log(err);
		    }
		    else{

				Users.findOneAndUpdate({_id : res.user_id}, {$set:{confimed:"1", status:"1"}}, {new: true}, (err, doc) => {
				    if (err) {
				        console.log("Something went wrong while updating data!");
				    }else{


				    	var name = (doc.username);
				    	var destemail = (doc.email);

						var templateDir = 'email_templates/';
						var html = jade.renderFile(templateDir+'/activated.jade', {username: doc.name});

						var email = {
						  from: 'awesome@bar.com',
						  to: destemail,
						  subject: 'Thanks for Mail Confirmation',
						  text: '',
						  html: html
						};

						mailClient.sendMail(email, function(err, info){
						    if (err ){
						      console.log(err);
						    }
						    else {
						      console.log('Message sent: ' + info.response);
						    }
						});



				    }

				    
				});




		    }
		});


		res.send('Verified');

	}

});

app.post('/api/add-lead', checkRedis ,(req,res)=>{

	var phoneObj = {}
	var emailObj = {}

	if(req.body.phone){
		var emailObj = req.body.email.map(function(index,value) {
		  var o = Object.assign({}, value);
		  console.log(index,value);
		  o.email = index;
		  return o;
		});
	}

	if(req.body.email){
		var phoneObj = req.body.email.map(function(index,value) {
		  var o = Object.assign({}, value);
		  console.log(index,value);
		  o.email = index;
		  return o;
		});
	}


	var email = emailObj;
	var phone = phoneObj;

	var data = { email: email, phone:phone ,added_by: req.session.user, first_name: req.body.first_name,middle_name: req.body.middle_name,last_name: req.body.last_name,country: req.body.country, state: req.body.state,city: req.body.city };

	var lead = new LeadsModel(data);


	var usage_limit;
	var count;


	function redisFind(keyspace,field) {
	  return new Promise(resolve => {
	    client.hget(keyspace, field,function(err,result){
	      	console.log('In '+result);
	      	resolve(result);
	      });
	  });
	}


	function get_all_data(keyspace,field){
		return new Promise(resolve => {
			redisFind(keyspace,field).then(data => resolve(data));
		})
	};

	get_all_data("db:node:user:"+req.session.user, "usage_limit").then((usage_limit)=>{


		get_all_data("db:node:user:"+req.session.user, "count").then((count)=>{


				if(count>=usage_limit){
					res.send('Limit Exceeded');
				}else{
					client.hincrby("db:node:user:"+req.session.user, 'count', 1);
					lead.save(function(err){
					      if(err){
					           console.log(err);
					           return;
					      }
					      res.json({ token: (req.body.first_name), user: req.body.first_name, available:(usage_limit-count) });
					});
				}


		});


	});



	// usage_limit =  client.hget("db:node:user:"+req.session.user, "usage_limit")
	 //count = client.hget("db:node:user:"+req.session.user, "count")


	//console.log(usage_limit, count);




});

app.get('/api/list-lead', checkRedis ,(req,res)=>{

		var limit = "";
		var offset = "";

		if(req.query.limit!=undefined){
			limit = parseInt(req.query.limit);
		}
		if(req.query.offset!=undefined){
			offset = parseInt(req.query.offset);
		}
	

	  LeadsModel.find({added_by:req.body.user_id}).limit(limit).skip(offset).sort('id').select('-__v').exec(function (err, posts) {	    
	  	var final_data = [];
	    for(i=0;i<posts.length;i++){
	   		var index = (posts.length-i);
	    	posts[i]['_doc']['sr_num'] = index;
	    	final_data.push(posts[i]);
	    }
	    res.send({data: final_data});
	  });


});

app.post('/redis',checkRedis, (req,res)=>{
		
	res.send('Welcome');	

});

app.get('/get-api',requiresLogin, (req,res)=>{


	var token = '';
	var token = crypto.randomBytes(24).toString('hex');


	var data = { user_id:req.session.user ,api_key:token,expires_at:86400,status:"1",usage_limit:"5" }


	client.hset("user:api:"+token, "user_id", req.session.user, redis.print);
	client.hset("user:api:"+token, "api_key", token, redis.print);

  	client.hset("db:node:user:"+req.session.user, "api_key", token, redis.print);
  	client.hset("db:node:user:"+req.session.user, "user_id", req.session.user, redis.print);
  	client.hset("db:node:user:"+req.session.user, "expires_at", 86400, redis.print);
  	client.hset("db:node:user:"+req.session.user, "status", 1, redis.print);
  	client.hset("db:node:user:"+req.session.user, "count", 0, redis.print);
  	client.hset("db:node:user:"+req.session.user, "usage_limit", 5, redis.print);
  	//client.hincrby("db:node:user:"+docs[0]._id, 'count', 1);

  	var apidata = new UserApis(data);
  	apidata.save(function (err) {
				  if (err) return console.log(err);
				  // saved!
				});



	res.send(token);

});


// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});

app.listen(5000, ()=>console.log('Server started on port 5000'));

function requiresLogin(req, res, next) {

  if (req.session && req.session.user) {
    return next();
  } else {
    var err = new Error('You must be logged in to view this page.');
    err.status = 401;
    return next(err);
  }
}

function checkRedis(req,res,next){

	if(req.header('API_KEY')){

		var key = req.header('API_KEY');
		var cursor = '0';
		var user_id = "";

		client.hscan ("user:api:"+key, 0, "MATCH", "user_id", "COUNT", 10, function (err, replies) { 


			 user_id = replies[1][1];

			client.hscan ("db:node:user:"+user_id, 0, "MATCH", "status", "COUNT", 10, function (err, replies) { 

				var status = replies[1][1];

				if(status==1){
					req.body.user_id = user_id;
					next();
				}else{
					var err = new Error('Not Authorized.');
					    err.status = 401;
					    return next(err);
				}


			  });


		  });   


	}

}
