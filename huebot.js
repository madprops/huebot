const path = require('path')
const fs = require("fs")
const io = require("socket.io-client")
var commands = require("./commands.json")
var permissions = require("./permissions.json")
var themes = require("./themes.json")

const bot_email = "xxx"
const bot_password = "xxx"

const server_address = "http://localhost:3210"
// const server_address = "https://hue.merkoba.com"

const command_prefix = "."
const command_types = ["image", "tv", "radio"]
var protected_admins = ["mad"]

var username = ""
var role = false
var room_images_enabled = false
var room_tv_enabled = false
var room_radio_enabled = false
var can_chat = false
var can_tv = false
var can_radio = false
var vpermissions = {}
var theme
var text_color
var text_color_mode

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

			var msg = data.msg.replace(/\s+/g, ' ').trim()

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

					var arg = msg.substring(cmd.length)
				}

				else
				{
					var arg = ""
				}

				cmd = cmd.substring(1).trim()

				if(cmd === "set")
				{
					if(!permissions.admins.includes(data.username))
					{
						return false
					}

					var split = arg.split(' ')

					if(!arg || split.length < 3)
					{
						send_message(`Correct format is --> ${command_prefix}set [name] ${command_types.join("|")} [url]`)
						return false
					}

					var command_name = split[0]
					var command_type = split[1]
					var command_url = split.slice(2).join(" ")

					if(!command_types.includes(command_type))
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

				if(cmd === "unset")
				{
					if(!permissions.admins.includes(data.username))
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

				else if(cmd === "list")
				{
					var s = list_items(commands, arg, command_prefix)

					if(!s)
					{
						var s = "No commands found."
					}

					send_message(s)
				}

				else if(cmd === "random")
				{
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
					if(!protected_admins.includes(data.username))
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
							send_message(`${arg} was successfully added as an admin.`)
						})
					}
				}

				else if(cmd === "adminremove")
				{
					if(!protected_admins.includes(data.username))
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
							send_message(`${arg} was successfully removed as an admin.`)
						})
					}

					else
					{
						send_message(`${arg} is not an admin. Nothing to remove.`)
					}
				}

				else if(cmd === "admins")
				{
					if(!permissions.admins.includes(data.username))
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
					if(!permissions.admins.includes(data.username))
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
						send_message(`Theme "${arg}" successfully saved.`)
					})
				}

				else if(cmd === "themeremove")
				{
					if(!permissions.admins.includes(data.username))
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

				else if(cmd === "theme")
				{
					if(!permissions.admins.includes(data.username))
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
					if(!permissions.admins.includes(data.username))
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

				else if(cmd === "help")
				{
					var s = ""

					s += "Available Commands: "
					s += `${command_prefix}set, ` 
					s += `${command_prefix}unset, ` 
					s += `${command_prefix}list, ` 
					s += `${command_prefix}random, ` 
					s += `${command_prefix}adminadd, ` 
					s += `${command_prefix}adminremove, ` 
					s += `${command_prefix}admins, ` 
					s += `${command_prefix}themeadd, ` 
					s += `${command_prefix}themeremove, ` 
					s += `${command_prefix}theme, ` 
					s += `${command_prefix}themes` 

					send_message(s)
				}

				else if(commands[cmd] !== undefined)
				{
					run_command(cmd)
				}
			}
		}

		else if(data.type === 'room_images_enabled_change')
		{
			room_images_enabled = data.what
			check_permissions()
		}

		else if(data.type === 'room_tv_enabled_change')
		{
			room_tv_enabled = data.what
			check_permissions()
		}

		else if(data.type === 'room_radio_enabled_change')
		{
			room_radio_enabled = data.what
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

	msg = msg.substring(0, 2000).replace(/[\n\r]+/g, '\n').replace(/\s+$/g, '')
	
	socket_emit('sendchat', {msg:msg})	
}

function change_image(src)
{
	if(!can_images)
	{
		return false
	}
	
	socket_emit('change_image_source', {src:src})
}

function change_tv(src)
{
	if(!can_tv)
	{
		return false
	}
	
	socket_emit('change_tv_source', {src:src})
}

function change_radio(src)
{
	if(!can_radio)
	{
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
	can_images = room_images_enabled && check_permission(role, "images")
	can_tv = room_tv_enabled && check_permission(role, "tv")
	can_radio =  room_radio_enabled && check_permission(role, "radio")
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
	room_images_enabled = data.room_images_enabled
	room_tv_enabled = data.room_tv_enabled
	room_radio_enabled = data.room_radio_enabled	
}

function socket_emit(destination, data)
{
	data.server_method_name = destination
	socket.emit("server_method", data)	
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
			if(p.includes(arg))
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