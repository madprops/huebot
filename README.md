# Installation

To use simply do "npm install" inside the directory, change the login details in huebot.js, then run huebot.js with node.

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

For instance ".topicadd music the beatles", ".topicadd music pink floyd"

music = ["the beatles", "pink floyd"]

Then calling .subject music will create a search string consisting of the name of the subject, a random item, and a random word from words.json

For instance it could search youtube for "music pink floyd butter".

This is why having a proper subject name could be important.

Subject names can't have spaces.

>subjectremove

Removes a subject.

>subjectrename

Renames a subject.

>subject

Used to change the tv (or image, or radio, if specified), using the generated search string.

>subjectlist

Shows the list of a subject. 

For instance ".subjectlist music" will show "the beatles, pink floyd".

>subjectlistremove

Removes an item from a subject list.

".subjectlistremove music the beatles".

>subjects

Shows a list of subjects. Can be filtered with an argument.

# More

The bot accepts and processes private messages (whispers) if the user is an admin.

Which can be useful to make more direct calls to the bot (without spamming the chat).

For instance "/whisper2 myBot > .q tv next".