const fetch = require("node-fetch")

module.exports = function (Huebot) {
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
}