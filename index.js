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
  if (!message.text ) { return }
  if (message.user === rtm.activeUserId) { return }
  const ticker = message.text.match(/^\$([\w]*)/)[1];
  if(ticker) {
    stocks.getquote([ticker])
      .then((json) => {
        const img = `http://chart.finance.yahoo.com/z?s=${ticker}&z=l&t=1d&z=l`;
        const positive = json[0].PercentChange.match(/^\+/);
        const emoji = (positive)? '💵' : '⚰';
        const color = (positive)?  '#36a64f' : '#e11d1d';
        const body = {
          as_user: true,
          attachments: [
            {
              pretext: json[0].Name,
              text: `${emoji} ${json[0].PercentChange} [Open ${json[0].Open}]`,
              image_url: img,
              color: color,
              fields: [
                {
                  short: true,
                  title: 'Open',
                  value: `$${json[0].Open}`
                },
                {
                  short: true,
                  title: 'Last Trade',
                  value: `$${json[0].LastTradePriceOnly}`
                },
                {
                  short: true,
                  title: 'Percent Change From Year Low',
                  value: `${json[0].PercentChangeFromYearLow}%`
                },
                {
                  short: true,
                  title: 'Fifty Day Moving Average',
                  value: `$${json[0].FiftydayMovingAverage}`
                }
              ]
            }
          ]
        };
        web.chat.postMessage(message.channel, '', body, (err) => {
          if (err) { console.log(err) }
        });
      });
  }
});

rtm.start();
