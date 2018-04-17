const path = require('path')
const fs = require("fs")
const io = require("socket.io-client")
var commands = require("./commands.json")

const bot_email = "some@email.com"
const bot_password = "somepassword"

// Admins get access to certain control commands like .set
// There can be any number of admins

const admins = ["username1", "username2", "username3"]

const server_address = "http://localhost:3210"
// const server_address = "https://hue.merkoba.com"

const command_prefix = "."
const command_types = ["image", "tv", "radio"]

var username = ""
var role = false
var room_images_enabled = false
var room_tv_enabled = false
var room_radio_enabled = false
var can_chat = false
var can_tv = false
var can_radio = false
var vpermissions = {}
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

				if(cmd === "set" && arg)
				{
					if(admins.indexOf(data.username) === -1)
					{
						return false
					}

					var split = arg.split(' ')

					if(split.length < 3)
					{
						send_message(`Correct format is --> ${command_prefix}set [name] ${command_types.join("|")} [url]`)
						return false
					}

					var command_name = split[0]
					var command_type = split[1]
					var command_url = split.slice(2).join(" ")

					if(command_types.indexOf(command_type) === -1)
					{
						send_message(`Correct format is --> ${command_prefix}set [name] ${command_types.join("|")} [url]`)
						return false
					}

					var testobj = {}

					try
					{
						testobj[command_name] = {type:command_type, url:command_url}
						commands[command_name] = {type:command_type, url:command_url}

						fs.writeFile(path.join(__dirname, "commands.json"), JSON.stringify(commands), 'utf8', function(err)
						{
							if(err)
							{
								console.error(err)
								return false
							}

							send_message(`Command "${command_name}" successfully set.`)
						})
					}

					catch(err)
					{
						send_message(`Can't save that command.`)
						return false
					}
				}

				else if(cmd === "list")
				{
					var list = []
					var filter = arg ? true : false
					var cmds = Object.keys(commands)

					if(filter)
					{
						cmds.sort()
					}

					else
					{
						cmds = cmds.map(x => [Math.random(), x]).sort(([a], [b]) => a - b).map(([_, x]) => x)
					}

					for(var c of cmds)
					{
						if(filter)
						{
							if(c.includes(arg))
							{
								list.push(`.${c}`)
							}
						}

						else
						{
							list.push(`.${c}`)
						}

						if(list.length === 20)
						{
							break
						}
					}

					if(list.length > 0)
					{
						var s = list.join(" ")
					}

					else
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