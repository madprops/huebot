	const io = require("socket.io-client")

	// const server_address = "http://localhost:3210"
	const server_address = "https://hue.merkoba.com"

	const bot_username = "a user username"
	const bot_password = "the user password"

	const socket = io(server_address)

	function start_socket()
	{
		socket.on('connect', function() 
		{
			socket.emit('join_room', 
			{
				alternative: true, 
				room_id: "main", 
				username: bot_username, 
				password: bot_password
			})
		})

		socket.on('update', function(data) 
		{
			if(data.type === 'chat_msg')
			{
				var lmsg = data.msg.toLowerCase()

				if(data.username !== bot_username)
				{
					if(lmsg === `hi ${bot_username}`)						
					{
						send_message(`hello! ${data.username}`)
					}

					if(lmsg === ".hello")
					{
						change_image("https://i.imgur.com/ZUdre7C.gif")
					}

					if(lmsg === ".tony")
					{
						change_tv("https://youtu.be/4YYTNkAdDD8")
					}

					if(lmsg === ".ass")
					{
						change_tv("https://adultswimhls-i.akamaihd.net/hls/live/238460/adultswim/main/1/master_Layer2.m3u8")
					}

					if(lmsg === ".stream")
					{
						change_tv("https://j.l5.ca/stream/hls/test.m3u8")
					}
					
					if(lmsg === ".lofi")
					{
						change_radio("https://youtu.be/SsYkibjW_gc")
					}
				}
			}

			if(data.type === 'joined')
			{
				console.log("Joined!")
			}
		})
	}

	function send_message(msg)
	{
		socket.emit('sendchat', {msg:msg})
	}

	function change_image(src)
	{
		socket.emit('pasted', {image_url:src})
	}

	function change_tv(src)
	{
		socket.emit('change_tv_source', {src:src})
	}

	function change_radio(src)
	{
		socket.emit('change_radio_source', {src:src})
	}

	start_socket()
