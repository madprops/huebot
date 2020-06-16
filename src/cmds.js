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

  // Must Include:
  // data.message
  // data.username
  // data.method
  // Optional:
  // data.callback
  Huebot.process_command = function (ctx, data) {
    let allowed = false
    let split = data.message.split(' ')
    let cmd = split[0]
    let arg

    if (split.length > 1) {
      cmd += ' '
      arg = Huebot.clean_string2(split.slice(1).join(" "))
    } else {
      arg = ""
    }

    cmd = cmd.substring(1).trim()

    if (!Huebot.is_admin(data.username)) {
      if (Huebot.db.options.public_commands) {
        if (public_commands.includes(cmd)) {
          allowed = check_public_command(cmd, arg)
        } else {
          let cmd2 = Huebot.db.commands[cmd]

          if (cmd2) {
            if (cmd2.type === "image" || cmd2.type === "tv" || cmd2.type === "radio") {
              allowed = true
            } else if (cmd2.type === "alias") {
              let split = cmd2.url.split(" && ")

              allowed = true

              for (let c of split) {
                let sp = c.split(" ")
                let cmd = sp[0]
                let arg = sp.slice(1).join(" ")

                if (!public_commands.includes(cmd) || !check_public_command(cmd, arg)) {
                  allowed = false
                  break
                }
              }
            }
          }
        }
      }

      if (!allowed) {
        if (data.callback) {
          return data.callback()
        } else {
          return false
        }
      }
    } else {
      allowed = true
    }

    ctx.user_command_activity.push(data.username)

    if (ctx.user_command_activity.length > Huebot.config.max_user_command_activity) {
      ctx.user_command_activity.shift()
    }

    if (data.message.includes(" && ")) {
      if (cmd !== "set" && cmd !== "setforce") {
        let full_cmd = `${cmd} ${arg}`

        let and_split = full_cmd.split(" && ")

        if (and_split.length > 1) {
          let cmds = []

          for (let i = 0; i < and_split.length; i++) {
            let item = and_split[i]

            let c = item.trim()

            let cc
            let c2

            if (!c.startsWith(Huebot.db.config.command_prefix)) {
              cc = Huebot.db.config.command_prefix + c
              c2 = c
            } else {
              cc = c
              c2 = c.substring(1)
            }

            let acmd = Huebot.db.commands[c2]

            if (acmd !== undefined) {
              let spc = acmd.url.split(" ")[0]

              if (Huebot.command_list.includes(spc)) {
                cc = Huebot.db.config.command_prefix + acmd.url
              }
            }

            cmds.push(cc)
          }

          let qcmax = 0

          let cqid

          while (true) {
            cqid = Huebot.get_random_string(5) + Date.now()

            if (ctx.commands_queue[cqid] === undefined) {
              break
            }

            qcmax += 1

            if (qcmax >= 100) {
              if (data.callback) {
                return data.callback()
              } else {
                return false
              }
            }
          }

          ctx.commands_queue[cqid] = {}
          ctx.commands_queue[cqid].username = data.username
          ctx.commands_queue[cqid].method = data.method
          ctx.commands_queue[cqid].commands = cmds

          Huebot.run_commands_queue(ctx, cqid)

          if (data.callback) {
            return data.callback()
          } else {
            return false
          }
        }
      }
    }

    Huebot.execute_command(ctx, data, cmd, arg)

    if (data.callback) {
      return data.callback()
    } else {
      return false
    }
  }
}