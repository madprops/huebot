const MathJS = require("mathjs")
const fetch = require("node-fetch")

module.exports = function (Huebot) {
  let math_config = {
    number: 'BigNumber',
    precision: 64
  }

  const math = MathJS.create(MathJS.all, math_config)

  Huebot.change_image = function (ox) {
    Huebot.change_media(ox.ctx, {
      type: "image",
      src: ox.arg
    })
  }

  Huebot.change_tv = function (ox) {
    Huebot.change_media(ox.ctx, {
      type: "tv",
      src: ox.arg
    })
  }

  Huebot.change_radio = function (ox) {
    Huebot.change_media(ox.ctx, {
      type: "radio",
      src: ox.arg
    })
  }

  Huebot.add_custom_command = function (ox) {
    let split = ox.arg.split(' ')
    let command_name = split[0]
    let command_type = split[1]
    let command_url = split.slice(2).join(" ")

    if (!ox.arg || split.length < 3 || (!Huebot.config.media_types.includes(command_type) && command_type !== "alias")) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}${ox.cmd} [name] ${Huebot.config.media_types.join("|")}|alias [url]`)
      return false
    }

    if (Huebot.command_list.includes(command_name)) {
      Huebot.process_feedback(ox.ctx, ox.data, `Command "${command_name}" is reserved.`)
      return false
    }

    if (command_type === "alias") {
      let and_split = command_url.split(" && ")

      for (let item of and_split) {
        let c = item.trim().split(" ")[0]

        if (!Huebot.command_list.includes(c)) {
          Huebot.process_feedback(ox.ctx, ox.data, "Not a valid alias. Remember to not include the trigger character.")
          return false
        }
      }
    }

    let oc = Huebot.db.commands[command_name]

    if (oc && ox.cmd !== "setforce") {
      Huebot.process_feedback(ox.ctx, ox.data, `"${command_name}" already exists. Use "${Huebot.prefix}setforce" to overwrite.`)
      return false
    }

    let testobj = {}

    try {
      testobj[command_name] = {
        type: command_type,
        url: command_url
      }
      Huebot.db.commands[command_name] = {
        type: command_type,
        url: command_url
      }

      Huebot.save_file("commands.json", Huebot.db.commands, function (err) {
        Huebot.send_message(ox.ctx, `Command "${command_name}" successfully set.`)
      })
    } catch (err) {
      Huebot.process_feedback(ox.ctx, ox.data, `Can't save that command.`)
      return false
    }
  }

  Huebot.remove_custom_command = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}unset [name]`)
      return false
    }
  
    if (Huebot.db.commands[ox.arg] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Command "${ox.arg}" doesn't exist.`)
      return false
    }
  
    delete Huebot.db.commands[ox.arg]
  
    Huebot.save_file("commands.json", Huebot.db.commands, function () {
      Huebot.send_message(ox.ctx, `Command "${ox.arg}" successfully unset.`)
    })
  }

  Huebot.rename_custom_command = function (ox) {
    let split = ox.arg.split(' ')
    let old_name = split[0]
    let new_name = split[1]

    if (!ox.arg || split.length !== 2) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}rename [old_name] [new_name]`)
      return false
    }

    if (Huebot.db.commands[old_name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Command "${old_name}" doesn't exist.`)
      return false
    }

    try {
      Huebot.db.commands[new_name] = Huebot.db.commands[old_name]

      delete Huebot.db.commands[old_name]

      Huebot.save_file("commands.json", Huebot.db.commands, function () {
        Huebot.send_message(ox.ctx, `Command "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ox.ctx, ox.data, `Can't rename that command.`)
      return false
    }
  }

  Huebot.list_custom_commands = function (ox) {
    let sort_mode = "random"

    if (ox.arg) {
      sort_mode = "sort"
    }
  
    let cmds = Object.keys(Huebot.db.commands)
  
    cmds = cmds.filter(x => Huebot.db.commands[x].type !== "alias")
  
    let s = Huebot.list_items({
      data: cmds,
      filter: ox.arg,
      prepend: Huebot.prefix,
      sort_mode: sort_mode,
      whisperify: `${Huebot.prefix}`,
      mode: "commands"
    })
  
    if (!s) {
      s = "No commands found."
    }
  
    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.execute_random_custom_command = function (ox) {
    let comment = generate_random_controls()
    let words = false

    if (ox.arg) {
      if (ox.arg === "tv" || ox.arg === "radio") {
        let n = Huebot.get_random_int(0, 2)

        if (n === 0) {
          words = true
        }
      }
    }

    if (ox.arg && !words) {
      let cmds = Object.keys(Huebot.db.commands)

      cmds = cmds.filter(x => Huebot.db.commands[x].type !== "alias")

      if (!Huebot.config.media_types.includes(ox.arg)) {
        return false
      }

      cmds = cmds.filter(x => Huebot.db.commands[x].type === ox.arg)

      let c = cmds[Huebot.get_random_int(0, cmds.length - 1)]

      ox.data.comment = comment

      if (c) {
        Huebot.run_command(ox.ctx, c, ox.arg, ox.data)
      }
    } else {
      let type = "tv"
      let word1, word2

      if (ox.arg) {
        type = ox.arg
      }

      if (!ox.arg || ox.arg === "tv") {
        if (!ox.ctx.can_tv) {
          Huebot.process_feedback(ox.ctx, ox.data, Huebot.config.no_tv_error)
          return false
        }

        word1 = Huebot.get_random_word()
        word2 = Huebot.get_random_word()
      } else if (ox.arg === "radio") {
        if (!ox.ctx.can_radio) {
          Huebot.process_feedback(ox.ctx, ox.data, Huebot.config.no_radio_error)
          return false
        }

        word1 = Huebot.get_random_word()
        word2 = "music"
      }

      Huebot.change_media(ox.ctx, {
        type: type,
        src: `${word1} ${word2}`,
        comment: comment
      })
    }
  }

  Huebot.whatis_command = function (ox) {
    if (!ox.arg || ox.arg.split(" ").length > 1) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}whatis [command_name]`)
      return false
    }

    if (Huebot.command_list.includes(ox.arg)) {
      Huebot.process_feedback(ox.ctx, ox.data, `${ox.arg}: ${Huebot.commands[ox.arg].description}`)
    } else {
      let command = Huebot.db.commands[ox.arg]

      if (command) {
        Huebot.process_feedback(ox.ctx, ox.data, `"${ox.arg}" is of type "${command.type}" and is set to "${safe_replacements(command.url)}".`)
      } else {
        Huebot.process_feedback(ox.ctx, ox.data, `Command "${ox.arg}" doesn't exist.`)
      }
    }
  }

  Huebot.add_admin = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}adminadd [username]`)
      return false
    }

    if (ox.arg === ox.data.username) {
      return false
    }

    if (!Huebot.db.permissions.admins.includes(ox.arg)) {
      Huebot.db.permissions.admins.push(ox.arg)

      Huebot.save_file("permissions.json", Huebot.db.permissions, function (err) {
        Huebot.send_message(ox.ctx, `Username "${ox.arg}" was successfully added as an admin.`)
      })
    }
  }

  Huebot.remove_admin = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}adminremove [username]`)
      return false
    }

    if (ox.arg === ox.data.username) {
      return false
    }

    if (Huebot.db.permissions.admins.includes(ox.arg)) {
      for (let i = 0; i < Huebot.db.permissions.admins.length; i++) {
        let admin = Huebot.db.permissions.admins[i]

        if (admin === ox.arg) {
          Huebot.db.permissions.admins.splice(i, 1)
        }
      }

      Huebot.save_file("permissions.json", Huebot.db.permissions, function (err) {
        Huebot.send_message(ox.ctx, `Username "${ox.arg}" was successfully removed as an admin.`)
      })
    } else {
      Huebot.process_feedback(ox.ctx, ox.data, `"${ox.arg}" is not an admin. Nothing to remove.`)
    }
  }

  Huebot.list_admins = function (ox) {
    let sort_mode = "random"

    if (ox.arg) {
      sort_mode = "sort"
    }
  
    let s = Huebot.list_items({
      data: Huebot.db.permissions.admins,
      filter: ox.arg,
      append: ",",
      sort_mode: sort_mode
    })
  
    if (!s) {
      s = "No admins found."
    }
  
    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.change_background_mode = function (ox) {
    if (!Huebot.check_op_permission(ox.ctx, "background")) {
      return false
    }

    if (!ox.data || !ox.arg) {
      return false
    }

    if (!Huebot.is_admin_or_op(ox.ctx.role)) {
      Huebot.process_feedback(ox.ctx, ox.data, "I need to be an operator to do that.")
      return false
    }

    let modes = ["normal", "tiled", "mirror", "mirror_tiled", "solid"]

    if (!modes.includes(ox.arg)) {
      Huebot.process_feedback(ox.ctx, ox.data, "Invalid background mode.")
      return false
    }

    if (ox.arg === ox.ctx.background_mode) {
      Huebot.process_feedback(ox.ctx, ox.data, "Background mode is already set to that.")
      return false
    }

    Huebot.socket_emit(ox.ctx, "change_background_mode", {
      mode: ox.arg
    })
  }

  Huebot.change_theme_mode = function (ox) {
    if (!Huebot.check_op_permission(ox.ctx, "theme")) {
      return false
    }

    if (!ox.data || !ox.arg) {
      return false
    }

    if (!Huebot.is_admin_or_op(ox.ctx.role)) {
      Huebot.process_feedback(ox.ctx, ox.data, "I need to be an operator to do that.")
      return false
    }

    let modes = ["automatic", "custom"]

    if (!modes.includes(ox.arg)) {
      Huebot.process_feedback(ox.ctx, ox.data, "Invalid theme mode.")
      return false
    }

    if (ox.arg === ox.ctx.theme_mode) {
      Huebot.process_feedback(ox.ctx, ox.data, "Theme mode is already set to that.")
      return false
    }

    Huebot.socket_emit(ox.ctx, "change_theme_mode", {
      mode: ox.arg
    })
  }

  Huebot.add_theme = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}themeadd [name]`)
      return false
    }

    if (ox.ctx.theme_mode !== "custom") {
      Huebot.process_feedback(ox.ctx, ox.data, "Automatic themes can't be saved.")
      return false
    }

    let obj = {}

    obj.theme = ox.ctx.theme
    obj.text_color = ox.ctx.text_color
    obj.text_color_mode = ox.ctx.text_color_mode

    Huebot.db.themes[ox.arg] = obj

    Huebot.save_file("themes.json", Huebot.db.themes, function () {
      Huebot.send_message(ox.ctx, `Theme "${ox.arg}" successfully added.`)
    })
  }

  Huebot.remove_theme = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}themeremove [name]`)
      return false
    }
  
    if (Huebot.db.themes[ox.arg] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Theme "${ox.arg}" doesn't exist.`)
      return false
    }
  
    delete Huebot.db.themes[ox.arg]
  
    Huebot.save_file("themes.json", Huebot.db.themes, function () {
      Huebot.send_message(ox.ctx, `Theme "${ox.arg}" successfully removed.`)
    })
  }

  Huebot.rename_theme = function (ox) {
    let split = ox.arg.split(' ')
    let old_name = split[0]
    let new_name = split[1]
  
    if (!ox.arg || split.length !== 2) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}themerename [old_name] [new_name]`)
      return false
    }
  
    if (Huebot.db.themes[old_name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Theme "${old_name}" doesn't exist.`)
      return false
    }
  
    try {
      Huebot.db.themes[new_name] = Huebot.db.themes[old_name]
  
      delete Huebot.db.themes[old_name]
  
      Huebot.save_file("themes.json", Huebot.db.themes, function (err) {
        Huebot.send_message(ox.ctx, `Theme "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ox.ctx, ox.data, `Can't rename that theme.`)
      return false
    }
  }

  Huebot.apply_theme = function (ox) {
    if (!Huebot.check_op_permission(ox.ctx, "theme")) {
      return false
    }

    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}theme [name]`)
      return false
    }

    let obj = Huebot.db.themes[ox.arg]

    if (obj) {
      if (ox.ctx.theme_mode !== "custom") {
        Huebot.change_theme_mode(ox.ctx, ox.data, "custom")
      }

      obj.theme = Huebot.clean_string5(obj.theme)
      obj.text_color = Huebot.clean_string5(obj.text_color)

      if (obj.theme.startsWith("rgb")) {
        obj.theme = Huebot.rgb_to_hex(obj.theme)
      }

      if (obj.text_color.startsWith("rgb")) {
        obj.text_color = Huebot.rgb_to_hex(obj.text_color)
      }

      if (obj.theme && obj.theme !== ox.ctx.theme) {
        Huebot.socket_emit(ox.ctx, "change_theme", {
          color: obj.theme
        })
      }

      if (obj.text_color_mode && obj.text_color_mode !== ox.ctx.text_color_mode) {
        Huebot.socket_emit(ox.ctx, "change_text_color_mode", {
          mode: obj.text_color_mode
        })
      }

      if (obj.text_color_mode && obj.text_color_mode === "custom") {
        if (obj.text_color && obj.text_color !== ox.ctx.text_color) {
          Huebot.socket_emit(ox.ctx, "change_text_color", {
            color: obj.text_color
          })
        }
      }
    } else {
      Huebot.process_feedback(ox.ctx, ox.data, `Theme "${ox.arg}" doesn't exist.`)
    }
  }

  Huebot.list_themes = function (ox) {
    let sort_mode = "random"

    if (ox.arg) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: Huebot.db.themes,
      filter: ox.arg,
      append: ",",
      sort_mode: sort_mode,
      whisperify: `${Huebot.prefix}theme `
    })

    if (!s) {
      s = "No themes found."
    }

    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.search_wiki = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, "No search term provided.")
      return false
    }
  
    let query = `https://en.wikipedia.org/api/rest_v1/page/summary/${ox.arg}`
  
    fetch(query)
  
    .then(res => {
      return res.json()
    })

    .then(res => {
      if (res.extract) {
        Huebot.process_feedback(ox.ctx, ox.data, res.extract)
      }
    })
  }

  Huebot.decide_something = function (ox) {
    let ans
    let n = Huebot.get_random_int(0, 1)
  
    if (n == 0) {
      ans = "Yeah"
    } else {
      ans = "Nah"
    }
  
    Huebot.process_feedback(ox.ctx, ox.data, ans)
  }

  Huebot.pick_something = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, "Give me a space separated list to pick from.")
    }

    let split = ox.arg.split(' ')
    let n = Huebot.get_random_int(0, split.length - 1)
    Huebot.process_feedback(ox.ctx, ox.data, split[n])
  }

  Huebot.add_subject = function (ox) {
    let error = false

    if (!ox.arg) {
      error = true
    }

    if (!error) {
      if (ox.arg.split(" ").length > 1) {
        error = true
      }
    }

    if (error) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subjectadd [name:no_spaces]`)
      return false
    }

    let name = ox.arg.toLowerCase()

    if (Huebot.db.subjects[name] === undefined) {
      Huebot.db.subjects[name] = []

      Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
        Huebot.send_message(ox.ctx, `Subject "${name}" successfully added. Use ${Huebot.prefix}subjectkeywordsadd to add additional keywords to the subject.`)
      })
    } else {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" already exists.`)
    }
  }

  Huebot.remove_subject = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subjectremove [name]`)
      return false
    }

    let name = ox.arg.toLowerCase()

    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" doesn't exist.`)
      return false
    }

    delete Huebot.db.subjects[name]

    Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
      Huebot.send_message(ox.ctx, `Subject "${name}" successfully removed.`)
    })
  }

  Huebot.rename_subject = function (ox) {
    let split = ox.arg.split(' ')
    let old_name = split[0].toLowerCase()
    let new_name = split.slice(1).join(" ").toLowerCase()

    if (!ox.arg || split.length !== 2) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subjectrename [old_name:no_spaces] [new_name:no_spaces]`)
      return false
    }

    if (Huebot.db.subjects[old_name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${old_name}" doesn't exist.`)
      return false
    }

    try {
      Huebot.db.subjects[new_name] = Huebot.db.subjects[old_name]

      delete Huebot.db.subjects[old_name]

      Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
        Huebot.send_message(ox.ctx, `Subject "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ox.ctx, ox.data, `Can't rename that subject.`)
      return false
    }
  }

  Huebot.show_subject_keywords = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subjectkeywords [name:no_spaces]`)
      return false
    }

    let split = ox.arg.split(" ")
    let name = split[0].toLowerCase()
    let filter = split.slice(1).join(" ").toLowerCase()

    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" doesn't exist.`)
      return false
    }

    let list = Huebot.db.subjects[name]

    if (list.length === 0) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" is empty.`)
      return false
    }

    let sort_mode = "random"

    if (filter) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: list,
      filter: filter,
      append: ",",
      sort_mode: sort_mode
    })

    if (!s) {
      s = "No subjects found."
    }

    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.add_subject_keyword = function (ox) {
    let error = false

    if (!ox.arg) {
      error = true
    }
  
    let split
    let name
    let keyword
  
    if (!error) {
      split = ox.arg.split(" ")
      name = split[0].toLowerCase()
      keyword = split.slice(1).join(" ").toLowerCase()
  
      if (!name || !keyword) {
        error = true
      }
    }
  
    if (error) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subjectkeywordsadd [name:no_spaces] [keyword]`)
      return false
    }
  
    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" doesn't exist.`)
      return false
    }
  
    let list = Huebot.db.subjects[name]
  
    for (let i of list) {
      if (i === keyword) {
        Huebot.process_feedback(ox.ctx, ox.data, `"${keyword}" is already part of subject "${name}".`)
        return false
      }
    }
  
    list.push(keyword)
  
    Huebot.save_file("subjects.json", Huebot.db.subjects, function (err) {
      Huebot.send_message(ox.ctx, `"${keyword}" successfully added to subject "${name}".`)
    })
  }

  Huebot.remove_subject_keyword = function (ox) {
    let error = false

    if (!ox.arg) {
      error = true
    }
  
    let split
    let name
    let keyword
  
    if (!error) {
      split = ox.arg.split(" ")
      name = split[0].toLowerCase()
      keyword = split.slice(1).join(" ").toLowerCase()
  
      if (!name || !keyword) {
        error = true
      }
    }
  
    if (error) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subjectkeywordsremove [name:no_spaces] [keyword]`)
      return false
    }
  
    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" doesn't exist.`)
      return false
    }
  
    let list = Huebot.db.subjects[name]
  
    if (list.length === 0) {
      Huebot.process_feedback(ox.ctx, ox.data, `Subject "${name}" is empty.`)
      return false
    }
  
    for (let i = 0; i < list.length; i++) {
      let kw = list[i]
  
      if (kw === keyword) {
        list.splice(i, 1)
  
        Huebot.save_file("subjects.json", Huebot.db.subjects, function (err) {
          Huebot.send_message(ox.ctx, `"${keyword}" was removed from subject "${name}".`)
          return true
        })
  
        return true
      }
    }
  
    Huebot.process_feedback(ox.ctx, ox.data, `"${keyword}" is not part of subject "${name}".`)
  }

  Huebot.use_subject = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}subject [name] > ${Huebot.config.media_types.join("|")} : optional`)
      return false
    }

    let split = ox.arg.split(">")
    let name = split[0].toLowerCase().trim()
    let type = split.slice(1).join(" ").toLowerCase().trim()
    let list = []

    if (Huebot.db.subjects[name] !== undefined) {
      list = Huebot.db.subjects[name]
    }

    let query

    if (list.length === 0) {
      query = `${name} ${Huebot.get_random_word()}`
    } else {
      query = `${name} ${list[Huebot.get_random_int(0, list.length - 1)]} ${Huebot.get_random_word()}`
    }

    if (type) {
      if (type === "image") {
        Huebot.change_media(ox.ctx, {
          type: "image",
          src: query
        })
      } else if (type === "tv") {
        Huebot.change_media(ox.ctx, {
          type: "tv",
          src: query
        })
      } else if (type === "radio") {
        Huebot.change_media(ox.ctx, {
          type: "radio",
          src: query
        })
      }
    } else {
      Huebot.change_media(ox.ctx, {
        type: "tv",
        src: query
      })
    }
  }

  Huebot.list_subjects = function (ox) {
    let sort_mode = "random"

    if (ox.arg) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: Huebot.db.subjects,
      filter: ox.arg,
      append: ",",
      sort_mode: sort_mode,
      whisperify: `${Huebot.prefix}subject `
    })

    if (!s) {
      s = "No subjects found."
    }

    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.change_public = function (ox) {
    if (!ox.arg || (ox.arg !== "on" && ox.arg !== "off")) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}public on|off`)
      return false
    }

    if (ox.arg === "on") {
      if (Huebot.db.options.public_commands) {
        Huebot.process_feedback(ox.ctx, ox.data, "Public Commands are already on.")
        return false
      }

      Huebot.db.options.public_commands = true

      Huebot.save_file("options.json", Huebot.db.options, function () {
        Huebot.send_message(ox.ctx, `Public Commands are now on.`)
      })
    } else if (ox.arg === "off") {
      if (!Huebot.db.options.public_commands) {
        Huebot.process_feedback(ox.ctx, ox.data, "Public Commands are already off.")
        return false
      }

      Huebot.db.options.public_commands = false

      Huebot.save_file("options.json", Huebot.db.options, function () {
        Huebot.send_message(ox.ctx, `Public Commands are now off.`)
      })
    }
  }

  Huebot.manage_queue = function (ox) {
    let error = false

    let arg1
    let arg2

    if (!ox.arg) {
      error = true
    } else {
      let split = ox.arg.split(' ')

      if (split.length < 2) {
        error = true
      } else {
        arg1 = split[0]

        if (!Huebot.config.media_types.includes(arg1) && arg1 !== "remove" && isNaN(arg1)) {
          error = true
        } else {
          arg2 = split.slice(1).join(" ")
        }
      }
    }

    if (error) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}q ${Huebot.config.media_types.join("|")} [url]|next|clear|size`)
      return false
    }

    let error_string
    let upname
    let perm

    if (arg1 === "image") {
      error_string = Huebot.config.no_image_error
      upname = "Image"
      perm = ox.ctx.can_image
    } else if (arg1 === "tv") {
      error_string = Huebot.config.no_tv_error
      upname = "TV"
      perm = ox.ctx.can_tv
    } else if (arg1 === "radio") {
      error_string = Huebot.config.no_radio_error
      upname = "Radio"
      perm = ox.ctx.can_radio
    } else if (arg1 === "remove") {
      if (Huebot.get_q_item(arg2, "delete")) {
        Huebot.process_feedback(ox.ctx, ox.data, "Item successfully removed.")
      } else {
        Huebot.process_feedback(ox.ctx, ox.data, "This was already played or removed.")
      }
      return
    } else if (!isNaN(arg1)) {
      let item = Huebot.get_q_item(arg1, "delete")

      if (item) {
        Huebot.selective_play(ox.ctx, item.kind, item.url)
        Huebot.save_file("queue.json", Huebot.db.queue)
      } else {
        Huebot.process_feedback(ox.ctx, ox.data, "This was already played or removed.")
      }
      return
    }

    if (arg2 === "next") {
      if (Huebot.db.queue[arg1].length > 0) {
        if (!perm) {
          Huebot.process_feedback(ox.ctx, ox.data, error_string)
          return false
        }

        let item = Huebot.db.queue[arg1].shift()

        if (typeof item !== "object") {
          return
        }

        Huebot.selective_play(ox.ctx, item.kind, item.url)
        Huebot.save_file("queue.json", Huebot.db.queue)
      } else {
        Huebot.process_feedback(ox.ctx, ox.data, `${upname} queue is empty.`)
      }
    } else if (arg2 === "clear") {
      if (Huebot.db.queue[arg1].length > 0) {
        Huebot.db.queue[arg1] = []

        Huebot.save_file("queue.json", Huebot.db.queue, function () {
          Huebot.send_message(ox.ctx, `${upname} queue successfully cleared.`)
        })
      } else {
        Huebot.process_feedback(ox.ctx, ox.data, `${upname} queue was already cleared.`)
      }
    } else if (arg2 === "size") {
      let n = Huebot.db.queue[arg1].length

      let s

      if (n === 1) {
        s = "item"
      } else {
        s = "items"
      }

      Huebot.process_feedback(ox.ctx, ox.data, `${upname} queue has ${n} ${s}.`)
    } else {
      if (Huebot.db.queue[arg1].includes(arg2)) {
        Huebot.process_feedback(ox.ctx, ox.data, `That item is already in the ${arg1} queue.`)
        return false
      }

      let obj = {}
      obj.kind = arg1
      obj.url = arg2
      obj.date = Date.now()

      Huebot.db.queue[arg1].push(obj)

      Huebot.save_file("queue.json", Huebot.db.queue, function () {
        let links = `[whisper .q ${obj.date} next]Play This[/whisper]`
        links += ` | [whisper .q ${arg1} next]Play Next[/whisper]`
        links += ` | [whisper .q remove ${obj.date} next]Remove[/whisper]`
        let message = `${upname} item successfully queued.`
        let ans = `${message}\n${links}`
        Huebot.send_message(ox.ctx, ans)
      })
    }
  }

  Huebot.get_random_stream = function (ox) {
    if (!Huebot.db.config.youtube_enabled) {
      Huebot.process_feedback(ox.ctx, ox.data, "No stream source support is enabled.")
      return false
    }

    Huebot.get_youtube_stream(ox.ctx)
  }

  Huebot.show_activity = function (ox) {
    let s = Huebot.list_items({
      data: ox.ctx.user_command_activity.slice(0).reverse(),
      append: ","
    })

    if (!s) {
      s = "No activity yet."
    }

    Huebot.process_feedback(ox.ctx, ox.data, `Recent command activity by: ${s}`)
  }

  Huebot.clear_commands = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }
  
    Huebot.db.commands = {}
  
    Huebot.save_file("commands.json", Huebot.db.commands, function () {
      Huebot.send_message(ox.ctx, `Commands list successfully cleared.`)
    })
  }

  Huebot.clear_admins = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    Huebot.db.permissions.admins = [ox.data.username]

    Huebot.save_file("permissions.json", Huebot.db.permissions, function () {
      Huebot.send_message(ox.ctx, `Admins list successfully cleared.`)
    })
  }

  Huebot.clear_themes = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    Huebot.db.themes = {}

    Huebot.save_file("themes.json", Huebot.db.themes, function () {
      Huebot.send_message(ox.ctx, `Themes list successfully cleared.`)
    })
  }

  Huebot.clear_subjects = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    Huebot.db.subjects = {}

    Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
      Huebot.send_message(ox.ctx, `Subjects list successfully cleared.`)
    })
  }

  Huebot.clear_backgrounds = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }
  
    Huebot.db.backgrounds = {}
  
    Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function () {
      Huebot.send_message(ox.ctx, `Backgrounds list successfully cleared.`)
    })
  }
  
  Huebot.say = function (ox) {
    if (!ox.arg) {
      return false
    }

    Huebot.send_message(ox.ctx, ox.arg)
  }
  
  Huebot.join_room = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Argument must be a room ID.`)
      return false
    }

    if (Huebot.connected_rooms[ox.arg] !== undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, "It seems I'm already in that room.")
      return false
    }

    Huebot.process_feedback(ox.ctx, ox.data, "Attempting to join that room!")
    Huebot.start_connection(ox.arg)
  }

  Huebot.leave_room = function (ox) {
    if (!Huebot.is_protected_admin(ox.data.username)) {
      return false
    }

    Huebot.process_feedback(ox.ctx, ox.data, "Good bye!")
    ox.ctx.socket.disconnect()
  }

  Huebot.add_background = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}backgroundadd [name]`)
      return false
    }

    if (ox.ctx.background_mode !== "normal" && ox.ctx.background_mode !== "tiled") {
      Huebot.process_feedback(ox.ctx, ox.data, "Only backgrounds that use an image can be saved.")
      return false
    }

    if (!ox.ctx.background_image.startsWith("http://") && !ox.ctx.background_image.startsWith("https://")) {
      Huebot.process_feedback(ox.ctx, ox.data, "Only backgrounds that use external images can be saved.")
      return false
    }

    let obj = {}

    obj.image = ox.ctx.background_image
    obj.mode = ox.ctx.background_mode
    obj.effect = ox.ctx.background_effect
    obj.tile_dimensions = ox.ctx.background_tile_dimensions

    Huebot.db.backgrounds[ox.arg] = obj

    Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function () {
      Huebot.send_message(ox.ctx, `Background "${ox.arg}" successfully added.`)
    })
  }

  Huebot.remove_background = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}backgroundremove [name]`)
      return false
    }

    if (Huebot.db.backgrounds[ox.arg] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Background "${ox.arg}" doesn't exist.`)
      return false
    }

    delete Huebot.db.backgrounds[ox.arg]

    Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function () {
      Huebot.send_message(ox.ctx, `Background "${ox.arg}" successfully removed.`)
    })
  }

  Huebot.rename_background = function (ox) {
    let split = ox.arg.split(' ')
    let old_name = split[0]
    let new_name = split[1]

    if (!ox.arg || split.length !== 2) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}backgroundrename [old_name] [new_name]`)
      return false
    }

    if (Huebot.db.backgrounds[old_name] === undefined) {
      Huebot.process_feedback(ox.ctx, ox.data, `Background "${old_name}" doesn't exist.`)
      return false
    }

    try {
      Huebot.db.backgrounds[new_name] = Huebot.db.backgrounds[old_name]

      delete Huebot.db.backgrounds[old_name]

      Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function (err) {
        Huebot.send_message(ox.ctx, `Background "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ox.ctx, ox.data, `Can't rename that background.`)
      return false
    }
  }

  Huebot.apply_background = function (ox) {
    if (!Huebot.check_op_permission(ox.ctx, "background")) {
      return false
    }

    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}background [name]`)
      return false
    }

    let obj = Huebot.db.backgrounds[ox.arg]

    if (obj) {
      if (obj.image && obj.image !== ox.ctx.background_image) {
        Huebot.socket_emit(ox.ctx, "change_background_image_source", {
          src: obj.image
        })
      }

      if (obj.mode && obj.mode !== ox.ctx.background_mode) {
        Huebot.change_background_mode(ox.ctx, ox.data, obj.mode)
      }

      if (obj.mode && obj.mode !== "solid") {
        let effect = obj.effect

        if (!effect) {
          effect = "none"
        }

        if (effect !== ox.ctx.background_effect) {
          Huebot.socket_emit(ox.ctx, "change_background_effect", {
            effect: effect
          })
        }
      }

      if (obj.mode && obj.mode === "tiled") {
        if (obj.tile_dimensions && obj.tile_dimensions !== ox.ctx.background_tile_dimensions) {
          Huebot.socket_emit(ox.ctx, "change_background_tile_dimensions", {
            dimensions: obj.tile_dimensions
          })
        }
      }
    } else {
      Huebot.process_feedback(ox.ctx, ox.data, `Background "${ox.arg}" doesn't exist.`)
    }
  }

  Huebot.list_backgrounds = function (ox) {
    let sort_mode = "random"

    if (ox.arg) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: Huebot.db.backgrounds,
      filter: ox.arg,
      append: ",",
      sort_mode: sort_mode,
      whisperify: `${Huebot.prefix}background `
    })

    if (!s) {
      s = "No backgrounds found."
    }

    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.suggest = function (ox) {
    let type = "tv"

    if (ox.arg) {
      if (ox.arg === "tv" || ox.arg === "image" || ox.arg === "radio") {
        type = ox.arg
      }
    }

    let suggestions = `Some ${type} suggestions: `

    for (let i = 0; i < Huebot.config.num_suggestions; i++) {
      let words = `${Huebot.get_random_word()} ${Huebot.get_random_word()}`

      let s = `[whisper ${Huebot.prefix}${type} ${words}]"${words}"[/whisper]`

      if (i < Huebot.config.num_suggestions - 1) {
        s += ", "
      }

      suggestions += s
    }

    Huebot.process_feedback(ox.ctx, ox.data, suggestions)
  }

  Huebot.play_song = function (ox) {
    if (!ox.ctx.can_synth) {
      Huebot.process_feedback(ox.ctx, ox.data, Huebot.config.no_synth_error)
      return false
    }

    let i = 0

    function send() {
      let key = Huebot.get_random_int(1, Huebot.config.num_synth_keys)

      Huebot.send_synth_key(ox.ctx, key)

      i += 1

      if (i < 20) {
        setTimeout(function () {
          send()
        }, Huebot.get_random_int(200, 600))
      }
    }

    send()
  }

  Huebot.synth_key = function (ox) {
    if (!ox.ctx.can_synth) {
      Huebot.process_feedback(ox.ctx, ox.data, Huebot.config.no_synth_error)
      return false
    }

    if (!ox.arg) {
      return false
    }

    Huebot.send_synth_key(ox.ctx, ox.arg)
  }

  Huebot.speak = function (ox) {
    if (!ox.ctx.can_synth) {
      Huebot.process_feedback(ox.ctx, ox.data, Huebot.config.no_synth_error)
      return false
    }

    if (!ox.arg) {
      return false
    }

    Huebot.send_synth_voice(ox.ctx, ox.arg)
  }

  Huebot.think = async function (ox) {
    if (!ox.ctx.can_chat) {
      return false
    }

    let thought = await Huebot.get_shower_thought()

    if(!thought) {
      return false
    }

    let links = `[whisper .think again]Another One[/whisper] | [anchor ${thought.url}]Source[/anchor]`
    let ans = `${thought.title}\n${links}`

    if (ox.arg === "again") {
      ox.data.method = "public"
    }

    Huebot.process_feedback(ox.ctx, ox.data, ans)
  }

  Huebot.think2 = async function (ox) {
    if (!ox.ctx.can_synth) {
      Huebot.process_feedback(ox.ctx, ox.data, Huebot.config.no_synth_error)
      return false
    }

    let thought = await Huebot.get_shower_thought()

    if(!thought) {
      return false
    }

    Huebot.send_synth_voice(ox.ctx, thought.title)
  }

  Huebot.remind = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}${ox.cmd} [username] > [message]`)
      return false
    }

    let split = ox.arg.split(">")

    if (split.length < 2) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}${ox.cmd} [username] > [message]`)
      return false
    }

    let uname = split[0].trim()
    let message = split.slice(1).join(">").trim()

    if (uname === ox.data.username) {
      Huebot.process_feedback(ox.ctx, ox.data, "Self-reminders are not allowed.")
      return false
    }

    if (!uname || !message) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}${ox.cmd} [username] > [message]`)
      return false
    }

    if (Huebot.db.reminders[uname] === undefined) {
      Huebot.db.reminders[uname] = []
    }

    if (Huebot.db.reminders[uname].length >= 5) {
      Huebot.process_feedback(ox.ctx, ox.data, "There are too many reminders for this user.")
      return false
    }

    let m = {
      from: ox.data.username,
      message: message
    }

    Huebot.db.reminders[uname].push(m)

    Huebot.save_file("reminders.json", Huebot.db.reminders, function () {
      Huebot.process_feedback(ox.ctx, ox.data, `Reminder for ${uname} saved.`)
      return false
    })
  }

  Huebot.do_calculation = function (ox) {
    if (!ox.arg) {
      Huebot.process_feedback(ox.ctx, ox.data, `Correct format is --> ${Huebot.prefix}${ox.cmd} [javascript math operation]`)
      return false
    }

    let r

    try {
      r = math.evaluate(ox.arg).toString()
    } catch (err) {
      r = "Error"
    }

    Huebot.process_feedback(ox.ctx, ox.data, r)
  }

  Huebot.roll_dice = function (ox) {
    if (!ox.arg || !ox.arg.match(/^\d+d\d+$/)) {
      Huebot.process_feedback(ox.ctx, ox.data, `Example format --> 2d6 (Roll a 6 sided die twice)`)
      return false
    }

    let split = ox.arg.split("d")
    let times = split[0]
    let max = split[1]
    let results = []

    if (times > 10 || max > 1000) {
      return false
    }

    for (let i = 0; i < times; i++) {
      let num = Huebot.get_random_int(1, max)
      results.push(num)
    }

    let ans = `Result: ${results.join(', ')}`
    Huebot.process_feedback(ox.ctx, ox.data, ans)
  }

  Huebot.show_users = function (ox) {
    s = Huebot.list_items({
      data: ox.ctx.userlist.slice(0, 20),
      append: ",",
      sort_mode: "random"
    })

    Huebot.process_feedback(ox.ctx, ox.data, s)
  }

  Huebot.show_help = function (ox) {
    let items = []
    let i = 25
    let n = 1

    if(ox.arg === "2") {
      items = Huebot.command_list.slice(i)
      n = 2
    } else {
      items = Huebot.command_list.slice(0, i)
    }

    let s = ""
    s += `Help ${n}`
    s += "\n---------------------\n"
    
    s += Huebot.list_items({
      data: items,
      prepend: Huebot.prefix,
      append: " ",
      sort_mode: "sort",
      whisperify: `${Huebot.prefix}whatis `,
      limit: false
    })

    if (n < 2) {
      let n2 = 2
  
      if (n === 2) {
        n2 = 1
      }
  
      s += "\n---------------------"
      s += `\n[whisper .help ${n2}]Show More[/whisper]`
    }

    if (s) {
      Huebot.send_whisper(ox.ctx, ox.data.username, s, false)
    } else {
      Huebot.send_whisper(ox.ctx, ox.data.username, "Nothing found.", false)
    }
  }

  Huebot.ping = function (ox) {
    Huebot.process_feedback(ox.ctx, ox.data, "Pong")
  }
}