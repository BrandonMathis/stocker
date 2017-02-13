require('dotenv').config();
const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const stocks = require('yahoo-nasdaq');

process.on('uncaughtException', (err) => {
    console.log(`Caught exception: ${err}`);
});

const rtm = new RtmClient(process.env.SLACK_TOKEN);
const web = new WebClient(process.env.SLACK_TOKEN);

rtm.on(RTM_EVENTS.MESSAGE, (message) => {
  console.log(message);

  if (!message.text ) { return }
  if (message.user === rtm.activeUserId) { return }
  const ticker = message.text.match(/^\$([\w]*)/)[1];
  if(ticker) {
    stocks.getquote([ticker])
      .then((json) => {
        const img = `http://chart.finance.yahoo.com/z?s=i${ticker}&z=l&t=1d&z=l`;
        const emoji = (json[0].PercentChange.match(/^\+/))? '💵' : '⚰';
        const body = {
          as_user: true,
          attachments: [
            {
                pretext: json[0].Name,
                text: emoji + ' ' + json[0].PercentChange,
                image_url: img
            }
          ]
        };
        console.log("Posting");
        web.chat.postMessage(message.channel, '', body, (err) => {
          if (err) { console.log(err) }
        });
      });
  }
});

rtm.start();
