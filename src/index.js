// boomhauer skill -- ask for an episode of King of the Hill

'use strict';

// load environment variables
require('dotenv').config();

// dotenv puts all variables in process.env
const APP_ID = process.env.ALEXA_APP_ID;

const Episodes = require('./episodes');
const Alexa = require('alexa-sdk');

function getEpisodeNumber(totalEpisodes) {
  // random returns [0, 1)
  return Math.floor(Math.random() * totalEpisodes);
}

const handlers = {
  LaunchRequest() {
    const speechText = 'Ask the Arlen Bystander for an episode of King of the Hill. You can even specify a season. Which season number would you like?';
    const repromptText = 'For example, ask me to give you an episode from season one.';

    this.emit(':ask', speechText, repromptText);
  },

  'AMAZON.HelpIntent': function HelpIntent() {
    const speechText = 'The Arlen Bystander is the mythical town newspaper from the television series King of the Kill. ' +
      'Ask for an episode from a particular season, and the Bystander will pick one at random, providing an episode title, ' +
      'number, and description. Now, which season number would you like?';
    const repromptText = 'Which season number would you like?';

    this.emit(':ask', speechText, repromptText);
  },

  'AMAZON.StopIntent': function StopIntent() {
    const speechText = 'Goodbye shuai guh';

    this.emit(':tell', speechText);
  },

  'AMAZON.CancelIntent': function CancelIntent() {
    const speechText = 'Goodbye shuai guh';

    this.emit(':tell', speechText);
  },

  EpisodeIntent() {
    const seasonSlot = this.event.request.intent.slots.Season;
    const seasonErrorResp = 'I did not understand the season you wanted.';
    let seasonNumber;
    if (seasonSlot && seasonSlot.value) {
      if (seasonSlot.value !== '?') {
        seasonNumber = seasonSlot.value;
      } else {
        console.info('The season appeared as "?"');
        this.emit(':tell', seasonErrorResp);
        return;
      }
    } else {
      console.info('No season value provided');
      this.emit(':tell', seasonErrorResp);

      return;
    }

    let resp;
    const season = Episodes[seasonNumber];
    if (season) {
      const episodeNumber = getEpisodeNumber(season.length);
      const episode = season[episodeNumber];
      console.info(`Requested season: ${seasonNumber}, returning episode: ${episode.number}`);
      if (episodeNumber + 1 === season.length) {
        resp = `In episode ${episode.number}, the season finale titled ${episode.title}, ${episode.description}`;
      } else {
        resp = `In episode ${episode.number}, titled ${episode.title}, ${episode.description}`;
      }
    } else {
      console.warn(`Request for unsupported season: ${seasonNumber}`);
      if (seasonNumber > 13) {
        resp = 'King of the Hill only aired for 13 seasons. Try again.';
      } else {
        resp = `I don't have data for season ${seasonNumber} at this time.`;
      }
    }

    this.emit(':tellWithCard', resp, 'King of the Hill', resp);
  }
};

exports.handler = function handler(event, context) {
  const alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
