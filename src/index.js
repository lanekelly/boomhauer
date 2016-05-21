// boomhauer skill -- ask for an episode of King of the Hill

'use strict';

var AlexaSkill = require('./AlexaSkill');
var Episodes = require('./episodes');

var Boomhauer = function () {
  AlexaSkill.call(this); // add APP_ID here later
};

Boomhauer.prototype = Object.create(AlexaSkill.prototype);
Boomhauer.prototype.constructor = Boomhauer;

Boomhauer.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
  var speechText = "Ask me for an episode of King of the Hill. You can even specify a season.";
  var repromptText = "For example, ask me to give you an episode from season one.";

  response.ask(speechText, repromptText);
};

Boomhauer.prototype.intentHandlers = {
  "EpisodeIntent": function (intent, session, response) {
    var seasonSlot = intent.slots.Season;
    var seasonNumber;

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

    var resp = "";

    var season = Episodes[seasonNumber];
    if (season) {
      // for now, just get first in list
      var episode = season[0];
      resp = "In episode " + episode.number + ", titled " + episode.title + ", " + episode.description;
    } else {
      resp = "No data for season " + seasonNumber;
    }

    var speechOutput = {
      speech: resp,
      type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.tellWithCard(speechOutput, "King of the Hill", resp);
  }
};

exports.handler = function (event, context) {
  var boomhauer = new Boomhauer();
  boomhauer.execute(event, context);
};
