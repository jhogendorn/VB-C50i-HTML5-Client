var Api_Abstract, Api_Camera, Camera, Config, Eventish, camera;
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

  Api_Camera.prototype.image_size = '192x144';

  Api_Camera.prototype.getAttr = function(name) {
    return this.svcinfo[name];
  };

  Api_Camera.prototype.OpenCameraServer = function(callback) {
    var _this = this;
    delete this.api.defaults.connection_id;
    this._callApi('OpenCameraServer', {
      client_version: 'CamControl',
      image_size: this.image_size
    }, function(data) {
      data = _this.parse(data);
      _this.api.defaults.connection_id = data.connection_id;
      _this._addSvcInfo(data);
      _this.on = true;
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

  Api_Camera.prototype.OperateCamera = function(callback, movements) {
    var _this = this;
    return this._callApi('OperateCamera', movements, function(data) {
      _this.trigger('OperatedCamera');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

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
      _this.on = false;
      _this.trigger('SessionEnd');
      if ((callback != null) && typeof callback === "function") return callback();
    });
  };

  return Api_Camera;

})();

Camera = (function() {

  __extends(Camera, Eventish);

  Camera.prototype.position = {};

  Camera.prototype.api = null;

  Camera.prototype.state = false;

  Camera.prototype.canvas = null;

  Camera.prototype.timer = null;

  function Camera(canvas) {
    var _this = this;
    this.api = new Api_Camera();
    this.canvas = canvas;
    this.position = {
      x: {
        min: 0,
        max: 0,
        val: 0
      },
      y: {
        min: 0,
        max: 0,
        val: 0
      },
      z: {
        min: 0,
        max: 0,
        val: 0
      }
    };
    this.api.bind('SessionStart', function() {
      var call, count, done, queue, _i, _len, _results;
      queue = [_this.api.GetCameraServerInfo, _this.api.GetVideoInfo, _this.api.GetCameraInfo];
      count = queue.length;
      done = function() {
        count--;
        if (count < 1) {
          _this.update();
          return _this.trigger('Ready');
        }
      };
      _results = [];
      for (_i = 0, _len = queue.length; _i < _len; _i++) {
        call = queue[_i];
        _results.push(call(done));
      }
      return _results;
    });
    this.bind('Ready', function() {
      return this._loopStart();
    });
  }

  Camera.prototype.switchOn = function(res) {
    if (res == null) res = '192x144';
    this.state = true;
    this.api.image_size = res;
    return this.api.OpenCameraServer();
  };

  Camera.prototype.switchOff = function() {
    return this.state = false;
  };

  Camera.prototype.update = function() {
    this.position.x.min = Number(this.api.getAttr('pan_left_end'));
    this.position.x.max = Number(this.api.getAttr('pan_right_end'));
    this.position.x.val = Number(this.api.getAttr('pan_current_value'));
    this.position.y.min = Number(this.api.getAttr('tilt_down_end'));
    this.position.y.max = Number(this.api.getAttr('tilt_up_end'));
    this.position.y.val = Number(this.api.getAttr('tilt_current_value'));
    this.position.z.min = Number(this.api.getAttr('zoom_tele_end'));
    this.position.z.max = Number(this.api.getAttr('zoom_wide_end'));
    return this.position.z.val = Number(this.api.getAttr('zoom_current_value'));
  };

  Camera.prototype._loopStart = function() {
    this.timer = {
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
    return this._loop();
  };

  Camera.prototype._loop = function() {
    var frame;
    var _this = this;
    if (this.state) {
      this.timer.recalc();
      $('.info .framerate.floating').html("FPS: " + new Number(1 / (this.timer.getStackAvg() / 1000)).toFixed(2));
      $('.info .framerate.average').html("AVG: " + new Number(1 / (this.timer.getAvg() / 1000)).toFixed(2));
      frame = new Image();
      frame.onload = function() {
        _this._render(frame);
        return _this._loop();
      };
      return frame.src = this.api.GetLiveImage();
    } else {
      return this.api.CloseCameraServer(function() {
        return _this.trigger('Closed');
      });
    }
  };

  Camera.prototype._render = function(image) {
    var canvas, destH, destW, destX, destY, maxH, maxW, origH, origW, ratH, ratW, ratio;
    canvas = document.getElementById(this.canvas).getContext('2d');
    maxW = window.innerWidth;
    maxH = window.innerHeight;
    canvas.canvas.width = maxW;
    canvas.canvas.height = maxH;
    origW = this.api.getAttr("image_width") * 1;
    origH = this.api.getAttr("image_height") * 1;
    ratW = maxW / origW;
    ratH = maxH / origH;
    ratio = ratW < ratH ? ratW : ratH;
    destW = origW * ratio;
    destH = origH * ratio;
    destX = (maxW - destW) / 2;
    destY = (maxH - destH) / 2;
    $('#control').css('width', destW).css('height', destH);
    $('#control').css('left', destX).css('top', destY);
    return canvas.drawImage(image, 0, 0, origW, origH, destX, destY, destW, destH);
  };

  Camera.prototype.move = function(direction, callback) {
    var _this = this;
    return this.api.GetCameraControl(function() {
      return _this.api.OperateCamera(function() {
        return _this.api.GetCameraInfo(function() {
          _this.update();
          if ((callback != null) && typeof callback === "function") {
            return callback();
          }
        });
      }, direction);
    });
  };

  return Camera;

})();

camera = null;

$(document).ready(function() {
  camera = new Camera('camera');
  camera.switchOn();
  return camera.bindTemp('Ready', function() {
    var offset;
    $('.zoom').slider({
      max: camera.position.z.max,
      min: camera.position.z.min,
      orientation: "vertical",
      value: camera.position.z.max - camera.position.z.val + camera.position.z.min,
      change: function(event, ui) {
        var zoom;
        zoom = camera.position.z.max - ui.value + camera.position.z.min;
        return camera.move({
          zoom: zoom
        });
      }
    });
    $('.quality').slider({
      min: 0,
      max: Number(camera.api.getAttr('image_size').length) - 1,
      change: function(event, ui) {
        var res;
        res = camera.api.getAttr('image_size')[ui.value];
        camera.bindTemp('Closed', function() {
          return camera.switchOn(res);
        });
        return camera.switchOff();
      }
    });
    offset = 1000;
    $('#control .up.none').button({
      icons: {
        primary: "ui-icon-carat-1-n"
      },
      text: false
    }).click(function() {
      camera.move({
        tilt: camera.position.y.val + offset
      });
      return false;
    });
    $('#control .up.left').button({
      icons: {
        primary: "ui-icon-carat-1-nw"
      },
      text: false
    }).click(function() {
      camera.move({
        tilt: camera.position.y.val + offset,
        pan: camera.position.x.val + offset * -1
      });
      return false;
    });
    $('#control .up.right').button({
      icons: {
        primary: "ui-icon-carat-1-ne"
      },
      text: false
    }).click(function() {
      camera.move({
        tilt: camera.position.y.val + offset,
        pan: camera.position.x.val + offset
      });
      return false;
    });
    $('#control .left.none').button({
      icons: {
        primary: "ui-icon-carat-1-w"
      },
      text: false
    }).click(function() {
      camera.move({
        pan: camera.position.x.val + offset * -1
      });
      return false;
    });
    $('#control .right.none').button({
      icons: {
        primary: "ui-icon-carat-1-e"
      },
      text: false
    }).click(function() {
      camera.move({
        pan: camera.position.x.val + offset
      });
      return false;
    });
    $('#control .down.none').button({
      icons: {
        primary: "ui-icon-carat-1-s"
      },
      text: false
    }).click(function() {
      camera.move({
        tilt: camera.position.y.val + offset * -1
      });
      return false;
    });
    $('#control .down.left').button({
      icons: {
        primary: "ui-icon-carat-1-sw"
      },
      text: false
    }).click(function() {
      camera.move({
        tilt: camera.position.y.val + offset * -1,
        pan: camera.position.x.val + offset * -1
      });
      return false;
    });
    return $('#control .down.right').button({
      icons: {
        primary: "ui-icon-carat-1-se"
      },
      text: false
    }).click(function() {
      camera.move({
        tilt: camera.position.y.val + offset * -1,
        pan: camera.position.x.val + offset
      });
      return false;
    });
  });
});
