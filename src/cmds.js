module.exports = function (Huebot) {
  Huebot.commands = {
    "image": {
      description: "Change the image",
      public: false
    },
    "tv": {
      description: "Change the tv",
      public: false
    },
    "radio": {
      description: "Change the radio",
      public: false
    },
    "set": {
      description: "Set a command",
      public: false
    },
    "setforce": {
      description: "Set a command with a name that already exists",
      public: false
    },
    "unset": {
      description: "Remove a command",
      public: false
    },
    "rename": {
      description: "Change the name of a command",
      public: false
    },
    "list": {
      description: "List set commands",
      public: true
    },
    "random": {
      description: "Execute a random command",
      public: true
    },
    "q": {
      description: "Control the queue",
      public: true
    },
    "adminadd": {
      description: "Add a bot admin",
      public: false
    },
    "adminremove": {
      description: "Remove a bot admin",
      public: false
    },
    "admins": {
      description: "List admins",
      public: false
    },
    "themeadd": {
      description: "Save current theme",
      public: false
    },
    "themeremove": {
      description: "Remove a theme",
      public: false
    },
    "themerename": {
      description: "Change the name of a theme",
      public: false
    },
    "theme": {
      description: "Apply a theme",
      public: false
    },
    "themes": {
      description: "List themes",
      public: false
    },
    "stream": {
      description: "Put a random video stream",
      public: false
    },
    "activity": {
      description: "Show recent bot users",
      public: false
    },
    "clearcommands": {
      description: "Remove all commands",
      public: false
    },
    "clearadmins": {
      description: "Remove all bot admins",
      public: false
    },
    "clearthemes": {
      description: "Remove all themes",
      public: false
    },
    "clearsubjects": {
      description: "Remove all tv subjects",
      public: false
    },
    "help": {
      description: "Show a summary of commands",
      public: false
    },
    "ping": {
      description: "Returns a Pong",
      public: false
    },
    "whatis": {
      description: "Inspects a command",
      public: false
    },
    "say": {
      description: "Make the bot say something",
      public: false
    },
    "subjectadd": {
      description: "Add a tv subject",
      public: false
    },
    "subjectremove": {
      description: "Remove a tv subject",
      public: false
    },
    "subjectrename": {
      description: "Rename a tv subject",
      public: false
    },
    "subjectkeywords": {
      description: "List keywords added to a tv subject",
      public: false
    },
    "subjectkeywordsadd": {
      description: "Add a keyword to a tv subject",
      public: false
    },
    "subjectkeywordsremove": {
      description: "Remove a keyword from a tv subject",
      public: false
    },
    "subject": {
      description: "Use a keyword to find a semi-random video",
      public: true
    },
    "subjects": {
      description: "List saved tv subjects",
      public: false
    },
    "leave": {
      description: "Leave the room",
      public: false
    },
    "join": {
      description: "Join a room",
      public: false
    },
    "backgroundadd": {
      description: "Save the current background",
      public: false
    },
    "backgroundremove": {
      description: "Remove a background",
      public: false
    },
    "backgroundrename": {
      description: "Change the name of a background",
      public: false
    },
    "background": {
      description: "Apply a background",
      public: false
    },
    "backgrounds": {
      description: "List backgrounds",
      public: false
    },
    "backgroundmode": {
      description: "Change the background mode",
      public: false
    },
    "clearbackgrounds": {
      description: "Remove all backgrounds",
      public: false
    },
    "thememode": {
      description: "Change the theme mode",
      public: false
    },
    "sleep": {
      description: "Wait before executing the next command (ms)",
      public: false
    },
    "suggest": {
      description: "Suggest topics/subjects",
      public: false
    },
    "song": {
      description: "Play a random song on the synth",
      public: false
    },
    "key": {
      description: "Play a synth key",
      public: false
    },
    "speak": {
      description: "Say something through the voice synth",
      public: false
    },
    "think": {
      description: "Get a random showerthought",
      public: false
    },
    "think2": {
      description: "Speak a random showerthought",
      public: false
    },
    "public": {
      description: "Enable or disable public commands",
      public: false
    },
    "remind": {
      description: "Remind a message to a user when they become active",
      public: false
    },
    "calc": {
      description: "Make a math calculation",
      public: true
    },
    "roll": {
      description: "Simulate a dice",
      public: true
    },
    "users": {
      description: "List connected users",
      public: true
    },
    "decide": {
      description: "Decide if yes or no",
      public: true
    },
    "pick": {
      description: "Pick one among various items",
      public: true
    },
    "wiki": {
      description: "Define something using wikipedia",
      public: true
    },
  }

  Huebot.command_list = []

  for (let key in Huebot.commands) {
    Huebot.command_list.push(key)
  }
}