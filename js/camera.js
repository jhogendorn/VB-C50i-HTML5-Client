var Api_Abstract, Api_Camera, Config, Eventish, Frame;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Config = (function() {

  function Config() {}

  Config.baseurl = 'http://space.hsbne.org:52169/-wvhttp-01-/';

  return Config;

})();

Eventish = (function() {

  function Eventish() {}

  Eventish.prototype.bind = function(event, fn) {
    return $(this).bind(event, fn);
  };

  Eventish.prototype.bindTemp = function(event, fn) {
    var uniqid;
    var _this = this;
    uniqid = String.fromCharCode(Math.floor(Math.random() * 11)) + Math.floor(Math.random() * 1000000);
    event = event + '.temp_' + uniqid;
    return this.bind(event, function() {
      var result;
      result = $.proxy(fn, _this)();
      $(_this).unbind(event);
      return result;
    });
  };

  Eventish.prototype.trigger = function(event) {
    return $(this).trigger(event);
  };

  return Eventish;

})();

Api_Abstract = (function() {

  __extends(Api_Abstract, Eventish);

  function Api_Abstract() {
    this.api = {
      url: Config.baseurl,
      dataType: 'text',
      defaults: {}
    };
  }

  Api_Abstract.prototype._prepData = function(params) {
    return jQuery.extend(true, {}, this.api.defaults, params);
  };

  Api_Abstract.prototype._callApi = function(url, params, callback) {
    var data;
    data = this._prepData(params);
    return $.ajax({
      url: this.api.url + url,
      data: data,
      dataType: this.api.dataType,
      traditional: true,
      cache: true,
      success: function(data) {
        return callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log('failure');
        return console.log(jqXHR, textStatus, errorThrown);
      }
    });
  };

  Api_Abstract.prototype.parse = function(data) {
    var line, pair, parsed, _fn, _i, _len;
    data = (function() {
      var _i, _len, _ref, _results;
      _ref = data.split('\n');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        if (line.match(/.+\=?.*/)) _results.push(line.split('='));
      }
      return _results;
    })();
    parsed = {};
    _fn = function(pair) {
      var key, value;
      key = pair[0], value = pair[1];
      if (!(value != null)) {
        value = key;
        key = 'messages';
      }
      if (parsed[key] != null) {
        if (typeof parsed[key] !== 'object') parsed[key] = [parsed[key]];
        parsed[key].push(value);
      } else {
        parsed[key] = value;
      }
      return true;
    };
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      pair = data[_i];
      _fn(pair);
    }
    return parsed;
  };

  return Api_Abstract;

})();

Api_Camera = (function() {

  __extends(Api_Camera, Api_Abstract);

  function Api_Camera() {
    this.CloseCameraServer = __bind(this.CloseCameraServer, this);
    this.GetCameraControl = __bind(this.GetCameraControl, this);
    this.GetPanoramaImage = __bind(this.GetPanoramaImage, this);
    this.GetLiveImage = __bind(this.GetLiveImage, this);
    this.OperateCamera = __bind(this.OperateCamera, this);
    this.GetNotice = __bind(this.GetNotice, this);
    this.GetPanoramaList = __bind(this.GetPanoramaList, this);
    this.GetCameraList = __bind(this.GetCameraList, this);
    this.GetPresetList = __bind(this.GetPresetList, this);
    this.GetCameraInfo = __bind(this.GetCameraInfo, this);
    this.GetVideoInfo = __bind(this.GetVideoInfo, this);
    this.GetCameraServerInfo = __bind(this.GetCameraServerInfo, this);
    this.OpenCameraServer = __bind(this.OpenCameraServer, this);
    this._addSvcInfo = __bind(this._addSvcInfo, this);
    Api_Camera.__super__.constructor.apply(this, arguments);
  }

  Api_Camera.prototype.svcinfo = {};

  Api_Camera.prototype._addSvcInfo = function(info) {
    return this.svcinfo = jQuery.extend(true, {}, this.svcinfo, info);
  };

  Api_Camera.prototype.OpenCameraServer = function(callback) {
    var _this = this;
    this._callApi('OpenCameraServer', {
      client_version: 'CamControl',
      image_size: '192x144'
    }, function(data) {
      data = _this.parse(data);
      _this.api.defaults.connection_id = data.connection_id;
      _this._addSvcInfo(data);
      _this.trigger('SessionStart');
      if ((callback != null) && typeof callback === "function") return callback();
    });
    return true;
  };

  Api_Camera.prototype.GetCameraServerInfo = function(callback) {
    var _this = this;
    return this._callApi('GetCameraServerInfo', {
      item: 'image_sizes'
    }, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotCameraServerInfo');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetVideoInfo = function(callback) {
    var _this = this;
    return this._callApi('GetVideoInfo', {}, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotVideoInfo');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetCameraInfo = function(callback) {
    var _this = this;
    return this._callApi('GetCameraInfo', {}, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotCameraInfo');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetPresetList = function(callback) {
    var _this = this;
    return this._callApi('GetPresetList', {
      language: 'English',
      character_set: 'ascii'
    }, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotPresetList');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetCameraList = function(callback) {
    var _this = this;
    return this._callApi('GetCameraList', {
      language: 'English',
      character_set: 'ascii'
    }, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotCameraList');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetPanoramaList = function(callback) {
    var _this = this;
    return this._callApi('GetPanoramaList', {
      item: ['camera_id', 'date_and_time_string']
    }, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotPanoramaList');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetNotice = function(callback) {
    var _this = this;
    return this._callApi('GetNotice', {
      timeout: 1800,
      seq: 1
    }, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotNotice');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.OperateCamera = function(movements) {};

  Api_Camera.prototype.GetLiveImage = function(callback) {
    return Config.baseurl + 'GetLiveImage?serialize_requests=yes&connection_id=' + this.svcinfo.connection_id;
  };

  Api_Camera.prototype.GetPanoramaImage = function(callback) {
    var _this = this;
    return this._callApi('GetPanoramaImage', {
      camera_id: 1
    }, function(data) {
      _this.trigger('GotPanoramaImage');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.GetCameraControl = function(callback) {
    var _this = this;
    return this._callApi('GetCameraControl', {}, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('GotCameraControl');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  Api_Camera.prototype.CloseCameraServer = function(callback) {
    var _this = this;
    return this._callApi('GetCameraControl', {}, function(data) {
      _this._addSvcInfo(_this.parse(data));
      _this.trigger('SessionEnd');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  return Api_Camera;

})();

Frame = (function() {

  __extends(Frame, Eventish);

  Frame.prototype.width = null;

  Frame.prototype.height = null;

  Frame.prototype.src = null;

  Frame.prototype.image = null;

  Frame.prototype.api = null;

  Frame.prototype.socket = null;

  function Frame(api) {
    var _this = this;
    this.api = api;
    this.src = this.api.GetLiveImage();
    this.image = new Image();
    this.image.onload = function() {
      return _this.trigger('onload');
    };
    this.image.src = this.src;
  }

  Frame.prototype.setWidth = function(width) {
    this.width = width;
    return this;
  };

  Frame.prototype.setHeight = function(height) {
    this.height = height;
    return this;
  };

  Frame.prototype.resize = function(width, height) {
    var destH, destW, destX, destY, ratH, ratW, ratio;
    destX = destY = 0;
    ratW = width / this.width;
    ratH = height / this.height;
    ratio = ratW < ratH ? ratW : ratH;
    destW = this.width * ratio;
    destH = this.height * ratio;
    this.width = destW;
    this.height = destH;
    return this;
  };

  Frame.prototype.position = function(width, height) {
    var padL, padT;
    padT = (width - this.width) / 2;
    padL = (height - this.height) / 2;
    return {
      vertical: padT,
      horizontal: padL
    };
  };

  Frame.prototype.render = function(canvasid) {
    var canvas, maxH, maxW, origH, origW, padL, padT, _ref;
    canvas = document.getElementById(canvasid).getContext('2d');
    maxW = window.innerWidth;
    maxH = window.innerHeight;
    canvas.canvas.width = maxW;
    canvas.canvas.height = maxH;
    origW = this.api.svcinfo.image_width;
    origH = this.api.svcinfo.image_height;
    this.setWidth(origW).setHeight(origH);
    this.resize(maxW, maxH);
    $('#control').css('width', this.width).css('height', this.height);
    _ref = this.position(maxW, maxH), padT = _ref['vertical'], padL = _ref['horizontal'];
    $('#control').css('left', padT).css('top', padL);
    return canvas.drawImage(this.image, 0, 0, origW, origH, padT, padL, this.width, this.height);
  };

  return Frame;

})();

$(document).ready(function() {
  var api;
  api = new Api_Camera();
  api.bind('SessionStart', function() {
    var call, count, done, queue, _i, _len, _results;
    queue = [api.GetCameraServerInfo, api.GetVideoInfo, api.GetCameraInfo];
    count = queue.length;
    _results = [];
    for (_i = 0, _len = queue.length; _i < _len; _i++) {
      call = queue[_i];
      done = function() {
        count--;
        if (count < 1) return api.trigger('CameraReady');
      };
      _results.push(call(done));
    }
    return _results;
  });
  api.bind('CameraReady', function() {
    var drawframe, frame, timer, zoom;
    console.log(api.svcinfo);
    zoom = {
      min: Number(api.svcinfo.zoom_tele_limit),
      max: Number(api.svcinfo.zoom_wide_limit),
      val: Number(api.svcinfo.zoom_current_value)
    };
    $('.zoom').slider({
      max: zoom.max,
      min: zoom.min,
      orientation: "vertical",
      value: zoom.max - zoom.val + zoom.min,
      change: function(event, ui) {
        return console.log(zoom.max - ui.value + zoom.min);
      }
    });
    $('.quality').slider({
      min: 0,
      max: Number(api.svcinfo.image_size.length) - 1,
      change: function(event, ui) {
        return console.log(api.svcinfo.image_size[ui.value]);
      }
    });
    frame = new Frame(api);
    timer = {
      count: Number(0),
      sum: Number(0),
      stack: [Number(new Date().getTime())],
      last: Number(new Date().getTime()),
      push: function(val) {
        this.stack.push(val);
        if (this.stack.length > 10) this.stack.shift();
        return true;
      },
      recalc: function() {
        var diff, now;
        now = Number(new Date().getTime());
        diff = now - this.last;
        this.count = this.count + 1;
        this.sum = this.sum + diff;
        this.last = now;
        return this.push(diff);
      },
      getAvg: function() {
        return this.sum / this.count;
      },
      getStackAvg: function() {
        var item, sum, _i, _len, _ref;
        sum = 0;
        _ref = this.stack;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          sum = Number(sum) + Number(item);
        }
        return sum / this.stack.length;
      }
    };
    drawframe = function() {
      timer.recalc();
      $('.info .framerate.floating').html("FPS: " + new Number(1 / (timer.getStackAvg() / 1000)).toFixed(2));
      $('.info .framerate.average').html("FPS AVG: " + new Number(1 / (timer.getAvg() / 1000)).toFixed(2));
      frame.render('camera');
      frame = null;
      frame = new Frame(api);
      return frame.bind('onload', drawframe);
    };
    return frame.bind('onload', drawframe);
  });
  return api.OpenCameraServer();
});
