const fetch = require("node-fetch")

module.exports = function (Huebot) {
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

    if (cmd === "image") {
      Huebot.change_image(ctx, data, arg)
    } else if (cmd === "tv") {
      Huebot.change_tv(ctx, data, arg)
    } else if (cmd === "radio") {
      Huebot.change_radio(ctx, data, arg)
    } else if (cmd === "backgroundmode") {
      Huebot.change_background_mode(ctx, data, arg)
    } else if (cmd === "thememode") {
      Huebot.change_theme_mode(ctx, data, arg)
    } else if (cmd === "set" || cmd === "setforce") {
      Huebot.add_custom_command(ctx, data, arg, cmd)
    } else if (cmd === "unset") {
      Huebot.remove_custom_command(ctx, data, arg)
    } else if (cmd === "rename") {
      Huebot.rename_custom_command(ctx, data, arg)
    } else if (cmd === "list") {
      Huebot.list_custom_commands(ctx, data, arg)
    } else if (cmd === "random") {
      Huebot.execute_random_custom_command(ctx, data, arg)
    } else if (cmd === "whatis") {
      Huebot.whatis_command(ctx, data, arg)
    } else if (cmd === "adminadd") {
      Huebot.add_admin(ctx, data, arg)
    } else if (cmd === "adminremove") {
      Huebot.remove_admin(ctx, data, arg)
    } else if (cmd === "admins") {
      Huebot.list_admins(ctx, data, arg)
    } else if (cmd === "themeadd") {
      Huebot.add_theme(ctx, data, arg)
    } else if (cmd === "themeremove") {
      Huebot.remove_theme(ctx, data, arg)
    } else if (cmd === "themerename") {
      Huebot.rename_theme(ctx, data, arg)
    } else if (cmd === "theme") {
      Huebot.apply_theme(ctx, data, arg)
    } else if (cmd === "themes") {
      Huebot.list_themes(ctx, data, arg)
    } else if (cmd === "decide") {
      Huebot.decide_something(ctx, data, arg)
    } else if (cmd === "pick") {
      Huebot.pick_something(ctx, data, arg)
    } else if (cmd == "wiki") {
      Huebot.search_wiki(ctx, data, arg)
    } else if (cmd === "subjectadd") {
      Huebot.add_subject(ctx, data, arg)
    } else if (cmd === "subjectrename") {
      Huebot.rename_subject(ctx, data, arg)
    } else if (cmd === "subjectremove") {
      Huebot.remove_subject(ctx, data, arg)
    } else if (cmd === "subjectkeywords") {
      Huebot.show_subject_keywords(ctx, data, arg)
    } else if (cmd === "subjectkeywordsadd") {
      Huebot.add_subject_keyword(ctx, data, arg)
    } else if (cmd === "subjectkeywordsremove") {
      Huebot.remove_subject_keyword(ctx, data, arg)
    } else if (cmd === "subject") {
      Huebot.use_subject(ctx, data, arg)
    } else if (cmd === "subjects") {
      Huebot.list_subjects(ctx, data, arg)
    } else if (cmd === "public") {
      Huebot.change_public(ctx, data, arg)
    } else if (cmd === "q") {
      Huebot.manage_queue(ctx, data, arg)
    } else if (cmd === "ping") {
      Huebot.process_feedback(ctx, data, "Pong")
    } else if (cmd === "stream") {
      Huebot.get_random_stream(ctx, data, arg)
    } else if (cmd === "activity") {
      Huebot.show_activity(ctx, data, arg)
    } else if (cmd === "clearcommands") {
      Huebot.clear_commands(ctx, data, arg)
    } else if (cmd === "clearadmins") {
      Huebot.clear_admins(ctx, data, arg)
    } else if (cmd === "clearthemes") {
      Huebot.clear_themes(ctx, data, arg)
    } else if (cmd === "clearsubjects") {
      Huebot.clear_subjects(ctx, data, arg)
    } else if (cmd === "clearbackgrounds") {
      Huebot.clear_backgrounds(ctx, data, arg)
    } else if (cmd === "say") {
      Huebot.say(ctx, data, arg)
    } else if (cmd === "join") {
      Huebot.join_room(ctx, data, arg)
    } else if (cmd === "leave") {
      Huebot.leave_room(ctx, data, arg)
    } else if (cmd === "backgroundadd") {
      Huebot.add_background(ctx, data, arg)
    } else if (cmd === "backgroundremove") {
      Huebot.remove_background(ctx, data, arg)
    } else if (cmd === "backgroundrename") {
      Huebot.rename_background(ctx, data, arg)
    } else if (cmd === "background") {
      Huebot.apply_background(ctx, data, arg) 
    } else if (cmd === "backgrounds") {
      Huebot.list_backgrounds(ctx, data, arg)
    } else if (cmd === "suggest") {
      Huebot.suggest(ctx, data, arg)
    } else if (cmd === "song") {
      Huebot.play_song(ctx, data, arg)
    } else if (cmd === "key") {
      Huebot.synth_key(ctx, data, arg)
    } else if (cmd === "speak") {
      Huebot.speak(ctx, data, arg)
    } else if (cmd === "think") {
      Huebot.think(ctx, data, arg)
    } else if (cmd === "think2") {
      Huebot.think2(ctx, data, arg)
    } else if (cmd === "remind") {
      Huebot.remind(ctx, data, arg)
    } else if (cmd === "calc") {
      Huebot.do_calculation(ctx, data, arg)
    } else if (cmd === "roll") {
      Huebot.roll_dice(ctx, data, arg)
    } else if (cmd === "users") {
      Huebot.show_users(ctx, data, arg)
    } else if (cmd === "help") {
      Huebot.show_help(ctx, data, arg)
    }
  }
}