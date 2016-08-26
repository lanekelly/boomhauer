// boomhauer skill -- ask for an episode of King of the Hill

'use strict';

// load environment variables
require('dotenv').config();

// dotenv puts all variables in process.env
const APP_ID = process.env.ALEXA_APP_ID;
console.info(`Loaded APP_ID: ${APP_ID}`);

const _ = require('lodash');

console.info(`lodash version: ${_.VERSION}`);

const Episodes = require('./episodes');
const Characters = require('./characters');
const Alexa = require('alexa-sdk');

const ValueResult = {
  Success: 'Success',
  Error: 'Error',
  Empty: 'Empty'
};

function getEpisodeNumber(totalEpisodes) {
  // random returns [0, 1)
  return Math.floor(Math.random() * totalEpisodes);
}

function findEpisode(season, character) {
  let episodeList = Episodes;
  if (season) {
    episodeList = _.filter(episodeList, (e) => e.season === season);
  }

  if (character) {
    episodeList = _.filter(episodeList, (e) => _.includes(e.description, character));
  }

  if (episodeList.length === 0) {
    return {
      result: ValueResult.Empty
    };
  }

  const episodeNumber = getEpisodeNumber(episodeList.length);

  return {
    result: ValueResult.Success,
    value: episodeList[episodeNumber]
  };
}

function getSeasonNumber(context) {
  const seasonSlot = context.event.request.intent.slots.Season;
  let seasonNumber;
  if (seasonSlot && seasonSlot.value) {
    if (seasonSlot.value !== '?') {
      seasonNumber = parseInt(seasonSlot.value, 10);
    } else {
      console.info('The season appeared as "?"');
      return {
        result: ValueResult.Error,
        errorResp: () => context.emit(':tell', 'I did not understand the season you wanted.')
      };
    }
  } else {
    console.info('No season value provided');
    return {
      result: ValueResult.Empty
    };
  }

  if (seasonNumber < 1) {
    console.warn(`Request for unsupported season: ${seasonNumber}. Converting to 1.`);
    seasonNumber = 1;
  }

  if (seasonNumber > 13) {
    console.warn(`Request for unsupported season: ${seasonNumber}`);
    return {
      result: ValueResult.Error,
      errorResp: () => context.emit(':tell', 'King of the Hill only aired for 13 seasons. Try again.')
    };
  }

  return {
    result: ValueResult.Success,
    value: seasonNumber
  };
}

function getCharacter(context) {
  const characterSlot = context.event.request.intent.slots.Character;
  let characterName;
  if (characterSlot && characterSlot.value) {
    if (characterSlot.value !== '?') {
      characterName = characterSlot.value;
    } else {
      console.info('The character appeared as "?"');
      return {
        result: ValueResult.Error,
        errorResp: () => context.emit(':tell', 'I did not understand the character you wanted.')
      };
    }
  } else {
    console.info('No character value provided.');
    return {
      result: ValueResult.Empty
    };
  }

  console.info(`Raw character input: ${characterName}`);

  // normalize to lower case since input can be either of: Hank, hank
  characterName = _.chain(characterName)
    .split(' ')
    .map((name) => name.toLowerCase())
    .join(' ')
    .value();

  if (!_.includes(Characters, characterName)) {
    console.warn(`Request for unsupported character: ${characterName}.`);
    return {
      result: ValueResult.Error,
      errorResp: () => context.emit(':tell', 'Unsupported character, please try again.')
    };
  }

  // need to capitalize names for string search
  characterName = _.chain(characterName)
    .split(' ')
    .map((name) => name.charAt(0).toUpperCase() + name.substr(1))
    .join(' ')
    .value();

  return {
    result: ValueResult.Success,
    value: characterName
  };
}

const handlers = {
  LaunchRequest() {
    const speechText = 'Ask the Arlen Bystander for an episode of King of the Hill. You can even ask for an episode featuring a ' +
      'particular character, or from a specific season. Go ahead, tell me what kind of episode you would like.';
    const repromptText = 'For example, ask me to give you an episode featuring Bobbie from season one.';

    this.emit(':ask', speechText, repromptText);
  },

  'AMAZON.HelpIntent': function HelpIntent() {
    const speechText = 'The Arlen Bystander is the mythical town newspaper from the television series King of the Hill. ' +
      'Ask for an episode of the show, and the Bystander will pick one at random, providing an episode title, number, and ' +
      'description. You can even ask for an episode featuring a particular character, or from a specific season. Now, what ' +
      'kind of episode would you like?';
    const repromptText = 'For example, ask me to give you an episode featuring Bobbie from season one.';

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
    const seasonInfo = getSeasonNumber(this);
    if (seasonInfo.result === ValueResult.Error) {
      seasonInfo.errorResp();
      return;
    }

    const gaveSeasonNumber = seasonInfo.result !== ValueResult.Empty;

    if (gaveSeasonNumber) {
      console.info(`Requested season number: ${seasonInfo.value}`);
    }

    const charInfo = getCharacter(this);
    if (charInfo.result === ValueResult.Error) {
      charInfo.errorResp();
      return;
    }

    const gaveCharacterName = charInfo.result !== ValueResult.Empty;

    if (gaveCharacterName) {
      console.info(`Requested character: ${charInfo.value}.`);
    }

    const episodeInfo = findEpisode(seasonInfo.value, charInfo.value);

    if (episodeInfo.result === ValueResult.Empty) {
      console.info(`No episode found for season: ${seasonInfo.value}, character: ${charInfo.value}`);
      const extraSeasonText = gaveSeasonNumber ? `from season ${seasonInfo.value}` : '';
      const extraCharText = gaveCharacterName ? `featuring ${charInfo.value}` : '';

      this.emit(':tell', `Sorry, I couldn't find an episode ${extraSeasonText} ${extraCharText}.`);
      return;
    }

    const episode = episodeInfo.value;

    let resp;
    console.info(`Returning season: ${episode.season}, episode: ${episode.number}`);

    const extraSeasonText = gaveSeasonNumber ? '' : `season ${episode.season},`;

    if (episode.finale) {
      resp = `In ${extraSeasonText} episode ${episode.number}, the season finale titled ${episode.title}, ${episode.description}`;
    } else {
      resp = `In ${extraSeasonText} episode ${episode.number}, titled ${episode.title}, ${episode.description}`;
    }

    this.emit(':tellWithCard', resp, `Season ${episode.season}, episode ${episode.number}`, resp);
  }
};

exports.handler = function handler(event, context) {
  const alexa = Alexa.handler(event, context);

  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
