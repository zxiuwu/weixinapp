var crypt = require("./crypt.js")
var app = getApp();

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function getData() {
  wx.request({
    url: 'http://vzan.com/f/s-1',
    data: {},
    method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
    // header: {}, // 设置请求的 header
    success: function(res){
      // success
    },
    fail: function() {
      // fail
    },
    complete: function() {
      // complete
    }
  })
}

// 举报
function tipOff(user) {
    console.info("举报");
}

// 登陆必要参数
function primaryLoginArgs() {
    var uid = app.globalData.unionId;
    var versionCode = 1;
    var deviceType = "qq";
    var timestamp = ( new Date() ).getTime();
    var sign = crypt.getVerifyModel(uid, versionCode, deviceType, timestamp);
    var verifyModel = {};
    verifyModel.deviceType = deviceType;
    verifyModel.timestamp = timestamp;
    verifyModel.uid = uid;
    verifyModel.versionCode= versionCode;
    verifyModel.sign=sign;
    return verifyModel;
}

function login(data) {
    // 登陆服务器
    wx.request({
      url: 'https://URL/minisnsapp/loginByWeiXin',
      data: data,
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      header: {}, // 设置请求的 header
      success: function(res){
        // success
      }
    })
}

module.exports = {
  formatTime: formatTime,
  tipOff: tipOff,
  primaryLoginArgs:primaryLoginArgs,
  login:login
}

