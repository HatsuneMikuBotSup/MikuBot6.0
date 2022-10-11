//-------------------------------------------------------------------------------------------------Constant

const botName = "Miku";
const mainServer = "606567664852402188";

//---------------------------------------------------------------------Word Arrays

const slurWords = [
    "nigger",
    "nigga",
    "niger",
    "niga",
    "niggers",
    "niggas",
    "nigers",
    "nigas"
];

const owoWords = new Map([
    ["owo", "OwO"],
    ["uwu", "UwU"],
    ["òwó", "ÒwÓ"],
    ["ùwú", "ÙwÚ"],
    ["pog", "p...pog..pogchamp:see_no_evil::two_hearts:"],
    ["nice", "69"],
    ["boop", "boop:two_hearts:"]
]);

//-------------------------------------------------------------------------------------------------Discord API

const Discord = require("discord.js");
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers
    ],
    partials: [Discord.Partials.Channel],
});

//-------------------------------------------------------------------------------------------------Requires

const fs = require("fs");
const request = require("request");
require("dotenv").config();

//-------------------------------------------------------------------------------------------------Database

const { Client } = require("pg");

const databaseName = "MikuBot6.0";

const database = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: process.env.DATABASE,
    database: databaseName
});

database.connect().then(console.log("Database connected!"));

//---------------------------------------------------------------------DatabaseHandler

class DatabaseHandler {
    constructor(database) {
        this.database = database
    }
    getPrefix(id) {
        database.query(`SELECT "PREFIX" FROM "SERVER" WHERE "Id" = ` + id + `;`, (err, result) => {
            if (err || result.rows[0] == undefined) return "!";
            return result.rows[0].PREFIX;
        });
    }
    getUserCommands(userCommand) {
        database.query(`SELECT * FROM "USERCOMMANDS";`, (err, result) => {
            if (err || result.rows == undefined) return none;
            for (var i = 0; i < result.rows.length; i++) {
                userCommand.set(result.rows[i].COMMAND, result.rows[i].RESPONSE);
            }
        });
    }
    createUserCommands(command, response) {
        var phrase = `INSERT INTO "USERCOMMANDS" ("COMMAND", "RESPONSE") VALUES ('` + command + `', ARRAY['` + response + `']);`;
        console.log(phrase)
        database.query(phrase);
    }
    appendUserCommands(command, response) {
        var phrase = `UPDATE "USERCOMMANDS" SET "RESPONSE" = array_append("RESPONSE",'` + response + `') WHERE "COMMAND" = '` + command + `';`;
        console.log(phrase)
        database.query(phrase);
    }
}

const databaseHandler = new DatabaseHandler(database);

//---------------------------------------------------------------------Cache

class Cache {
    constructor(databaseHandler) {
        this.databaseHandler = databaseHandler;
        this.prefix = new Map();
        this.userCommands = new Map();

    }
    getPrefix(id) {
        return this.prefix.get(id);
    }
    updatePrefix() {
        client.guilds.cache.forEach((guild) => {
            this.prefix.set(guild.id, this.databaseHandler.getPrefix(guild.id));
        });
        this.prefix.set("606567664852402188", "!");
    }
    getUserCommands() {
        return this.userCommands;
    }
    async updateUsercommands() {
        await this.databaseHandler.getUserCommands(this.userCommands);
        //this.userCommands.set("baka", ["BAKA", "baka", "Anatawa baka desu", "idiot", "idiot :see_no_evil:", "baka :see_no_evil:", ">:I"])
    }
    updateAll() {
        this.updatePrefix();
        this.updateUsercommands();
    }
}

const cache = new Cache(databaseHandler);


//------------------------------------------integratedCommands

class IntegratedCommandsHandler {
    constructor() {
        this.userCommands = ["create", "help", "ping", "setup", "spam", "changechannel", "describe", "rename"];
    }
    ownerCheck(message) {
        return (message.author.user.id == message.guild.ownerId)
    }
    changechannel(message) {
        message.channel.send("not finished yet");
    }
    async create(message) {
        await cache.updateUsercommands();
        let wordsCache = message.content.slice(cache.getPrefix(message.channel.guildId).length).split(/[ ,]+/)
        var newCommand = wordsCache[1].replace(/`/g, '').replace(/´/g, '').replace(/'/g, '').replace(/"/g, '').replace(/[^a-z0-9]/gi, '');
        if (newCommand > 30 || newCommand < 1 || newCommand == undefined || newCommand == null) {
            message.channel.send("command not valid!" + newCommand);
            return 0;
        }
        var newResponse = message.content.slice(cache.getPrefix(message.channel.guildId).length).replace(newCommand, "`").split("`")[1].replace(/`/g, '´').replace(/´/g, '').replace(/'/g, '').replace(/"/g, '').replace(/^\w+$/, '').trim();
        if (newResponse > 255 || newResponse < 1 || newResponse == undefined || newResponse == null) {
            message.channel.send("response not valid!");
            return 0;
        }
        for (var i = 0; i < this.userCommands.length; i++) {
            if (newCommand == this.userCommands[i]) {
                message.channel.send("Command is an OG command and cant be changed");
                return 0;
            }
        }
        var duplicateFlag = false;
        for (var i = 0; i < cache.userCommands.size; i++) {
            if (newCommand == Array.from(cache.userCommands.keys())[i]) {
                duplicateFlag = true;
            }
        }
        console.log(newCommand, newResponse);
        if (duplicateFlag) {
            databaseHandler.appendUserCommands(newCommand, newResponse);
            message.channel.send("Appended a allready existing command");
        } else {
            fs.mkdirSync("./media/usercommands/" + newCommand);
            databaseHandler.createUserCommands(newCommand, newResponse);
            message.channel.send("Created a new command");
        }
        if (message.attachments.size > 0) {
            submit(message, newCommand);
        }
        await cache.updateUsercommands();
    }
    describe(message) {
        if (!this.ownerCheck) {
            message.channel.send("This is an Owner only command");
            return 0;
        }

        const commandSplitted = message.content.slice(cache.getPrefix(message.channel.guildId).length).split(/[ ,]+/);
        try {
            var out = eval(commandSplitted[1] + ".toString().replace(/`/g, '´')").match(/(.|[\r\n]){1,1980}/g);
            for (var i = 0; i < out.length; i++) {
                message.channel.send("```javascript\n" + out[i] + "```");
            }
        } catch (e) {
            message.channel.send("Error!");
        }
    }
    help(message) {
        message.channel.send("not finished yet");
    }
    ping(message) {
        var delay = 0;
        message.channel.send("🏓 pong!").then(m => {
            delay = (m.createdTimestamp - message.createdTimestamp) * 2;
            m.edit("Delay is: " + delay + "ms");
        });
    }
    rename(message) {
        if (!this.ownerCheck) {
            message.channel.send("This is an Owner only command");
            return 0;
        }

        var guild = message.guild;
        const renameName = message.content.slice(cache.getPrefix(message.channel.guildId).length).split(/[ ,]+/)[1];

        if (renameName == null || renameName == undefined || renameName.length > 30 || renameName.length < 1) {
            message.channel.send("Invalid rename name!");
        }
        guild.members.fetch().then((members) => {
            members.forEach(async (member) => {
                if (member.user.id == guild.ownerId) {
                    console.log("Can't rename owner: " + member.user.username);
                } else {
                    if (!member.nickname ||
                        !member.nickname.toLowerCase().includes(renameName.toLowerCase())
                    ) {
                        if (member.user.username.length + renameName.length <= 32) {
                            await member.setNickname(renameName + member.user.username);
                            console.log("renaming: " + member.user.username);
                        } else {
                            await member.setNickname(
                                renameName +
                                member.user.username.substring(0, 31 - renameName.length)
                            );
                            console.log("Renaming: " + member.user.username);
                        }
                    }
                }
            });
            console.log("Renaming done! server: " + guild.name);
        });
        message.channel.send("Starting to rename everyone with: " + renameName);
    }
    setup(message) {
        message.channel.send("not finished yet");
    }
    spam(message) {
        var spamThis = message.content.slice(cache.getPrefix(message.channel.guildId).length + 4);
        if (spamThis.length == 0) {
            message.channel.send("Error!");
        }
        var out = "";
        while (out.length + spamThis.length < 2000) {
            out += spamThis;
        }
        message.channel.send(out);
    }
}

var integratedCommandsHandler = new IntegratedCommandsHandler()

//-------------------------------------------------------------------------------------------------Boot

client.once("ready", async () => {
    //gets executed once at the start of the bot
    client.user.setActivity(botName + "Bot6.0");
    console.log(botName + " is online!");
    cache.updateAll();

});

//-------------------------------------------------------------------------------------------------On Message Event 

client.on("messageCreate", (message) => {

    //---------------------------------------------------------------------Logs Messages
    if (message.guildId) {
        console.log(message.guild.name + ": " + message.author.tag + ": " + message.content);
    } else {
        if (message.author.bot) return 0;
        console.log(message.author.tag + ": " + message.content);
        var file = mediaSelector("./media/usercommands/cute/");
        message.channel.send({
            content:
                "Miku only works inside a server!\n" +
                "Invite me to your server OwO\n\n" +
                "https://discord.com/api/oauth2/authorize?client_id=782328525071056918&permissions=8&scope=bot", files: [file]
        });
        return 0;
    }

    //---------------------------------------------------------------------Anti Bot Loop

    if (message.author.bot) {
        //ensures that the bot doesnt loop, talks with itself or other bots
        return 0;
    }

    //---------------------------------------------------------------------Anti Racist Chat

    for (var i = 0; i < slurWords.length; i++) {
        if (message.content.toLowerCase().includes(slurWords[i])) {
            message.delete();
            message.channel.send("You fucking racist go kys! :D");
            console.log("Deleted message for being racist from: " + message.author);
        }
    }

    //---------------------------------------------------------------------OwO UwU responses

    var response = "";
    for (var i = 0; i < owoWords.size; i++) {
        if (message.content.toLowerCase().includes(Array.from(owoWords.keys())[i])) {
            response += owoWords.get(Array.from(owoWords.keys())[i]) + " ";
        }
    }
    if (response != "") {
        message.channel.send(response);
    }

    //---------------------------------------------------------------------Command Setup

    if (
        //setup for commands that start with the prefix
        message.content.startsWith(cache.getPrefix(message.guild.id)) &&
        !message.author.bot &&
        !message.content.toLowerCase().includes("@everyone") &&
        !message.content.toLowerCase().includes("@here")
    ) {
        const command = message.content.slice(cache.getPrefix(message.guild.id).length).toLowerCase();
        const commandSplitted = command.split(/[ ,]+/);

        //---------------------------------------------------------------------Integrated User + Owner Commands 

        for (var i = 0; i < integratedCommandsHandler.userCommands.length; i++) {
            if (commandSplitted[0] == integratedCommandsHandler.userCommands[i]) {
                eval("integratedCommandsHandler." + commandSplitted[0] + "(message);");
                return 0;
            }
        }

        //---------------------------------------------------------------------UserCommands SFW + NSFW
        let userCommands = cache.getUserCommands();
        for (var i = 0; i < userCommands.size; i++) {
            if (commandSplitted[0] == Array.from(userCommands.keys())[i]) {
                if (message.channel.nsfw) {
                    var mention = "";
                    if (message.mentions.members.size > 0) {
                        mention = `${message.mentions.members.first().user}`;
                    }
                    var responseArray = userCommands.get(commandSplitted[0]);
                    var response = responseArray[Math.floor(Math.random() * responseArray.length)] + mention;
                    var file = mediaSelector("./media/usercommands/" + commandSplitted[0] + "/");
                    if (file != null) {
                        message.channel.send({ content: response, files: [file] });
                    } else {
                        message.channel.send(response);
                    }
                    return 0;
                } else {
                    message.channel.send("No NSFW allowed here!");
                    return 0;
                }
            }
        }
    }
});

//-------------------------------------------------------------------------------------------------On Member join event

client.on("guildMemberAdd", async (member) => { });

//-------------------------------------------------------------------------------------------------On Server join event

client.on("guildCreate", async (guild) => {
    console.log("I joined a new server: " + guild.name);
    var file = mediaSelector("./media/usercommands/cute/");
    guild.systemChannel.send({ content: "Thanks for inviting me OwO\nYou can set me up with !setup", files: [file] });
});



//-------------------------------------------------------------------------------------------------Client Login

//bot connects with Discord api
client.login(process.env.TOKEN);

//-------------------------------------------------------------------------------------------------Functions

//---------------------------------------------------------------------SelectMediaOnThisPath
//put all the file endings you want to support here
const fileEndings = [
    ".jpg",
    ".jpeg",
    ".gif",
    ".png",
]
//When I wrote this code only I and God knew how this works
//Now only God knows

function mediaSelector(path) {
    var fileEndingsLengthsTotal = 0;
    var fileEndingsLengths = [];
    for (var i = 0; i < fileEndings.length; i++) {
        var length = fs.readdirSync(path).filter(file => file.endsWith(fileEndings[i])).length
        fileEndingsLengths.push(length);
        fileEndingsLengthsTotal += length;
    }
    if (fileEndingsLengthsTotal == 0) return null;

    const luckyNumber = Math.random() * fileEndingsLengthsTotal;
    var cache = 0;
    for (var i = 0; i < fileEndings.length; i++) {
        cache += fileEndingsLengths[i];
        if (cache > luckyNumber) {
            var fileNumber = Math.floor(Math.random() * fileEndingsLengths[i]);
            return new Discord.AttachmentBuilder((path + fileNumber + fileEndings[i]), { name: path + fileNumber + fileEndings[i] });
        }
    }
}

//---------------------------------------------------------------------SubmitMedia

async function submit(message, command) {
    var url = [];
    for (var i = 0; i < message.attachments.size; i++) {
        url[i] = (message.attachments.get(Array.from(message.attachments.keys())[i]).url);
    }
    message.channel.send(await submitUrl(url, command));
}
//---------------------------------------------------------------------submitUrl

async function submitUrl(url, command) {
    try {
        if (url.length == 0) {
            return "no image or url!";
        }
        console.log(url);
        var masterflag = "";
        var fileEndingsLengthsTotal = 0;
        for (var i = 0; i < fileEndings.length; i++) {
            var length = fs.readdirSync("./media/usercommands/" + command).filter(file => file.endsWith(fileEndings[i])).length
            fileEndingsLengthsTotal += length;
        }
        for (var k = 0; k < url.length; k++) {
            request.head(url[k], function (err, res, body) {
                var ending = "." + res.headers['content-type'].split("/")[1];
                var flag = true;
                for (var i = 0; i < fileEndings.length; i++) {
                    if (ending == fileEndings[i]) {
                        var path = "./media/usercommands/" + command + "/" + (fileEndingsLengthsTotal+k) + ending;
                        console.log("path");
                        request(url[k]).pipe(fs.createWriteStream(path));
                        flag = false;
                    }
                }
                if (flag) {
                    masterflag += url + "\n";
                }
            });
        }
        if (masterflag.length == 0) {
            return "Submission succesfull!";

        } else {
            return "Submission only partly succesfull! Errors on:\n" + masterflag
        }
    } catch (e) {
        return "There was an Error with the Media!";
    }
}

//-------------------------------------------------------------------------------------------------Constructors




