//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    categories: [],
    selectedCategoryCode: '', //当前选中的新闻类别，默认选中第一个
    newsListMap: {},
    hotNews: {
      title: '加载中...',
      source: '',
      date: '',
      firstImage: '/images/cloudy-bg.png'
    },
    swiperHeight: 0,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    this.setData({
      categories: app.globalData.categories,
      selectedCategoryCode: app.globalData.categories[0].code
    })

    this.setSwiperHeight();
    this.initNewsListMap();
    this.getNewsList();
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  /**
   * 初始化新闻类别和新闻列表的映射字典
   */
  initNewsListMap() {
    let newsList = [];
    let newsListMap = {};
    app.globalData.categories.forEach((category) => {
      newsListMap[category.code] = {
        newsList: [],
        hotNews: {
          title: '加载中...',
          source: '',
          date: '',
          firstImage: '/images/cloudy-bg.png'
        }
      };
    });
    this.setData({
      newsListMap: newsListMap
    });
  },

  /**
   * 由于swpier默认高度是150px,
   * 为了让swiper能够填充整个屏幕的高度，
   * 需要获取屏幕尺寸，动态计算swiper应该占用的高度(rpx)
   */
  setSwiperHeight() {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          // 89为新闻类别选项卡的高度
          swiperHeight: 750 / res.windowWidth * res.windowHeight - 89
        })
      },
    });
  },

  /**
   * 点击新闻类别选项卡时，切换新闻类别选项卡，
   * 并重新调用onTapCategory函数获取新选中类别的新闻列表数据
   */
  onTapCategory(event) {
    // console.log(event);
    let categoryCode = event.currentTarget.dataset['categoryCode'];
    this.setData({
      selectedCategoryCode: categoryCode
    });
    this.getNewsList();
  },

  /**
   * 下拉刷新，重新调用getNewsList函数加载当前类别的新闻列表信息，
   * 并需要传入回调函数，在网络请求完成后(无论成功/失败)停止下拉刷新
   */
  onPullDownRefresh() {
    this.getNewsList(() => wx.stopPullDownRefresh());
  },

  /**
   * @param: cb 回调函数, 
   * 若传入该函数参数，则会在网络获取数据完成后(无论成功/失败)执行,
   */
  getNewsList(cb) {
    console.log("getNewsList");
    wx.request({
      url: 'https://test-miniprogram.com/api/news/list',
      data: {
        type: this.data.selectedCategoryCode
      },
      success: (res) => {
        console.log(res.data.result);
        let newsList = [];
        // 构造用于显示的新闻列表
        res.data.result.forEach(news => {
          let date = new Date(news.date);
          newsList.push({
            id: news.id,
            title: news.title,
            date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
            source: news.source === '' ? '未知来源' : news.source,
            firstImage: news.firstImage ? news.firstImage : '/images/sunny-bg.png'
          });
        });
        let newsListMap = this.data.newsListMap;
        newsListMap[this.data.selectedCategoryCode] = {
          newsList: newsList.slice(1),
          hotNews: newsList[0]
        }
        this.setData({
          newsListMap: newsListMap
        });
      },
      error: (err) => {
        console.log(err);
      },
      complete: () => {
        cb && cb();
      }
    });
  },

  bindChange(event) {
    // console.log(event);
    // https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html 
    // Bug & Tip:
    // 如果在 bindchange 的事件回调函数中使用 setData 改变 current 值，则有可能导致 setData 被不停地调用，
    // 因而通常情况下请在改变 current 值前检测 source 字段来判断是否是由于用户触摸引起。
    //
    // 通过Tap点击新闻类别选项卡时已经setData并获取网络数据，
    // 此时event.detail.source === '', 不需要再次重复setData及获取网络数据
    if (event.detail.source === 'touch') {
      this.setData({
        selectedCategoryCode: event.detail.currentItemId
      });
      this.getNewsList();
    }

  },

  /**
   * 跳转到对应newsId的新闻详情页面
   */
  toNewsDetail(event) {
    let newsId = event.currentTarget.dataset.id;
    // console.log(newsId);
    wx.navigateTo({
      url: '/pages/details/details?newsId=' + newsId,
    });
  }
})