#!/usr/bin/env node

const request = require("request")
const cron = require("node-cron")
const fs = require("fs")
require("dotenv").config()
let activityList = require("./activityList.json")

const requestUrl =
    "https://habitica.com/api/v3/groups/" + process.env.GROUPID + "/chat"

const chatRequest = {
    url: requestUrl,
    headers: {
        "x-api-user": process.env.APIUSER,
        "x-api-key": process.env.APIKEY
    }
}

function updateActivity(error, response, body) {
    if (!error && response.statusCode == 200) {
        const chat = Object.entries(JSON.parse(body).data)
        chat.reverse().forEach(message => {
            console.log(message)
            const text = message[1].text
            if (message[1].info.type === "spell_cast_party") {
                let caster = text.substr(0, message[1].text.indexOf("casts"))
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
                activityList.members[caster] = now
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
            console.log("json saved")
        }
    )
}

request(chatRequest, updateActivity)

cron.schedule("0,30 0-23 * * *", () => {
    request(chatRequest, updateActivity)
})
