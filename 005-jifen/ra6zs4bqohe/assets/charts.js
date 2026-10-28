// 积分运营诊断报告 · 图表配置
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var warn = style.getPropertyValue('--warn').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var charts = [];
  function init(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var c = echarts.init(el, null, { renderer: 'svg' });
    charts.push(c);
    window.addEventListener('resize', function () { c.resize(); });
    return c;
  }

  var axisCommon = {
    axisLine: { lineStyle: { color: rule } },
    axisTick: { show: false },
    axisLabel: { color: muted, fontSize: 12 },
    splitLine: { lineStyle: { color: rule, type: 'dashed' } }
  };

  // ---- 图1 访问趋势 ----
  var c1 = init('chart-trend');
  if (c1) c1.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true },
    legend: { data: ['访问次数 PV', '活跃 UV', '新增 UV'], bottom: 0, textStyle: { color: muted, fontSize: 12 } },
    grid: { left: 52, right: 52, top: 24, bottom: 44 },
    xAxis: Object.assign({ type: 'category', data: ['10-23', '10-24', '10-25', '10-26', '10-27'] }, axisCommon, { splitLine: { show: false } }),
    yAxis: [
      Object.assign({ type: 'value', name: 'PV', nameTextStyle: { color: muted, fontSize: 11 } }, axisCommon),
      Object.assign({ type: 'value', name: 'UV', nameTextStyle: { color: muted, fontSize: 11 } }, axisCommon)
    ],
    series: [
      { name: '访问次数 PV', type: 'line', smooth: true, data: [2177, 3750, 5191, 6249, 7215],
        lineStyle: { width: 2.5, color: accent }, itemStyle: { color: accent }, symbolSize: 6,
        areaStyle: { color: accent, opacity: 0.1 } },
      { name: '活跃 UV', type: 'line', yAxisIndex: 1, smooth: true, data: [1606, 1872, 1908, 1554, 1551],
        lineStyle: { width: 2.5, color: accent2 }, itemStyle: { color: accent2 }, symbolSize: 6 },
      { name: '新增 UV', type: 'line', yAxisIndex: 1, smooth: true, data: [1594, 1573, 1441, 1058, 966],
        lineStyle: { width: 2, color: warn, type: 'dashed' }, itemStyle: { color: warn }, symbolSize: 5 }
    ]
  });

  // ---- 图2 批次留存衰减 ----
  var c2r = init('chart-retain');
  if (c2r) c2r.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: function (p) {
        var d = p[0];
        return d.name + ' 批次<br/>次日留存 ' + (d.value == null ? '数据未出' : d.value + '%');
      }
    },
    grid: { left: 56, right: 34, top: 34, bottom: 38 },
    xAxis: Object.assign({ type: 'category', data: ['10-23', '10-24', '10-25', '10-26', '10-27'] }, axisCommon, { splitLine: { show: false }, axisLabel: { color: muted, fontSize: 12 } }),
    yAxis: Object.assign({ type: 'value', max: 22, axisLabel: { color: muted, fontSize: 12, formatter: '{value}%' } }, axisCommon),
    series: [{
      type: 'bar',
      barWidth: '44%',
      data: [
        { value: 18.01, itemStyle: { color: accent } },
        { value: 12.46, itemStyle: { color: '#3FA877' } },
        { value: 7.56, itemStyle: { color: warn } },
        { value: 8.13, itemStyle: { color: warn } },
        { value: null, itemStyle: { color: rule } }
      ],
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', color: ink, fontSize: 12, fontFamily: 'GeistMono', formatter: function (p) { return p.value == null ? '未出' : p.value + '%'; } },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: accent2, type: 'dashed', width: 1.5 },
        label: { color: accent2, fontSize: 11.5, position: 'insideEndTop', formatter: '参考值 5%' },
        data: [{ yAxis: 5 }]
      }
    }]
  });

  // ---- 图3 人群收窄 ----
  var c2 = init('chart-narrow');
  if (c2) c2.setOption({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true, formatter: function (p) { return p[0].name + '<br/>约占 ' + p[0].value + ' 人'; } },
    grid: { left: 130, right: 60, top: 10, bottom: 10 },
    xAxis: Object.assign({ type: 'value', max: 6800 }, axisCommon),
    yAxis: Object.assign({
      type: 'category',
      data: ['iPhone 高端机', '广深', '广东', '24-39 岁女性', '女性', '全部访问用户'],
      axisLabel: { color: ink, fontSize: 12.5 }
    }, axisCommon, { splitLine: { show: false } }),
    series: [{
      type: 'bar',
      data: [155, 237, 401, 1644, 3757, 6421],
      barWidth: 20,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: function (p) {
          var arr = [warn, accent2, accent2, accent, accent, accent + '99'];
          return arr[p.dataIndex];
        }
      },
      label: { show: true, position: 'right', color: ink, fontSize: 12, fontFamily: 'GeistMono', formatter: '{c}' }
    }]
  });

  // ---- 图3 积分结构 ----
  var c3 = init('chart-points');
  if (c3) c3.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}<br/>{c} 分（{d}%）' },
    legend: { bottom: 0, textStyle: { color: muted, fontSize: 11.5 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      itemStyle: { borderColor: bg2, borderWidth: 2 },
      label: { color: ink, fontSize: 11.5, formatter: '{d}%' },
      labelLine: { lineStyle: { color: rule } },
      color: [accent, accent2, warn, '#3FA877', '#8CC7A8', muted, '#CBD9D0'],
      data: [
        { name: '新人首单 377,700', value: 377700 },
        { name: '订单到账 190,846', value: 190846 },
        { name: '红包领取 98,080', value: 98080 },
        { name: '夜宵 16,600', value: 16600 },
        { name: '下午茶 8,100', value: 8100 },
        { name: '签到 5,728', value: 5728 },
        { name: '订阅 340', value: 340 }
      ]
    }]
  });

  // ---- 图4 24 小时分布 ----
  var hours = [97, 103, 352, 91, 62, 55, 26, 30, 18, 9, 4, 4, 3, 2, 8, 12, 14, 33, 211, 348, 184, 92, 73, 61];
  var colorFor = function (i) {
    if (i <= 3) return warn;            // 0-3 点：空白高峰
    if (i >= 14 && i <= 16) return accent2; // 下午茶
    if (i >= 17 && i <= 19) return accent;  // 晚餐
    if (i >= 20 && i <= 23) return '#3FA877'; // 夜宵
    return muted;
  };
  var c4 = init('chart-hour');
  if (c4) c4.setOption({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true, formatter: function (p) { return p[0].name + ' 点<br/>订单 ' + p[0].value + ' 单'; } },
    grid: { left: 52, right: 24, top: 34, bottom: 46 },
    xAxis: Object.assign({ type: 'category', data: hours.map(function (_, i) { return i + '时'; }) }, axisCommon, { splitLine: { show: false }, axisLabel: { color: muted, fontSize: 11, interval: 0 } }),
    yAxis: Object.assign({ type: 'value', name: '订单数', nameTextStyle: { color: muted, fontSize: 11 } }, axisCommon),
    series: [{
      type: 'bar',
      data: hours.map(function (v, i) { return { value: v, itemStyle: { color: colorFor(i) } }; }),
      barWidth: '62%',
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: accent, type: 'dashed', width: 1 },
        label: { color: muted, fontSize: 11, formatter: function (p) { return p.name; } },
        data: []
      }
    }]
  });

  // ---- 图5 兑换漏斗 ----
  var c5 = init('chart-funnel');
  if (c5) c5.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true, formatter: '{b}<br/>{c} 人' },
    series: [{
      type: 'funnel',
      sort: 'none',
      left: '12%',
      width: '76%',
      top: 10,
      bottom: 10,
      minSize: '16%',
      gap: 3,
      label: { show: true, position: 'inside', color: '#fff', fontSize: 12, formatter: '{b}  {c}人' },
      itemStyle: { borderColor: bg2, borderWidth: 2 },
      color: [accent, '#3FA877', '#8CC7A8', warn],
      data: [
        { name: '领过红包', value: 5187 },
        { name: '下过单', value: 1298 },
        { name: '账上够 300 分', value: 1232 },
        { name: '实际兑换', value: 46 }
      ]
    }]
  });

  // ---- 图6 发放强度 ----
  var c6 = init('chart-tier');
  if (c6) c6.setOption({
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true, formatter: function (p) { return p[0].name + '<br/>可发放 ' + p[0].value.toLocaleString() + ' 分/天'; } },
    grid: { left: 70, right: 40, top: 24, bottom: 40 },
    xAxis: Object.assign({ type: 'category', data: ['当前实际', '保守 30%', '中性 50%', '激进 80%'] }, axisCommon, { splitLine: { show: false }, axisLabel: { color: ink, fontSize: 12 } }),
    yAxis: Object.assign({ type: 'value', name: '分/天', nameTextStyle: { color: muted, fontSize: 11 } }, axisCommon),
    series: [{
      type: 'bar',
      barWidth: '46%',
      data: [
        { value: 99628, itemStyle: { color: muted } },
        { value: 103560, itemStyle: { color: accent } },
        { value: 172600, itemStyle: { color: accent2 } },
        { value: 276160, itemStyle: { color: warn } }
      ],
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', color: ink, fontSize: 12, fontFamily: 'GeistMono', formatter: function (p) { return p.value.toLocaleString(); } }
    }]
  });
})();
