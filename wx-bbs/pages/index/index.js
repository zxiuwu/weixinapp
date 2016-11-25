var index = require("../../data/index-list.js")
var util = require("../../utils/util.js")
var crypt = require("../../utils/crypt.js")
var comobj = require("../../obj/comobj.js")
var api = require("../../utils/api.js")


//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    loading:true,
    articles: [],
    pageIndex:1, 
    pageSize:2,
    audioIcon:"http://i.pengxun.cn/content/images/voice/voiceplaying.png",
    typeList:[],
    currentTypeId:0,
    hot:0,
    scrollLeft:0,
    praised:{}, // 是否已经点赞
    showRecommend:{},
    emoij:{id:""},
    commentText:"",
    selectedImgs:[],
    currentMoreComment:null,
    headInfo:{},
    categories:[]
    },

  onLoad: function () {
    console.log('onLoad')
    var that = this
    this.init();
  },
  /**
   * 下拉加载
   */
  onReachBottom: function() {
      this.nextPage();
  },
  /**
   * 上拉刷新
   */
  onPullDownRefresh: function() {
    
  },
  /**
   * 初始化
   */
  init:function(){
    var that = this;
    that.setData({"loading":true});
    app.getInit(function(result){
        var minisId = result.obj._Minisns.Id;
        var unionid = result.obj._LookUser.unionid;
        var verifyModel = util.primaryLoginArgs(unionid);
        // 设置全局数据
        that.setData({"user":result.obj._LookUser,"minisns":result.obj._Minisns})
        wx.request({
          url: 'https://xiuxun.top/wx/app/minisnsapp/getminisnsheadinfo',
          data: {"deviceType": verifyModel.deviceType, "uid": verifyModel.uid, "versionCode":verifyModel.versionCode,
          "timestamp": verifyModel.timestamp, "sign":verifyModel.sign, "id":minisId },
          method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
          // header: {}, // 设置请求的 header
          success: function(res){
              var result = res.data;
              that.setData({
                  headInfo:{"backMap":result.obj.BackMap, "logoUrl":result.obj.LogoUrl, "articleCount":result.obj.ArticleCount,
                      "clickCount":result.obj.ClickCount, "isSign":result.obj.IsSign, "isConcern":result.obj.IsConcern },
                  categories:result.obj.Categories
              });
              wx.setStorageSync('categories', result.obj.Categories);
          }
        })
        wx.request({
          url: 'https://xiuxun.top/wx/app/minisnsapp/getartlistbyminisnsid',
          data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
            "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
            "fid": minisId, "hotshow":1, "categoryId": 0, "pageIndex":1},
          method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
          // header: {}, // 设置请求的 header
          success: function(res){
              var result = res.data;
              var articles = result.objArray; // 更新数据

              that.setData({articles:articles})
          },
          complete: function() {
            that.setData({loading:false});
          }
        })
    })
  },

  more_bankuai: function () {
    console.log ("获取更多版块");
  },
  // 加载数据
  ready: function () {
    this.setData({
      articles:index.articles.slice(0,10),
      typeList:index.typeList
    })
  },
  /**
   * 下拉刷新
   */
  nextPage: function(e) {
    console.log ("开启下拉加载");
    var that = this;
    wx.showNavigationBarLoading();
    that.setData({"loading":true});
    var minisId = that.data.minisns.Id;
    var unionid = that.data.user.unionid;
    var verifyModel = util.primaryLoginArgs(unionid);
    var pageIndex = that.data.pageIndex + 1;
    wx.request({
      url: 'https://xiuxun.top/wx/app/minisnsapp/getartlistbyminisnsid',
      data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
        "fid": minisId, "hotshow":1, "categoryId": that.data.currentTypeId, "pageIndex":pageIndex},
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      success: function(res){
          console.log("下拉刷新成功");
          var result = res.data;
          var articles = [];
          if (pageIndex <= 1) {
              articles = result.objArray; // 更新数据
          } else {
              articles = that.data.articles.concat(result.objArray);
          }
          that.setData({articles:articles,pageIndex:result.pageIndex});
          wx.hideNavigationBarLoading();
      },
      complete: function() {
        that.setData({"loading":false})
      }
    })
  },
/**
 * 版块跳转 
 */
  toBankuai: function (event) {
    var that = this;
    console.log("点击版块跳转", event);
    var typeId = event.currentTarget.dataset.typeid;
    var hot = event.currentTarget.dataset.hot;
    if (hot) {
      typeId = 0;
      hot = 1;
    } else {
      typeId= typeId;
      hot = 0;
    }
    that.setData({currentTypeId:typeId, hot:hot, articles:[], loading:true});
    // 获取articles
    var minisId = wx.getStorageSync('minisns').Id;
    var unionid = wx.getStorageSync('user').unionid;
    var verifyModel = util.primaryLoginArgs(unionid);
    wx.request({
      url: 'https://xiuxun.top/wx/app/minisnsapp/getartlistbyminisnsid',
      data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
        "fid": minisId, "hotshow":1, "categoryId": that.data.currentTypeId, "pageIndex":1},
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      success: function(res){
          var result = res.data;
          that.setData({articles:result.objArray, pageIndex:1});
      },
      complete: function() {
          that.setData({loading:false})
      }
    })
  },
  /**
   * 操作帖子
   */
  openArrow: function(e) {
    var that = this;
    let artId = e.currentTarget.dataset.artId;
    // 获取权限
    var minisId = that.data.minisns.Id;
    var unionid = that.data.user.unionid;
    var verifyModel = util.primaryLoginArgs(unionid);
    wx.request({
      url: 'https://xiuxun.top/wx/app/minisnsapp/checkpermissionbyuser',
      data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
              "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign, artId:artId},
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      success: function(res){
          let result = res.data;
          console.log("获取帖子权限", result);
          if (result.result == true) {
              let actionList = []
              if (result.obj.BlackOne) { // 举报
                  actionList.push("举报")
              }
              actionList.push("取消")
              wx.showActionSheet({
                  itemList: actionList,
                  success: function(res){
                      if (!res.cancel) {
                        let idx = res.tapIndex;
                        if (actionList[idx] == "举报") {
                            console.log("点击举报")
                        }
                      }
                  }
              })
          }
      }
    })
  },
  // 播放声音
  playAudio: function(event) {
    console.log ("播放声音");
    var voiceId = event.currentTarget.dataset.vId;
    var storageVoice =  wx.getStorageSync('playingVoice');
    var audioContext = wx.createAudioContext(voiceId+"");
    // 获取正在播放的内容
    if (typeof storageVoice == "undefined" || storageVoice == "" || storageVoice == null) {
        // 当前未播放
        audioContext.play();
        storageVoice = new Object();
        storageVoice.id=voiceId;
        storageVoice.status=2;
      } else if(storageVoice.id == voiceId) {
        // 暂定状态
        if (storageVoice.status == 1) {
          audioContext.play();
          storageVoice.status=2;
        } else
        // 播放状态 - 转为暂停
        if (storageVoice.status == 2) {
            audioContext.pause();
            storageVoice.status=1;
        }
      } else {
        // 停止当前的，播放另一个
        var usingAudioContext = wx.createAudioContext(storageVoice.id+"")
        usingAudioContext.seek(0);
        usingAudioContext.pause();
        storageVoice = new Object();
        storageVoice.id = voiceId;
        storageVoice.status = 2;
        audioContext.play();
      }
      wx.setStorageSync('playingVoice', storageVoice);

  },
  /**
   * 更多版块
   */
  moreType: function(event) {
    var that = this;
    var categories = that.data.categories //wx.getStorageSync('categories');
    if (typeof categories == "undefined") {
      return ;
    }
    var typeIds = [];
    var typeNames = [];
    for (var i = 0; i < categories.length; i++) {
      typeIds[i] = categories[i].Id;
      typeNames[i] = categories[i].Title;
    }
    wx.showActionSheet({
        itemList:typeNames,
        success:function(res){
          if (res.cancel) { console.log("取消");
          } else {
            // 获取新的内容
            var idx = res.tapIndex;
            var typeId = typeIds[idx];
            that.typeChange(typeId);
          }
        }
    })
  },
  typeChange: function(typeId) {
      var that = this;
      var tmp = wx.getStorageSync('categories');
      var typeList = tmp;
      for (var i=0 ; i<typeList.length ; i++) {
          if (typeList[i].Id == typeId) {
            var tmpType={ Id:typeId, Title:typeList[i].Title }
            typeList.splice(i,1);
            typeList.splice(0, 0, tmpType);
          }
      }
      // 获取新的数据
      var minisId = wx.getStorageSync('minisns').Id;
      var unionid = wx.getStorageSync('user').unionid;
      var verifyModel = util.primaryLoginArgs(unionid);
      wx.request({
        url: 'https://xiuxun.top/wx/app/minisnsapp/getartlistbyminisnsid',
        data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
        "fid": minisId, "hotshow":1, "categoryId": typeId, "pageIndex":1},
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        // header: {}, // 设置请求的 header
        success: function(res){
            var result = res.data;
            that.setData({articles:result.objArray})
            that.setData({ currentTypeId : typeId, categories:typeList, scrollLeft:-900, pageIndex:1 })
        }
      })
  },
  /**
   * 展示头部信息
   */
  showHeadInfo: function() {
    var that = this;
    app.getInit(function(result){
        var minisId = result.obj._Minisns.Id;
        var unionid = result.obj._LookUser.unionid;
        var verifyModel = util.primaryLoginArgs(unionid);
        wx.request({
          url: 'https://xiuxun.top/wx/app/minisnsapp/getminisnsheadinfo',
          data: {"deviceType": verifyModel.deviceType, "uid": verifyModel.uid, "versionCode":verifyModel.versionCode,
                 "timestamp": verifyModel.timestamp, "sign":verifyModel.sign, "id":minisId },
          method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
          // header: {}, // 设置请求的 header
          success: function(res){
              var result = res.data;
              that.setData({
                  headInfo:{"backMap":result.obj.BackMap, "logoUrl":result.obj.LogoUrl, "articleCount":result.obj.ArticleCount,
                      "clickCount":result.obj.ClickCount, "isSign":result.obj.IsSign, "isConcern":result.obj.IsConcern },
                  categories:result.obj.Categories
              });
              wx.setStorageSync('categories', result.obj.Categories);
          }
        })
    })
  },

  toArticleDetail: function(event) {
    var articleId = event.currentTarget.dataset.articleId;
    wx.navigateTo({
      url: '/pages/articledetail/articledetail?id=' + articleId,
    })
  }, 
  showBigImg: function(e) { // 展示大图
    var src = e.currentTarget.dataset.src;
    wx.previewImage({
       current: src, // 当前显示图片的链接，不填则默认为 urls 的第一张
       urls: [src],
    })
    return false;
  },
  // 签到
  sign: function() {

  },
  // 关注
  concern: function() {
    
  },
  /**
   * 对帖子点赞
   */
  praise:function(e){
      var that = this;
      var minisId = wx.getStorageSync('minisns').Id;
      var unionid = wx.getStorageSync('user').unionid;
      var verifyModel = util.primaryLoginArgs(unionid);
      var id = e.currentTarget.dataset.id; // 帖子ID
      var verifyModel = util.primaryLoginArgs(unionid);
      wx.request({
        url: 'https://xiuxun.top/wx/app/minisnsapp/articlepraise',
        data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode,"sign":verifyModel.sign, "artId":id},
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        // header: {}, // 设置请求的 header
        success: function(res){
            var tmp = that.data.articles;
            var result = res.data;
            console.log("点赞成功", result)
            // 修改状态
            if(result.result==true) {
                for(var i=0; i < tmp.length; i++) {
                  if (tmp[i].Id==id) {
                    tmp[i].IsPraise=true;
                    tmp[i].Praise = tmp[i].Praise + 1; 
                  }
                }
                that.setData({articles:tmp})
            } else {
                wx.showModal({title:"提示",content:result.msg, showCancel:false, confirmText:"取消"})
            }
        }
      })
  },
  /**
   * 评论帖子
   */
  showReComment:function(e){
      var that = this;
      var id = e.currentTarget.dataset.id;
      var existId = that.data.showRecommend.id;
      var emoij = that.data.emoij;
      var commentText = that.data.commentText;
      var selectedImgs = that.data.selectedImgs;
      var existCommontid = that.data.showRecommend.commontId;
      if (existId == id && existCommontid == null){ // 关闭
        id = "";
      }
      if (existId != id) { // 打开新的
        emoij = {id:""},
        commentText = "";
        selectedImgs = [];
      } 
      // var tmp = that.data.articles;
      that.setData({
        showRecommend:{id:id, toUserId:null, commontId:null, toUserName:null}, 
        emoij:emoij, 
        commentText:commentText, 
        selectedImgs:selectedImgs
      })
  },
  /**
   * 回复用户评论
   */
commentUser:function(e){
    var that = this;
    var artId = e.currentTarget.dataset.artid;
    var uid = e.currentTarget.dataset.uid;
    var name = e.currentTarget.dataset.name;
    var id = e.currentTarget.dataset.id;

    var emoij = that.data.emoij;
    var commentText = that.data.commentText;
    var selectedImgs = that.data.selectedImgs;
    
    var existId = that.data.showRecommend.id;
    var existCommontid = that.data.showRecommend.commontId;
    if (artId == existId && existCommontid == id) { 
        // 关闭当前评论
        artId = "";
    }
    if (existId != artId || existCommontid != id) {
        // 清空数据 ,打开新的
        emoij = {id:""};
        commentText = "";
        selectedImgs = [];
    }
    that.setData({
        showRecommend:{id:artId,toUserId:uid,commontId:id,toUserName:name},
        emoij:emoij,
        commentText:commentText,
        selectedImgs:selectedImgs,
    })
},

  /**
   * 转发
   */
  zhuan:function(){

  },
  /**
   * 赏
   */
  reward:function(){
    wx.request({
      url: 'https://xiuxun.top/wx/eee/',
      data: {},
      method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      success: function(res){
        console.log("测试.top")
      },
      fail: function() {
        // fail
      },
      complete: function() {
        // complete
      }
    })
  },
  /**
   * 选择Emoij
   */
  selectEmoij:function(e){

      var id = e.currentTarget.dataset.id;
      var eid = this.data.emoij.id;
      if (eid == id) {
        id="";
      }
      this.setData({emoij:{id:id}})
  },
  /**
   * 保存评论的内容
   */
  saveTextValue:function(e) {
      var content = e.detail.value;
      this.setData({commentText:content});
  },
  /**
   * 保存选择的表情
   */
  emoijSelected:function(e){
      var code = e.currentTarget.dataset.code;
      var tmp = this.data.commentText;
      tmp = tmp + code;
      this.setData({commentText:tmp});
  },

  /**
   * 选择图片
   */
  selectImg: function(e) {
      var that = this;
      var id = e.currentTarget.dataset.id;
      var minisId = wx.getStorageSync('minisns').Id;
      var unionid = wx.getStorageSync('user').unionid;
      var verifyModel = util.primaryLoginArgs(unionid);
      wx.chooseImage({
        count: 9, // 最多可以选择的图片张数，默认9
        sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
        sourceType: ['album', 'camera'], // album 从相册选图，camera 使用相机，默认二者都有
        success: function(res){
          var tmp = res.tempFilePaths;

          for(var i=0; i<tmp.length; i++) {
                // 上传图片s
              wx.uploadFile({
                url: 'http://apptest.vzan.com/minisnsapp/uploadfilebytype',
                filePath:tmp[i],
                name:'file',
                // header: {}, // 设置请求的 header
                formData: {"fid":minisId, "uploadType":"img", "deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
                           "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign}, // HTTP 请求中其他额外的 form data
                success: function(res){
                    var result = JSON.parse(res.data);
                    console.log("上传图片成功", result);
                    // 刷新页面
                    var rtmp = that.data.selectedImgs;
                    rtmp = rtmp.concat({id:result.obj.id,src:result.obj.url});
                    that.setData({selectedImgs:rtmp});
                }
              })
          }
        }
      })
  },
    // 删除图片
  removeImg: function(event){
    var that = this;
    var id = event.currentTarget.dataset.id;
    var imgs = that.data.selectedImgs;
    for (var i=0; i<imgs.length; i++) {
      if(imgs[i].id == id) {
        imgs.splice(i,1)
        break;
      }
    }
    that.setData({selectedImgs:imgs})
  },
  /**
   * 取消评论
   */
  commentCancle:function(e) {
    console.log("取消评论")
    this.setData({
        showRecommend:{ id:"",toUserId:null,commontId:null,toUserName:null },
        emoij:{ id:"" }, commentText:"", selectedImgs:[] 
    })
  },
  /**
   * 提交帖子评论 | 回复
   */
  commentSubmit:function(e){
      var that = this;
      var id = e.currentTarget.dataset.id;
      var showRecommend = that.data.showRecommend;
      if (showRecommend.commontId) { // 回复用户
          that.replyComment(id);
      } else {
          that.replyPost(id); // 回复帖子
      }
      // 清空评论数据
      that.setData({
        showRecommend:{ id:"",toUserId:null,commontId:null,toUserName:null },
        emoij:{ id:"" }, commentText:"", selectedImgs:[] 
      })
      console.log("提交评论 -- END");
  },

/**
 * 评论帖子
 */
replyPost: function(id) {
      var that = this;
      var minisId = wx.getStorageSync('minisns').Id;
      var unionid = wx.getStorageSync('user').unionid;
      var verifyModel = util.primaryLoginArgs(unionid);
      var imgs = "";
      for (var i=0; i < that.data.selectedImgs.length; i++) {
        if (i=0) { imgs = that.data.selectedImgs[i].id;} 
        else { imgs = imgs + "," + that.data.selectedImgs[i].id; }
      }
      var content = this.data.commentText;
      wx.request({
        url: 'https://xiuxun.top/wx/app/minisnsapp/commentartbyid',
        data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode,"sign":verifyModel.sign,
        "artId":id,"comment":content,"images":imgs},
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        // header: {}, // 设置请求的 header
        success: function(res){
            var result = res.data;
            if (result.result == true) { // 发帖成功
                // 获取评论列表
                //  that.reload();
                wx.request({
                  url: "https://xiuxun.top/wx/app/minisnsapp/getcmt-"+id,
                  data: {fid:minisId,pageIndex:1},
                  method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
                  // header: {}, // 设置请求的 header
                  success: function(res){
                      var arts = that.data.articles;
                      for (var i=0; i<arts.length;i++) {
                          var tmp = arts[i];
                          if (tmp.Id==id) {
                            tmp.articleComments = that.generateComments(res.data.CommentList);
                            arts[i] = tmp;
                            // 更新数据
                            that.setData({articles:arts})
                            break;
                          }
                      }
                  }
                })              
            }
        }
      })
  },

/**
 * 回复评论
 */
  replyComment:function(id) {
      var that = this;
      var minisId = that.data.minisns.Id;
      var unionid = that.data.user.unionid;
      var verifyModel = util.primaryLoginArgs(unionid);
      var imgs = "";
      for (var i=0; i < that.data.selectedImgs.length; i++) {
        if (i=0) {
          imgs = that.data.selectedImgs[i].id;
        } else {
          imgs = imgs + "," + that.data.selectedImgs[i].id;
        }
      }
      var content = that.data.commentText;
      var showRecommend = that.data.showRecommend;
      wx.request({
        url: 'https://xiuxun.top/wx/app/minisnsapp/replyartcommentbyid',
        data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
        "artId":id, "toUserId":showRecommend.toUserId, "commontId":showRecommend.commontId, "comment":content, "images":imgs},
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        // header: {}, // 设置请求的 header
        success: function(res){
            var result = res.data;
            if (result.result == true) { // 发帖成功
                // that.reload();
              //  获取评论列表
                wx.request({
                  url: "https://xiuxun.top/wx/app/minisnsapp/getcmt-"+id,
                  data: {fid:minisId,pageIndex:1},
                  method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
                  // header: {}, // 设置请求的 header
                  success: function(res){
                      var arts = that.data.articles;
                      for (var i=0; i<arts.length;i++) {
                          var tmp = arts[i];
                          if (tmp.Id==id) {
                            tmp.articleComments = that.generateComments(res.data.CommentList);
                            arts[i] = tmp;
                            // 更新数据
                            that.setData({articles:arts})
                            break;
                          }
                      }
                  }
                })              
            }
        }
      })
  },
  /**
   * 获取论坛帖子列表
   */
  getartlistbyminisnsid: function(hotshow, categoryId, pageIndex) {
      var that = this;
      app.getInit(function(result){
        var tmpFile = result.obj.tmpFile;
        var minisId = result.obj._Minisns.Id;
        var unionid = result.obj._LookUser.unionid;
        var verifyModel = util.primaryLoginArgs(unionid);
        wx.request({
          url: 'https://xiuxun.top/wx/app/minisnsapp/getartlistbyminisnsid',
          data: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
            "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
            "fid": minisId, "hotshow":hotshow, "categoryId": categoryId, "pageIndex":pageIndex},
          method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
          // header: {}, // 设置请求的 header
          success: function(res){
              var result = res.data;
              var articles = [];
              if (pageIndex <= 1) {
                  articles = result.objArray; // 更新数据
              } else {
                  articles = result.articles.concat(result.objArray);
              }
              that.setData({articles:articles})
          }
        })
      })
  },

  /**
   * 整合评论信息
   */
  generateComments: function(commentList) {
      var comment = {};
      console.log("获取帖子评论列表", commentList)
      for (var i=0; i<commentList.length; i++) {
        var tmp = commentList[i];
        // 回复者
        for(var j=0; j<tmp.Comments.length; j++) {
            var rTmp = tmp.Comments[j];
            rTmp.DUser = {"Id":tmp.User.Id,"Headimgurl":tmp.User.Headimgurl,"NickName":tmp.User.Nickname};
   	        rTmp.ComUser = rTmp.User;
            comment[rTmp.Id] = rTmp;
        }
        if (typeof comment[tmp.Id] == "undefined") {
             tmp.ComUser = tmp.User;          
             comment[tmp.Id] = tmp;             
        }
      }
      var list = [];
      for (var key in comment) {
        list.push(comment[key])
      }
      console.log("转换后的评论列表", list);
      return list.reverse();
  },
  /**
   * 更多评论信息
   */
  moreComment: function(e) {
      this.setData({currentMoreComment:e.currentTarget.dataset.id})
  },

  /**
   * 刷新页面
   */
  reload: function(e) {
      var that = this;
      var tmpFile = that.data.tmpFile;
      var minisId = that.data.minisns.Id;
      var unionid = that.data.user.unionid;
      var verifyModel = util.primaryLoginArgs(unionid);
      var pageIndex = that.data.pageIndex;
      var categoryId = that.data.currentTypeId;
      var articles = [];
      that.getArticles(1);

      // for (var i=1; i<=pageIndex; i++) {
      //     wx.uploadFile({
      //       url: 'http://apptest.vzan.com/minisnsapp/getartlistbyminisnsid',
      //       filePath: tmpFile,
      //       name:'file',
      //       // header: {}, // 设置请求的 header
      //       formData: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
      //       "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
      //       "fid": minisId, "hotshow":1, "categoryId": categoryId, "pageIndex":i}, // HTTP 请求中其他额外的 form data
      //       success: function(res){
      //           var result = JSON.parse(res.data);
      //           if (pageIndex <= 1) {
      //               articles = result.objArray; // 更新数据
      //           } else {
      //               articles = articles.concat(result.objArray);
      //           }
      //           if(pageIndex == result.pageIndex) {
      //               that.setData({articles:articles,pageIndex:result.pageIndex});
      //           }
      //       }
      //     })
          
      // }
  },
  /**
   * 递归获取数据
   */
  getArticles:function(n){
      var that = this;
      var tmpFile = that.data.tmpFile;
      var minisId = that.data.minisns.Id;
      var unionid = that.data.user.unionid;
      var pageIndex = that.data.pageIndex;
      var categoryId = that.data.currentTypeId;
      var verifyModel = util.primaryLoginArgs(unionid);
      wx.uploadFile({
        url: 'http://apptest.vzan.com/minisnsapp/getartlistbyminisnsid',
        filePath: tmpFile,
        name:'file',
        // header: {}, // 设置请求的 header
        formData: {"deviceType":verifyModel.deviceType, "timestamp":verifyModel.timestamp, 
        "uid": unionid, "versionCode":verifyModel.versionCode, "sign":verifyModel.sign,
        "fid": minisId, "hotshow":1, "categoryId": categoryId, "pageIndex":n}, // HTTP 请求中其他额外的 form data
        success: function(res){
            var articles = [];
            var result = JSON.parse(res.data);
            if (n < pageIndex) {
                articles = articles.concat(that.getArticles(n+1));
            } else {
                articles = result.objArray; 
            }
            that.setData({articles:articles,pageIndex:result.pageIndex});
            return articles;
        },
        complete:function(){
          return [];
        }
      })

  }

})




