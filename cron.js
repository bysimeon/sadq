#!/usr/bin/env node

const request = require("request");
const cron = require("node-cron");
const fs = require("fs");
require("dotenv").config();

let activityList = require("./activityList.json");
let memberList = {};

const requestUrl =
  "https://habitica.com/api/v3/groups/" + process.env.GROUPID + "/chat";

const chatRequest = {
  url: requestUrl,
  headers: {
    "x-api-user": process.env.APIUSER,
    "x-api-key": process.env.APIKEY
  }
};

const membersUrl =
  "https://habitica.com/api/v3/groups/" + process.env.GROUPID + "/members";

const membersRequest = {
  url: membersUrl,
  headers: {
    "x-api-user": process.env.APIUSER,
    "x-api-key": process.env.APIKEY
  }
};

function updateJSON() {
  fs.writeFile(
    "./activityList.json",
    JSON.stringify(activityList, null, 4),
    err => {
      if (err) throw err;
    }
  );
}

function updateMembers(error, response, body) {
  if (!error && response.statusCode == 200) {
    const memList = Object.entries(JSON.parse(body).data);

    memList.forEach(member => {
      memberList[member[1].profile.name] = member[1].id;
    });

    Object.entries(activityList.members).forEach(member => {
      if (memberList[member[0]]) {
        console.log(`${member[0]} is in the party`);
      } else {
        console.log(`${member[0]} is not in the party anymore`);
        delete activityList.members[member[0]];
      }
    });
    updateJSON();
  }
}

function updateActivity(error, response, body) {
  if (!error && response.statusCode == 200) {
    const chat = Object.entries(JSON.parse(body).data);
    chat.reverse().forEach(message => {
      const text = message[1].text;
      if (message[1].info.type === "spell_cast_party") {
        let caster = text.substr(1, message[1].text.indexOf("casts") - 2);

        const time = message[1].timestamp;
        activityList.members[caster] = { time: time, id: message[1].id };
      }
    });
    const time = new Date(Date.now()).toString();
    activityList["time"] = time;
  }

  request(membersRequest, updateMembers);
}

request(chatRequest, updateActivity);

cron.schedule("* * * * *", () => {
  request(chatRequest, updateActivity);
});
