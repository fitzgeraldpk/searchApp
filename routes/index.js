var express = require('express');
var router = express.Router();
var async =require('async');
var debug = require('debug')('cfapp:server');
var httpRequest=require('request');
var settings = require('../settings.json');
var google = require('google')
//limit search to first 10 results
google.resultsPerPage = settings.google.resultsPerPage;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'GSS Integrated Search' });
});

/*
* GitHub search api in the form of https://api.github.com/search/code?q=addClass+in:file+language:js+repo:jquery/jquery
*/
router.get('/search/:query', 
					function (req,res,next){
						var query = req.params.query
						//query=query.replace(/\//g,"%5c");
						//console.log(query)					   
					async.parallel([
			        	function(callback){
			        		searchGitHub(req,res,next,query,callback)	
			        	},
			        	function(callback){
			        		debug('callback');
			        		searchSlack(req,res,next,query,callback);

			        	},
			        	function(callback){
			        		searchZendesk(req,res,next,query,callback);
			        	},
			        	function(callback){
			        		scrapeGoogle(req,res,next,query,'support.pivotal.io',callback);
			        	},
			        	function(callback){
			        		scrapeGoogle(req,res,next,query,'docs.pivotal.io/pivotalcf',callback);
			        	}
			            //res.render('index', { total_results: response.total_results,title:'CF API'});
			        
			        	],function(err){var result={}; 
			        						result.userQuery=query;
			        						result.github=res.locals.github; //console.log(result.github);
			        						result.slack=res.locals.slack; //console.log(result.slack);
			        						result.zendesk=res.locals.zendesk;//console.log(result.zendesk);
			        						result.google=res.locals.google;//console.log(result.google);
			        						res.render('index', { result: result,title:'GSS Integrated Search'})});

});

	function searchGitHub(req,res,next,query,callback){
					
					    var options={url:'https://api.github.com/search/code?q='+query+'+in:file+user:'+settings.github.user,
					    			 method:'GET',
					    			 headers: {'User-Agent': 'fitzgeraldpk'}
					  				};
					        httpRequest(options,function(error, response, body) {
					            if (error) {debug(error)}					       
					            if (typeof response!='undefined' && response.statusCode===200){
					            	var result=JSON.parse(response.body|| {});
					            	res.locals.github=result;
					            }else{
					            	res.locals.github={};
					            }  

					              callback();	
					        });

					      	

	}


	function searchSlack(req,res,next,query,callback){
					
					    var options={url:'https://slack.com/api/search.messages?token='+settings.slack.token+'&query='+query+'&count=100',
					    			 method:'GET'
					  				};
					        httpRequest(options,function(error, response, body) {
					            if (error) {debug(error)}					       
					            if (typeof response!='undefined' && response.statusCode===200){
					            	var result=JSON.parse(response.body|| {});
					            	res.locals.slack=result;
					            }else{
					            	res.locals.slack={};
					            }  
					            callback();	 
					        });	
					        

	}

	function searchZendesk(req,res,next,query,callback){
					
					    var options={url:'https://discuss.zendesk.com/api/v2/search.json?query=type:ticket '+query,
					    			 method:'GET',
					    			 auth: {'user':settings.zendesk.user,'pass':settings.zendesk.password,'sendImmediately':'false'}
					  				};
					        httpRequest(options,function(error, response, body) {
					            if (error) {debug(error)}					       
					            if (typeof response!='undefined' && response.statusCode===200){
					            	var result=JSON.parse(response.body|| {});
					            	res.locals.zendesk=result.results;
					            }else{
					            	res.locals.zendesk={};
					            }  
					            callback();	 
					        });	
					        

	}

	function scrapeGoogle (req,res,next,query,site,callback){
		var nextCounter = 0;
        var resultCount = 0;
		google(query+ ' site:'+site, function (err, response){
		  if (err) console.error(err)
		  	if (!res.locals.google){
		  	res.locals.google=[];
		  }else{
		  	resultCount = res.locals.google.length;
		  }

		  console.log(response.links.length);
		  for (var i = 0; i < response.links.length; ++i) {
		    var link = response.links[i];
		    if (link.url !==null){
		    	res.locals.google[resultCount+i]={"site":site,"title":link.title,"url":link.href};
				}
		  }
		  	callback();
		});

	}

module.exports = router;
