console.log('[Amazon CloudWatch Notification]');

/*
 configuration for each condition.
 add any conditions here
 */
var ALARM_CONFIG = [
  {
    condition: "OK",
    channel: "#cloudwatch",
    mention: "<@channel>  ",
    color: "#FF9F21",
    severity: "INFO"
  },
  {
    condition: "FAILED",
    channel: "#cloudwatch",
    mention: "<@channel> ",
    color: "#F35A00",
    severity: "CRITICAL"
  }
];

var slackapiendpoint = "/services/xxxxxxxx";

var SLACK_CONFIG = {
  path: slackapiendpoint
};

var http = require ('https');
var querystring = require ('querystring');
module.exports.slack = function(event, context) {
  console.log(event.Records[0]);

  // parse information
  var message = event.Records[0].Sns.Message;
  var subject = event.Records[0].Sns.Subject;
  var timestamp = event.Records[0].Sns.Timestamp;

  // vars for final message
  var channel;
  var severity;
  var color;

  // create post message
  var alarmMessage = " *[Service Notification]* \n"+
      "Subject: "+subject+"\n"+
      "Message: "+message+"\n"+
      "Timestamp: "+timestamp;

  // check subject for condition
  for (var i=0; i < ALARM_CONFIG.length; i++) {
    var row = ALARM_CONFIG[i];
    console.log(row);
    if (subject.match(row.condition)) {
      console.log("Matched condition: "+row.condition);

      alarmMessage = row.mention+" "+alarmMessage+" ";
      channel = row.channel;
      severity = row.severity;
      color = row.color;
      break;
    }
  }

  if (!channel) {
    console.log("Could not find condition.");
    context.done('error', "Invalid condition");
  }

  var payloadStr = JSON.stringify({
    "attachments": [
      {
        "fallback": alarmMessage,
        "text": alarmMessage,
        "mrkdwn_in": ["text"],
        "username": "AWS-Status-bot",
        "fields": [
          {
            "title": "Severity",
            "value": severity,
            "short": true
          }
        ],
        "color": color
      }
    ],
    "channel":channel
  });
  var postData = querystring.stringify({
    "payload": payloadStr
  });
  console.log(postData);
  var options = {
    hostname: "hooks.slack.com",
    port: 443,
    path: SLACK_CONFIG.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  var req = http.request(options, function(res) {
    console.log("Got response: " + res.statusCode);
    res.on("data", function(chunk) {
      console.log('BODY: '+chunk);
      context.done(null, 'done!');
    });
  }).on('error', function(e) {
    context.done('error', e);
  });
  req.write(postData);
  req.end();
};