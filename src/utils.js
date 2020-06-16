const fs = require("fs")
const path = require('path')

module.exports = function(Huebot)
{
  Huebot.is_protected_admin = function(uname)
  {
    return Huebot.db.config.protected_admins.includes(uname)
  }

  Huebot.is_admin = function(uname)
  {
    return Huebot.db.permissions.admins.includes(uname) || Huebot.is_protected_admin(uname)
  }

  Huebot.shuffle_array = function(array) 
  {
    for(let i=array.length-1; i>0; i--) 
    {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // eslint-disable-line no-param-reassign
    }
  }

  Huebot.get_random_word = function(mode="normal")
  {
    let word = Huebot.db.words[Huebot.get_random_int(0, Huebot.db.words.length - 1)]

    if(mode === "normal")
    {
      return word
    }

    else if(mode === "capitalized")
    {
      return word[0].toUpperCase() + word.slice(1)
    }

    else if(mode === "upper_case")
    {
      return word.toUpperCase()
    }
  }

  Huebot.get_random_phrase = function()
  {
    let contexts = 
    [
      // bool=plural | bool=add_question_mark
      ["I want a", false, false],
      ["I feel like a", false, false],
      ["would you like a", false, true],
      ["I'm playing with a", false, false],
      ["you look like a", false, false],
      ["you're all a bunch of", true, false],
      ["I want to eat a", false, false],
      ["I see the", false, false],
    ]

    let word = Huebot.get_random_word()
    let context = contexts[Huebot.get_random_int(0, contexts.length - 1)]
    let en = ""
		
    if(context[0].endsWith(" a") && (word.startsWith("a") || word.startsWith("e") || 
      word.startsWith("i") || word.startsWith("o") || word.startsWith("u")))
    {
      en = "n"
    }

    let plural = ""

    if(context[1])
    {
      plural = "s"
    }

    let qs = ""

    if(context[2])
    {
      qs = "?"
    }

    return `${context[0]}${en} ${word}${plural}${qs}`
  }

  Huebot.safe_replacements = function(s)
  {
    s = s.replace(/\$user\$/g, "[random user]")
    s = s.replace(/\$word\$/g, "[random word]")
    s = s.replace(/\$Word\$/g, "[random Word]")
    s = s.replace(/\$WORD\$/g, "[random WORD]")

    return s
  }

  Huebot.get_random_string = function(n)
  {
    let text = ""

    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    for(let i=0; i < n; i++)
    {
      text += possible[Huebot.get_random_int(0, possible.length - 1)]
    }

    return text
  }

  Huebot.string_similarity = function(s1, s2) 
  {
    let longer = s1
    let shorter = s2

    if(s1.length < s2.length) 
    {
      longer = s2
      shorter = s1
    }

    let longerLength = longer.length

    if(longerLength == 0) 
    {
      return 1.0
    }

    return (longerLength - Huebot.string_similarity_distance(longer, shorter)) / parseFloat(longerLength)
  }

  Huebot.string_similarity_distance = function(s1, s2) 
  {
    s1 = s1.toLowerCase()
    s2 = s2.toLowerCase()
	
    let costs = new Array()

    for(let i = 0; i <= s1.length; i++) 
    {
      let lastValue = i

      for(let j = 0; j <= s2.length; j++) 
      {
        if(i == 0)
        {
          costs[j] = j
        }

        else 
        {
          if (j > 0) 
          {
            let newValue = costs[j - 1]

            if(s1.charAt(i - 1) != s2.charAt(j - 1))
            {
              newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1
            }

            costs[j - 1] = lastValue
            lastValue = newValue
          }
        }
      }

      if(i > 0)
      {
        costs[s2.length] = lastValue
      }
    }

    return costs[s2.length]
  }

  Huebot.is_admin_or_op = function(rol)
  {
    return rol === "admin" || rol.startsWith("op")
  }

  Huebot.get_random_int = function(min, max)
  {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  Huebot.get_q_item = function(date, op="normal")
  {
    date = parseInt(date)

    let media = ["image", "tv", "radio"]

    while(media.length > 0)
    {
      let i = 0

      for(let item of Huebot.db.queue[media[0]])
      {
        if(item.date === date)
        {
          if(op === "delete")
          {
            Huebot.db.queue[media[0]].splice(i, 1)
          }

          return item
        }

        i += 1
      }

      media.shift()
    }

    return false
  }

  Huebot.save_file = function(name, content, callback=false)
  {
    let text = JSON.stringify(content)

    fs.writeFile(path.join(Huebot.files_path, name), text, 'utf8', function(err)
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

  Huebot.fill_defaults = function(args, def_args)
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

  Huebot.list_items = function(args={})
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

    Huebot.fill_defaults(args, def_args)

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

      if(i > 1 && i < Huebot.config.max_list_items)
      {
        s += args.append
      }

      if(i <= Huebot.config.max_list_items)
      {
        s += " "
      }

      let bp = ""

      if(args.mode === "commands")
      {
        let cmd = Huebot.db.commands[p]

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

      let ns = `${w}${args.prepend}${p}${bp}${w2}`

      if(s.length + ns.length > Huebot.config.max_text_length)
      {
        return false
      }

      else
      {
        s += ns
      }

      if(i >= Huebot.config.max_list_items)
      {
        return false
      }

      return true
    }

    return s.trim()
  }

  Huebot.get_extension = function(s)
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

  Huebot.clean_string2 = function(s)
  {
    return s.replace(/\s+/g, ' ').trim()
  }

  Huebot.clean_string5 = function(s)
  {
    return s.replace(/\s+/g, '').trim()
  }

  Huebot.clean_string10 = function(s)
  {
    return s.replace(/[\n\r]+/g, '\n').replace(/\s+$/g, '')
  }

  Huebot.smart_capitalize = function(s)
  {
    if(s.length > 2)
    {
      return s[0].toUpperCase() + s.slice(1)
    }

    else
    {
      return s.toUpperCase()
    }
  }

  Huebot.generate_random_controls = function()
  {
    let controls = ["image", "tv", "radio"]
    let strings = []

    for(let control of controls)
    {
      strings.push(`[whisper ${Huebot.db.config.command_prefix}random ${control}]${smart_capitalize(control)}[/whisper]`)
    }

    return strings.join(" | ")
  }

  Huebot.clean_multiline = function(message)
  {
    let message_split = message.split("\n")
    let num_lines = message_split.length

    if(num_lines === 1)
    {
      message = message.trim()
    }

    else
    {
      let new_lines = []

      for(let line of message_split)
      {
        if(line.trim().length > 0)
        {
          new_lines.push(line)
        }
      }

      message = new_lines.join("\n")
    }

    return message
  }

  Huebot.round = function(value, decimals)
  {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals)
  }

  Huebot.rgb_to_hex = function(rgb, hash=true)
  {
    if(typeof rgb === "string")
    {
      rgb = rgb_to_array(rgb)
    }

    let code = ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)

    if(hash)
    {
      code = "#" + code
    }

    return code
  }

  Huebot.rgb_to_array = function(rgb)
  {
    let array

    if(Array.isArray(rgb))
    {
      array = []

      for(let i=0; i<rgb.length; i++)
      {
        let split = rgb[i].replace("rgb(", "").replace(")", "").split(",")
        array[i] = split.map(x => parseInt(x))
      }
    }

    else
    {
      let split = rgb.replace("rgb(", "").replace(")", "").split(",")
      array = split.map(x => parseInt(x))
    }

    return array					
  }

  Huebot.generate_random_drawing = function()
  {
    let n = Huebot.get_random_int(3, 300)

    let click_x = []
    let click_y = []
    let drag = []

    for(let i=0; i<n; i++)
    {
      click_x.push(Huebot.get_random_int(0, 400))
      click_y.push(Huebot.get_random_int(0, 300))

      if(drag.length === 0)
      {
        drag.push(false)
      }

      else
      {
        drag.push(Huebot.get_random_int(0, 2) > 0)
      }
    }

    return [click_x, click_y, drag]
  }

  Huebot.is_command = function(message)
  {
    if(message.length > 1 && message[0] === Huebot.db.config.command_prefix && message[1] !== Huebot.db.config.command_prefix)
    {
      return true
    }

    return false
  }

  Huebot.check_public_command = function(cmd, arg)
  {
    if(cmd === "random")
    {
      if(arg)
      {
        if(arg !== "image" && arg !== "tv" && arg !== "radio")
        {
          return false
        }
      }
    }

    return true
  }
}