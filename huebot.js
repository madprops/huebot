const fs = require("fs")
const io = require("socket.io-client")
var commands = require("./commands.json")

const bot_email = "some@email.com"
const bot_password = "somepassword"

// Admins get access to certain control commands like .set
const admins = ["user1", "user2", "user3"]

const command_prefix = "."

var username = ""
var role = false
var room_images_enabled = false
var room_tv_enabled = false
var room_radio_enabled = false
var can_chat = false
var can_tv = false
var can_radio = false
var vpermissions = {}
vpermissions.v1_chat_permission = false
vpermissions.v1_images_permission = false
vpermissions.v1_tv_permission = false
vpermissions.v1_radio_permission = false
vpermissions.v2_chat_permission = false
vpermissions.v2_images_permission = false
vpermissions.v2_tv_permission = false
vpermissions.v2_radio_permission = false
vpermissions.v3_chat_permission = false
vpermissions.v3_images_permission = false
vpermissions.v3_tv_permission = false
vpermissions.v3_radio_permission = false
vpermissions.v4_chat_permission = false
vpermissions.v4_images_permission = false
vpermissions.v4_tv_permission = false
vpermissions.v4_radio_permission = false


const server_address = "http://localhost:3210"
// const server_address = "https://hue.merkoba.com"

const socket = io(server_address,
{
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionDelayMax : 5000,
	reconnectionAttempts: 1000
})

socket.on('connect', function() 
{
	socket.emit('join_room', 
	{
		alternative: true, 
		room_id: "main", 
		email: bot_email, 
		password: bot_password
	})
})

socket.on('update', function(data) 
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
		var msg = data.msg.replace(/\s+/g, ' ').trim()

		if(msg === `hi ${username}`)						
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

			cmd = cmd.substring(1).trim()

			if(cmd === "set")
			{
				if(admins.indexOf(data.username) === -1)
				{
					return false
				}

				var split = arg.split(' ')

				if(split.length < 3)
				{
					return false
				}

				var command_name = split[0]
				var command_type = split[1]
				var command_url = split.slice(2).join(" ")

				var testobj = {}

				try
				{
					testobj[command_name] = {type:command_type, url:command_url}
					commands[command_name] = {type:command_type, url:command_url}

					fs.writeFile('./commands.json', JSON.stringify(commands), 'utf8', function()
					{
						send_message(`Command "${command_name}" successfully set.`)
					})
				}

				catch(err)
				{
					send_message(`Can't save that command.`)
				}
			}

			else if(commands[cmd] !== undefined)
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
})

function send_message(msg)
{
	if(!can_chat)
	{
		return false
	}
	
	socket.emit('sendchat', {msg:msg})	
}

function change_image(src)
{
	if(!can_images)
	{
		return false
	}
	
	socket.emit('linked_image', {image_url:src})
}

function change_tv(src)
{
	if(!can_tv)
	{
		return false
	}
	
	socket.emit('change_tv_source', {src:src})
}

function change_radio(src)
{
	if(!can_radio)
	{
		return false
	}
	
	socket.emit('change_radio_source', {src:src})
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

	if(role === "voice1")
	{
		if(vpermissions[`v1_${type}_permission`])
		{
			return true
		}
	}

	else if(role === "voice2")
	{
		if(vpermissions[`v2_${type}_permission`])
		{
			return true
		}
	}

	else if(role === "voice3")
	{
		if(vpermissions[`v3_${type}_permission`])
		{
			return true
		}
	}

	else if(role === 'voice4')
	{
		if(vpermissions[`v4_${type}_permission`])
		{
			return true
		}
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
	vpermissions.v1_chat_permission = data.v1_chat_permission
	vpermissions.v1_images_permission = data.v1_images_permission
	vpermissions.v1_tv_permission = data.v1_tv_permission
	vpermissions.v1_radio_permission = data.v1_radio_permission
	vpermissions.v2_chat_permission = data.v2_chat_permission
	vpermissions.v2_images_permission = data.v2_images_permission
	vpermissions.v2_tv_permission = data.v2_tv_permission
	vpermissions.v2_radio_permission = data.v2_radio_permission
	vpermissions.v3_chat_permission = data.v3_chat_permission
	vpermissions.v3_images_permission = data.v3_images_permission
	vpermissions.v3_tv_permission = data.v3_tv_permission
	vpermissions.v3_radio_permission = data.v3_radio_permission
	vpermissions.v4_chat_permission = data.v4_chat_permission
	vpermissions.v4_images_permission = data.v4_images_permission
	vpermissions.v4_tv_permission = data.v4_tv_permission
	vpermissions.v4_radio_permission = data.v4_radio_permission	
}

function set_room_enables(data)
{
	room_images_enabled = data.room_images_enabled
	room_tv_enabled = data.room_tv_enabled
	room_radio_enabled = data.room_radio_enabled	
}