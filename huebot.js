const path = require('path')
const fs = require("fs")
const io = require("socket.io-client")
const fetch = require("node-fetch")
const cheerio = require("cheerio")
const linkify = require("linkifyjs")

var commands = require("./commands.json")
var permissions = require("./permissions.json")
var themes = require("./themes.json")
var options = require("./options.json")
var queue = require("./queue.json")

const bot_email = "xxx"
const bot_password = "xxx"

const server_address = "http://localhost:3210"
// const server_address = "https://hue.merkoba.com"

const command_prefix = "."
const command_types = ["image", "tv", "radio"]
var protected_admins = ["mad"]

var username = ""
var role = false
var room_images_mode = "disabled"
var room_tv_mode = "disabled"
var room_radio_mode = "disabled"
var can_chat = false
var can_tv = false
var can_radio = false
var vpermissions = {}
var theme
var text_color
var text_color_mode
var emit_queue_timeout
var emit_queue = []
var socket_emit_throttle = 10
var max_text_length = 2000
var max_title_length = 250

vpermissions.voice1_chat_permission = false
vpermissions.voice1_images_permission = false
vpermissions.voice1_tv_permission = false
vpermissions.voice1_radio_permission = false
vpermissions.voice2_chat_permission = false
vpermissions.voice2_images_permission = false
vpermissions.voice2_tv_permission = false
vpermissions.voice2_radio_permission = false
vpermissions.voice3_chat_permission = false
vpermissions.voice3_images_permission = false
vpermissions.voice3_tv_permission = false
vpermissions.voice3_radio_permission = false
vpermissions.voice4_chat_permission = false
vpermissions.voice4_images_permission = false
vpermissions.voice4_tv_permission = false
vpermissions.voice4_radio_permission = false

const socket = io(server_address,
{
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionDelayMax : 5000,
	reconnectionAttempts: 1000
})

socket.on('connect', function() 
{
	socket_emit('join_room', 
	{
		alternative: true, 
		room_id: "main", 
		email: bot_email, 
		password: bot_password
	})
})

socket.on('update', function(data) 
{
	try
	{
		if(data.type === 'joined')
		{
			set_username(data.username)
			set_role(data.role)
			set_room_enables(data)
			set_permissions(data)
			set_theme(data)
			check_permissions()
		}

		else if(data.type === 'chat_msg')
		{
			if(data.username === username)
			{
				return false
			}

			var is_admin = permissions.admins.includes(data.username)

			var is_protected_admin = protected_admins.includes(data.username)

			var msg = data.msg

			if(msg === `hi ${username}` || msg === `${username} hi`)						
			{
				send_message(`hello ${data.username}!`)
			}

			if(msg.length > 1 && msg[0] === command_prefix && msg[1] !== command_prefix)
			{
				var a = msg.split(' ')

				var cmd = a[0]

				if(a.length > 1)
				{
					cmd += ' '

					var arg = clean_string2(a.slice(1).join(" "))
				}

				else
				{
					var arg = ""
				}

				cmd = cmd.substring(1).trim()

				if(cmd === "set")
				{
					if(!is_admin)
					{
						return false
					}

					var split = arg.split(' ')
					var command_name = split[0]
					var command_type = split[1]
					var command_url = split[2]

					if(!arg || split.length !== 3 || !command_types.includes(command_type))
					{
						send_message(`Correct format is --> ${command_prefix}set [name] ${command_types.join("|")} [url]`)
						return false
					}

					var testobj = {}

					try
					{
						testobj[command_name] = {type:command_type, url:command_url}
						commands[command_name] = {type:command_type, url:command_url}

						save_file("commands.json", commands, function(err)
						{
							send_message(`Command "${command_name}" successfully set.`)
						})
					}

					catch(err)
					{
						send_message(`Can't save that command.`)
						return false
					}
				}

				else if(cmd === "unset")
				{
					if(!is_admin)
					{
						return false
					}

					if(!arg)
					{
						send_message(`Correct format is --> ${command_prefix}unset [name]`)
						return false
					}

					if(commands[arg] === undefined)
					{
						send_message(`Command "${arg}" doesn't exist.`)
						return false
					}

					delete commands[arg]

					save_file("commands.json", commands, function(err)
					{
						send_message(`Command "${arg}" successfully unset.`)
					})
				}

				else if(cmd === "rename")
				{
					if(!is_admin)
					{
						return false
					}

					var split = arg.split(' ')
					var old_name = split[0]
					var new_name = split[1]

					if(!arg || split.length !== 2)
					{
						send_message(`Correct format is --> ${command_prefix}rename [old_name] [new_name]`)
						return false
					}

					if(commands[old_name] === undefined)
					{
						send_message(`Command "${old_name}" doesn't exist.`)
						return false
					}

					try
					{
						commands[new_name] = commands[old_name]

						delete commands[old_name]

						save_file("commands.json", commands, function(err)
						{
							send_message(`Command "${old_name}" successfully renamed to "${new_name}".`)
						})
					}

					catch(err)
					{
						send_message(`Can't rename that command.`)
						return false
					}
				}

				else if(cmd === "list")
				{
					if(!is_admin)
					{
						return false
					}

					var s = list_items(commands, arg, command_prefix)

					if(!s)
					{
						var s = "No commands found."
					}

					send_message(s)
				}

				else if(cmd === "random")
				{
					if(!is_admin)
					{
						return false
					}

					var cmds = Object.keys(commands)

					if(arg)
					{
						if(!command_types.includes(arg))
						{
							return false
						}
						
						cmds = cmds.filter(x => commands[x].type === arg)
					}

					var c = cmds[get_random_int(0, cmds.length - 1)]

					run_command(c)
				}

				else if(cmd === "adminadd")
				{
					if(!is_protected_admin)
					{
						return false
					}

					if(!arg)
					{
						send_message(`Correct format is --> ${command_prefix}adminadd [username]`)
						return false
					}

					if(arg === data.username)
					{
						return false
					}

					if(!permissions.admins.includes(arg))
					{
						permissions.admins.push(arg)

						save_file("permissions.json", permissions, function(err)
						{
							send_message(`Username "${arg}" was successfully added as an admin.`)
						})
					}
				}

				else if(cmd === "adminremove")
				{
					if(!is_protected_admin)
					{
						return false
					}

					if(!arg)
					{
						send_message(`Correct format is --> ${command_prefix}adminremove [username]`)
						return false
					}

					if(arg === data.username)
					{
						return false
					}
					
					if(permissions.admins.includes(arg))
					{
						for(let i=0; i<permissions.admins.length; i++)
						{
							var admin = permissions.admins[i]

							if(admin === arg)
							{
								permissions.admins.splice(i, 1)
							}
						}

						save_file("permissions.json", permissions, function(err)
						{
							send_message(`Username "${arg}" was successfully removed as an admin.`)
						})
					}

					else
					{
						send_message(`"${arg}" is not an admin. Nothing to remove.`)
					}
				}

				else if(cmd === "admins")
				{
					if(!is_admin)
					{
						return false
					}

					var s = list_items(permissions.admins, arg, "", ",")

					if(!s)
					{
						var s = "No admins found."
					}

					send_message(s)
				}

				else if(cmd === "themeadd")
				{
					if(!is_admin)
					{
						return false
					}

					if(!arg)
					{
						send_message(`Correct format is --> ${command_prefix}themeadd [name]`)
						return false
					}

					var obj = {}

					obj.theme = theme
					obj.text_color = text_color
					obj.text_color_mode = text_color_mode

					themes[arg] = obj

					save_file("themes.json", themes, function()
					{
						send_message(`Theme "${arg}" successfully added.`)
					})
				}

				else if(cmd === "themeremove")
				{
					if(!is_admin)
					{
						return false
					}

					if(!arg)
					{
						send_message(`Correct format is --> ${command_prefix}themeremove [name]`)
						return false
					}

					if(themes[arg] === undefined)
					{
						send_message(`Theme "${arg}" doesn't exist.`)
						return false
					}

					delete themes[arg]

					save_file("themes.json", themes, function()
					{
						send_message(`Theme "${arg}" successfully removed.`)
					})
				}

				else if(cmd === "themerename")
				{
					if(!is_admin)
					{
						return false
					}

					var split = arg.split(' ')
					var old_name = split[0]
					var new_name = split[1]

					if(!arg || split.length !== 2)
					{
						send_message(`Correct format is --> ${command_prefix}themerename [old_name] [new_name]`)
						return false
					}

					if(themes[old_name] === undefined)
					{
						send_message(`Theme "${old_name}" doesn't exist.`)
						return false
					}

					try
					{
						themes[new_name] = themes[old_name]

						delete themes[old_name]

						save_file("themes.json", themes, function(err)
						{
							send_message(`Theme "${old_name}" successfully renamed to "${new_name}".`)
						})
					}

					catch(err)
					{
						send_message(`Can't rename that theme.`)
						return false
					}
				}

				else if(cmd === "theme")
				{
					if(!is_admin)
					{
						return false
					}

					if(role !== "admin" && role !== "op")
					{
						send_message("I need operator status to do this.")
						return false
					}

					if(!arg)
					{
						send_message(`Correct format is --> ${command_prefix}theme [name]`)
						return false
					}

					var obj = themes[arg]

					if(obj)
					{
						if(obj.theme !== theme)
						{
							socket_emit("change_theme", {color:obj.theme})
						}

						if(obj.text_color_mode !== text_color_mode)
						{
							socket_emit("change_text_color_mode", {mode:obj.text_color_mode})
						}

						if(obj.text_color_mode === "custom")
						{
							if(obj.text_color !== text_color)
							{
								socket_emit("change_text_color", {color:obj.text_color})
							}
						}
					}

					else
					{
						send_message(`Theme "${arg}" doesn't exist.`)
					}
				}

				else if(cmd === "themes")
				{
					if(!is_admin)
					{
						return false
					}

					var s = list_items(themes, arg, "", ",")

					if(!s)
					{
						var s = "No themes found."
					}

					send_message(s)
				}

				else if(cmd === "linktitles")
				{
					if(!is_admin)
					{
						return false
					}

					if(!arg || (arg !== "on" && arg !== "off"))
					{
						send_message(`Correct format is --> ${command_prefix}linktitles on|off`)
						return false
					}

					if(arg === "on")
					{
						if(options.link_titles)
						{
							send_message("Link titles are already on.")
							return false
						}

						options.link_titles = true

						save_file("options.json", options, function()
						{
							send_message(`Link titles are now on.`)
						})
					}

					else if(arg === "off")
					{
						if(!options.link_titles)
						{
							send_message("Link titles are already off.")
							return false
						}

						options.link_titles = false

						save_file("options.json", options, function()
						{
							send_message(`Link titles are now off.`)
						})
					}
				}

				else if(cmd === "q")
				{
					if(!is_admin)
					{
						return false
					}

					var error = false

					var arg1
					var arg1

					if(!arg)
					{
						error = true
					}
					
					else
					{
						var split = arg.split(' ')

						if(split.length !== 2)
						{
							error = true
						}

						else
						{
							arg1 = split[0]

							if(!command_types.includes(arg1))
							{
								error = true
							}
							
							else
							{
								arg2 = split[1]

								if(arg2 !== "next" && arg2 !== "clear" && arg2 !== "size")
								{
									if(!arg2.startsWith("http://") && !arg2.startsWith("https://"))
									{
										error = true
									}
								}
							}
						}
					}

					if(error)
					{
						send_message(`Correct format is --> ${command_prefix}q ${command_types.join("|")} [url]|next|clear|size`)
						return false
					}

					if(arg1 === "image")
					{
						var pname = "images"
						var upname = "Image"
						var perm = can_images
					}

					else if(arg1 === "tv")
					{
						var pname = "the tv"
						var upname = "TV"
						var perm = can_tv
					}

					else if(arg1 === "radio")
					{
						var pname = "the radio"
						var upname = "Radio"
						var perm = can_radio
					}

					if(arg2 === "next")
					{
						if(queue[arg1].length > 0)
						{
							if(!perm)
							{
								send_message(`I don't have permission to change ${pname}.`)
								return false
							}

							var url = queue[arg1].shift()

							if(arg1 === "image")
							{
								change_image(url)
							}

							else if(arg1 === "tv")
							{
								change_tv(url)
							}

							else if(arg1 === "radio")
							{
								change_radio(url)
							}

							save_file("queue.json", queue)
						}

						else
						{
							send_message(`${upname} queue is empty.`)
						}
					}

					else if(arg2 === "clear")
					{
						if(queue[arg1].length > 0)
						{
							queue[arg1] = []

							save_file("queue.json", queue, function()
							{
								send_message(`${upname} queue successfully cleared.`)
							})
						}

						else
						{
							send_message(`${upname} queue was already cleared.`)
						}
					}

					else if(arg2 === "size")
					{
						var n = queue[arg1].length

						if(n === 1)
						{
							var s = "item"
						}

						else
						{
							var s = "items"
						}

						send_message(`${upname} queue has ${n} ${s}.`)
					}

					else
					{
						if(queue[arg1].includes(arg2))
						{
							send_message(`That URL is already in the ${arg1} queue.`)
							return false
						}
						
						queue[arg1].push(arg2)

						save_file("queue.json", queue, function()
						{
							send_message(`${upname} URL successfully queued.`)
						})	
					}
				}

				else if(cmd === "help")
				{
					if(!is_admin)
					{
						return false
					}
					
					var s = ""

					s += "Available Commands: "
					s += `${command_prefix}set, ` 
					s += `${command_prefix}unset, ` 
					s += `${command_prefix}rename, ` 
					s += `${command_prefix}list, ` 
					s += `${command_prefix}random, ` 
					s += `${command_prefix}q, ` 
					s += `${command_prefix}adminadd, ` 
					s += `${command_prefix}adminremove, ` 
					s += `${command_prefix}admins, ` 
					s += `${command_prefix}themeadd, ` 
					s += `${command_prefix}themeremove, ` 
					s += `${command_prefix}themerename, ` 
					s += `${command_prefix}theme, ` 
					s += `${command_prefix}themes, ` 
					s += `${command_prefix}linktitles`

					send_message(s)
				}

				else if(commands[cmd] !== undefined)
				{
					if(!is_admin)
					{
						return false
					}

					run_command(cmd)
				}
			}

			else
			{
				if(options.link_titles)
				{
					var links = linkify.find(msg)

					if(links)
					{
						for(let i=0; i<links.length; i++)
						{
							if(i >= 3)
							{
								break
							}

							var link = links[i]

							var extension = get_extension(link.href).toLowerCase()

							if(extension)
							{
								if(extension !== "html" && extension !== "php")
								{
									continue
								}
							}

							fetch(link.href)
							
							.then(res => 
							{
								return res.text()
							})
							
							.then(body => 
							{
								var $ = cheerio.load(body)
								var title = clean_string2($("title").text().substring(0, max_title_length))
								
								if(title)
								{
									send_message(`[ Title: ${title} ]`)
								}
							})

							.catch(err =>
							{
								console.error(err)
							})
						}
					}
				}
			}
		}

		else if(data.type === 'room_images_mode_change')
		{
			room_images_mode = data.what
			check_permissions()
		}

		else if(data.type === 'room_tv_mode_change')
		{
			room_tv_mode = data.what
			check_permissions()
		}

		else if(data.type === 'room_radio_mode_change')
		{
			room_radio_mode = data.what
			check_permissions()
		}

		else if(data.type === 'voice_permission_change')
		{
			vpermissions[data.ptype] = data.what
			check_permissions()
		}

		else if(data.type === 'new_username')
		{
			if(username === data.old_username)
			{
				set_username(data.username)
			}
		}

		else if(data.type === 'theme_change')
		{
			theme = data.color
		}

		else if(data.type === 'text_color_changed')
		{
			text_color = data.color
		}

		else if(data.type === 'text_color_mode_changed')
		{
			text_color_mode = data.mode
		}

		else if(data.type === 'announce_role_change')
		{
			if(username === data.username2)
			{
				set_role(data.role)
				check_permissions()
			}
		}

		else if(data.type === 'whisper')
		{
			var is_admin = permissions.admins.includes(data.username)

			if(!is_admin)
			{
				return false
			}

			socket_emit('whisper', 
			{
				username: data.username, 
				message: "Hi! I hope you like my drawing :)", 
				draw_coords: generate_random_drawing()
			})
		}
	}

	catch(err)
	{
		console.error(err)
	}
})

function send_message(msg)
{
	if(!can_chat)
	{
		return false
	}

	msg = msg.substring(0, max_text_length).replace(/[\n\r]+/g, '\n').replace(/\s+$/g, '')
	
	socket_emit('sendchat', {msg:msg})	
}

function change_image(src)
{
	if(!can_images)
	{
		console.error("No images permission")
		return false
	}
	
	socket_emit('change_image_source', {src:src})
}

function change_tv(src)
{
	if(!can_tv)
	{
		console.error("No tv permission")
		return false
	}
	
	socket_emit('change_tv_source', {src:src})
}

function change_radio(src)
{
	if(!can_radio)
	{
		console.error("No radio permission")
		return false
	}
	
	socket_emit('change_radio_source', {src:src})
}

function run_command(cmd)
{
	var command = commands[cmd]

	if(command.type === "image")
	{
		change_image(command.url)
	}

	else if(command.type === "tv")
	{
		change_tv(command.url)
	}

	else if(command.type === "radio")
	{
		change_radio(command.url)
	}	
}

function check_permissions()
{
	can_chat = check_permission(role, "chat")
	can_images = room_images_mode === "enabled" && check_permission(role, "images")
	can_tv = room_tv_mode === "enabled" && check_permission(role, "tv")
	can_radio =  room_radio_mode === "enabled" && check_permission(role, "radio")
}

function check_permission(role, type)
{
	if(role === "admin" || role === "op")
	{
		return true
	}

	if(vpermissions[`${role}_${type}_permission`])
	{
		return true
	}

	return false	
}

function set_username(uname)
{
	username = uname
}

function set_role(rol)
{
	role = rol
}

function set_permissions(data)
{
	vpermissions.voice1_chat_permission = data.voice1_chat_permission
	vpermissions.voice1_images_permission = data.voice1_images_permission
	vpermissions.voice1_tv_permission = data.voice1_tv_permission
	vpermissions.voice1_radio_permission = data.voice1_radio_permission
	vpermissions.voice2_chat_permission = data.voice2_chat_permission
	vpermissions.voice2_images_permission = data.voice2_images_permission
	vpermissions.voice2_tv_permission = data.voice2_tv_permission
	vpermissions.voice2_radio_permission = data.voice2_radio_permission
	vpermissions.voice3_chat_permission = data.voice3_chat_permission
	vpermissions.voice3_images_permission = data.voice3_images_permission
	vpermissions.voice3_tv_permission = data.voice3_tv_permission
	vpermissions.voice3_radio_permission = data.voice3_radio_permission
	vpermissions.voice4_chat_permission = data.voice4_chat_permission
	vpermissions.voice4_images_permission = data.voice4_images_permission
	vpermissions.voice4_tv_permission = data.voice4_tv_permission
	vpermissions.voice4_radio_permission = data.voice4_radio_permission	
}

function set_room_enables(data)
{
	room_images_mode = data.room_images_mode
	room_tv_mode = data.room_tv_mode
	room_radio_mode = data.room_radio_mode	
}

function socket_emit(destination, data)
{
	var obj =
	{
		destination: destination,
		data: data
	}

	emit_queue.push(obj)

	if(emit_queue_timeout === undefined)
	{
		check_emit_queue()
	}
}

function check_emit_queue()
{
	if(emit_queue.length > 0)
	{
		var obj = emit_queue[0]

		if(obj !== "first")
		{
			do_socket_emit(obj)
		}

		emit_queue.shift()

		emit_queue_timeout = setTimeout(function()
		{
			check_emit_queue()
		}, socket_emit_throttle)
	}

	else
	{
		clearTimeout(emit_queue_timeout)
		emit_queue_timeout = undefined
	}
}

function do_socket_emit(obj)
{
	obj.data.server_method_name = obj.destination
	socket.emit("server_method", obj.data)
}

function get_random_int(min, max)
{
	return Math.floor(Math.random() * (max  -min + 1) + min)
}

function set_theme(data)
{
	theme = data.theme
	text_color_mode = data.text_color_mode
	text_color = data.text_color
}

function save_file(name, content, callback=false)
{
	fs.writeFile(path.join(__dirname, name), JSON.stringify(content), 'utf8', function(err)
	{
		if(err)
		{
			console.error(err)
		}

		else
		{
			if(callback)
			{
				return callback()
			}
		}
	})
}

function list_items(obj, arg, prep="", app="")
{
	arg = arg.toLowerCase()

	var list = []
	
	var filter = arg ? true : false

	if(Array.isArray(obj))
	{
		var props = obj
	}

	else
	{
		var props = Object.keys(obj)
	}

	if(filter)
	{
		props.sort()
	}

	else
	{
		props = props.map(x => [Math.random(), x]).sort(([a], [b]) => a - b).map(([_, x]) => x)
	}

	for(var p of props)
	{
		if(filter)
		{
			if(p.toLowerCase().includes(arg))
			{
				list.push(`${prep}${p}${app}`)
			}
		}

		else
		{
			list.push(`${prep}${p}${app}`)
		}

		if(list.length === 20)
		{
			break
		}
	}

	if(list.length > 0)
	{
		var s = list.join(" ")

		if(app)
		{
			s = s.slice(0, -1)
		}
	}

	else
	{
		var s = false
	}

	return s
}

function get_extension(s)
{
	var matches = s.match(/\.(\w+)(?=$|[#?])/)

	if(matches)
	{
		return matches[1]
	}

	else
	{
		return ""
	}
}

function clean_string2(s)
{
	return s.replace(/\s+/g, ' ').trim()
}

function generate_random_drawing()
{
	var n = get_random_int(100, 300)

	var click_x = []
	var click_y = []
	var drag = []

	for(let i=0; i<n; i++)
	{
		click_x.push(get_random_int(0, 400))
		click_y.push(get_random_int(0, 300))

		if(drag.length === 0)
		{
			drag.push(false)
		}

		else
		{
			drag.push(get_random_int(0, 2) > 0)
		}
	}

	return [click_x, click_y, drag]
}