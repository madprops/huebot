module.exports = function (Huebot) {
  Huebot.commands = {
    "image": {
      description: "Change the image",
      public: false,
      exec: function(ox) {Huebot.change_image(ox)}
    },
    "tv": {
      description: "Change the tv",
      public: false,
      exec: function(ox) {Huebot.change_tv(ox)}
    },
    "commands": {
      description: "Manage commands",
      public: false,
      exec: function(ox) {Huebot.manage_commands(ox)}
    },
    "q": {
      description: "Manage the queue",
      public: true,
      exec: function(ox) {Huebot.manage_queue(ox)}
    },
    "adminadd": {
      description: "Add a bot admin",
      public: false,
      exec: function(ox) {Huebot.add_admin(ox)}
    },
    "adminremove": {
      description: "Remove a bot admin",
      public: false,
      exec: function(ox) {Huebot.remove_admin(ox)}
    },
    "admins": {
      description: "List admins",
      public: false,
      exec: function(ox) {Huebot.list_admins(ox)}
    },
    "themes": {
      description: "Manage themes",
      public: false,
      exec: function(ox) {Huebot.manage_themes(ox)}
    },
    "stream": {
      description: "Put a random video stream",
      public: false,
      exec: function(ox) {Huebot.get_random_stream(ox)}
    },
    "activity": {
      description: "Show recent bot users",
      public: false,
      exec: function(ox) {Huebot.show_activity(ox)}
    },
    "clearadmins": {
      description: "Remove all bot admins",
      public: false,
      exec: function(ox) {Huebot.clear_admins(ox)}
    },
    "help": {
      description: "Show a summary of commands",
      public: false,
      exec: function(ox) {Huebot.show_help(ox)}
    },
    "ping": {
      description: "Returns a Pong",
      public: false,
      exec: function(ox) {Huebot.ping(ox)}
    },
    "whatis": {
      description: "Inspects a command",
      public: false,
      exec: function(ox) {Huebot.whatis_command(ox)}
    },
    "say": {
      description: "Make the bot say something",
      public: false,
      exec: function(ox) {Huebot.say(ox)}
    },
    "subject": {
      description: "Use a keyword to find a semi-random video",
      public: true,
      exec: function(ox) {Huebot.use_subject(ox)}
    },
    "leave": {
      description: "Leave the room",
      public: false,
      exec: function(ox) {Huebot.leave_room(ox)}
    },
    "join": {
      description: "Join a room",
      public: false,
      exec: function(ox) {Huebot.join_room(ox)}
    },
    "backgrounds": {
      description: "Manage backgrounds",
      public: false,
      exec: function(ox) {Huebot.manage_backgrounds(ox)}
    },
    "backgroundmode": {
      description: "Change the background mode",
      public: false,
      exec: function(ox) {Huebot.change_background_mode(ox)}
    },
    "thememode": {
      description: "Change the theme mode",
      public: false,
      exec: function(ox) {Huebot.change_theme_mode(ox)}
    },
    "sleep": {
      description: "Wait before executing the next command (ms)",
      public: false,
      exec: undefined
    },
    "suggest": {
      description: "Suggest topics",
      public: false,
      exec: function(ox) {Huebot.suggest(ox)}
    },
    "think": {
      description: "Get a random showerthought",
      public: false,
      exec: function(ox) {Huebot.think(ox)}
    },
    "public": {
      description: "Enable or disable public commands",
      public: false,
      exec: function(ox) {Huebot.change_public(ox)}
    },
    "remind": {
      description: "Remind a message to a user when they become active",
      public: false,
      exec: function(ox) {Huebot.remind(ox)}
    },
    "calc": {
      description: "Make a math calculation",
      public: true,
      exec: function(ox) {Huebot.do_calculation(ox)}
    },
    "roll": {
      description: "Simulate a dice",
      public: true,
      exec: function(ox) {Huebot.roll_dice(ox)}
    },
    "users": {
      description: "List connected users",
      public: true,
      exec: function(ox) {Huebot.show_users(ox)}
    },
    "decide": {
      description: "Decide if yes or no",
      public: true,
      exec: function(ox) {Huebot.decide_something(ox)}
    },
    "pick": {
      description: "Pick one among various items",
      public: true,
      exec: function(ox) {Huebot.pick_something(ox)}
    },
    "wiki": {
      description: "Define something using wikipedia",
      public: true,
      exec: function(ox) {Huebot.search_wiki(ox)}
    },
    "wolfram": {
      description: "Ask Wolfram something",
      public: true,
      exec: function(ox) {Huebot.ask_wolfram(ox)}
    }
  }

  Huebot.command_list = []
  Huebot.public_command_list = []

  for (let key in Huebot.commands) {
    Huebot.command_list.push(key)

    if (Huebot.commands[key].public) {
      Huebot.public_command_list.push(key)
    }
  }

  Huebot.command_list.sort()

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
        if (Huebot.public_command_list.includes(cmd)) {
          allowed = Huebot.check_public_command(cmd, arg)
        } else {
          let cmd2 = Huebot.db.commands[cmd]

          if (cmd2) {
            if (cmd2.type === "image" || cmd2.type === "tv") {
              allowed = true
            } else if (cmd2.type === "alias") {
              let split = cmd2.url.split(" && ")

              allowed = true

              for (let c of split) {
                let sp = c.split(" ")
                let cmd = sp[0]
                let arg = sp.slice(1).join(" ")

                if (!Huebot.public_command_list.includes(cmd) || !Huebot.check_public_command(cmd, arg)) {
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
      if (cmd !== "commands") {
        let full_cmd = `${cmd} ${arg}`

        let and_split = full_cmd.split(" && ")

        if (and_split.length > 1) {
          let cmds = []

          for (let i = 0; i < and_split.length; i++) {
            let item = and_split[i]

            let c = item.trim()

            let cc
            let c2

            if (!c.startsWith(Huebot.prefix)) {
              cc = Huebot.prefix + c
              c2 = c
            } else {
              cc = c
              c2 = c.substring(1)
            }

            let acmd = Huebot.db.commands[c2]

            if (acmd !== undefined) {
              let spc = acmd.url.split(" ")[0]

              if (Huebot.command_list.includes(spc)) {
                cc = Huebot.prefix + acmd.url
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

  Huebot.execute_command = function (ctx, data, cmd, arg) {
    let command = Huebot.commands[cmd]

    if(command) {
      command.exec({ctx:ctx, data:data, arg:arg, cmd:cmd})
    } else {
      let closest = Huebot.find_closest(cmd, Huebot.command_list)
      if (closest) {
        Huebot.commands[closest].exec({ctx:ctx, data:data, arg:arg, cmd:closest})
      } else {
        if (Huebot.db.commands[cmd] !== undefined) {
          Huebot.run_command(ctx, cmd, arg, data)
        } else {
          let closest = Huebot.find_closest(cmd, Object.keys(Huebot.db.commands))
          if (closest) {
            Huebot.run_command(ctx, closest, arg, data)
          }
        }
      }
    }
  }
}