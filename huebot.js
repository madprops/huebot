// Configuration

const bot_email = "xxx"
const bot_password = "xxx"
const twitch_client_id = "xxx"
const twitch_enabled = true
const youtube_client_id = "xxx"
const youtube_enabled = true
const server_address = "http://localhost:3210"
const room_ids = ["main"]
const protected_admins = ["mad"]
const files_location = "./files/"
const command_prefix = "."

// ----------

const path = require('path')
const fs = require("fs")
const io = require("socket.io-client")
const fetch = require("node-fetch")
const cheerio = require("cheerio")
const linkify = require("linkifyjs")

const files_path = path.normalize(path.resolve(__dirname, files_location) + "/")

let commands = require(`${files_path}commands.json`)
let permissions = require(`${files_path}permissions.json`)
let themes = require(`${files_path}themes.json`)
let options = require(`${files_path}options.json`)
let queue = require(`${files_path}queue.json`)
let words = require(`${files_path}words`)
let subjects = require(`${files_path}subjects`)
let backgrounds = require(`${files_path}backgrounds`)

const connected_rooms = {}
const user_command_activity = []

const socket_emit_throttle = 10
const max_text_length = 2000
const max_title_length = 250
const recent_streams_max_length = 5
const max_user_command_activity = 20
const max_media_source_length = 800
const max_list_items = 20
const num_suggestions = 5

const media_types = ["image", "tv", "radio"]
const no_image_error = "I don't have permission to change the image."
const no_tv_error = "I don't have permission to change the tv."
const no_radio_error = "I don't have permission to change the radio."

const available_commands = 
[
	'image',
	'tv',
	'radio',
	'set',
	'setforce',
	'unset',
	'rename',
	'list',
	'random',
	'q',
	'adminadd',
	'adminremove',
	'admins',
	'themeadd',
	'themeremove',
	'themerename',
	'theme',
	'themes',
	'linktitles',
	'stream',
	'activity',
	'clearcommands',
	'clearadmins',
	'clearthemes',
	'clearsubjects',
	'help',
	'ping',
	'whatis',
	'say',
	'subjectadd',
	'subjectremove',
	'subjectrename',
	'subjectkeywords',
	'subjectkeywordsadd',
	'subjectkeywordsremove',
	'subject',
	'subjects',
	"leave",
	"join",
	"backgroundadd",
	"backgroundremove",
	"backgroundrename",
	"background",
	"backgrounds",
	"sleep",
	"suggest"
]

for(let room_id of room_ids)
{
	start_connection(room_id)
}

function start_connection(room_id)
{
	let username = ""
	let role = false
	let room_images_mode = "disabled"
	let room_tv_mode = "disabled"
	let room_radio_mode = "disabled"
	let can_chat = false
	let can_tv = false
	let can_radio = false
	let vpermissions = {}
	let theme
	let text_color
	let text_color_mode
	let emit_queue_timeout
	let emit_queue = []
	let recent_twitch_streams = []
	let recent_youtube_streams = []
	let userlist = []
	let background_image
	let background_mode
	let background_effect
	let background_tile_dimensions
	let current_image_source
	let current_tv_source
	let current_radio_source
	let commands_queue = {}

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
			room_id: room_id, 
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
				connected_rooms[room_id] = true

				set_username(data.username)
				set_role(data.role)
				set_room_enables(data)
				set_permissions(data)
				set_theme(data)
				set_background_image(data.background_image)
				set_background_mode(data.background_mode)
				set_background_effect(data.background_effect)
				set_background_tile_dimensions(data.background_tile_dimensions)
				set_userlist(data)
				set_image_source(data.image_source)
				set_tv_source(data.tv_source)
				set_radio_source(data.radio_source)
				check_permissions()
			}

			else if(data.type === 'chat_message')
			{
				if(data.username === username)
				{
					return false
				}

				if(data.message === `hi ${username}` || data.message === `${username} hi`)
				{
					send_message(`hello ${data.username}!`)
				}

				if(is_command(data.message))
				{
					let obj = 
					{
						username: data.username,
						message: data.message,
						method: "public"
					}

					process_command(obj)
				}

				else
				{
					if(options.link_titles)
					{
						let links = linkify.find(data.message)

						if(links)
						{
							for(let i=0; i<links.length; i++)
							{
								let link = links[i]

								let href = link.href

								if(!href.startsWith("http://") && !href.startsWith("https://"))
								{
									continue
								}

								if(i >= 3)
								{
									break
								}

								let extension = get_extension(href).toLowerCase()

								if(extension)
								{
									if(extension !== "html" && extension !== "php")
									{
										continue
									}
								}

								fetch(href)
								
								.then(res => 
								{
									return res.text()
								})
								
								.then(body => 
								{
									let $ = cheerio.load(body)
									let title = clean_string2($("title").text().substring(0, max_title_length))
									
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

			else if(data.type === "userjoin")
			{
				add_to_userlist(data.username)
			}

			else if(data.type === "userdisconnect")
			{
				remove_from_userlist(data.username)
			}

			else if(data.type === 'new_username')
			{
				if(username === data.old_username)
				{
					set_username(data.username)
				}

				replace_in_userlist(data.old_username, data.username)
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

			else if(data.type === "whisper")
			{
				if(is_command(data.message))
				{
					let obj = 
					{
						username: data.username,
						message: data.message,
						method: "whisper"
					}

					process_command(obj)
				}

				else
				{
					if(!is_admin(data.username))
					{
						return false
					}

					send_whisper(data.username, "Hi! I hope you like my drawing :)", generate_random_drawing())
				}
			}

			else if(data.type === 'background_image_change')
			{
				set_background_image(data.background_image)
			}

			else if(data.type === 'background_mode_changed')
			{
				set_background_mode(data.mode)
			}

			else if(data.type === 'background_effect_changed')
			{
				set_background_effect(data.effect)
			}

			else if(data.type === 'background_tile_dimensions_changed')
			{
				set_background_tile_dimensions(data.dimensions)
			}

			else if(data.type === 'changed_image_source')
			{
				set_image_source(data.image_source)
			}

			else if(data.type === 'changed_tv_source')
			{
				set_tv_source(data.tv_source)
			}

			else if(data.type === 'changed_radio_source')
			{
				set_radio_source(data.radio_source)
			}
		}

		catch(err)
		{
			console.error(err)
		}
	})

	socket.on('disconnect', function(data) 
	{
		delete connected_rooms[room_id]
	})

	function send_message(message, feedback=true)
	{
		if(!message)
		{
			return false
		}

		if(!can_chat)
		{
			return false
		}

		message = do_replacements(message)

		message = clean_string2(message.substring(0, max_text_length))
		
		socket_emit('sendchat', {message:message})	
	}

	function send_whisper(uname, message, coords=false)
	{
		message = do_replacements(message)

		message = clean_string2(message.substring(0, max_text_length))

		socket_emit('whisper', 
		{
			username: uname, 
			message: message, 
			draw_coords: coords
		})
	}

	function change_media(args={})
	{
		let def_args =
		{
			type: "",
			src: "",
			feedback: true
		}

		fill_defaults(args, def_args)

		if(!media_types.includes(args.type))
		{
			return false
		}

		if(!args.src)
		{
			return false
		}

		args.src = do_replacements(args.src)

		args.src = clean_string2(args.src)

		if(args.src.length > max_media_source_length)
		{
			return false
		}

		if(args.type === "image")
		{
			if(!can_images)
			{
				if(args.feedback)
				{
					send_message(no_image_error)
				}
				
				return false
			}

			if(current_image_source === args.src)
			{
				return false
			}

			socket_emit('change_image_source', {src:args.src})
		}

		else if(args.type === "tv")
		{
			if(!can_tv)
			{
				if(args.feedback)
				{
					send_message(no_tv_error)
				}

				return false
			}

			if(current_tv_source === args.src)
			{
				return false
			}

			socket_emit('change_tv_source', {src:args.src})
		}

		else if(args.type === "radio")
		{
			if(!can_radio)
			{
				if(args.feedback)
				{
					send_message(no_radio_error)
				}

				return false
			}

			if(current_radio_source === args.src)
			{
				return false
			}

			socket_emit('change_radio_source', {src:args.src})
		}
	}

	function run_command(cmd, arg, data)
	{
		let command = commands[cmd]

		if(command.type === "image")
		{
			change_media({type:"image", src:command.url})
		}

		else if(command.type === "tv")
		{
			change_media({type:"tv", src:command.url})
		}

		else if(command.type === "radio")
		{
			change_media({type:"radio", src:command.url})
		}	

		else if(command.type === "alias")
		{
			let c = command.url.split(" ")[0]

			if(available_commands.includes(c))
			{
				data.message = `${command_prefix}${command.url} ${arg}`

				process_command(data)
			}
		}	
	}

	function check_permissions()
	{
		can_chat = check_permission(role, "chat")
		can_images = room_images_mode === "enabled" && check_permission(role, "images")
		can_tv = room_tv_mode === "enabled" && check_permission(role, "tv")
		can_radio = room_radio_mode === "enabled" && check_permission(role, "radio")
	}

	function check_permission(role, type)
	{
		if(is_admin_or_op(role))
		{
			return true
		}

		if(vpermissions[`${role}_${type}_permission`])
		{
			return true
		}

		return false	
	}

	function is_admin_or_op(rol)
	{
		return rol === "admin" || rol === "op"
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
		let obj =
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
			let obj = emit_queue[0]

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
		return Math.floor(Math.random() * (max - min + 1) + min)
	}

	function set_theme(data)
	{
		theme = data.theme
		text_color_mode = data.text_color_mode
		text_color = data.text_color
	}

	function set_background_image(image)
	{
		background_image = image
	}

	function set_background_mode(mode)
	{
		background_mode = mode
	}

	function set_background_effect(effect)
	{
		background_effect = effect
	}

	function set_background_tile_dimensions(dimensions)
	{
		background_tile_dimensions = dimensions
	}

	function set_userlist(data)
	{
		userlist = []

		for(let user of data.userlist)
		{
			userlist.push(user.username)
		}
	}

	function add_to_userlist(uname)
	{
		for(let u of userlist)
		{
			if(u === uname)
			{
				return false
			}
		}

		userlist.push(uname)
	}

	function remove_from_userlist(uname)
	{
		for(let i=0; i<userlist.length; i++)
		{
			let u = userlist[i]

			if(u === uname)
			{
				userlist.splice(i, 1)
				return
			}
		}
	}

	function replace_in_userlist(old_uname, new_uname)
	{
		for(let i=0; i<userlist.length; i++)
		{
			let u = userlist[i]

			if(u === old_uname)
			{
				userlist[i] = new_uname
				return
			}
		}
	}

	function save_file(name, content, callback=false)
	{
		fs.writeFile(path.join(files_path, name), JSON.stringify(content), 'utf8', function(err)
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

	function fill_defaults(args, def_args)
	{
		for(let key in def_args)
		{
			let d = def_args[key]

			if(args[key] === undefined)
			{
				args[key] = d
			}
		}
	}

	function list_items(args={})
	{
		let def_args =
		{
			data: {},
			filter: "",
			prepend: "",
			append: "",
			sort_mode: "none",
			whisperify: false,
			mode: ""
		}

		fill_defaults(args, def_args)

		args.filter = args.filter.toLowerCase()
		
		let do_filter = args.filter ? true : false

		let props

		if(Array.isArray(args.data))
		{
			props = args.data
		}

		else
		{
			props = Object.keys(args.data)
		}

		if(args.sort_mode === "random")
		{
			props = props.map(x => [Math.random(), x]).sort(([a], [b]) => a - b).map(([_, x]) => x)
		}

		else if(args.sort_mode === "sort")
		{
			props.sort()
		}

		let i = 0

		let s = ""

		let num_props = props.length

		for(let p of props)
		{
			if(do_filter)
			{
				if(p.toLowerCase().includes(args.filter))
				{
					if(!on_added(p))
					{
						break
					}
				}
			}

			else
			{
				if(!on_added(p))
				{
					break
				}
			}
		}

		function on_added(p)
		{
			i += 1

			let ap = ""

			if(i <= max_list_items)
			{
				s += " "
			}

			if(i < max_list_items && i < num_props)
			{
				ap = args.append
			}

			let bp = ""

			if(args.mode === "commands")
			{
				let cmd = commands[p]

				if(cmd && cmd.type)
				{
					bp = ` (${cmd.type})`
				}
			}

			let w = ""
			let w2 = ""
			
			if(args.whisperify)
			{
				w = `[whisper ${args.whisperify}${p}]`
				w2 = "[/whisper]"
			}

			let ns = `${w}${args.prepend}${p}${bp}${ap}${w2}`

			if(s.length + ns.length > max_text_length)
			{
				return false
			}

			else
			{
				s += ns
			}

			if(i >= max_list_items)
			{
				return false
			}

			return true
		}

		return s.trim()
	}

	function get_extension(s)
	{
		if(s.startsWith("http://") || s.startsWith("https://"))
		{
			let s2 = s.split("//").slice(1).join("//")

			let matches = s2.match(/\/.*\.(\w+)(?=$|[#?])/)

			if(matches)
			{
				return matches[1]
			}
		}

		else
		{
			let matches = s.match(/\.(\w+)(?=$|[#?])/)

			if(matches)
			{
				return matches[1]
			}
		}

		return ""
	}

	function clean_string2(s)
	{
		return s.replace(/\s+/g, ' ').trim()
	}

	function clean_string5(s)
	{
		return s.replace(/\s+/g, '').trim()
	}

	function generate_random_drawing()
	{
		let n = get_random_int(3, 300)

		let click_x = []
		let click_y = []
		let drag = []

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

	function get_twitch_stream()
	{
		fetch(`https://api.twitch.tv/helix/streams`,
		{
			headers:
			{
				"Client-ID": twitch_client_id
			}
		})
		
		.then(res => 
		{
			return res.json()
		})
		
		.then(res => 
		{
			if(res.data && res.data.length > 0)
			{
				shuffle_array(res.data)

				for(let item of res.data)
				{
					if(!recent_twitch_streams.includes(item.user_id))
					{
						break
					}
				}

				let id = item.user_id

				recent_twitch_streams.push(id)

				if(recent_twitch_streams.length > recent_streams_max_length)
				{
					recent_twitch_streams.shift()
				}

				fetch(`https://api.twitch.tv/helix/users?id=${id}`,
				{
					headers:
					{
						"Client-ID": twitch_client_id
					}
				})
				
				.then(res => 
				{
					return res.json()
				})
				
				.then(res => 
				{
					if(res.data && res.data.length > 0)
					{
						let user = res.data[0]

						change_media({type:"tv", src:`https://twitch.tv/${user.login}`})
					}
				})

				.catch(err =>
				{
					console.error(err)
				})
			}
		})

		.catch(err =>
		{
			console.error(err)
		})
	}

	function get_youtube_stream()
	{
		fetch(`https://www.googleapis.com/youtube/v3/search?videoEmbeddable=true&maxResults=20&type=video&eventType=live&videoCategoryId=20&fields=items(id(videoId))&part=snippet&key=${youtube_client_id}`)
		
		.then(res => 
		{
			return res.json()
		})
		
		.then(res => 
		{
			if(res.items !== undefined && res.items.length > 0)
			{
				shuffle_array(res.items)

				for(let item of res.items)
				{
					if(!recent_youtube_streams.includes(item.id.videoId))
					{
						break
					}
				}

				let id = item.id.videoId

				recent_youtube_streams.push(id)

				if(recent_youtube_streams.length > recent_streams_max_length)
				{
					recent_youtube_streams.shift()
				}

				change_media({type:"tv", src:`https://youtube.com/watch?v=${id}`})
			}
		})

		.catch(err =>
		{
			console.error(err)
		})
	}

	function is_command(message)
	{
		if(message.length > 1 && message[0] === command_prefix && message[1] !== command_prefix)
		{
			return true
		}

		return false
	}

	// Must Include:
	// data.message
	// data.username
	// data.method
	// Optional:
	// data.callback
	function process_command(data)
	{
		if(!is_admin(data.username))
		{
			if(data.callback)
			{
				return data.callback()
			}

			else
			{
				return false
			}
		}

		user_command_activity.push(data.username)

		if(user_command_activity.length > max_user_command_activity)
		{
			user_command_activity.shift()
		}

		let split = data.message.split(' ')

		let cmd = split[0]

		let arg

		if(split.length > 1)
		{
			cmd += ' '

			arg = clean_string2(split.slice(1).join(" "))
		}

		else
		{
			arg = ""
		}

		cmd = cmd.substring(1).trim()

		if(data.message.includes(" && "))
		{
			if(cmd !== "set" && cmd !== "setforce")
			{
				let full_cmd = `${cmd} ${arg}`

				let and_split = full_cmd.split(" && ")

				if(and_split.length > 1)
				{
					let cmds = []

					for(let i=0; i<and_split.length; i++)
					{
						let item = and_split[i]

						let c = item.trim()

						let cc
						let c2

						if(!c.startsWith(command_prefix))
						{
							cc = command_prefix + c
							c2 = c
						}

						else
						{
							cc = c
							c2 = c.substring(1)
						}

						let acmd = commands[c2]

						if(acmd !== undefined)
						{
							let spc = acmd.url.split(" ")[0]

							if(available_commands.includes(spc))
							{
								cc = command_prefix + acmd.url
							}
						}

						cmds.push(cc)
					}

					let qcmax = 0

					let cqid

					while(true)
					{
						cqid = get_random_string(5) + Date.now()

						if(commands_queue[cqid] === undefined)
						{
							break
						}

						qcmax += 1

						if(qcmax >= 100)
						{
							if(data.callback)
							{
								return data.callback()
							}

							else
							{
								return false
							}
						}
					}

					commands_queue[cqid] = {}
					commands_queue[cqid].username = data.username
					commands_queue[cqid].method = data.method
					commands_queue[cqid].commands = cmds

					run_commands_queue(cqid)

					if(data.callback)
					{
						return data.callback()
					}

					else
					{
						return false
					}
				}
			}
		}

		execute_command(data, cmd, arg)

		if(data.callback)
		{
			return data.callback()
		}

		else
		{
			return false
		}
	}

	function execute_command(data, cmd, arg)
	{
		if(!available_commands.includes(cmd))
		{
			if(commands[cmd] !== undefined)
			{
				run_command(cmd, arg, data)
			}

			return false
		}

		if(cmd === "image")
		{
			change_media({type:"image", src:arg})
		}

		else if(cmd === "tv")
		{
			change_media({type:"tv", src:arg})
		}

		else if(cmd === "radio")
		{
			change_media({type:"radio", src:arg})
		}

		else if(cmd === "backgroundimage")
		{
			change_background_image(arg)
		}

		else if(cmd === "backgroundmode")
		{
			change_background_mode(arg)
		}

		else if(cmd === "tiledimensions")
		{
			change_background_tile_dimensions(arg)
		}

		else if(cmd === "set" || cmd === "setforce")
		{
			let split = arg.split(' ')
			let command_name = split[0]
			let command_type = split[1]
			let command_url = split.slice(2).join(" ")

			if(!arg || split.length < 3 || (!media_types.includes(command_type) && command_type !== "alias"))
			{
				process_feedback(data, `Correct format is --> ${command_prefix}${cmd} [name] ${media_types.join("|")}|alias [url]`)
				return false
			}

			if(available_commands.includes(command_name))
			{
				process_feedback(data, `Command "${command_name}" is reserved.`)
				return false
			}

			if(command_type === "alias")
			{
				let and_split = command_url.split(" && ")

				for(let item of and_split)
				{
					let c = item.trim().split(" ")[0]

					if(!available_commands.includes(c))
					{
						process_feedback(data, "Not a valid alias. Remember to not include the trigger character.")
						return false
					}
				}
			}

			let oc = commands[command_name]

			if(oc && cmd !== "setforce")
			{
				process_feedback(data, `"${command_name}" already exists. Use "${command_prefix}setforce" to overwrite.`)
				return false
			}

			let testobj = {}

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
				process_feedback(data, `Can't save that command.`)
				return false
			}
		}

		else if(cmd === "unset")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}unset [name]`)
				return false
			}

			if(commands[arg] === undefined)
			{
				process_feedback(data, `Command "${arg}" doesn't exist.`)
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
			let split = arg.split(' ')
			let old_name = split[0]
			let new_name = split[1]

			if(!arg || split.length !== 2)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}rename [old_name] [new_name]`)
				return false
			}

			if(commands[old_name] === undefined)
			{
				process_feedback(data, `Command "${old_name}" doesn't exist.`)
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
				process_feedback(data, `Can't rename that command.`)
				return false
			}
		}

		else if(cmd === "list")
		{
			let sort_mode = "random"

			if(arg)
			{
				sort_mode = "sort"
			}

			let s = list_items(
			{
				data: commands,
				filter: arg,
				prepend: command_prefix,
				sort_mode: sort_mode,
				whisperify: `${command_prefix}`,
				mode: "commands"
			})

			if(!s)
			{
				s = "No commands found."
			}

			process_feedback(data, s)
		}

		else if(cmd === "random")
		{
			if(arg)
			{
				let cmds = Object.keys(commands)

				cmds = cmds.filter(x => commands[x].type !== "alias")

				if(!media_types.includes(arg))
				{
					return false
				}
				
				cmds = cmds.filter(x => commands[x].type === arg)
				
				let c = cmds[get_random_int(0, cmds.length - 1)]

				if(c)
				{
					run_command(c, arg, data)
				}
			}

			else
			{
				if(!can_tv)
				{
					process_feedback(data, no_tv_error)
					return false
				}

				let word1 = words[get_random_int(0, words.length - 1)]
				let word2 = words[get_random_int(0, words.length - 1)]

				change_media({type:"tv", src:`${word1} ${word2}`})
			}
		}

		else if(cmd === "whatis")
		{
			if(!arg || arg.split(" ").length > 1)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}whatis [command_name]`)
				return false
			}

			if(available_commands.includes(arg))
			{
				process_feedback(data, `"${arg}" is a reserved command.`)
			}

			else
			{
				let command = commands[arg]

				if(command)
				{
					process_feedback(data, `"${arg}" is of type "${command.type}" and is set to "${safe_replacements(command.url)}".`)
				}

				else
				{
					process_feedback(data, `Command "${arg}" doesn't exist.`)
				}
			}
		}

		else if(cmd === "adminadd")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}adminadd [username]`)
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
			if(!is_protected_admin(data.username))
			{
				return false
			}

			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}adminremove [username]`)
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
					let admin = permissions.admins[i]

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
				process_feedback(data, `"${arg}" is not an admin. Nothing to remove.`)
			}
		}

		else if(cmd === "admins")
		{
			let sort_mode = "random"

			if(arg)
			{
				sort_mode = "sort"
			}

			let s = list_items(
			{
				data: permissions.admins,
				filter: arg,
				append: ",",
				sort_mode: sort_mode
			})

			if(!s)
			{
				s = "No admins found."
			}

			process_feedback(data, s)
		}

		else if(cmd === "themeadd")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}themeadd [name]`)
				return false
			}

			let obj = {}

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
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}themeremove [name]`)
				return false
			}

			if(themes[arg] === undefined)
			{
				process_feedback(data, `Theme "${arg}" doesn't exist.`)
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
			let split = arg.split(' ')
			let old_name = split[0]
			let new_name = split[1]

			if(!arg || split.length !== 2)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}themerename [old_name] [new_name]`)
				return false
			}

			if(themes[old_name] === undefined)
			{
				process_feedback(data, `Theme "${old_name}" doesn't exist.`)
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
				process_feedback(data, `Can't rename that theme.`)
				return false
			}
		}

		else if(cmd === "theme")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}theme [name]`)
				return false
			}

			if(!is_admin_or_op(role))
			{
				process_feedback(data, "I need to be an operator to do that.")
				return false
			}

			let obj = themes[arg]

			if(obj)
			{
				obj.theme = clean_string5(obj.theme)

				obj.text_color = clean_string5(obj.text_color)

				if(obj.theme && obj.theme !== theme)
				{
					socket_emit("change_theme", {color:obj.theme})
				}

				if(obj.text_color_mode && obj.text_color_mode !== text_color_mode)
				{
					socket_emit("change_text_color_mode", {mode:obj.text_color_mode})
				}

				if(obj.text_color_mode && obj.text_color_mode === "custom")
				{
					if(obj.text_color && obj.text_color !== text_color)
					{
						socket_emit("change_text_color", {color:obj.text_color})
					}
				}
			}

			else
			{
				process_feedback(data, `Theme "${arg}" doesn't exist.`)
			}
		}

		else if(cmd === "themes")
		{
			let sort_mode = "random"

			if(arg)
			{
				sort_mode = "sort"
			}

			let s = list_items(
			{
				data: themes,
				filter: arg,
				append: ",",
				sort_mode: sort_mode,
				whisperify: `${command_prefix}theme `
			})

			if(!s)
			{
				s = "No themes found."
			}

			process_feedback(data, s)
		}

		else if(cmd === "subjectadd")
		{
			let error = false

			if(!arg)
			{
				error = true
			}

			if(!error)
			{
				if(arg.split(" ").length > 1)
				{
					error = true
				}
			}

			if(error)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subjectadd [name:no_spaces]`)
				return false
			}

			let name = arg.toLowerCase()

			if(subjects[name] === undefined)
			{
				subjects[name] = []

				save_file("subjects.json", subjects, function()
				{
					send_message(`Subject "${name}" successfully added. Use ${command_prefix}subjectkeywordsadd to add additional keywords to the subject.`)
				})
			}

			else
			{
				process_feedback(data, `Subject "${name}" already exists.`)
			}
		}

		else if(cmd === "subjectremove")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subjectremove [name]`)
				return false
			}

			let name = arg.toLowerCase()

			if(subjects[name] === undefined)
			{
				process_feedback(data, `Subject "${name}" doesn't exist.`)
				return false
			}

			delete subjects[name]

			save_file("subjects.json", subjects, function()
			{
				send_message(`Subject "${name}" successfully removed.`)
			})
		}

		else if(cmd === "subjectrename")
		{
			let split = arg.split(' ')
			let old_name = split[0].toLowerCase()
			let new_name = split.slice(1).join(" ").toLowerCase()

			if(!arg || split.length !== 2)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subjectrename [old_name:no_spaces] [new_name:no_spaces]`)
				return false
			}

			if(subjects[old_name] === undefined)
			{
				process_feedback(data, `Subject "${old_name}" doesn't exist.`)
				return false
			}

			try
			{
				subjects[new_name] = subjects[old_name]

				delete subjects[old_name]

				save_file("subjects.json", subjects, function(err)
				{
					send_message(`Subject "${old_name}" successfully renamed to "${new_name}".`)
				})
			}

			catch(err)
			{
				process_feedback(data, `Can't rename that subject.`)
				return false
			}
		}

		else if(cmd === "subjectkeywords")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subjectkeywords [name:no_spaces]`)
				return false
			}

			let split = arg.split(" ")
			let name = split[0].toLowerCase()
			let filter = split.slice(1).join(" ").toLowerCase()

			if(subjects[name] === undefined)
			{
				process_feedback(data, `Subject "${name}" doesn't exist.`)
				return false
			}

			let list = subjects[name]

			if(list.length === 0)
			{
				process_feedback(data, `Subject "${name}" is empty.`)
				return false
			}

			let sort_mode = "random"

			if(filter)
			{
				sort_mode = "sort"
			}

			let s = list_items(
			{
				data: list,
				filter: filter,
				append: ",",
				sort_mode: sort_mode
			})

			if(!s)
			{
				s = "No subjects found."
			}

			process_feedback(data, s)
		}

		else if(cmd === "subjectkeywordsadd")
		{
			let error = false
			
			if(!arg)
			{
				error = true
			}

			let split
			let name
			let keyword

			if(!error)
			{
				split = arg.split(" ")
				name = split[0].toLowerCase()
				keyword = split.slice(1).join(" ").toLowerCase()

				if(!name || !keyword)
				{
					error = true
				}
			}

			if(error)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subjectkeywordsadd [name:no_spaces] [keyword]`)
				return false
			}

			if(subjects[name] === undefined)
			{
				process_feedback(data, `Subject "${name}" doesn't exist.`)
				return false
			}

			let list = subjects[name]

			for(let i of list)
			{
				if(i === keyword)
				{
					process_feedback(data, `"${keyword}" is already part of subject "${name}".`)
					return false
				}
			}

			list.push(keyword)

			save_file("subjects.json", subjects, function(err)
			{
				send_message(`"${keyword}" successfully added to subject "${name}".`)
			})
		}

		else if(cmd === "subjectkeywordsremove")
		{
			let error = false
			
			if(!arg)
			{
				error = true
			}

			let split
			let name
			let keyword

			if(!error)
			{
				split = arg.split(" ")
				name = split[0].toLowerCase()
				keyword = split.slice(1).join(" ").toLowerCase()

				if(!name || !keyword)
				{
					error = true
				}
			}

			if(error)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subjectkeywordsremove [name:no_spaces] [keyword]`)
				return false
			}

			if(subjects[name] === undefined)
			{
				process_feedback(data, `Subject "${name}" doesn't exist.`)
				return false
			}

			let list = subjects[name]

			if(list.length === 0)
			{
				process_feedback(data, `Subject "${name}" is empty.`)
				return false
			}

			for(let i=0; i<list.length; i++)
			{	
				let kw = list[i]

				if(kw === keyword)
				{
					list.splice(i, 1)

					save_file("subjects.json", subjects, function(err)
					{
						send_message(`"${keyword}" was removed from subject "${name}".`)
						return true
					})
					
					return true
				}
			}

			process_feedback(data, `"${keyword}" is not part of subject "${name}".`)
		}

		else if(cmd === "subject")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}subject [name:no_spaces] ${media_types.join("|")} : optional`)
				return false
			}

			let split = arg.split(" ")
			let name = split[0].toLowerCase()
			let type = split.slice(1).join(" ").toLowerCase()

			if(subjects[name] === undefined)
			{
				process_feedback(data, `Subject "${name}" doesn't exist.`)
				return false
			}

			let list = subjects[name]

			let query

			if(list.length === 0)
			{
				query = `${name} ${words[get_random_int(0, words.length - 1)]}`
			}

			else
			{
				query = `${name} ${list[get_random_int(0, list.length - 1)]} ${words[get_random_int(0, words.length - 1)]}`
			}

			if(type)
			{
				if(type === "image")
				{
					change_media({type:"image", src:query})
				}

				else if(type === "tv")
				{
					change_media({type:"tv", src:query})
				}

				else if(type === "radio")
				{
					change_media({type:"radio", src:query})
				}
			}

			else
			{
				change_media({type:"tv", src:query})
			}
		}

		else if(cmd === "subjects")
		{
			let sort_mode = "random"

			if(arg)
			{
				sort_mode = "sort"
			}

			let s = list_items(
			{
				data: subjects,
				filter: arg,
				append: ",",
				sort_mode: sort_mode,
				whisperify: `${command_prefix}subject `
			})

			if(!s)
			{
				s = "No subjects found."
			}

			process_feedback(data, s)
		}

		else if(cmd === "linktitles")
		{
			if(!arg || (arg !== "on" && arg !== "off"))
			{
				process_feedback(data, `Correct format is --> ${command_prefix}linktitles on|off`)
				return false
			}

			if(arg === "on")
			{
				if(options.link_titles)
				{
					process_feedback(data, "Link titles are already on.")
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
					process_feedback(data, "Link titles are already off.")
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
			let error = false

			let arg1
			let arg2

			if(!arg)
			{
				error = true
			}
			
			else
			{
				let split = arg.split(' ')

				if(split.length < 2)
				{
					error = true
				}

				else
				{
					arg1 = split[0]

					if(!media_types.includes(arg1))
					{
						error = true
					}
					
					else
					{
						arg2 = split.slice(1).join(" ")
					}
				}
			}

			if(error)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}q ${media_types.join("|")} [url]|next|clear|size`)
				return false
			}

			let error_string
			let upname
			let perm

			if(arg1 === "image")
			{
				error_string = no_image_error
				upname = "Image"
				perm = can_images
			}

			else if(arg1 === "tv")
			{
				error_string = no_tv_error
				upname = "TV"
				perm = can_tv
			}

			else if(arg1 === "radio")
			{
				error_string = no_radio_error
				upname = "Radio"
				perm = can_radio
			}

			if(arg2 === "next")
			{
				if(queue[arg1].length > 0)
				{
					if(!perm)
					{
						process_feedback(data, error_string)
						return false
					}

					let url = queue[arg1].shift()

					if(arg1 === "image")
					{
						change_media({type:"image", src:url})
					}

					else if(arg1 === "tv")
					{
						change_media({type:"tv", src:url})
					}

					else if(arg1 === "radio")
					{
						change_media({type:"radio", src:url})
					}

					save_file("queue.json", queue)
				}

				else
				{
					process_feedback(data, `${upname} queue is empty.`)
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
					process_feedback(data, `${upname} queue was already cleared.`)
				}
			}

			else if(arg2 === "size")
			{
				let n = queue[arg1].length

				let s

				if(n === 1)
				{
					s = "item"
				}

				else
				{
					s = "items"
				}

				process_feedback(data, `${upname} queue has ${n} ${s}.`)
			}

			else
			{
				if(queue[arg1].includes(arg2))
				{
					process_feedback(data, `That item is already in the ${arg1} queue.`)
					return false
				}
				
				queue[arg1].push(arg2)

				save_file("queue.json", queue, function()
				{
					send_message(`${upname} item successfully queued.`)
				})	
			}
		}

		else if(cmd === "ping")
		{
			process_feedback(data, "Pong")
		}

		else if(cmd === "stream")
		{
			if(!twitch_enabled && !youtube_enabled)
			{
				process_feedback(data, "No stream source support is enabled.")
				return false
			}

			if(twitch_enabled && !youtube_enabled)
			{
				get_twitch_stream()
			}

			else if(youtube_enabled && !twitch_enabled)
			{
				get_youtube_stream()
			}

			else
			{
				let n = get_random_int(0, 1)

				if(n === 0)
				{
					get_twitch_stream()
				}

				else
				{
					get_youtube_stream()
				}
			}
		}

		else if(cmd === "activity")
		{
			let s = list_items(
			{
				data: user_command_activity.slice(0).reverse(),
				append: ","
			})

			if(!s)
			{
				s = "No activity yet."
			}

			process_feedback(data, `Recent command activity by: ${s}`)
		}

		else if(cmd === "clearcommands")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			commands = {}

			save_file("commands.json", commands, function()
			{
				send_message(`Commands list successfully cleared.`)
			})
		}

		else if(cmd === "clearadmins")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			permissions.admins = [data.username]

			save_file("permissions.json", permissions, function()
			{
				send_message(`Admins list successfully cleared.`)
			})
		}

		else if(cmd === "clearthemes")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			themes = {}

			save_file("themes.json", themes, function()
			{
				send_message(`Themes list successfully cleared.`)
			})
		}

		else if(cmd === "clearsubjects")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			subjects = {}

			save_file("subjects.json", subjects, function()
			{
				send_message(`Subjects list successfully cleared.`)
			})
		}

		else if(cmd === "clearbackgrounds")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			backgrounds = {}

			save_file("backgrounds.json", backgrounds, function()
			{
				send_message(`Backgrounds list successfully cleared.`)
			})
		}

		else if(cmd === "say")
		{
			if(!arg)
			{
				return false
			}
			
			send_message(arg)
		}

		else if(cmd === "join")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			if(!arg)
			{
				process_feedback(data, `Argument must be a room ID.`)
				return false
			}

			if(connected_rooms[arg] !== undefined)
			{
				process_feedback(data, "It seems I'm already in that room.")
				return false
			}

			process_feedback(data, "Attempting to join that room!")
			start_connection(arg)
		}

		else if(cmd === "leave")
		{
			if(!is_protected_admin(data.username))
			{
				return false
			}

			process_feedback(data, "Good bye!")
			socket.disconnect()
		}

		else if(cmd === "backgroundadd")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}backgroundadd [name]`)
				return false
			}

			if(background_mode !== "normal" && background_mode !== "tiled")
			{
				process_feedback(data, "Only backgrounds that use an image can be saved.")
				return false	
			}

			if(!background_image.startsWith("http://") && !background_image.startsWith("https://"))
			{
				process_feedback(data, "Only backgrounds that use external images can be saved.")
				return false
			}

			let obj = {}

			obj.image = background_image
			obj.mode = background_mode
			obj.effect = background_effect
			obj.tile_dimensions = background_tile_dimensions

			backgrounds[arg] = obj

			save_file("backgrounds.json", backgrounds, function()
			{
				send_message(`Background "${arg}" successfully added.`)
			})
		}

		else if(cmd === "backgroundremove")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}backgroundremove [name]`)
				return false
			}

			if(backgrounds[arg] === undefined)
			{
				process_feedback(data, `Background "${arg}" doesn't exist.`)
				return false
			}

			delete backgrounds[arg]

			save_file("backgrounds.json", themes, function()
			{
				send_message(`Background "${arg}" successfully removed.`)
			})
		}

		else if(cmd === "backgroundrename")
		{
			let split = arg.split(' ')
			let old_name = split[0]
			let new_name = split[1]

			if(!arg || split.length !== 2)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}backgroundrename [old_name] [new_name]`)
				return false
			}

			if(backgrounds[old_name] === undefined)
			{
				process_feedback(data, `Background "${old_name}" doesn't exist.`)
				return false
			}

			try
			{
				backgrounds[new_name] = backgrounds[old_name]

				delete backgrounds[old_name]

				save_file("backgrounds.json", backgrounds, function(err)
				{
					send_message(`Background "${old_name}" successfully renamed to "${new_name}".`)
				})
			}

			catch(err)
			{
				process_feedback(data, `Can't rename that background.`)
				return false
			}
		}

		else if(cmd === "background")
		{
			if(!arg)
			{
				process_feedback(data, `Correct format is --> ${command_prefix}background [name]`)
				return false
			}

			if(!is_admin_or_op(role))
			{
				process_feedback(data, "I need to be an operator to do that.")
				return false
			}

			let obj = backgrounds[arg]

			if(obj)
			{
				if(obj.image && obj.image !== background_image)
				{
					socket_emit("change_background_image_source", {src:obj.image})
				}

				if(obj.mode && obj.mode !== background_mode)
				{
					socket_emit("change_background_mode", {mode:obj.mode})
				}

				if(obj.mode && obj.mode !== "solid")
				{
					if(obj.effect && obj.effect !== background_effect)
					{
						socket_emit("change_background_effect", {effect:obj.effect})
					}
				}

				if(obj.mode && obj.mode === "tiled")
				{
					if(obj.tile_dimensions && obj.tile_dimensions !== background_tile_dimensions)
					{
						socket_emit("change_background_tile_dimensions", {dimensions:obj.tile_dimensions})
					}
				}
			}

			else
			{
				process_feedback(data, `Background "${arg}" doesn't exist.`)
			}
		}

		else if(cmd === "backgrounds")
		{
			let sort_mode = "random"

			if(arg)
			{
				sort_mode = "sort"
			}

			let s = list_items(
			{
				data: backgrounds,
				filter: arg,
				append: ",",
				sort_mode: sort_mode,
				whisperify: `${command_prefix}background `
			})

			if(!s)
			{
				s = "No backgrounds found."
			}

			process_feedback(data, s)
		}

		else if(cmd === "suggest")
		{
			let type = "tv"

			if(arg)
			{
				if(arg === "tv" || arg === "image" || arg === "images" || arg === "radio")
				{
					type = arg

					if(type === "images")
					{
						type = "image"
					}
				}
			}

			let suggestions = `Some ${type} suggestions: `

			for(let i=0; i<num_suggestions; i++)
			{
				let words = `${get_random_word()} ${get_random_word()}`

				let s = `[whisper ${command_prefix}${type} ${words}]"${words}"[/whisper]`

				if(i < num_suggestions - 1)
				{
					s += ", "
				}
				
				suggestions += s
			}

			process_feedback(data, suggestions)
		}

		else if(cmd === "help")
		{
			let s = ""

			if(arg)
			{
				s = list_items(
				{
					data: available_commands,
					filter: arg,
					prepend: command_prefix,
					append: ",",
					sort_mode: "sort"
				})
			}

			else
			{
				s += "Available Commands: "

				for(let c of available_commands)
				{
					s += `${command_prefix}${c}, ` 
				}
				
				s = s.slice(0, -2)
			}

			if(s)
			{
				send_whisper(data.username, s, false)
			}

			else
			{
				send_whisper(data.username, "Nothing found.", false)
			}
		}
	}

	function is_protected_admin(uname)
	{
		return protected_admins.includes(uname)
	}

	function is_admin(uname)
	{
		return permissions.admins.includes(uname) || is_protected_admin(uname)
	}

	function shuffle_array(array) 
	{
		for(let i=array.length-1; i>0; i--) 
		{
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
		}
	}

	function process_feedback(data, s)
	{
		if(!s)
		{
			return false
		}

		if(data.method === "whisper")
		{
			send_whisper(data.username, s, false)
		}

		else
		{
			send_message(s)
		}
	}

	function get_random_word()
	{
		return words[get_random_int(0, words.length - 1)]
	}

	function get_random_user()
	{
		return userlist[get_random_int(0, userlist.length - 1)]
	}

	function do_replacements(s)
	{
		s = s.replace(/\$word\$/gi, function()
		{
			return get_random_word()
		})

		s = s.replace(/\$user\$/gi, function()
		{
			return get_random_user()
		})

		return s
	}

	function safe_replacements(s)
	{
		s = s.replace(/\$word\$/gi, "[random word]")
		s = s.replace(/\$user\$/gi, "[random user]")

		return s
	}

	function set_image_source(src)
	{
		current_image_source = src
	}

	function set_tv_source(src)
	{
		current_tv_source = src
	}

	function set_radio_source(src)
	{
		current_radio_source = src
	}

	function get_random_string(n)
	{
		let text = ""

		let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

		for(let i=0; i < n; i++)
		{
			text += possible[get_random_int(0, possible.length - 1)]
		}

		return text
	}

	function run_commands_queue(id)
	{
		let cq = commands_queue[id]

		if(!cq)
		{
			delete commands_queue[id]
			return false
		}

		let cmds = cq.commands
		
		if(cmds.length === 0)
		{
			delete commands_queue[id]
			return false	
		}

		let cmd = cmds.shift()

		let lc_cmd = cmd.toLowerCase()

		let obj = 	
		{
			message: cmd,
			username: cq.username,
			method: cq.method,
			callback: function()
			{
				run_commands_queue(id)
			}
		}

		if(lc_cmd.startsWith(".sleep") || lc_cmd === ".sleep")
		{
			let n = parseInt(lc_cmd.replace(".sleep ", ""))

			if(isNaN(n))
			{
				n = 1000
			}

			setTimeout(function()
			{
				run_commands_queue(id)
			}, n)
		}

		else
		{
			process_command(obj)
		}
	}
}