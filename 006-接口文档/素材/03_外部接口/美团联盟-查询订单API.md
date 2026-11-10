# 美团联盟-查询订单API

## 基础信息

API 名称：查询订单接口

API 描述：查询推广的订单明细及佣金信息，包括到店、到家、买菜等业务类型的订单。支持按付款时间或更新时间查询，查询近3个月的订单明细。支持POST方法查询接口。只接受JSON格式。

API 地址：https://media.meituan.com/cps_open/common/api/v1/query_order POST

## 接口参数

### 入参

| 参数名称 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| -公共签名请求头 | - | 必填 | 公共请求签名参数 |
| S-Ca-App | String | 必填 | 分配的AppKey |
| S-Ca-Signature | String | 必填 | 签名字符串 |
| S-Ca-Timestamp | String | 必填 | API 调用者传递时间戳，值为当前时间的毫秒数，也就是从1970年1月1日起至今的时间转换为毫秒，时间戳有效时间为2分钟 |
| Content-MD5 | String | 必填 | Body MD5，有请求体接口必传 |
| S-Ca-Signature-Headers | String | 必填 | 将需要签名的header，使用英文逗号分割放到 Request 的 Header 中，其中必须包括S-Ca-Timestamp，建议将S-Ca-App也添加进去，例如【S-Ca-Timestamp,S-Ca-App】 |
| -接口请求body | - | 必填 | 接口请求body内容，JSON结构 |
| platform | Integer | 非必填 | 商品所属业务一级分类类型：1 到家及其他业务类型，2 到店业务类型（包含到店美食、休闲生活、酒店、门票）；不填则默认1 |
| businessLine | List<Integer> | 非必填 | 业务线标识；1）当platform为1，选择到家及其他业务类型时，业务线枚举为1：外卖订单 WAIMAI （别名：外卖红包）2：闪购红包 3：酒旅 4：美团电商订单（团好货） 5：医药 6：拼好饭 7：商品超值券包 COUPON 8：买菜 MAICAI 9：美团私域 11：闪购商品 12：省钱包；不传则默认传空表示非售卖券包、省钱包订单类型的全部查询。若输入参数含7 商品超值券包，则只返回商品超值券包订单，查询省钱包仅传省钱包参数值；2）当platform为2，选择到店业务类型 时，业务线枚举1：到餐 2：到综 3：酒店 4：门票 5：民宿 6：度假 15：到店红包 1301： 大交通火车票 1302： 大交通飞机票，不填则默认传1, 999：新客CPA(到家和到店都包含) |
| categoryIds | List<Long> | 非必填 | 订单品类；1）当platform为1，当businessLine为11时，枚举值支持：大型连锁商超便利店(12)，小型商超便利店(14)，线上便利店(21)，日百服饰(128)，数码家电(106)，美妆日化(107)，母婴玩具(108)，宠物(110)，生鲜食材(24)，鲜花(16)，水果(15)，酒饮(26)，休闲食品(25)，旗舰店(137)，其他(-2)；2）当platform为1，当businessLine为9时，枚举值支持：进群(1)，下单(2)，首关注(3)；3）当platform为2，当businessLine为3时，枚举值支持：酒店(209)，非标住宿(2327)；4）当platform为2，当businessLine为2时，枚举值支持：休闲娱乐(3)，结婚(338)，教育培训(289)，养车/用车(390)，运动健身(206)，家居(600)，购物(379)，亲子(389)，医疗健康(450)，生活服务(4)，K歌(1853)，宠物(1861)，其他(-1) 4）当businessLine为999时，枚举值支持 到餐-纯新用户(1001),到餐-召回用户(1002),到综-纯新用户(1003),到综-召回用户(1004),闪购-纯新用户(1005),闪购-召回用户(1006),外卖-纯新用户(1007),外卖-沉默用户(1008),外卖-预警用户(1009),外卖-流失用户(1010) |
| actId | Long | 非必填 | 活动物料id，我要推广-活动推广中第一列的id信息，不传则返回所有actId的数据，省钱包订单不传 |
| sid | String | 非必填 | 二级推广位id，最长64位，不传则返回所有sid的数据 |
| orderId | String | 非必填 | 订单id，入参后可与业务线标识businessLine配合使用，输入的orderId需要与businessLine能对应上。举例：如查询商品超值券包订单时orderId传券包订单号，businessLine传7；除此以外其他查询筛选条件不生效，不传业务线标识businessLine则默认仅查非券包订单 |
| startTime | Integer | 非必填 | 查询时间类型对应的查询开始时间，10位时间戳表示，单位秒 |
| endTime | Integer | 非必填 | 查询时间类型对应的查询结束时间，10位时间戳表示，单位秒 |
| page | Integer | 非必填 | 页码，默认1，从1开始,若searchType选择2，本字段必须传1，若不传参数默认1 |
| limit | Integer | 非必填 | 每页限制条数，默认100，最大支持100 |
| queryTimeType | Integer | 非必填 | 查询时间类型，枚举值， 1 按订单支付时间查询， 2 按照更新时间查询， 默认为1 |
| tradeType | Integer | 非必填 | 交易类型，1表示CPS，2表示CPA |
| scrollId | String | 非必填 | 分页id，当searchType选择2逐页查询时，本字段为必填。若不填写，默认查询首页。取值为上一页查询时出参的scrollId字段 |
| searchType | Integer | 非必填 | 订单分页查询方案选择，不填则默认为1。1 分页查询（最多能查询到1万条订单），当选择本查询方案，page参数不能为空。此查询方式后续不再维护，建议使用2逐页查询。2 逐页查询（不限制查询订单数，只能逐页查询，不能指定页数），当选择本查询方案，需配合scrollId参数使用，省钱包查询仅支持2 |
| cityNames | List<String> | 非必填 | 可输入城市名称圈定特定城市的订单，单次最多查询10个城市（英文逗号分隔）。不传则默认全部城市订单。 注：如需确认城市具体名称，可参考后台订单明细页的城市筛选项，或参考具体活动的城市命名。目前支持到家业务类型-商品超值券包业务线；到店业务类型-到餐、到综、酒店、门票、民宿、度假业务线。 |

### 出参

| 参数名称 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| code | int | 必填 | 响应码，0成功，其他值为失败 |
| message | String | 必填 | 响应文案 |
| -data | - | 非必填 | 响应结果信息 |
| actId | Long | 非必填 | 活动物料id，我要推广-活动推广中第一列的id信息 |
| skuCount | Integer | 必填 | 查询返回本页的数量合计（无实际使用场景，若查询订单购买商品数可以看返回的dataList中skuCount） |
| scrollId | String | 必填 | 分页id，当searchType选择2逐页查询时，出参会返回本字段。用于下一页查询的scrollId字段入参使用 |
| -dataList | - | 非必填 | 数据列表 |
| businessLine | Integer | 必填 | 业务线，同入参枚举说明 |
| orderId | String | 必填 | 订单ID |
| payTime | Integer | 必填 | 订单支付时间 |
| payPrice | String | 非必填 | 订单支付价格。针对到餐、到综、酒店、闪购、医药业务类型，为父订单的支付价格，单位元 |
| updateTime | Integer | 必填 | 订单最近一次的更新时间。到家外卖商品券、到家医药、到家闪购商品业务、到店到餐、到综、酒店类型，订单时间为用户买券包的更新时间，非每张券的更新时间。针对以上业务类型，建议查询单张券的更新时间 |
| commissionRate | String | 必填 | 订单预估佣金比例，300表示3% |
| profit | String | 必填 | cps类型的预估佣金收入，单位元，1.60表示1.6元 |
| cpaProfit | String | 必填 | cpa类型的预估佣金收入，单位元，6.50表示6.5元 |
| sid | String | 非必填 | 二级媒体身份标识，用于渠道效果追踪 |
| productId | String | 非必填 | 产品ID，对应商品查询接口的skuViewId，目前只支持到家外卖商品券、到家医药、到家闪购商品业务、到店业务类型 |
| productViewSign | String | 非必填 | 商品ID，对应商品查询接口的productViewSign，目前只支持到家外卖商品券、到家医药、到家闪购商品业务、到店业务类型 |
| productName | String | 非必填 | 产品名称，外卖实物订单展示订单内商品名称（取订单内前 5 个商品，超出不展示），外卖商品券和到店订单展示商品名称 |
| specificationName | String | 非必填 | 规格信息，同一个商品名称下可以包括不同的规格，对应不同的价格和佣金 |
| -orderDetail | - | 非必填 | 订单详情，只支持到家外卖商品券、到家医药、到家闪购商品业务、到店到餐、到综、酒店类型返回数据 |
| couponStatus | String | 非必填 | 本期只有到到家外卖商品券、到家医药、到家闪购商品业务、到店到餐、到综、酒店业务类型展示订单明细，表示商品券/子订单推广计佣状态，1、付款，2、完成（或券已核销），3、结算，4、失效（含取消或风控的情况） |
| itemOrderId | String | 非必填 | 针对到店到餐、到综、酒店商品券，返回商品券的子订单号。其他业务类型不返回 |
| finishTime | String | 非必填 | 1、针对到家外卖商品券，返回商品券核销完成履约的实物菜品订单号对应的完成时间；2、针对到家医药&闪购商品，返回商品订单完成时间；3、针对到店到餐、到综、酒店子订单，返回子订单对应的券核销时间 |
| basicAmount | String | 非必填 | 商品的计佣金额，每个商品对应的支付分摊金额，单位元 |
| couponFee | String | 非必填 | 商品的佣金，当推广状态为失效、取消、风控时，佣金值为0，单位元 |
| orderViewId | String | 非必填 | 只对到家外卖商品券有效。商品券的核销完成履约的实物菜品订单号 |
| refundAmount | String | 非必填 | 到店到餐、到综、酒店子订单、到家闪购商品、到家医药业务类型的退款金额，到家其他业务类型不返回数据，单位元 |
| refundFee | String | 非必填 | 到店到餐、到综、酒店子订单、到家闪购商品、到家医药业务类型的退款佣金，到家其他业务类型不返回数据，单位元 |
| refundTime | String | 非必填 | 到店到餐、到综、酒店子订单、到家闪购商品、到家医药业务类型的退款时间，到家其他业务类型不返回数据 |
| settleTime | String | 非必填 | 到家商品券/到家闪购商品/到店到餐/到综/酒店子订单的结算时间，完成并且进入结算账期时则变为结算状态。若存在多次结算记录则取最新结算时间 |
| updateTime | String | 非必填 | 到家商品券/到家闪购商品/到家医药/到店到餐、到综、酒店子订单的更新时间 |
| incentiveOrder | Boolean | 非必填 | 是否为激励订单，true表示该订单参与了激励活动，false表示未参与 |
| incentiveIds | List | 非必填 | 激励活动ID列表，订单关联的激励活动ID |
| refundPrice | String | 非必填 | 只对非到店到餐、非到综、非酒店业务类型有效。订单维度退款价格，该笔订单用户发生退款行为时的退款计佣金额之和，超值券包订单本期不返回退款数据，单位元 |
| refundTime | String | 非必填 | 只对非到店到餐、非到综、非酒店业务类型有效。订单维度最新一次发生退款的时间；超值券包订单本期不返回退款数据，单位元 |
| refundProfit | String | 非必填 | 只对非到店到餐、非到综、非酒店业务类型有效。订单维度退款预估佣金，该笔订单用户发生退款行为时的退款预估佣金金额之和；超值券包订单本期不返回退款数据，单位元 |
| cpaRefundProfit | String | 非必填 | cpa退款预估佣金，单位元 |
| status | String | 非必填 | 表示订单维度状态，枚举有 2：付款（如果是CPA订单则表示奖励已创建） 3：完成 4：取消 5：风控 6：结算。 针对到家商品券订单、到家闪购订单、到家医药订单、到店到餐、到综、酒店业务类型订单则为父订单相关状态，枚举有2：付款，父订单仅付款，至少有任意一个子订单未核销； 3：完成，父订单中所有子订单都核销完成； 4：取消，父订单中的子订单全部退款或过期未使用； 5：风控，父订单中的子订单全部变成风控状态； 6：结算，父订单中所有子订单都结算完成。（CPA订单只有到家闪购订单、到家医药订单、到店到餐、到综业务类型有本状态） 说明： 1、若到店到餐、到综、酒店业务类型父订单、到家闪购商品父订单、到家医药父订单，含有多个状态混合的子订单，则随机取子订单状态作为父订单状态，建议以orderDetail中每张券状态为准 2、含多个商品或券包的订单不建议使用该字段，实际计佣状态以orderDetail中每张券的计佣状态为准。 |
| tradeType | Integer | 非必填 | 交易类型，1：cps，2：cpa |
| actId | Long | 非必填 | 活动物料id，我要推广-活动推广中第一列的id信息 |
| appkey | String | 非必填 | 归因到的appKey，对应取链时入参的appkey |
| skuCount | Integer | 非必填 | 表示sku数量，团好货和券包类型的CPS订单返回有值，其余类型订单不返回该值 |
| cityName | String | 非必填 | 订单所属的城市，目前支持三级城市粒度。目前支持到家业务类型-商品超值券包业务线；到店业务类型-到餐、到综、酒店、门票、民宿、度假业务线。 |
| categoryId | Long | 非必填 | 订单品类id。 |
| categoryName | String | 非必填 | 订单品类名称。 |
| incentiveOrder | Boolean | 非必填 | 是否为激励订单，true表示该订单参与了激励活动，false表示未参与 |
| incentiveIds | List | 非必填 | 激励活动ID列表，订单关联的激励活动ID |

### 请求示例

```javascript
{
  "limit": 20,
  "queryTimeType": 1,
  "page": 1
}
```

### 返回示例

```javascript
{
  "code": 0,
  "message": "成功",
  "data": {
    "actId": null,
    "skuCount": 6,
    "scrollId": "cebbef8776874b248a182d966b42532c",
    "dataList": [{
      "businessLine": 1,
      "orderId": "800611112553920000",
      "payTime": 1688875000,
      "payPrice": "100.00",
      "updateTime": 1688956422,
      "commissionRate": "300",
      "profit": "3.00",
      "cpaProfit": "0",
      "sid": null,
      "productId": "null",
      "productName": "江渔子捞汁小海鲜（XXX店）",
      "orderDetail": null,
      "refundPrice": null,
      "refundTime": "null",
      "refundProfit": "null",
      "cpaRefundProfit": "0",
      "status": "6",
      "tradeType": 1,
      "appkey": "xxxxxxxx",
      "skuCount": 1
    }, {
      "businessLine": 1,
      "orderId": "800611111003350000",
      "payTime": 1688734000,
      "payPrice": "50.00",
      "updateTime": 1688783416,
      "commissionRate": "300",
      "profit": "1.50",
      "cpaProfit": "0",
      "sid": null,
      "productId": "null",
      "productName": "刘记盘锦小卷饼（XXX店）",
      "orderDetail": null,
      "refundPrice": null,
      "refundTime": "null",
      "refundProfit": "null",
      "cpaRefundProfit": "0",
      "status": "6",
      "tradeType": 1,
      "appkey": "xxxxxxxx",
      "skuCount": 1
    }]
  }
}
```

## 异常示例

```javascript
{
  "code": "400",
  "msg": "未授权"
}
```

## 公共错误码

> 原页面通过「公共错误码」按钮弹窗展示公共错误码表，该弹窗内容未包含在本次静态页面导出中。
