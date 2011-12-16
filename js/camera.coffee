class Config
	@baseurl = 'http://space.hsbne.org:52169/-wvhttp-01-/'

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
	OpenCameraServer: (callback) =>
		@_callApi(
			'OpenCameraServer',
				client_version: 'CamControl'
				image_size: '192x144'#'768x576'
			(data) =>
				data = @parse(data)
				@api.defaults.connection_id = data.connection_id
				@_addSvcInfo(data)
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
	OperateCamera: (movements) =>
	GetLiveImage: (callback) =>
		#@_callApi(
			#'GetLiveImage',
				#serialize_requests: 'yes'
			#(data) =>
				#@trigger('GotLiveImage')
				#if callback? and typeof callback is "function"
					#callback()
		#)
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
				@trigger('SessionEnd')
				if callback? and typeof callback is "function"
					callback()
		)

class Frame extends Eventish
	width: null
	height: null
	src: null
	image: null
	api: null
	socket: null
	constructor: (api) ->
		@api = api
		@src = @api.GetLiveImage()
		@image = new Image()
		@image.onload = () =>
			@.trigger('onload')
		@image.src = @src # .src = "data:image/gif;base64," + msg.data
	setWidth: (width) ->
		@width = width
		return @
	setHeight: (height) ->
		@height = height
		return @
	resize: (width, height) ->
		destX = destY = 0
		ratW = width / @width
		ratH = height / @height
		ratio = if ratW < ratH then ratW else ratH
		destW = @width * ratio
		destH = @height * ratio
		@width = destW
		@height = destH
		return @
	position: (width, height) ->
		padT = (width - @width) / 2
		padL = (height - @height) / 2
		return {
			vertical: padT
			horizontal: padL
		}
	render: (canvasid) ->
		canvas = document.getElementById(canvasid).getContext('2d')
		maxW = window.innerWidth
		maxH = window.innerHeight
		canvas.canvas.width = maxW
		canvas.canvas.height = maxH
		origW = @api.svcinfo.image_width
		origH = @api.svcinfo.image_height
		@setWidth(origW).setHeight(origH)
		@resize(maxW, maxH)
		$('#control').css('width', @width).css('height', @height)
		{'vertical': padT, 'horizontal': padL } = @position(maxW, maxH)
		$('#control').css('left', padT).css('top', padL)
		canvas.drawImage(@image, 0, 0, origW, origH, padT, padL, @width, @height)

		
$(document).ready(() ->
	api = new Api_Camera()
	api.bind('SessionStart', () ->
		queue = [
			api.GetCameraServerInfo
			api.GetVideoInfo
			api.GetCameraInfo
		]

		count = queue.length
		for call in queue
			done = () ->
				count--
				if count < 1
					api.trigger('CameraReady')

			call(done)
	)
	api.bind('CameraReady', () ->
		console.log(api.svcinfo)
		zoom = 
			min: Number(api.svcinfo.zoom_tele_limit)
			max: Number(api.svcinfo.zoom_wide_limit)
			val: Number(api.svcinfo.zoom_current_value)
		$('.zoom').slider(
				max: zoom.max
				min: zoom.min
				#step: -1
				orientation: "vertical"
				value: zoom.max - zoom.val + zoom.min
				change: (event, ui) ->
					console.log(zoom.max - ui.value + zoom.min)
		)
		$('.quality').slider(
				min: 0
				max: Number(api.svcinfo.image_size.length) - 1
				change: (event, ui) ->
					console.log(api.svcinfo.image_size[ui.value])
		)
		frame = new Frame(api)
		timer =
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

		drawframe = () ->
			timer.recalc()
			$('.info .framerate.floating').html("FPS: " + new Number(1 / (timer.getStackAvg() / 1000)).toFixed(2))
			$('.info .framerate.average').html("FPS AVG: " + new Number(1 / (timer.getAvg() / 1000)).toFixed(2))
			frame.render('camera')
			frame = null
			frame = new Frame(api)
			frame.bind('onload', drawframe)

		frame.bind('onload', drawframe)
	)
	#$(window).resize(() ->
			#maxW = window.innerWidth
			#maxH = window.innerHeight
			#canvas.canvas.width = maxW
			#canvas.canvas.height = maxH
	#)
	api.OpenCameraServer()
)
