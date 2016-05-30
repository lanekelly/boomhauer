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

    let seasonNumber;
    if (seasonSlot && seasonSlot.value) {
      // check if converting is really necessary
      // might need to convert to a Number instead
      seasonNumber = seasonSlot.value.toLowerCase();
    } else {
      response.tell({
        speech: "Couldn't parse the season number",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
      });

      return;
    }

    let resp = '';

    const season = Episodes[seasonNumber];
    if (season) {
      // for now, just get first in list
      const episode = season[0];
      resp = `In episode ${episode.number}, titled ${episode.title}, ${episode.description}`;
    } else {
      resp = `No data for season ${seasonNumber}`;
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
