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

    let ox = {ctx:ctx, data:data, arg:arg, cmd:cmd}

    if (cmd === "image") {
      Huebot.change_image(ox)
    } else if (cmd === "tv") {
      Huebot.change_tv(ox)
    } else if (cmd === "radio") {
      Huebot.change_radio(ox)
    } else if (cmd === "backgroundmode") {
      Huebot.change_background_mode(ox)
    } else if (cmd === "thememode") {
      Huebot.change_theme_mode(ox)
    } else if (cmd === "set" || cmd === "setforce") {
      Huebot.add_custom_command(ox)
    } else if (cmd === "unset") {
      Huebot.remove_custom_command(ox)
    } else if (cmd === "rename") {
      Huebot.rename_custom_command(ox)
    } else if (cmd === "list") {
      Huebot.list_custom_commands(ox)
    } else if (cmd === "random") {
      Huebot.execute_random_custom_command(ox)
    } else if (cmd === "whatis") {
      Huebot.whatis_command(ox)
    } else if (cmd === "adminadd") {
      Huebot.add_admin(ox)
    } else if (cmd === "adminremove") {
      Huebot.remove_admin(ox)
    } else if (cmd === "admins") {
      Huebot.list_admins(ox)
    } else if (cmd === "themeadd") {
      Huebot.add_theme(ox)
    } else if (cmd === "themeremove") {
      Huebot.remove_theme(ox)
    } else if (cmd === "themerename") {
      Huebot.rename_theme(ox)
    } else if (cmd === "theme") {
      Huebot.apply_theme(ox)
    } else if (cmd === "themes") {
      Huebot.list_themes(ox)
    } else if (cmd === "decide") {
      Huebot.decide_something(ox)
    } else if (cmd === "pick") {
      Huebot.pick_something(ox)
    } else if (cmd == "wiki") {
      Huebot.search_wiki(ox)
    } else if (cmd === "subjectadd") {
      Huebot.add_subject(ox)
    } else if (cmd === "subjectrename") {
      Huebot.rename_subject(ox)
    } else if (cmd === "subjectremove") {
      Huebot.remove_subject(ox)
    } else if (cmd === "subjectkeywords") {
      Huebot.show_subject_keywords(ox)
    } else if (cmd === "subjectkeywordsadd") {
      Huebot.add_subject_keyword(ox)
    } else if (cmd === "subjectkeywordsremove") {
      Huebot.remove_subject_keyword(ox)
    } else if (cmd === "subject") {
      Huebot.use_subject(ox)
    } else if (cmd === "subjects") {
      Huebot.list_subjects(ox)
    } else if (cmd === "public") {
      Huebot.change_public(ox)
    } else if (cmd === "q") {
      Huebot.manage_queue(ox)
    } else if (cmd === "ping") {
      Huebot.process_feedback(ctx, data, "Pong")
    } else if (cmd === "stream") {
      Huebot.get_random_stream(ox)
    } else if (cmd === "activity") {
      Huebot.show_activity(ox)
    } else if (cmd === "clearcommands") {
      Huebot.clear_commands(ox)
    } else if (cmd === "clearadmins") {
      Huebot.clear_admins(ox)
    } else if (cmd === "clearthemes") {
      Huebot.clear_themes(ox)
    } else if (cmd === "clearsubjects") {
      Huebot.clear_subjects(ox)
    } else if (cmd === "clearbackgrounds") {
      Huebot.clear_backgrounds(ox)
    } else if (cmd === "say") {
      Huebot.say(ox)
    } else if (cmd === "join") {
      Huebot.join_room(ox)
    } else if (cmd === "leave") {
      Huebot.leave_room(ox)
    } else if (cmd === "backgroundadd") {
      Huebot.add_background(ox)
    } else if (cmd === "backgroundremove") {
      Huebot.remove_background(ox)
    } else if (cmd === "backgroundrename") {
      Huebot.rename_background(ox)
    } else if (cmd === "background") {
      Huebot.apply_background(ox) 
    } else if (cmd === "backgrounds") {
      Huebot.list_backgrounds(ox)
    } else if (cmd === "suggest") {
      Huebot.suggest(ox)
    } else if (cmd === "song") {
      Huebot.play_song(ox)
    } else if (cmd === "key") {
      Huebot.synth_key(ox)
    } else if (cmd === "speak") {
      Huebot.speak(ox)
    } else if (cmd === "think") {
      Huebot.think(ox)
    } else if (cmd === "think2") {
      Huebot.think2(ox)
    } else if (cmd === "remind") {
      Huebot.remind(ox)
    } else if (cmd === "calc") {
      Huebot.do_calculation(ox)
    } else if (cmd === "roll") {
      Huebot.roll_dice(ox)
    } else if (cmd === "users") {
      Huebot.show_users(ox)
    } else if (cmd === "help") {
      Huebot.show_help(ox)
    }
  }
}