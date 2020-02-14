'use strict';

const https = require('https');
const host = 'www.rocketlaunch.live';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request Headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request Body: ' + JSON.stringify(request.body));
      
    function next_launch(agent) {
        return new Promise((resolve, reject) => {
            // Create the path for the HTTPS request to get the launch
            let path = '/json/launch/next';
            console.log('API Request: ' + host + path);
	    console.log('Numbers: ' + agent.parameters.number);
	    console.log('Slug: ' + agent.parameters.slug);
          
	    if(agent.parameters.number) {
                path = path + '/' + agent.parameters.number;
	    }
	    if(agent.parameters['slug']) {
                path = path + '/' + agent.parameters.slug;
	    }
          
          // Make the HTTPS request to get the launch
          https.get({host: host, path: path}, (res) => {
              let body = ''; // var to store the response chunks
              res.on('data', (d) => { body += d; }); // store each response chunk
              res.on('end', () => {
                  // After all the data has been received parse the JSON for desired data
                  let response = JSON.parse(body);
                  if (response.result.length > 1) {
                      let payload = response.result;
                      let body = "Here are the following launches.\n";
                      var i = 0;
                      for(i = 0; i < payload.length; i++) {
                          body = body + payload[i].slug + " on " + payload[i].date_str + ". \n";
		      }
                      agent.add(body);
                      resolve(agent);
		  } else {
		      let payload = response.result[0];
                  
                      let launchDescription = payload.launch_description;
                      let buttonText = 'Rocket Launch Live - ' + payload.name;
                      let outboundUrl = 'https://' + host + '/' + payload.slug;
                
                      agent.add(launchDescription);
                      resolve(agent);
		  }
              });
              res.on('error', (error) => {
                  console.log(`Error calling the Rocket Launch API: ${error}`);
              });
          });
      });
    }


    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Next Launch', next_launch);
    agent.handleRequest(intentMap);
});
