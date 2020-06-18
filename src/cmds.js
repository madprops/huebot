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
    "radio": {
      description: "Change the radio",
      public: false,
      exec: function(ox) {Huebot.change_radio(ox)}
    },
    "set": {
      description: "Set a command",
      public: false,
      exec: function(ox) {Huebot.add_custom_command(ox)}
    },
    "setforce": {
      description: "Set a command with a name that already exists",
      public: false,
      exec: function(ox) {Huebot.add_custom_command(ox)}
    },
    "unset": {
      description: "Remove a command",
      public: false,
      exec: function(ox) {Huebot.remove_custom_command(ox)}
    },
    "rename": {
      description: "Change the name of a command",
      public: false,
      exec: function(ox) {Huebot.rename_custom_command(ox)}
    },
    "list": {
      description: "List set commands",
      public: true,
      exec: function(ox) {Huebot.list_custom_commands(ox)}
    },
    "random": {
      description: "Execute a random command",
      public: true,
      exec: function(ox) {Huebot.execute_random_custom_command(ox)}
    },
    "q": {
      description: "Control the queue",
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
    "themeadd": {
      description: "Save current theme",
      public: false,
      exec: function(ox) {Huebot.add_theme(ox)}
    },
    "themeremove": {
      description: "Remove a theme",
      public: false,
      exec: function(ox) {Huebot.remove_theme(ox)}
    },
    "themerename": {
      description: "Change the name of a theme",
      public: false,
      exec: function(ox) {Huebot.rename_theme(ox)}
    },
    "theme": {
      description: "Apply a theme",
      public: false,
      exec: function(ox) {Huebot.apply_theme(ox)}
    },
    "themes": {
      description: "List themes",
      public: false,
      exec: function(ox) {Huebot.list_themes(ox)}
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
    "clearcommands": {
      description: "Remove all commands",
      public: false,
      exec: function(ox) {Huebot.clear_commands(ox)}
    },
    "clearadmins": {
      description: "Remove all bot admins",
      public: false,
      exec: function(ox) {Huebot.clear_admins(ox)}
    },
    "clearthemes": {
      description: "Remove all themes",
      public: false,
      exec: function(ox) {Huebot.clear_themes(ox)}
    },
    "clearsubjects": {
      description: "Remove all tv subjects",
      public: false,
      exec: function(ox) {Huebot.clear_subjects(ox)}
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
    "subjectadd": {
      description: "Add a tv subject",
      public: false,
      exec: function(ox) {Huebot.add_subject(ox)}
    },
    "subjectremove": {
      description: "Remove a tv subject",
      public: false,
      exec: function(ox) {Huebot.remove_subject(ox)}
    },
    "subjectrename": {
      description: "Rename a tv subject",
      public: false,
      exec: function(ox) {Huebot.rename_subject(ox)}
    },
    "subjectkeywords": {
      description: "List keywords added to a tv subject",
      public: false,
      exec: function(ox) {Huebot.show_subject_keywords(ox)}
    },
    "subjectkeywordsadd": {
      description: "Add a keyword to a tv subject",
      public: false,
      exec: function(ox) {Huebot.add_subject_keyword(ox)}
    },
    "subjectkeywordsremove": {
      description: "Remove a keyword from a tv subject",
      public: false,
      exec: function(ox) {Huebot.remove_subject_keyword(ox)}
    },
    "subject": {
      description: "Use a keyword to find a semi-random video",
      public: true,
      exec: function(ox) {Huebot.use_subject(ox)}
    },
    "subjects": {
      description: "List saved tv subjects",
      public: false,
      exec: function(ox) {Huebot.list_subjects(ox)}
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
    "backgroundadd": {
      description: "Save the current background",
      public: false,
      exec: function(ox) {Huebot.add_background(ox)}
    },
    "backgroundremove": {
      description: "Remove a background",
      public: false,
      exec: function(ox) {Huebot.remove_background(ox)}
    },
    "backgroundrename": {
      description: "Change the name of a background",
      public: false,
      exec: function(ox) {Huebot.rename_background(ox)}
    },
    "background": {
      description: "Apply a background",
      public: false,
      exec: function(ox) {Huebot.apply_background(ox)}
    },
    "backgrounds": {
      description: "List backgrounds",
      public: false,
      exec: function(ox) {Huebot.list_backgrounds(ox)}
    },
    "backgroundmode": {
      description: "Change the background mode",
      public: false,
      exec: function(ox) {Huebot.change_background_mode(ox)}
    },
    "clearbackgrounds": {
      description: "Remove all backgrounds",
      public: false,
      exec: function(ox) {Huebot.clear_backgrounds(ox)}
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
      description: "Suggest topics/subjects",
      public: false,
      exec: function(ox) {Huebot.suggest(ox)}
    },
    "song": {
      description: "Play a random song on the synth",
      public: false,
      exec: function(ox) {Huebot.play_song(ox)}
    },
    "key": {
      description: "Play a synth key",
      public: false,
      exec: function(ox) {Huebot.synth_key(ox)}
    },
    "speak": {
      description: "Say something through the voice synth",
      public: false,
      exec: function(ox) {Huebot.speak(ox)}
    },
    "think": {
      description: "Get a random showerthought",
      public: false,
      exec: function(ox) {Huebot.think(ox)}
    },
    "think2": {
      description: "Speak a random showerthought",
      public: false,
      exec: function(ox) {Huebot.think2(ox)}
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
    if (!Huebot.command_list.includes(cmd)) {
      if (Huebot.db.commands[cmd] !== undefined) {
        Huebot.run_command(ctx, cmd, arg, data)
      } else {
        let highest_num = 0
        let highest_cmd

        for (let cmd2 in Huebot.db.commands) {
          let num = Huebot.string_similarity(cmd, cmd2)

          if (num > highest_num) {
            highest_num = num
            highest_cmd = cmd2
          }
        }

        if (highest_num >= 0.8) {
          Huebot.run_command(ctx, highest_cmd, arg, data)
        }
      }

      return false
    }

    let command = Huebot.commands[cmd]

    if(command && command.exec) {
      command.exec({ctx:ctx, data:data, arg:arg, cmd:cmd})
    }
  }
}