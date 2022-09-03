//-------------------------------------------------------------------------------------------------Discord API

const Discord = require("discord.js");
const allIntents = new Discord.IntentsBitField(32767);
const client = new Discord.Client({ intents: allIntents });

//-------------------------------------------------------------------------------------------------Requires

const fs = require("fs");
require("dotenv").config();

//-------------------------------------------------------------------------------------------------PostgreSQL API

const { Client } = require("pg");

const database = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: process.env.DATABASE,
    database: "MikuBot6.0"
})


//-------------------------------------------------------------------------------------------------Client Login

//bot connects with Discord api
client.login(process.env.TOKEN);