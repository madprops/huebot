const MathJS = require("mathjs")
const fetch = require("node-fetch")

module.exports = function (Huebot) {
  let math_config = {
    number: 'BigNumber',
    precision: 64
  }

  const math = MathJS.create(MathJS.all, math_config)

  Huebot.process_feedback = function (ctx, data, s) {
    if (!s) {
      return false
    }

    if (data.method === "whisper") {
      Huebot.send_whisper(ctx, data.username, s, false)
    } else {
      Huebot.send_message(ctx, s)
    }
  }

  Huebot.get_random_user = function (ctx) {
    return ctx.userlist[Huebot.get_random_int(0, userlist.length - 1)]
  }

  Huebot.do_replacements = function (ctx, s) {
    s = s.replace(/\$user\$/gi, function () {
      return get_random_user(ctx)
    })

    s = s.replace(/\$word\$/g, function () {
      return get_random_word()
    })

    s = s.replace(/\$Word\$/g, function () {
      return get_random_word("capitalized")
    })

    s = s.replace(/\$WORD\$/g, function () {
      return get_random_word("upper_case")
    })

    return s
  }

  Huebot.set_image_source = function (ctx, src) {
    ctx.current_image_source = src
  }

  Huebot.set_tv_source = function (ctx, src) {
    ctx.current_tv_source = src
  }

  Huebot.set_radio_source = function (ctx, src) {
    ctx.current_radio_source = src
  }

  Huebot.run_commands_queue = function (ctx, id) {
    let cq = ctx.commands_queue[id]

    if (!cq) {
      delete ctx.commands_queue[id]
      return false
    }

    let cmds = cq.commands

    if (cmds.length === 0) {
      delete ctx.commands_queue[id]
      return false
    }

    let cmd = cmds.shift()

    let lc_cmd = cmd.toLowerCase()

    let obj = {
      message: cmd,
      username: cq.username,
      method: cq.method,
      callback: function () {
        Huebot.run_commands_queue(ctx, id)
      }
    }

    if (lc_cmd.startsWith(".sleep") || lc_cmd === ".sleep") {
      let n = parseInt(lc_cmd.replace(".sleep ", ""))

      if (isNaN(n)) {
        n = 1000
      }

      setTimeout(function () {
        Huebot.run_commands_queue(ctx, id)
      }, n)
    } else {
      Huebot.process_command(ctx, obj)
    }
  }

  Huebot.send_message = function (ctx, message, feedback = true) {
    if (!message) {
      return false
    }

    if (!ctx.can_chat) {
      return false
    }

    message = Huebot.do_replacements(ctx, message)
    message = Huebot.clean_string10(message.substring(0, Huebot.config.max_text_length))

    Huebot.socket_emit(ctx, 'sendchat', {
      message: message
    })
  }

  Huebot.send_whisper = function (ctx, uname, message, coords = false) {
    message = Huebot.do_replacements(ctx, message)
    message = Huebot.clean_string10(Huebot.clean_multiline(message.substring(0, Huebot.config.max_text_length)))

    Huebot.socket_emit(ctx, 'whisper', {
      type: "user",
      usernames: [uname],
      message: message,
      draw_coords: coords
    })
  }

  Huebot.send_synth_key = function (ctx, key) {
    if (!key || !ctx.can_synth) {
      return false
    }

    key = parseInt(key)

    if (typeof key !== "number") {
      return false
    }

    if (isNaN(key)) {
      return false
    }

    if (key < 1 || key > Huebot.config.num_synth_keys) {
      return false
    }

    Huebot.socket_emit(ctx, "send_synth_key", {
      key: key
    })
  }

  Huebot.send_synth_voice = function (ctx, text) {
    if (!text || !ctx.can_synth) {
      return false
    }

    text = Huebot.clean_string2(text.substring(0, 140))
    Huebot.socket_emit(ctx, "send_synth_voice", {
      text: text
    })
  }

  Huebot.change_media = function (ctx, args = {}) {
    let def_args = {
      type: "",
      src: "",
      feedback: true,
      comment: ""
    }

    Huebot.fill_defaults(args, def_args)

    if (!Huebot.config.media_types.includes(args.type)) {
      return false
    }

    if (!args.src) {
      return false
    }

    args.src = Huebot.do_replacements(ctx, args.src)

    args.src = Huebot.clean_string2(args.src)

    if (args.src.length > Huebot.db.max_media_source_length) {
      return false
    }

    if (args.type === "image") {
      if (!ctx.can_image) {
        if (args.feedback) {
          send_message(Huebot.config.no_image_error)
        }

        return false
      }

      if (ctx.current_image_source === args.src) {
        return false
      }

      Huebot.socket_emit(ctx, 'change_image_source', {
        src: args.src,
        comment: args.comment
      })
    } else if (args.type === "tv") {
      if (!ctx.can_tv) {
        if (args.feedback) {
          send_message(Huebot.config.no_tv_error)
        }

        return false
      }

      if (ctx.current_tv_source === args.src) {
        return false
      }

      Huebot.socket_emit(ctx, 'change_tv_source', {
        src: args.src,
        comment: args.comment
      })
    } else if (args.type === "radio") {
      if (!ctx.can_radio) {
        if (args.feedback) {
          send_message(Huebot.config.no_radio_error)
        }

        return false
      }

      if (ctx.current_radio_source === args.src) {
        return false
      }

      Huebot.socket_emit(ctx, 'change_radio_source', {
        src: args.src,
        comment: args.comment
      })
    }
  }

  Huebot.run_command = function (ctx, cmd, arg, data) {
    let command = Huebot.db.commands[cmd]

    if (command.type === "image") {
      Huebot.change_media(ctx, {
        type: "image",
        src: command.url,
        comment: data.comment
      })
    } else if (command.type === "tv") {
      Huebot.change_media(ctx, {
        type: "tv",
        src: command.url,
        comment: data.comment
      })
    } else if (command.type === "radio") {
      Huebot.change_media(ctx, {
        type: "radio",
        src: command.url,
        comment: data.comment
      })
    } else if (command.type === "alias") {
      let c = command.url.split(" ")[0]

      if (Huebot.command_list.includes(c)) {
        data.message = `${Huebot.db.config.command_prefix}${command.url} ${arg}`

        Huebot.process_command(ctx, data)
      }
    }
  }

  Huebot.change_background_mode = function (ctx, data, mode) {
    if (!Huebot.check_op_permission(ctx, "background")) {
      return false
    }

    if (!data || !mode) {
      return false
    }

    if (!Huebot.is_admin_or_op(ctx.role)) {
      Huebot.process_feedback(ctx, data, "I need to be an operator to do that.")
      return false
    }

    let modes = ["normal", "tiled", "mirror", "mirror_tiled", "solid"]

    if (!modes.includes(mode)) {
      Huebot.process_feedback(ctx, data, "Invalid background mode.")
      return false
    }

    if (mode === ctx.background_mode) {
      Huebot.process_feedback(ctx, data, "Background mode is already set to that.")
      return false
    }

    Huebot.socket_emit(ctx, "change_background_mode", {
      mode: mode
    })
  }

  Huebot.change_theme_mode = function (ctx, data, mode) {
    if (!Huebot.check_op_permission(ctx, "theme")) {
      return false
    }

    if (!data || !mode) {
      return false
    }

    if (!Huebot.is_admin_or_op(ctx.role)) {
      Huebot.process_feedback(ctx, data, "I need to be an operator to do that.")
      return false
    }

    let modes = ["automatic", "custom"]

    if (!modes.includes(mode)) {
      Huebot.process_feedback(ctx, data, "Invalid theme mode.")
      return false
    }

    if (mode === ctx.theme_mode) {
      Huebot.process_feedback(ctx, data, "Theme mode is already set to that.")
      return false
    }

    Huebot.socket_emit(ctx, "change_theme_mode", {
      mode: mode
    })
  }

  Huebot.check_media_permissions = function (ctx) {
    ctx.can_chat = Huebot.check_media_permission(ctx, "chat")
    ctx.can_image = ctx.room_image_mode === "enabled" && Huebot.check_media_permission(ctx, "image")
    ctx.can_tv = ctx.room_tv_mode === "enabled" && Huebot.check_media_permission(ctx, "tv")
    ctx.can_radio = ctx.room_radio_mode === "enabled" && Huebot.check_media_permission(ctx, "radio")
    ctx.can_synth = ctx.room_synth_mode === "enabled" && Huebot.check_media_permission(ctx, "synth")
  }

  Huebot.check_media_permission = function (ctx, type) {
    if (Huebot.is_admin_or_op(ctx.role)) {
      return true
    }

    return ctx.voice_permissions[`${ctx.role}_permissions`][type]
  }

  Huebot.check_op_permission = function (ctx, type) {
    if (!Huebot.is_admin_or_op(ctx.role)) {
      return false
    }

    return ctx.op_permissions[`${ctx.role}_permissions`][type]
  }

  Huebot.set_username = function (ctx, uname) {
    ctx.username = uname
  }

  Huebot.set_role = function (ctx, rol) {
    ctx.role = rol
  }

  Huebot.set_permissions = function (ctx, data) {
    ctx.voice_permissions.voice_1_permissions = data.voice_1_permissions
    ctx.voice_permissions.voice_2_permissions = data.voice_2_permissions
    ctx.voice_permissions.voice_3_permissions = data.voice_3_permissions
    ctx.voice_permissions.voice_4_permissions = data.voice_4_permissions

    ctx.op_permissions.op_1_permissions = data.op_1_permissions
    ctx.op_permissions.op_2_permissions = data.op_2_permissions
    ctx.op_permissions.op_3_permissions = data.op_3_permissions
    ctx.op_permissions.op_4_permissions = data.op_4_permissions
  }

  Huebot.set_room_enables = function (ctx, data) {
    ctx.room_image_mode = data.room_image_mode
    ctx.room_tv_mode = data.room_tv_mode
    ctx.room_radio_mode = data.room_radio_mode
    ctx.room_synth_mode = data.room_synth_mode
  }

  Huebot.socket_emit = function (ctx, destination, data) {
    let obj = {
      destination: destination,
      data: data
    }

    ctx.emit_queue.push(obj)

    if (ctx.emit_queue_timeout === undefined) {
      Huebot.check_emit_queue(ctx)
    }
  }

  Huebot.check_emit_queue = function (ctx) {
    if (ctx.emit_queue.length > 0) {
      let obj = ctx.emit_queue[0]

      if (obj !== "first") {
        Huebot.do_socket_emit(ctx, obj)
      }

      ctx.emit_queue.shift()

      ctx.emit_queue_timeout = setTimeout(function () {
        Huebot.check_emit_queue(ctx)
      }, Huebot.config.socket_emit_throttle)
    } else {
      clearTimeout(ctx.emit_queue_timeout)
      ctx.emit_queue_timeout = undefined
    }
  }

  Huebot.do_socket_emit = function (ctx, obj) {
    obj.data.server_method_name = obj.destination
    ctx.socket.emit("server_method", obj.data)
  }

  Huebot.set_theme = function (ctx, data) {
    ctx.theme_mode = data.theme_mode
    ctx.theme = data.theme
    ctx.text_color_mode = data.text_color_mode
    ctx.text_color = data.text_color
  }

  Huebot.set_background_image = function (ctx, image) {
    ctx.background_image = image
  }

  Huebot.set_background_mode = function (ctx, mode) {
    ctx.background_mode = mode
  }

  Huebot.set_background_effect = function (ctx, effect) {
    ctx.background_effect = effect
  }

  Huebot.set_background_tile_dimensions = function (ctx, dimensions) {
    ctx.background_tile_dimensions = dimensions
  }

  Huebot.set_userlist = function (ctx, data) {
    ctx.userlist = []

    for (let user of data.userlist) {
      ctx.userlist.push(user.username)
    }
  }

  Huebot.add_to_userlist = function (ctx, uname) {
    for (let u of ctx.userlist) {
      if (u === uname) {
        return false
      }
    }

    ctx.userlist.push(uname)
  }

  Huebot.remove_from_userlist = function (ctx, uname) {
    for (let i = 0; i < ctx.userlist.length; i++) {
      let u = ctx.userlist[i]

      if (u === uname) {
        ctx.userlist.splice(i, 1)
        return
      }
    }
  }

  Huebot.replace_in_userlist = function (ctx, old_uname, new_uname) {
    for (let i = 0; i < ctx.userlist.length; i++) {
      let u = ctx.userlist[i]

      if (u === old_uname) {
        ctx.userlist[i] = new_uname
        return
      }
    }
  }

  Huebot.check_reminders = function (ctx, uname) {
    if (Huebot.db.reminders[uname] === undefined || Huebot.db.reminders[uname].length === 0) {
      return false
    }

    for (let reminder of Huebot.db.reminders[uname]) {
      let s = `To: ${uname} - From: ${reminder.from}\n"${reminder.message}"`
      Huebot.send_message(ctx, s)
    }

    Huebot.db.reminders[uname] = []

    Huebot.save_file("reminders.json", Huebot.db.reminders)
  }

  Huebot.check_speech = function (ctx, data, arg) {
    let p = Math.min(100, Huebot.db.config.speak_chance_percentage)

    if (p <= 0) {
      return
    }

    let n = Huebot.get_random_int(1, 100)
    
    if (n <= (p)) {
      let n2 = Huebot.get_random_int(1, 5)
      if (n2 === 1) {
        Huebot.think(ctx, data, arg)
      } else if (n2 === 2) {
        Huebot.think2(ctx, data, arg)
      } else {
        Huebot.send_message(ctx, Huebot.get_random_phrase())
      }
    }
  }

  Huebot.selective_play = function (ctx, kind, url) {
    if (kind === "image") {
      Huebot.change_media(ctx, {
        type: "image",
        src: url
      })
    } else if (kind === "tv") {
      Huebot.change_media(ctx, {
        type: "tv",
        src: url
      })
    } else if (kind === "radio") {
      Huebot.change_media(ctx, {
        type: "radio",
        src: url
      })
    }
  }

  Huebot.get_youtube_stream = function (ctx) {
    fetch(`https://www.googleapis.com/youtube/v3/search?videoEmbeddable=true&maxResults=20&type=video&eventType=live&videoCategoryId=20&fields=items(id(videoId))&part=snippet&key=${Huebot.db.config.youtube_client_id}`)

    .then(res => {
      return res.json()
    })

    .then(res => {
      if (res.items !== undefined && res.items.length > 0) {
        Huebot.shuffle_array(res.items)

        let item

        for (item of res.items) {
          if (!ctx.recent_youtube_streams.includes(item.id.videoId)) {
            break
          }
        }

        let id = item.id.videoId

        ctx.recent_youtube_streams.push(id)

        if (ctx.recent_youtube_streams.length > Huebot.config.recent_streams_max_length) {
          ctx.recent_youtube_streams.shift()
        }

        Huebot.change_media(ctx, {
          type: "tv",
          src: `https://youtube.com/watch?v=${id}`
        })
      }
    })

    .catch(err => {
      console.error(err)
    })
  }

  Huebot.change_image = function (ctx, data, arg) {
    Huebot.change_media(ctx, {
      type: "image",
      src: arg
    })
  }

  Huebot.change_tv = function (ctx, data, arg) {
    Huebot.change_media(ctx, {
      type: "tv",
      src: arg
    })
  }

  Huebot.change_radio = function (ctx, data, arg) {
    Huebot.change_media(ctx, {
      type: "radio",
      src: arg
    })
  }

  Huebot.add_custom_command = function (ctx, data, arg, cmd) {
    let split = arg.split(' ')
    let command_name = split[0]
    let command_type = split[1]
    let command_url = split.slice(2).join(" ")

    if (!arg || split.length < 3 || (!Huebot.config.media_types.includes(command_type) && command_type !== "alias")) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}${cmd} [name] ${Huebot.config.media_types.join("|")}|alias [url]`)
      return false
    }

    if (Huebot.command_list.includes(command_name)) {
      Huebot.process_feedback(ctx, data, `Command "${command_name}" is reserved.`)
      return false
    }

    if (command_type === "alias") {
      let and_split = command_url.split(" && ")

      for (let item of and_split) {
        let c = item.trim().split(" ")[0]

        if (!Huebot.command_list.includes(c)) {
          Huebot.process_feedback(ctx, data, "Not a valid alias. Remember to not include the trigger character.")
          return false
        }
      }
    }

    let oc = Huebot.db.commands[command_name]

    if (oc && cmd !== "setforce") {
      Huebot.process_feedback(ctx, data, `"${command_name}" already exists. Use "${Huebot.db.config.command_prefix}setforce" to overwrite.`)
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
        Huebot.send_message(ctx, `Command "${command_name}" successfully set.`)
      })
    } catch (err) {
      Huebot.process_feedback(ctx, data, `Can't save that command.`)
      return false
    }
  }

  Huebot.remove_custom_command = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}unset [name]`)
      return false
    }
  
    if (Huebot.db.commands[arg] === undefined) {
      Huebot.process_feedback(ctx, data, `Command "${arg}" doesn't exist.`)
      return false
    }
  
    delete Huebot.db.commands[arg]
  
    Huebot.save_file("commands.json", Huebot.db.commands, function () {
      Huebot.send_message(ctx, `Command "${arg}" successfully unset.`)
    })
  }

  Huebot.rename_custom_command = function (ctx, data, arg) {
    let split = arg.split(' ')
    let old_name = split[0]
    let new_name = split[1]

    if (!arg || split.length !== 2) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}rename [old_name] [new_name]`)
      return false
    }

    if (Huebot.db.commands[old_name] === undefined) {
      Huebot.process_feedback(ctx, data, `Command "${old_name}" doesn't exist.`)
      return false
    }

    try {
      Huebot.db.commands[new_name] = Huebot.db.commands[old_name]

      delete Huebot.db.commands[old_name]

      Huebot.save_file("commands.json", Huebot.db.commands, function () {
        Huebot.send_message(ctx, `Command "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ctx, data, `Can't rename that command.`)
      return false
    }
  }

  Huebot.list_custom_commands = function (ctx, data, arg) {
    let sort_mode = "random"

    if (arg) {
      sort_mode = "sort"
    }
  
    let cmds = Object.keys(Huebot.db.commands)
  
    cmds = cmds.filter(x => Huebot.db.commands[x].type !== "alias")
  
    let s = Huebot.list_items({
      data: cmds,
      filter: arg,
      prepend: Huebot.db.config.command_prefix,
      sort_mode: sort_mode,
      whisperify: `${Huebot.db.config.command_prefix}`,
      mode: "commands"
    })
  
    if (!s) {
      s = "No commands found."
    }
  
    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.execute_random_custom_command = function (ctx, data, arg) {
    let comment = generate_random_controls()
    let words = false

    if (arg) {
      if (arg === "tv" || arg === "radio") {
        let n = Huebot.get_random_int(0, 2)

        if (n === 0) {
          words = true
        }
      }
    }

    if (arg && !words) {
      let cmds = Object.keys(Huebot.db.commands)

      cmds = cmds.filter(x => Huebot.db.commands[x].type !== "alias")

      if (!Huebot.config.media_types.includes(arg)) {
        return false
      }

      cmds = cmds.filter(x => Huebot.db.commands[x].type === arg)

      let c = cmds[Huebot.get_random_int(0, cmds.length - 1)]

      data.comment = comment

      if (c) {
        Huebot.run_command(ctx, c, arg, data)
      }
    } else {
      let type = "tv"
      let word1, word2

      if (arg) {
        type = arg
      }

      if (!arg || arg === "tv") {
        if (!ctx.can_tv) {
          Huebot.process_feedback(ctx, data, Huebot.config.no_tv_error)
          return false
        }

        word1 = Huebot.get_random_word()
        word2 = Huebot.get_random_word()
      } else if (arg === "radio") {
        if (!ctx.can_radio) {
          Huebot.process_feedback(ctx, data, Huebot.config.no_radio_error)
          return false
        }

        word1 = Huebot.get_random_word()
        word2 = "music"
      }

      Huebot.change_media(ctx, {
        type: type,
        src: `${word1} ${word2}`,
        comment: comment
      })
    }
  }

  Huebot.whatis_command = function (ctx, data, arg) {
    if (!arg || arg.split(" ").length > 1) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}whatis [command_name]`)
      return false
    }

    if (Huebot.command_list.includes(arg)) {
      Huebot.process_feedback(ctx, data, `${arg}: ${Huebot.commands[arg].description}`)
    } else {
      let command = Huebot.db.commands[arg]

      if (command) {
        Huebot.process_feedback(ctx, data, `"${arg}" is of type "${command.type}" and is set to "${safe_replacements(command.url)}".`)
      } else {
        Huebot.process_feedback(ctx, data, `Command "${arg}" doesn't exist.`)
      }
    }
  }

  Huebot.add_admin = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}adminadd [username]`)
      return false
    }

    if (arg === data.username) {
      return false
    }

    if (!Huebot.db.permissions.admins.includes(arg)) {
      Huebot.db.permissions.admins.push(arg)

      Huebot.save_file("permissions.json", Huebot.db.permissions, function (err) {
        Huebot.send_message(ctx, `Username "${arg}" was successfully added as an admin.`)
      })
    }
  }

  Huebot.remove_admin = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}adminremove [username]`)
      return false
    }

    if (arg === data.username) {
      return false
    }

    if (Huebot.db.permissions.admins.includes(arg)) {
      for (let i = 0; i < Huebot.db.permissions.admins.length; i++) {
        let admin = Huebot.db.permissions.admins[i]

        if (admin === arg) {
          Huebot.db.permissions.admins.splice(i, 1)
        }
      }

      Huebot.save_file("permissions.json", Huebot.db.permissions, function (err) {
        Huebot.send_message(ctx, `Username "${arg}" was successfully removed as an admin.`)
      })
    } else {
      Huebot.process_feedback(ctx, data, `"${arg}" is not an admin. Nothing to remove.`)
    }
  }

  Huebot.list_admins = function (ctx, data, arg) {
    let sort_mode = "random"

    if (arg) {
      sort_mode = "sort"
    }
  
    let s = Huebot.list_items({
      data: Huebot.db.permissions.admins,
      filter: arg,
      append: ",",
      sort_mode: sort_mode
    })
  
    if (!s) {
      s = "No admins found."
    }
  
    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.add_theme = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}themeadd [name]`)
      return false
    }

    if (ctx.theme_mode !== "custom") {
      Huebot.process_feedback(ctx, data, "Automatic themes can't be saved.")
      return false
    }

    let obj = {}

    obj.theme = ctx.theme
    obj.text_color = ctx.text_color
    obj.text_color_mode = ctx.text_color_mode

    Huebot.db.themes[arg] = obj

    Huebot.save_file("themes.json", Huebot.db.themes, function () {
      Huebot.send_message(ctx, `Theme "${arg}" successfully added.`)
    })
  }

  Huebot.remove_theme = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}themeremove [name]`)
      return false
    }
  
    if (Huebot.db.themes[arg] === undefined) {
      Huebot.process_feedback(ctx, data, `Theme "${arg}" doesn't exist.`)
      return false
    }
  
    delete Huebot.db.themes[arg]
  
    Huebot.save_file("themes.json", Huebot.db.themes, function () {
      Huebot.send_message(ctx, `Theme "${arg}" successfully removed.`)
    })
  }

  Huebot.rename_theme = function (ctx, data, arg) {
    let split = arg.split(' ')
    let old_name = split[0]
    let new_name = split[1]
  
    if (!arg || split.length !== 2) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}themerename [old_name] [new_name]`)
      return false
    }
  
    if (Huebot.db.themes[old_name] === undefined) {
      Huebot.process_feedback(ctx, data, `Theme "${old_name}" doesn't exist.`)
      return false
    }
  
    try {
      Huebot.db.themes[new_name] = Huebot.db.themes[old_name]
  
      delete Huebot.db.themes[old_name]
  
      Huebot.save_file("themes.json", Huebot.db.themes, function (err) {
        Huebot.send_message(ctx, `Theme "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ctx, data, `Can't rename that theme.`)
      return false
    }
  }

  Huebot.apply_theme = function (ctx, data, arg) {
    if (!Huebot.check_op_permission(ctx, "theme")) {
      return false
    }

    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}theme [name]`)
      return false
    }

    let obj = Huebot.db.themes[arg]

    if (obj) {
      if (ctx.theme_mode !== "custom") {
        Huebot.change_theme_mode(ctx, data, "custom")
      }

      obj.theme = Huebot.clean_string5(obj.theme)
      obj.text_color = Huebot.clean_string5(obj.text_color)

      if (obj.theme.startsWith("rgb")) {
        obj.theme = Huebot.rgb_to_hex(obj.theme)
      }

      if (obj.text_color.startsWith("rgb")) {
        obj.text_color = Huebot.rgb_to_hex(obj.text_color)
      }

      if (obj.theme && obj.theme !== ctx.theme) {
        Huebot.socket_emit(ctx, "change_theme", {
          color: obj.theme
        })
      }

      if (obj.text_color_mode && obj.text_color_mode !== ctx.text_color_mode) {
        Huebot.socket_emit(ctx, "change_text_color_mode", {
          mode: obj.text_color_mode
        })
      }

      if (obj.text_color_mode && obj.text_color_mode === "custom") {
        if (obj.text_color && obj.text_color !== ctx.text_color) {
          Huebot.socket_emit(ctx, "change_text_color", {
            color: obj.text_color
          })
        }
      }
    } else {
      Huebot.process_feedback(ctx, data, `Theme "${arg}" doesn't exist.`)
    }
  }

  Huebot.list_themes = function (ctx, data, arg) {
    let sort_mode = "random"

    if (arg) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: Huebot.db.themes,
      filter: arg,
      append: ",",
      sort_mode: sort_mode,
      whisperify: `${Huebot.db.config.command_prefix}theme `
    })

    if (!s) {
      s = "No themes found."
    }

    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.search_wiki = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, "No search term provided.")
      return false
    }
  
    let query = `https://en.wikipedia.org/api/rest_v1/page/summary/${arg}`
  
    fetch(query)
  
    .then(res => {
      return res.json()
    })

    .then(res => {
      if (res.extract) {
        Huebot.process_feedback(ctx, data, res.extract)
      }
    })
  }

  Huebot.decide_something = function (ctx, data, arg) {
    let ans
    let n = Huebot.get_random_int(0, 1)
  
    if (n == 0) {
      ans = "Yeah"
    } else {
      ans = "Nah"
    }
  
    Huebot.process_feedback(ctx, data, ans)
  }

  Huebot.pick_something = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, "Give me a space separated list to pick from.")
    }

    let split = arg.split(' ')
    let n = Huebot.get_random_int(0, split.length - 1)
    Huebot.process_feedback(ctx, data, split[n])
  }

  Huebot.add_subject = function (ctx, data, arg) {
    let error = false

    if (!arg) {
      error = true
    }

    if (!error) {
      if (arg.split(" ").length > 1) {
        error = true
      }
    }

    if (error) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subjectadd [name:no_spaces]`)
      return false
    }

    let name = arg.toLowerCase()

    if (Huebot.db.subjects[name] === undefined) {
      Huebot.db.subjects[name] = []

      Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
        Huebot.send_message(ctx, `Subject "${name}" successfully added. Use ${Huebot.db.config.command_prefix}subjectkeywordsadd to add additional keywords to the subject.`)
      })
    } else {
      Huebot.process_feedback(ctx, data, `Subject "${name}" already exists.`)
    }
  }

  Huebot.remove_subject = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subjectremove [name]`)
      return false
    }

    let name = arg.toLowerCase()

    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ctx, data, `Subject "${name}" doesn't exist.`)
      return false
    }

    delete Huebot.db.subjects[name]

    Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
      Huebot.send_message(ctx, `Subject "${name}" successfully removed.`)
    })
  }

  Huebot.rename_subject = function (ctx, data, arg) {
    let split = arg.split(' ')
    let old_name = split[0].toLowerCase()
    let new_name = split.slice(1).join(" ").toLowerCase()

    if (!arg || split.length !== 2) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subjectrename [old_name:no_spaces] [new_name:no_spaces]`)
      return false
    }

    if (Huebot.db.subjects[old_name] === undefined) {
      Huebot.process_feedback(ctx, data, `Subject "${old_name}" doesn't exist.`)
      return false
    }

    try {
      Huebot.db.subjects[new_name] = Huebot.db.subjects[old_name]

      delete Huebot.db.subjects[old_name]

      Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
        Huebot.send_message(ctx, `Subject "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ctx, data, `Can't rename that subject.`)
      return false
    }
  }

  Huebot.show_subject_keywords = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subjectkeywords [name:no_spaces]`)
      return false
    }

    let split = arg.split(" ")
    let name = split[0].toLowerCase()
    let filter = split.slice(1).join(" ").toLowerCase()

    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ctx, data, `Subject "${name}" doesn't exist.`)
      return false
    }

    let list = Huebot.db.subjects[name]

    if (list.length === 0) {
      Huebot.process_feedback(ctx, data, `Subject "${name}" is empty.`)
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

    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.add_subject_keyword = function (ctx, data, arg) {
    let error = false

    if (!arg) {
      error = true
    }
  
    let split
    let name
    let keyword
  
    if (!error) {
      split = arg.split(" ")
      name = split[0].toLowerCase()
      keyword = split.slice(1).join(" ").toLowerCase()
  
      if (!name || !keyword) {
        error = true
      }
    }
  
    if (error) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subjectkeywordsadd [name:no_spaces] [keyword]`)
      return false
    }
  
    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ctx, data, `Subject "${name}" doesn't exist.`)
      return false
    }
  
    let list = Huebot.db.subjects[name]
  
    for (let i of list) {
      if (i === keyword) {
        Huebot.process_feedback(ctx, data, `"${keyword}" is already part of subject "${name}".`)
        return false
      }
    }
  
    list.push(keyword)
  
    Huebot.save_file("subjects.json", Huebot.db.subjects, function (err) {
      Huebot.send_message(ctx, `"${keyword}" successfully added to subject "${name}".`)
    })
  }

  Huebot.remove_subject_keyword = function (ctx, data, arg) {
    let error = false

    if (!arg) {
      error = true
    }
  
    let split
    let name
    let keyword
  
    if (!error) {
      split = arg.split(" ")
      name = split[0].toLowerCase()
      keyword = split.slice(1).join(" ").toLowerCase()
  
      if (!name || !keyword) {
        error = true
      }
    }
  
    if (error) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subjectkeywordsremove [name:no_spaces] [keyword]`)
      return false
    }
  
    if (Huebot.db.subjects[name] === undefined) {
      Huebot.process_feedback(ctx, data, `Subject "${name}" doesn't exist.`)
      return false
    }
  
    let list = Huebot.db.subjects[name]
  
    if (list.length === 0) {
      Huebot.process_feedback(ctx, data, `Subject "${name}" is empty.`)
      return false
    }
  
    for (let i = 0; i < list.length; i++) {
      let kw = list[i]
  
      if (kw === keyword) {
        list.splice(i, 1)
  
        Huebot.save_file("subjects.json", Huebot.db.subjects, function (err) {
          Huebot.send_message(ctx, `"${keyword}" was removed from subject "${name}".`)
          return true
        })
  
        return true
      }
    }
  
    Huebot.process_feedback(ctx, data, `"${keyword}" is not part of subject "${name}".`)
  }

  Huebot.use_subject = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}subject [name] > ${Huebot.config.media_types.join("|")} : optional`)
      return false
    }

    let split = arg.split(">")
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
        Huebot.change_media(ctx, {
          type: "image",
          src: query
        })
      } else if (type === "tv") {
        Huebot.change_media(ctx, {
          type: "tv",
          src: query
        })
      } else if (type === "radio") {
        Huebot.change_media(ctx, {
          type: "radio",
          src: query
        })
      }
    } else {
      Huebot.change_media(ctx, {
        type: "tv",
        src: query
      })
    }
  }

  Huebot.list_subjects = function (ctx, data, arg) {
    let sort_mode = "random"

    if (arg) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: Huebot.db.subjects,
      filter: arg,
      append: ",",
      sort_mode: sort_mode,
      whisperify: `${Huebot.db.config.command_prefix}subject `
    })

    if (!s) {
      s = "No subjects found."
    }

    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.change_public = function (ctx, data, arg) {
    if (!arg || (arg !== "on" && arg !== "off")) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}public on|off`)
      return false
    }

    if (arg === "on") {
      if (Huebot.db.options.public_commands) {
        Huebot.process_feedback(ctx, data, "Public Commands are already on.")
        return false
      }

      Huebot.db.options.public_commands = true

      Huebot.save_file("options.json", Huebot.db.options, function () {
        Huebot.send_message(ctx, `Public Commands are now on.`)
      })
    } else if (arg === "off") {
      if (!Huebot.db.options.public_commands) {
        Huebot.process_feedback(ctx, data, "Public Commands are already off.")
        return false
      }

      Huebot.db.options.public_commands = false

      Huebot.save_file("options.json", Huebot.db.options, function () {
        Huebot.send_message(ctx, `Public Commands are now off.`)
      })
    }
  }

  Huebot.manage_queue = function (ctx, data, arg) {
    let error = false

    let arg1
    let arg2

    if (!arg) {
      error = true
    } else {
      let split = arg.split(' ')

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
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}q ${Huebot.config.media_types.join("|")} [url]|next|clear|size`)
      return false
    }

    let error_string
    let upname
    let perm

    if (arg1 === "image") {
      error_string = Huebot.config.no_image_error
      upname = "Image"
      perm = ctx.can_image
    } else if (arg1 === "tv") {
      error_string = Huebot.config.no_tv_error
      upname = "TV"
      perm = ctx.can_tv
    } else if (arg1 === "radio") {
      error_string = Huebot.config.no_radio_error
      upname = "Radio"
      perm = ctx.can_radio
    } else if (arg1 === "remove") {
      if (Huebot.get_q_item(arg2, "delete")) {
        Huebot.process_feedback(ctx, data, "Item successfully removed.")
      } else {
        Huebot.process_feedback(ctx, data, "This was already played or removed.")
      }
      return
    } else if (!isNaN(arg1)) {
      let item = Huebot.get_q_item(arg1, "delete")

      if (item) {
        Huebot.selective_play(ctx, item.kind, item.url)
        Huebot.save_file("queue.json", Huebot.db.queue)
      } else {
        Huebot.process_feedback(ctx, data, "This was already played or removed.")
      }
      return
    }

    if (arg2 === "next") {
      if (Huebot.db.queue[arg1].length > 0) {
        if (!perm) {
          Huebot.process_feedback(ctx, data, error_string)
          return false
        }

        let item = Huebot.db.queue[arg1].shift()

        if (typeof item !== "object") {
          return
        }

        Huebot.selective_play(ctx, item.kind, item.url)
        Huebot.save_file("queue.json", Huebot.db.queue)
      } else {
        Huebot.process_feedback(ctx, data, `${upname} queue is empty.`)
      }
    } else if (arg2 === "clear") {
      if (Huebot.db.queue[arg1].length > 0) {
        Huebot.db.queue[arg1] = []

        Huebot.save_file("queue.json", Huebot.db.queue, function () {
          Huebot.send_message(ctx, `${upname} queue successfully cleared.`)
        })
      } else {
        Huebot.process_feedback(ctx, data, `${upname} queue was already cleared.`)
      }
    } else if (arg2 === "size") {
      let n = Huebot.db.queue[arg1].length

      let s

      if (n === 1) {
        s = "item"
      } else {
        s = "items"
      }

      Huebot.process_feedback(ctx, data, `${upname} queue has ${n} ${s}.`)
    } else {
      if (Huebot.db.queue[arg1].includes(arg2)) {
        Huebot.process_feedback(ctx, data, `That item is already in the ${arg1} queue.`)
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
        Huebot.send_message(ctx, ans)
      })
    }
  }

  Huebot.get_random_stream = function (ctx, data, arg) {
    if (!Huebot.db.config.youtube_enabled) {
      Huebot.process_feedback(ctx, data, "No stream source support is enabled.")
      return false
    }

    Huebot.get_youtube_stream(ctx)
  }

  Huebot.show_activity = function (ctx, data, arg) {
    let s = Huebot.list_items({
      data: ctx.user_command_activity.slice(0).reverse(),
      append: ","
    })

    if (!s) {
      s = "No activity yet."
    }

    Huebot.process_feedback(ctx, data, `Recent command activity by: ${s}`)
  }

  Huebot.clear_commands = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }
  
    Huebot.db.commands = {}
  
    Huebot.save_file("commands.json", Huebot.db.commands, function () {
      Huebot.send_message(ctx, `Commands list successfully cleared.`)
    })
  }

  Huebot.clear_admins = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    Huebot.db.permissions.admins = [data.username]

    Huebot.save_file("permissions.json", Huebot.db.permissions, function () {
      Huebot.send_message(ctx, `Admins list successfully cleared.`)
    })
  }

  Huebot.clear_themes = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    Huebot.db.themes = {}

    Huebot.save_file("themes.json", Huebot.db.themes, function () {
      Huebot.send_message(ctx, `Themes list successfully cleared.`)
    })
  }

  Huebot.clear_subjects = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    Huebot.db.subjects = {}

    Huebot.save_file("subjects.json", Huebot.db.subjects, function () {
      Huebot.send_message(ctx, `Subjects list successfully cleared.`)
    })
  }

  Huebot.clear_backgrounds = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }
  
    Huebot.db.backgrounds = {}
  
    Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function () {
      Huebot.send_message(ctx, `Backgrounds list successfully cleared.`)
    })
  }
  
  Huebot.say = function (ctx, data, arg) {
    if (!arg) {
      return false
    }

    Huebot.send_message(ctx, arg)
  }
  
  Huebot.join_room = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    if (!arg) {
      Huebot.process_feedback(ctx, data, `Argument must be a room ID.`)
      return false
    }

    if (Huebot.connected_rooms[arg] !== undefined) {
      Huebot.process_feedback(ctx, data, "It seems I'm already in that room.")
      return false
    }

    Huebot.process_feedback(ctx, data, "Attempting to join that room!")
    Huebot.start_connection(arg)
  }

  Huebot.leave_room = function (ctx, data, arg) {
    if (!Huebot.is_protected_admin(data.username)) {
      return false
    }

    Huebot.process_feedback(ctx, data, "Good bye!")
    ctx.socket.disconnect()
  }

  Huebot.add_background = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}backgroundadd [name]`)
      return false
    }

    if (ctx.background_mode !== "normal" && ctx.background_mode !== "tiled") {
      Huebot.process_feedback(ctx, data, "Only backgrounds that use an image can be saved.")
      return false
    }

    if (!ctx.background_image.startsWith("http://") && !ctx.background_image.startsWith("https://")) {
      Huebot.process_feedback(ctx, data, "Only backgrounds that use external images can be saved.")
      return false
    }

    let obj = {}

    obj.image = ctx.background_image
    obj.mode = ctx.background_mode
    obj.effect = ctx.background_effect
    obj.tile_dimensions = ctx.background_tile_dimensions

    Huebot.db.backgrounds[arg] = obj

    Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function () {
      Huebot.send_message(ctx, `Background "${arg}" successfully added.`)
    })
  }

  Huebot.remove_background = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}backgroundremove [name]`)
      return false
    }

    if (Huebot.db.backgrounds[arg] === undefined) {
      Huebot.process_feedback(ctx, data, `Background "${arg}" doesn't exist.`)
      return false
    }

    delete Huebot.db.backgrounds[arg]

    Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function () {
      Huebot.send_message(ctx, `Background "${arg}" successfully removed.`)
    })
  }

  Huebot.rename_background = function (ctx, data, arg) {
    let split = arg.split(' ')
    let old_name = split[0]
    let new_name = split[1]

    if (!arg || split.length !== 2) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}backgroundrename [old_name] [new_name]`)
      return false
    }

    if (Huebot.db.backgrounds[old_name] === undefined) {
      Huebot.process_feedback(ctx, data, `Background "${old_name}" doesn't exist.`)
      return false
    }

    try {
      Huebot.db.backgrounds[new_name] = Huebot.db.backgrounds[old_name]

      delete Huebot.db.backgrounds[old_name]

      Huebot.save_file("backgrounds.json", Huebot.db.backgrounds, function (err) {
        Huebot.send_message(ctx, `Background "${old_name}" successfully renamed to "${new_name}".`)
      })
    } catch (err) {
      Huebot.process_feedback(ctx, data, `Can't rename that background.`)
      return false
    }
  }

  Huebot.apply_background = function (ctx, data, arg) {
    if (!Huebot.check_op_permission(ctx, "background")) {
      return false
    }

    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}background [name]`)
      return false
    }

    let obj = Huebot.db.backgrounds[arg]

    if (obj) {
      if (obj.image && obj.image !== ctx.background_image) {
        Huebot.socket_emit(ctx, "change_background_image_source", {
          src: obj.image
        })
      }

      if (obj.mode && obj.mode !== ctx.background_mode) {
        Huebot.change_background_mode(ctx, data, obj.mode)
      }

      if (obj.mode && obj.mode !== "solid") {
        let effect = obj.effect

        if (!effect) {
          effect = "none"
        }

        if (effect !== ctx.background_effect) {
          Huebot.socket_emit(ctx, "change_background_effect", {
            effect: effect
          })
        }
      }

      if (obj.mode && obj.mode === "tiled") {
        if (obj.tile_dimensions && obj.tile_dimensions !== ctx.background_tile_dimensions) {
          Huebot.socket_emit(ctx, "change_background_tile_dimensions", {
            dimensions: obj.tile_dimensions
          })
        }
      }
    } else {
      Huebot.process_feedback(ctx, data, `Background "${arg}" doesn't exist.`)
    }
  }

  Huebot.list_backgrounds = function (ctx, data, arg) {
    let sort_mode = "random"

    if (arg) {
      sort_mode = "sort"
    }

    let s = Huebot.list_items({
      data: Huebot.db.backgrounds,
      filter: arg,
      append: ",",
      sort_mode: sort_mode,
      whisperify: `${Huebot.db.config.command_prefix}background `
    })

    if (!s) {
      s = "No backgrounds found."
    }

    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.suggest = function (ctx, data, arg) {
    let type = "tv"

    if (arg) {
      if (arg === "tv" || arg === "image" || arg === "radio") {
        type = arg
      }
    }

    let suggestions = `Some ${type} suggestions: `

    for (let i = 0; i < Huebot.config.num_suggestions; i++) {
      let words = `${Huebot.get_random_word()} ${Huebot.get_random_word()}`

      let s = `[whisper ${Huebot.db.config.command_prefix}${type} ${words}]"${words}"[/whisper]`

      if (i < Huebot.config.num_suggestions - 1) {
        s += ", "
      }

      suggestions += s
    }

    Huebot.process_feedback(ctx, data, suggestions)
  }

  Huebot.play_song = function (ctx, data, arg) {
    if (!ctx.can_synth) {
      Huebot.process_feedback(ctx, data, Huebot.config.no_synth_error)
      return false
    }

    let i = 0

    function send() {
      let key = Huebot.get_random_int(1, Huebot.config.num_synth_keys)

      Huebot.send_synth_key(ctx, key)

      i += 1

      if (i < 20) {
        setTimeout(function () {
          send()
        }, Huebot.get_random_int(200, 600))
      }
    }

    send()
  }

  Huebot.synth_key = function (ctx, data, arg) {
    if (!ctx.can_synth) {
      Huebot.process_feedback(ctx, data, Huebot.config.no_synth_error)
      return false
    }

    if (!arg) {
      return false
    }

    Huebot.send_synth_key(ctx, arg)
  }

  Huebot.speak = function (ctx, data, arg) {
    if (!ctx.can_synth) {
      Huebot.process_feedback(ctx, data, Huebot.config.no_synth_error)
      return false
    }

    if (!arg) {
      return false
    }

    Huebot.send_synth_voice(ctx, arg)
  }

  Huebot.think = async function (ctx, data, arg) {
    if (!ctx.can_chat) {
      return false
    }

    let thought = await Huebot.get_shower_thought()

    if(!thought) {
      return false
    }

    let links = `[whisper .think again]Another One[/whisper] | [anchor ${thought.url}]Source[/anchor]`
    let ans = `${thought.title}\n${links}`

    if (arg === "again") {
      data.method = "public"
    }

    Huebot.process_feedback(ctx, data, ans)
  }

  Huebot.think2 = async function (ctx, data, arg) {
    if (!ctx.can_synth) {
      Huebot.process_feedback(ctx, data, Huebot.config.no_synth_error)
      return false
    }

    let thought = await Huebot.get_shower_thought()

    if(!thought) {
      return false
    }

    Huebot.send_synth_voice(ctx, thought.title)
  }

  Huebot.remind = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}${cmd} [username] > [message]`)
      return false
    }

    let split = arg.split(">")

    if (split.length < 2) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}${cmd} [username] > [message]`)
      return false
    }

    let uname = split[0].trim()
    let message = split.slice(1).join(">").trim()

    if (uname === data.username) {
      Huebot.process_feedback(ctx, data, "Self-reminders are not allowed.")
      return false
    }

    if (!uname || !message) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}${cmd} [username] > [message]`)
      return false
    }

    if (Huebot.db.reminders[uname] === undefined) {
      Huebot.db.reminders[uname] = []
    }

    if (Huebot.db.reminders[uname].length >= 5) {
      Huebot.process_feedback(ctx, data, "There are too many reminders for this user.")
      return false
    }

    let m = {
      from: data.username,
      message: message
    }

    Huebot.db.reminders[uname].push(m)

    Huebot.save_file("reminders.json", Huebot.db.reminders, function () {
      Huebot.process_feedback(ctx, data, `Reminder for ${uname} saved.`)
      return false
    })
  }

  Huebot.do_calculation = function (ctx, data, arg) {
    if (!arg) {
      Huebot.process_feedback(ctx, data, `Correct format is --> ${Huebot.db.config.command_prefix}${cmd} [javascript math operation]`)
      return false
    }

    let r

    try {
      r = math.evaluate(arg).toString()
    } catch (err) {
      r = "Error"
    }

    Huebot.process_feedback(ctx, data, r)
  }

  Huebot.roll_dice = function (ctx, data, arg) {
    if (!arg || !arg.match(/^\d+d\d+$/)) {
      Huebot.process_feedback(ctx, data, `Example format --> 2d6 (Roll a 6 sided die twice)`)
      return false
    }

    let split = arg.split("d")
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
    Huebot.process_feedback(ctx, data, ans)
  }

  Huebot.show_users = function (ctx, data, arg) {
    s = Huebot.list_items({
      data: ctx.userlist.slice(0, 20),
      append: ",",
      sort_mode: "random"
    })

    Huebot.process_feedback(ctx, data, s)
  }

  Huebot.show_help = function (ctx, data, arg) {
    let s = Huebot.list_items({
      data: Huebot.command_list,
      filter: arg,
      prepend: Huebot.db.config.command_prefix,
      append: " ",
      sort_mode: "sort",
      whisperify: `${Huebot.db.config.command_prefix}whatis `,
      limit: false
    })

    if (s) {
      Huebot.send_whisper(ctx, data.username, s, false)
    } else {
      Huebot.send_whisper(ctx, data.username, "Nothing found.", false)
    }
  }
}