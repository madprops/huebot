# Requirements

NodeJS 10+

# Installation

To use simply do "npm install" inside the directory, change the details in huebot.js, then run huebot.js with node.

# Configuration

The following are the details that should be edited in /files/config.json

>bot_email

The bot's account email, used to log in.

>bot_password

The bot's account password, used to log in.

>twitch_client_id

A Twitch dev api client id so Twitch based features can work.

>twitch_enabled

If false, it will avoid using Twitch altogether.

>youtube_client_id

A YouTube dev api client id so YouTube based features can work.

>youtube_enabled

If false, it will avoid using YouTube altogether.

>server_address

The address of the Hue server.

>room_ids

List of rooms to connect at startup.

>protected_admins

These is the list of "superusers". 

These are admins that can't be removed through commands. 

Only they can add or remove more normal admins.

Can't be edited programatically, it's hardcoded.

>files_location

This is if you want to have multiple bots sharing the same files.

You can set this to a specific shared location.

>command_prefix

The character to trigger/identify commands.

# Commands

>image

Change the image with keywords or url.

>tv

Change the tv with keywords or url.

>radio

Change the radio with keywords or url.

>set

Set custom commands to change either the image, tv, or radio to a certain source.

For example ".set hello tv someYoutubeURLOrKeywords".

When .hello is called the tv will be changed to the specified URL or keywords.

It also accepts a type "alias" which allows to make aliases for other bot commands. Commands can be chained with &.

For example ".set qlist alias q image size && q tv size && q radio size".

When .qlist is called it will execute ".q image size" then ".q tv size", and then ".q radio size". 

When making an alias the command prefix in commands, like "." must be ommitted. It will also fail if the commands don't exist.

>setforce

If a command already exists, calling .set again will not overwrite it, to overwrite it you must use .setforce.

>unset

Removes/deletes a command.

>rename

Renames a command.

>list

Shows a list of commands. It can be filtered with an argument.

>random

If no argument is given it will show a random youtube video composed of 2 random words taken from words.json.

If image, tv, or, radio is given as an argument, it will run a random command (placed by .set) of the corresponding type.

>q

Used to control the queue system.

The queue is a list of urls or keywords for each media type.

For instance ".q tv the dog" will add "the dog" to the tv queue.

Queues have to be triggered manually.

To trigger the next item in it, use ".q tv next".

It will remove the old item and change the tv with the next one.

Same for image and radio.

There's also "clear" and "size".

For instance ".q tv clear" or ".q tv size".

Clear empties a queue, size shows how many items are queued.

>adminadd

To be able to control any of the bot's functions, a user must be an admin. This is used to add usernames to the admins list. Only "protected admins" can add or remove admins. The protected_admins list must be edited manually in the huebot.js file.

>adminremove

Removes a username from the admins list.

>admins

Shows a list of admins. Can be filtered with an argument.

>themeadd

The state of the room's look can be saved to be changed later.

For example ".themeadd dark" will save the current background color, text mode, and text color.

When ".theme dark" is used, it will change it back to those.

>themeremove

Removes a theme.

>themerename

Renames a theme.

>theme

Used to change the theme.

>themes

List of themes. Can be filtered with an argument.

>linktitles

Used to turn on or off the link titles feature.

If on, the bot will find and show the link of a website when it detects a URL in the chat.

>stream

Gets a random live stream from Twitch or Youtube and changes the tv to that.

>activity

Shows the usernames that have used a command most recently. 

Useful if somebody sending commands by private message, this is a way to find out who is doing it.

>clearcommands

Resets the commands object to its original state.

Must be a protected admin.

>clearadmins

Resets the admins object to its original state.

Must be a protected admin.

>clearthemes

Resets the themes object to its original state.

Must be a protected admin.

>clearsubjects

Resets the subjects object to its original state.

Must be a protected admin.

>help

Shows the list of the available commands.

This doesn't include commands created by .set

>ping

.ping -> Pong

>whatis

Shows information about a command made with .set

It shows the type and content.

>say

Makes the bot say something.

>subjectadd

Subjects are lists of keywords, that can be used to find random videos limited to a certain topic.

For instance ".topicadd music"

music = []

The music list can be added with keywords to search for using .topickeywordsadd

Subject names can't have spaces.

>subjectremove

Removes a subject.

>subjectrename

Renames a subject.

>subject

Used to change the tv (or image, or radio, if specified) using a subject.

The search string used to find media is made from the subject name, a random keyword, and a random word from words.json

For instance if subject music has "the beatles", and "pink floyd":

A search string could be "music pink floyd earth"

This is why having a subject name that describes what you want is important.

>subjectkeywords

Shows the keywords of a subject. 

For instance ".subjectkeywords music" may show "the beatles, pink floyd".

Can be filtered with an argument.

>subjectkeywordsadd

Adds a keyword to a subject's keywords list.

".subjectkeywordsadd music the beatles".

>subjectkeywordsremove

Removes an item from a subject's keywords list.

".subjectkeywordsremove music the beatles".

>subjects

Shows a list of subjects. Can be filtered with an argument.

>join

Makes the bot join a room with a certain ID. 

The bot will try to keep an idea of what rooms it's connected to.

It will throw a warning if trying to join a room that it's already in, and not connect. 

This is to avoid multiple connections.

>leave

Makes the bot leave the current room.

>backgroundadd

The state of the room's background can be saved to be changed later.

For example ".backgroundadd funny" will save the current background image, background mode, and background tile dimensions.

When ".background funny" is used, it will change it back to those.

This can be used in conjunction with themes to fully customize the look of a room.

Backgrounds will only be saved if the background image is not hosted by the system, since those get deleted after they're changed.

>backgroundremove

Removes a background.

>backgroundrename

Renames a background.

>background

Used to change the background.

>backgrounds

List of backgrounds. Can be filtered with an argument.

>sleep

Used with chained commands. For instance ".say hello && .sleep 2000 && .tv the world".

>suggest

Used to display suggested media search terms.
It defaults to tv, but image or radio can be specified too.
It will show a list with clickable items and make a search query when one is clicked.

>song

Plays 20 random notes in the synth.

>key

Play's a specific key in the synth.

>speak

Sends a synth voice message.

>think

Gets a random shower thought and displays it in a chat message.

>think2

Gets a random shower thought and sends it as a synth voice message.

>public

Whether public commands are enabled. Receives "on" or "off" as arguments.

>calc

Outputs a math calculation using math.js using BigNumbers with 64 bit precision.

# Replacements

Strings in some cases can get replaced to certain things depending on the keyword.

For instance ".tv blue $word$" could search youtube for "blue bird".

These replacements happen at the moment of sending a message or changing media.

These replacements exist:

$word$ = A random word from words.json

$user$ = A random username from the list of connected users.

# More

The bot accepts and processes private messages (whispers) if the user is an admin.

Which can be useful to make more direct calls to the bot (without spamming the chat).

For instance "/whisper2 myBot > .q tv next".

The bot can join multiple rooms at startup if the id is included in room_ids. To join or leave rooms after it's started you can use .join or .leave