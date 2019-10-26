#!/usr/bin/env node

const request = require("request")
const cron = require("node-cron")
const fs = require("fs")
require("dotenv").config()
let activityList = require("./activityList.json")
let memberList = {}

const requestUrl =
    "https://habitica.com/api/v3/groups/" + process.env.GROUPID + "/chat"

const chatRequest = {
    url: requestUrl,
    headers: {
        "x-api-user": process.env.APIUSER,
        "x-api-key": process.env.APIKEY
    }
}

const membersUrl =
    "https://habitica.com/api/v3/groups/" + process.env.GROUPID + "/members"

const membersRequest = {
    url: membersUrl,
    headers: {
        "x-api-user": process.env.APIUSER,
        "x-api-key": process.env.APIKEY
    }
}

function updateMembers(error, response, body) {
    if (!error && response.statusCode == 200) {
        const list = Object.entries(JSON.parse(body).data)
        list.forEach(member => {
            memberList[member[1].profile.name] = member[1].id
        })
        Object.entries(activityList.members).forEach(member => {
            if (memberList[member[0]]) {
            } else {
                delete activityList.members[member[0]]
            }
        })
    }
}

function updateActivity(error, response, body) {
    if (!error && response.statusCode == 200) {
        const chat = Object.entries(JSON.parse(body).data)
        chat.reverse().forEach(message => {
            const text = message[1].text
            if (message[1].info.type === "spell_cast_party") {
                let caster = text.substr(
                    1,
                    (message[1].text.indexOf("casts") - 2)
                )
                
                const time = new Date(message[1].timestamp)
                const now =
                    time.getMonth() +
                    1 +
                    "/" +
                    time.getDate() +
                    " " +
                    time.getHours() +
                    ":" +
                    time.getMinutes()
                activityList.members[caster] = { time: now, id: message[1].id }
            }
        })
        const time = new Date(Date.now())
        const now =
            time.getMonth() +
            1 +
            "/" +
            time.getDate() +
            " " +
            time.getHours() +
            ":" +
            time.getMinutes()
        activityList["time"] = now
    }

    fs.writeFile(
        "./activityList.json",
        JSON.stringify(activityList, null, 4),
        err => {
            if (err) throw err

            // success case, the file was saved
            console.log("activityList.json has been saved")
        }
    )
}

request(chatRequest, updateActivity)
request(membersRequest, updateMembers)

cron.schedule("0,30 0-23 * * *", () => {
    request(chatRequest, updateActivity)
})
