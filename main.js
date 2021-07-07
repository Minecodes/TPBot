const Discord = require('discord.js');
const fs = require('fs');
const ytdl = require('ytdl-core');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const client = new Discord.Client();
 
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

const COLORS = {
  error: 0xe74c3c,
  info: 0x2ecc71,
  blue: 0x3498db,
  orange: 0xe67e22,
  white: 0xecf0f1,
  yellow: 0xf1c40f,
  dark: 0x2c3e50
}

const queue = new Map();

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(config.prefix + 'play')) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(config.prefix + 'skip')) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(config.prefix + 'stop')) {
    stop(message, serverQueue);
    return;
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.on('message', message => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'info') {
    console.log('Someone use ' + config.prefix +'info');
		const embed = new Discord.MessageEmbed()
      .setTitle('Serverinfo')
      .setColor(COLORS.white)
      .setDescription('')
      .setAuthor('TPBot', 'https://minecraft3.neocities.org/tp.png', 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ')
      .addFields(
        { name: 'Name:', value: `${message.guild.name}`, inline: true },
        { name: 'Member: ', value: `${message.guild.memberCount}`, inline:true },
        { name: 'Owner:', value: `${message.own}`, inline: true }
      )
    message.channel.send(embed);
  } else if (command === 'help') {
    console.log('Someone use ' + config.prefix + 'help'.green);
    const embed = new Discord.MessageEmbed()
      .setTitle('Help')
      .setColor(COLORS.info)
      .setDescription('')
      .setAuthor('TPBot', 'https://minecraft3.neocities.org/tp.png', 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ')
      .addFields(
        { name: 'Music/Voice Channel', value: 'voice', inline: true },
        { name: 'Moderator', value: 'mod', inline:true },
        { name: 'Messages', value: 'msg', inlin: true },
        { name: 'Bot Creator:', value: 'creator', inline: true }
      )
    message.channel.send(embed);
  } else if (command === 'voice') {
    console.log('Someone use ' + config.prefix + 'voice'.green);
    const embed = new Discord.MessageEmbed()
      .setTitle('Help Music/Voice Channel')
      .setColor(COLORS.info)
      .setDescription('')
      .setAuthor('TPBot', 'https://minecraft3.neocities.org/tp.png', 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ')
      .addFields(
        { name: 'join', value: 'bot joins in a voice channel' },
        { name: 'leave', value: 'leave the voice channel' },
        { name: 'play', value: 'play music from YouTube' },
        { name: 'skip', value: 'skip a song from YouTube' },
        { name: 'stop', value: 'stop the music form ' }
      )
    message.channel.send(embed);
  } else if (command === 'mod') {
    console.log('Someone use ' + config.prefix + 'mod'.green);
    const embed = new Discord.MessageEmbed()
      .setTitle('Help Modoration')
      .setColor(COLORS.info)
      .setDescription('')
      .setAuthor('TPBot', 'https://minecraft3.neocities.org/tp.png', 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ')
      .addFields(
        { name: 'kick', value: 'kick a member' },
        { name: 'ban', value: 'ban a member' }
      )
    message.channel.send(embed);
  } else if (command === 'msg') {
    console.log('Someone use ' + config.prefix + 'msg'.green);
    const embed = new Discord.MessageEmbed()
      .setTitle('Help Messages')
      .setColor(COLORS.info)
      .setDescription('')
      .setAuthor('TPBot', 'https://minecraft3.neocities.org/tp.png', 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ')
      .addFields(
        { name: 'help', value: 'to become help' },
        { name: 'hi', value: 'to say hi to the bot' },
        { name: 'info', value: 'gives information of the server' }
      )
    message.channel.send(embed);
  } else if (command === 'hi') {
    console.log('Someone use ' + config.prefix + 'hi'.green);
    message.reply('hi')
  } else if (command === 'avatar') {
    console.log('Someone use ' + config.prefix + 'avatar'.green);
    message.reply(message.author.displayAvatarURL());
  } else if (command === 'creator') {
    console.log('Someone use ' + config.prefix + 'creator yay :)'.green);
    const embed = new Discord.MessageEmbed()
      .setTitle('TPBot created bye Minecodes#1043')
      .setColor(COLORS.white)
      .setDescription('')
      .setAuthor('TPBot', 'https://minecraft3.neocities.org/tp.png', 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ')
      .addFields(
        { name: 'Creator:', value: 'Minecodes#1043' },
        { name: 'YouTube Channel:', value: 'https://www.youtube.com/channel/UCxt0A5bz_CCSDMoFiYQdWNQ' }
      )
    message.channel.send(embed);
  }
});

client.on('message', message => {
  // Ignore messages that aren't from a guild
  if (!message.guild) return;

  // If the message content starts with "!kick"
  if (message.content.startsWith(config.prefix + 'kick')) {
    if (!message.member.hasPermission("KICK_MEMBER")) {
      msg.channel.send("You don't have permissions for that");
      return;
    }
    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions
    const user = message.mentions.users.first();
    // If we have a user mentioned
    if (user) {
      // Now we get the member from the user
      const member = message.guild.member(user);
      // If the member is in the guild
      if (member) {
        /**
         * Kick the member
         * Make sure you run this on a member, not a user!
         * There are big differences between a user and a member
         */
        member
          .kick('Kick a user')
          .then(() => {
            // We let the message author know we were able to kick the person
            message.reply(`Successfully kicked ${user.tag}`);
          })
          .catch(err => {
            // An error happened
            // This is generally due to the bot not being able to kick the member,
            // either due to missing permissions or role hierarchy
            message.reply('I was unable to kick the member');
            // Log the error
            console.error(err);
          });
      } else {
        // The mentioned user isn't in this guild
        message.reply("That user isn't in this guild!");
      }
      // Otherwise, if no user was mentioned
    } else {
      message.reply("You didn't mention the user to kick!");
    }
  }
});

client.on('message', message => {
  // Ignore messages that aren't from a guild
  if (!message.guild) return;

  // if the message content starts with "!ban"
  if (message.content.startsWith(config.prefix + 'ban')) {
    if (!message.member.hasPermission("BAN_MEMBER")) {
      message.channel.send("You don't have permissions for that!");
      return;
    }
    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions
    const user = message.mentions.users.first();
    // If we have a user mentioned
    if (user) {
      // Now we get the member from the user
      const member = message.guild.member(user);
      // If the member is in the guild
      if (member) {
        /**
         * Ban the member
         * Make sure you run this on a member, not a user!
         * There are big differences between a user and a member
         * Read more about what ban options there are over at
         * https://discord.js.org/#/docs/main/master/class/GuildMember?scrollTo=ban
         */
        member
          .ban({
            reason: 'Ban a user',
          })
          .then(() => {
            // We let the message author know we were able to ban the person
            message.reply(`Successfully banned ${user.tag}`);
          })
          .catch(err => {
            // An error happened
            // This is generally due to the bot not being able to ban the member,
            // either due to missing permissions or role hierarchy
            message.reply('I was unable to ban the member');
            // Log the error
            console.error(err);
          });
      } else {
        // The mentioned user isn't in this guild
        message.reply("That user isn't in this guild!");
      }
    } else {
      // Otherwise, if no user was mentioned
      message.reply("You didn't mention the user to ban!");
    }
  }
});

client.on('guildMemberAdd', member => {
  // Send the message to a designated channel on a server:
  const channel = member.guild.channels.cache.find(ch => ch.name === 'member-log');
  // Do nothing if the channel wasn't found on this server
  if (!channel) return;
  // Send the message, mentioning the member
  channel.send(`Welcome to the server, ${member}`);
});

client.on('message', async message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
  if (!message.guild) return;

  if (message.content === config.prefix + 'join') {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voice.channel) {
      const connection = await message.member.voice.channel.join();
      msg.reply('I joined into your channel');
    } else {
      message.reply('You need to join a voice channel first!');
    }
  }
});

client.on('message', async message => {
  // Voice only works in guilds, if the message does not come from a guild,
  // we ignore it
  if (!message.guild) return;

  if (message.content === config.prefix + 'leave') {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voice.channel) {
      const connection = await message.member.voice.channel.leave();
      msg.reply('I leave this channel');
    } else {
      message.reply('You don\'t are in a voice channel');
    }
  }
});

//klein geschrieben

client.on('message', message => {
  if (message.content === 'arsch')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'asshole')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'cheaten')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'wichser')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'ficken')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'dreckssack')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'ficken')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

//Gross geschrieben

client.on('message', message => {
  if (message.content === 'ARSCH')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'ASSHOLE')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'CHEATEN')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'WICHSER')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'FICKEN')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'DRECKSSACK')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.on('message', message => {
  if (message.content === 'FICKEN')
  message.delete({ timeout: 0250 })
  .then(msg => console.log(`Deleted message from ${msg.author.username} after 250 milliseconds`))
  .catch(console.error);
})

client.login(config.token);
