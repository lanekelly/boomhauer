// boomhauer skill -- ask for an episode of King of the Hill

'use strict';

const AlexaSkill = require('./AlexaSkill');
const Episodes = require('./episodes');

const Boomhauer = function Boomhauer() {
  AlexaSkill.call(this); // add APP_ID here later
};

Boomhauer.prototype = Object.create(AlexaSkill.prototype);
Boomhauer.prototype.constructor = Boomhauer;

Boomhauer.prototype.eventHandlers.onLaunch = function onLaunch(launchRequest, session, response) {
  const speechText = 'Ask me for an episode of King of the Hill. You can even specify a season.';
  const repromptText = 'For example, ask me to give you an episode from season one.';

  response.ask(speechText, repromptText);
};

Boomhauer.prototype.intentHandlers = {
  EpisodeIntent(intent, session, response) {
    const seasonSlot = intent.slots.Season;
    const seasonErrorResp = 'I did not understand the season you wanted.';
    let seasonNumber;
    if (seasonSlot && seasonSlot.value) {
      if (seasonSlot.value !== '?') {
        seasonNumber = seasonSlot.value;
      } else {
        console.info('The season appeared as "?"');
        response.tell({
          speech: seasonErrorResp,
          type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });

        return;
      }
    } else {
      console.info('No season value provided');
      response.tell({
        speech: seasonErrorResp,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
      });

      return;
    }

    let resp;
    const season = Episodes[seasonNumber];
    if (season) {
      // for now, just get first in list
      const episode = season[0];
      resp = `In episode ${episode.number}, titled ${episode.title}, ${episode.description}`;
    } else {
      console.warn(`Request for unsupported season: ${seasonNumber}`);
      if (seasonNumber > 13) {
        resp = 'King of the Hill only aired for 13 seasons. Try again.';
      } else {
        resp = `I don't have data for season ${seasonNumber} at this time.`;
      }
    }

    const speechOutput = {
      speech: resp,
      type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.tellWithCard(speechOutput, 'King of the Hill', resp);
  }
};

exports.handler = function handler(event, context) {
  const boomhauer = new Boomhauer();
  boomhauer.execute(event, context);
};
