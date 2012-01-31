class Config
	@baseurl = window.location.origin + '/-wvhttp-01-/'

class Eventish
	bind: (event, fn) ->
		$(@).bind(event, fn)
	bindTemp: (event, fn) ->
		uniqid = String.fromCharCode( Math.floor( Math.random() *11 ) ) + Math.floor( Math.random() * 1000000 )
		event = event + '.temp_' + uniqid
		@bind(
			event, 
			() =>
				result = $.proxy(fn, @)()
				$(@).unbind(event)
				return result
		)
	trigger: (event) ->
		$(@).trigger(event)

class Api_Abstract extends Eventish
	constructor: () ->
		@api = 
			url: Config.baseurl
			dataType: 'text'
			defaults: {}
	_prepData: (params) ->
		jQuery.extend(true, {}, @api.defaults, params)
	_callApi: (url, params, callback) ->
		data = @_prepData(params)
		$.ajax(
			url: @api.url + url
			data: data
			dataType: @api.dataType
			traditional: true
			cache: true
			success: (data) ->
				callback(data)
			error: (jqXHR, textStatus, errorThrown) ->
				console.log('failure')
				return console.log(jqXHR, textStatus, errorThrown)
		)
	parse: (data) ->
		data = for line in data.split('\n') when line.match(/.+\=?.*/) then line.split('=')
		parsed = {}
		for pair in data
			do (pair) ->
				[ key, value ] = pair
				if not value?
					value = key
					key = 'messages'
				if parsed[key]?
					if typeof parsed[key] isnt 'object'
						parsed[key] = [ parsed[key] ]
					parsed[key].push(value)
				else
					parsed[key] = value
				true
		return parsed
	
class Api_Camera extends Api_Abstract
	svcinfo: {}
	_addSvcInfo: (info) =>
		@svcinfo = jQuery.extend(true, {}, @svcinfo, info)
	image_size: '192x144'
	getAttr: (name) ->
		@svcinfo[name]
	OpenCameraServer: (callback) =>
		delete @api.defaults.connection_id
		@_callApi(
			'OpenCameraServer',
				client_version: 'CamControl'
				image_size: @image_size
			(data) =>
				data = @parse(data)
				@api.defaults.connection_id = data.connection_id
				@_addSvcInfo(data)
				@on = true
				@trigger('SessionStart')
				if callback? and typeof callback is "function"
					callback()
		)
		true
	GetCameraServerInfo: (callback) =>
		@_callApi(
			'GetCameraServerInfo',
				item: 'image_sizes'
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotCameraServerInfo')
				if callback? and typeof callback is "function"
					callback()
		)
	GetVideoInfo: (callback) =>
		@_callApi(
			'GetVideoInfo',
			{}
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotVideoInfo')
				if callback? and typeof callback is "function"
					callback()
		)
	GetCameraInfo: (callback) =>
		@_callApi(
			'GetCameraInfo',
			{}
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotCameraInfo')
				if callback? and typeof callback is "function"
					callback()
		)
	GetPresetList: (callback) =>
		@_callApi(
			'GetPresetList',
				language: 'English'
				character_set: 'ascii'
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotPresetList')
				if callback? and typeof callback is "function"
					callback()
		)
	GetCameraList: (callback) =>
		@_callApi(
			'GetCameraList',
				language: 'English'
				character_set: 'ascii'
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotCameraList')
				if callback? and typeof callback is "function"
					callback()
		)
	GetPanoramaList: (callback) =>
		@_callApi(
			'GetPanoramaList',
				item: ['camera_id', 'date_and_time_string']
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotPanoramaList')
				if callback? and typeof callback is "function"
					callback()
		)
	GetNotice: (callback) =>
		@_callApi(
			'GetNotice',
				timeout: 1800
				seq: 1
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotNotice')
				if callback? and typeof callback is "function"
					callback()
		)
	OperateCamera: (callback, movements) =>
		@_callApi(
			'OperateCamera',
			movements,
			(data) =>
				@trigger('OperatedCamera')
				if callback? and typeof callback is "function"
					callback()
		)
	GetLiveImage: (callback) =>
		Config.baseurl + 'GetLiveImage?serialize_requests=yes&connection_id=' + @svcinfo.connection_id
	GetPanoramaImage: (callback) =>
		@_callApi(
			'GetPanoramaImage',
				camera_id: 1
			(data) =>
				@trigger('GotPanoramaImage')
				if callback? and typeof callback is "function"
					callback()
		)
	GetCameraControl: (callback) =>
		@_callApi(
			'GetCameraControl',
			{}
			(data) =>
				@_addSvcInfo(@parse(data))
				@trigger('GotCameraControl')
				if callback? and typeof callback is "function"
					callback()
		)
	CloseCameraServer: (callback) =>
		@_callApi(
			'GetCameraControl',
			{}
			(data) =>
				@_addSvcInfo(@parse(data))
				@on = false
				@trigger('SessionEnd')
				if callback? and typeof callback is "function"
					callback()
		)

class Camera extends Eventish
	position: {}
	api: null
	state: false
	canvas: null
	timer: null
	speed: 50
	res: '192x144'
	steps: 1000
	constructor: (canvas) ->
		@api = new Api_Camera()
		@canvas = canvas
		@position =
			x:
				min: 0
				max: 0
				val: 0
			y:
				min: 0
				max: 0
				val: 0
			z:
				min: 0
				max: 0
				val: 0

		@api.bind('SessionStart', () =>
			queue = [
				@api.GetCameraServerInfo
				@api.GetVideoInfo
				@api.GetCameraInfo
			]

			count = queue.length
			done = () =>
				count--
				if count < 1
					@update()
					@trigger('Ready')

			for call in queue
				call(done)
		)
		@bind('Ready', () ->
			@_loopStart()
		)
	setSpeed: (speed = 50) ->
		@speed = speed
	switchOn: () ->
		@state = true
		@api.image_size = @res
		@api.OpenCameraServer()
	switchOff: () ->
		@state = false	
	update: () ->
		@position.x.min = Number(@api.getAttr('pan_left_end'))
		@position.x.max = Number(@api.getAttr('pan_right_end'))
		@position.x.val = Number(@api.getAttr('pan_current_value'))
		@position.y.min = Number(@api.getAttr('tilt_down_end'))
		@position.y.max = Number(@api.getAttr('tilt_up_end'))
		@position.y.val = Number(@api.getAttr('tilt_current_value'))
		@position.z.min = Number(@api.getAttr('zoom_tele_end'))
		@position.z.max = Number(@api.getAttr('zoom_wide_end'))
		@position.z.val = Number(@api.getAttr('zoom_current_value'))
	_loopStart: () ->
		@timer =
			count: Number(0)
			sum: Number(0)
			stack: [Number(new Date().getTime())]
			last: Number(new Date().getTime())
			push: (val) ->
				@stack.push(val)
				if @stack.length > 10 then @stack.shift()
				true
			recalc: () ->
				now = Number(new Date().getTime())
				diff = now - @last
				@count = @count + 1
				@sum = @sum + diff
				@last = now
				@push(diff)
			getAvg: () ->
				@sum / @count
			getStackAvg: () ->
				sum = 0
				sum = Number(sum) + Number(item) for item in @stack
				sum / @stack.length
		@_loopHandle = setInterval($.proxy(@_loop, @), @speed)
		#@_loop()
	_loop: () ->
		if @state
			@timer.recalc()
			$('.info .framerate.floating').html("FPS: " + new Number(1 / (@timer.getStackAvg() / 1000)).toFixed(2))
			$('.info .framerate.average').html("AVG: " + new Number(1 / (@timer.getAvg() / 1000)).toFixed(2))	
			frame = new Image()
			frame.onload = () =>
				@_render(frame)	
				#@_loop()
			frame.src = @api.GetLiveImage()
		else
			@api.CloseCameraServer(() =>
				@trigger('Closed')
				clearInterval(@_loopHandle)
			)
	_render: (image) ->
		canvas = document.getElementById(@canvas).getContext('2d')
		maxW = window.innerWidth
		maxH = window.innerHeight
		canvas.canvas.width = maxW
		canvas.canvas.height = maxH
		origW = @api.getAttr("image_width") * 1
		origH = @api.getAttr("image_height") * 1
		ratW = maxW / origW
		ratH = maxH / origH
		ratio = if ratW < ratH then ratW else ratH
		destW = origW * ratio
		destH = origH * ratio
		destX = (maxW - destW) / 2
		destY = (maxH - destH) / 2
		$('#control').css('width', destW).css('height', destH)
		$('#control').css('left', destX).css('top', destY)
		canvas.drawImage(image, 0, 0, origW, origH, destX, destY, destW, destH)
	move: (direction, callback) ->
		@api.GetCameraControl(() =>
			@api.OperateCamera(
				() =>
					@api.GetCameraInfo(
						() =>
							@update()
							if callback? and typeof callback is "function"
								callback()
					)
				direction
			)
		)
	getOffset: () ->
		Math.floor(@position.z.val / (@position.z.max / @steps))
		

camera = null

$(document).ready(() ->
	camera = new Camera('camera')
	camera.switchOn()
	camera.bindTemp('Ready', () ->
		$('.zoom').slider(
				max: camera.position.z.max
				min: camera.position.z.min
				orientation: "vertical"
				value: camera.position.z.max - camera.position.z.val + camera.position.z.min
				change: (event, ui) ->
					zoom = camera.position.z.max - ui.value + camera.position.z.min
					camera.move({ zoom: zoom })
		)
		$('.steps').slider(
				max: 5000
				min: 1
				orientation: "vertical"
				value: 1000
				change: (event, ui) ->
					camera.steps = ui.value
		)
		$('.quality').slider(
				min: 0
				max: Number(camera.api.getAttr('image_size').length) - 1
				change: (event, ui) ->
					res = camera.api.getAttr('image_size')[ui.value]
					camera.res = res	
					camera.bindTemp('Closed', () ->
						camera.switchOn()
					)
					camera.switchOff()
		)
		$('.speed').slider(
				min: 0
				max: 80
				value: camera.speed
				change: (event, ui) ->
					speed = ui.value
					camera.bindTemp('Closed', () ->
						camera.setSpeed(speed)
						camera.switchOn()
					)
					camera.switchOff()
		)
		$('#control .up.none').button(
				icons:
					primary: "ui-icon-carat-1-n"
				text: false
		).click(-> 
			camera.move({ tilt: camera.position.y.val + camera.getOffset() })
			false
		)

		$('#control .up.left').button(
				icons:
					primary: "ui-icon-carat-1-nw"
				text: false
		).click(-> 
			camera.move(
					tilt: camera.position.y.val + camera.getOffset(), 
					pan: camera.position.x.val + camera.getOffset() * -1 
			)
			false
		)

		$('#control .up.right').button(
				icons:
					primary: "ui-icon-carat-1-ne"
				text: false
		).click(-> 
			camera.move(
					tilt: camera.position.y.val + camera.getOffset(), 
					pan: camera.position.x.val + camera.getOffset()
			)
			false
		)

		$('#control .left.none').button(
				icons:
					primary: "ui-icon-carat-1-w"
				text: false
		).click(-> 
			camera.move(
					pan: camera.position.x.val + camera.getOffset() * -1
			)
			false
		)
		$('#control .right.none').button(
				icons:
					primary: "ui-icon-carat-1-e"
				text: false
		).click(-> 
			camera.move(
					pan: camera.position.x.val + camera.getOffset()
			)
			false
		)
		$('#control .down.none').button(
				icons:
					primary: "ui-icon-carat-1-s"
				text: false
		).click(-> 
			camera.move({tilt: camera.position.y.val + camera.getOffset() * -1})
			false
		)
		$('#control .down.left').button(
				icons:
					primary: "ui-icon-carat-1-sw"
				text: false
		).click(-> 
			camera.move(
					tilt: camera.position.y.val + camera.getOffset() * -1, 
					pan: camera.position.x.val + camera.getOffset() * -1
			)
			false
		)

		$('#control .down.right').button(
				icons:
					primary: "ui-icon-carat-1-se"
				text: false
		).click(-> 
			camera.move(
					tilt: camera.position.y.val + camera.getOffset() * -1, 
					pan: camera.position.x.val + camera.getOffset()
			)
			false
		)

	)
)
