# 小程序监控 H5 接口文档

> 面向运营 / AI Agent 调用。内容依据 `app/Http/Controllers/MiniMonitorController.php` 与线上实测（2026-11-24）。
> 本接口无鉴权、无 CORS 头，仅限内部使用，请勿对外公开或写入公开文档。

## 1. 基础约定

| 项目 | 说明 |
| --- | --- |
| 生产地址 | `https://video.fenfentuan.com` |
| H5 页面 | `/mini-monitor/index.html` |
| 接口前缀 | `/api/mini_monitor` |
| 请求方法 | 路由为 `Route::any`，GET / POST 均可；**统一使用 GET + Query String** |
| 鉴权 | 无。`/api` 前缀为免 Token 路径，CSRF 也已全局关闭 |
| 跨域 | 未返回 CORS 响应头。同源 H5 页面与服务端脚本可直接调用；第三方网页 AJAX 会被浏览器拦截 |
| 时区 | `Asia/Shanghai`（`config/app.php` 中 `PRC`） |
| 数据频率 | 微信小程序数据为**日报级别**，通常每天更新一次，不要高频轮询 |

### 1.1 成功响应

HTTP `200`，**直接返回业务对象，没有 `code` / `message` 外层包装**：

```json
{ "data_date": "2026-11-21", "total": 37, "rows": [] }
```

### 1.2 失败响应

HTTP `4xx` / `5xx`，统一结构：

```json
{
  "error": {
    "code": "mini_monitor_error",
    "message": "range 仅支持 yesterday、7d、30d"
  }
}
```

| HTTP 状态码 | 含义 |
| --- | --- |
| `422` | 参数不合法，或业务前置条件不满足（如小程序未配置密钥、当前跳转模式不支持公众号配置）。`message` 为可直接阅读的中文原因 |
| `404` | 小程序不存在 / 不属于当前分组 / 不可跳转 |
| `500` | 服务端或微信上游异常，`message` 为通用文案，具体原因需查服务端日志 |

> 判断成功与否：HTTP 200 且响应体不含 `error` 字段。

### 1.3 参数容错

全局中间件会把**空字符串转成 `null`**，因此 `?type=`、`?cert=`、`?keyword=` 等同于不传。

---

## 2. 通用枚举与数据口径

### 2.1 分组（group_ids）

| group_id | 分组名 | 说明 |
| --- | --- | --- |
| 1 | 公众号-小程序 | 日常运营 / 公众号 |
| 3 | 企微-小程序 | 日常运营 / 企微 |
| 4 | 进粉 | 进粉模块 |

同一个 `mini_id` 可能属于多个分组；列表与计数按小程序去重。

### 2.2 业务维度参数

| 参数 | 可选值 | 中文别名（需 URL 编码） | 说明 |
| --- | --- | --- | --- |
| `module` | `operation` / `growth` | `日常运营` / `进粉` | 总览模块，默认 `operation` |
| `tab` | `all` / `subscription` / `qw` | `全部` / `公众号` / `企微` | 日常运营下的分类，默认 `all`；`module=growth` 时忽略 |
| `type` | `all` / `operation` / `growth` / `subscription` / `qw` | `全部` / `日常运营` / `进粉` / `公众号` / `企微` | 列表 / 详情 / 资产的分组类型，优先级高于 `module`+`tab` |

约定：

- `overview` 只接受 `module` + `tab`。
- `apps` / `detail` 传 `type` 时按 `type` 决定分组；不传 `type` 时退化为 `module` + `tab`（默认 `operation` + `all`，即公众号 + 企微）。
- `type=all` 时 `context.module` 返回 `"all"`。
- 非法枚举返回 `422`。

### 2.3 统计周期 `range`

| 值 | 名称 | 统计窗口 | 趋势窗口 |
| --- | --- | --- | --- |
| `yesterday`（默认） | 昨天 | 1 天 | 7 天 |
| `7d` | 近7天 | 7 天 | 7 天 |
| `30d` | 近30天 | 30 天 | 30 天 |

- 统计窗口的**结束日不是系统当天，而是 `data_date`**。
- `overview.trend` 与 `overview.report` 固定返回 7 天，`range=30d` 时返回 30 天；`range=yesterday` 也返回 7 天趋势。
- `detail.history` 返回的长度 = 统计窗口天数（1 / 7 / 30）。

### 2.4 数据日期 `data_date`（重要）

所有接口都返回顶层 `data_date`，它同时是"昨天"口径的锚点日：

1. 若服务端**昨天**在 `d_mini_data` 中已有当前分组任意一个小程序的数据，`data_date` = 服务端昨天；
2. 否则回退为当前分组**最近一次有数据的日期**；
3. 完全没有数据时为 `null`。

因此 `range=yesterday` 表示"最近一个可用的数据日"，**不一定等于日历昨天**。AI Agent 做解读、写日报时必须读取 `data_date`，不要用系统时间推断。

实测（2026-11-24 调用）：`data_date` 为 `2026-11-21`，说明 11-22、11-23 的数据尚未入库。

### 2.5 指标定义

| 字段 | 含义 | 单位 |
| --- | --- | --- |
| `session_cnt` | 打开次数 | 次 |
| `visit_pv` | 访问次数（页面访问） | 次 |
| `visit_uv` | 访问人数 | 人 |
| `visit_uv_new` | 新访问人数 | 人 |
| `per_user_open` | 人均打开次数 = `session_cnt / visit_uv` | 次/人，2 位小数 |
| `new_user_rate` | 新用户占比 = `visit_uv_new * 100 / visit_uv` | **百分数**（`35.8` 表示 35.8%），1 位小数 |

### 2.6 覆盖状态字段

每个小程序有一组覆盖度字段：

| 字段 | 说明 |
| --- | --- |
| `monitor_start_date` | 纳入监控日期，取 `d_mini_mini.created_at` 的日期；不展示时为 `null` |
| `expected_days` | 统计窗口内"应有多少天数据"，从 `max(窗口开始日, monitor_start_date)` 算到 `data_date` |
| `not_monitored_days` | 窗口内尚未纳入监控的天数 = 窗口天数 − `expected_days` |
| `data_days` | 窗口内实际有数据的天数（`session_cnt` 非空） |
| `missing_days` | 应有没有的天数 = `expected_days` − `data_days`（不小于 0） |
| `complete` | 是否有数据：`data_days > 0`。**不是"数据完整无缺失"** |
| `coverage_status` | `not_started`：窗口内完全无数据；`missing`：有数据但有缺失天；`partial_period`：无缺失但窗口部分时间未纳入监控；`complete`：无缺失且全程在监控期内 |

> 注意：`complete` / `complete_app_count` / `missing_count` 均沿用"是否有数据"的口径，不是"KPI 是否齐全"。判断数据质量请看 `missing_days` 与 `coverage_status`。

---

## 3. 数据总览：`GET /api/mini_monitor/overview`

返回分组维度的汇总、趋势和报表，用于首页看板。

### 3.1 请求参数

| 参数 | 必填 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `module` | 否 | string | `operation` | `operation` / `growth`（支持中文别名） |
| `tab` | 否 | string | `all` | `all` / `subscription` / `qw`（支持中文别名） |
| `range` | 否 | string | `yesterday` | `yesterday` / `7d` / `30d` |

### 3.2 响应字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `context` | object | `{module, tab, group_ids[], group_names[]}`，本次查询实际生效的分组 |
| `range` | object | `{code, label, begin_date, end_date, days}`；无数据时 `begin_date`/`end_date` 为 `null` |
| `data_date` | string \| null | 数据锚点日，`YYYY-MM-DD` |
| `summary` | object | 见下表 |
| `trend` | object | 按小程序明细汇总的逐日趋势 |
| `report` | object | 按后台"分组数据"口径的逐日报表 |

`summary`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `app_count` | int | 分组内纳入监控的小程序数（`mini_status=0` 且 `app_id` 非空） |
| `complete_app_count` | int | 统计期内至少 1 天有数据的小程序数 |
| `missing_app_count` | int | 统计期内**完全无数据**的小程序数 = `app_count - complete_app_count` |
| `totals` | object | `{session_cnt, visit_pv, visit_uv, visit_uv_new}` 窗口内累计 |
| `daily_average` | object | 同结构日均值，**分母固定为窗口自然天数 `range.days`**（不是有数据天数、也不是 `expected_days`） |
| `per_user_open` | number | 人均打开次数 |
| `new_user_rate` | number | 新用户占比（百分数） |
| `comparison` | object \| null | 环比。正常返回时仅 `range=yesterday` 有值，其他周期为 `null`；分组完全无数据时（见 3.4）即使是 `yesterday` 也返回 `available=false` 的结构 |

`comparison`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `available` | bool | 是否可计算。要求分组内**每个**小程序在前一天都有且仅有 1 天完整数据；任一缺失即为 `false` |
| `previous_date` | string \| null | 对比日（`data_date` 前一天）；不可算时也会返回该日期 |
| `current` | object \| null | 当日四项累计 |
| `previous` | object \| null | 前一日四项累计 |
| `change_rate` | object \| null | 四项环比百分比，1 位小数；前值为 0 时为 `null` |

`trend.rows[]`（按日期升序，无数据的日期也补齐为 0）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | string | `YYYY-MM-DD` |
| `data_app_count` | int | 当日有数据的小程序数 |
| `session_cnt` / `visit_pv` / `visit_uv` / `visit_uv_new` | int | 当日合计 |

`report`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `group_name` | string | `全部` / `公众号` / `企微` / `进粉` |
| `daily_average_visit_uv` | int | 趋势窗口内日均访问人数，**分母为窗口天数（含无数据日）** |
| `daily_average_visit_uv_new` | int | 趋势窗口内日均新访问人数 |
| `rows` | array | 结构同 `trend.rows` |

口径差异：`trend` 基于 `d_mini_data` 按当前小程序清单汇总；`report` 基于 `d_mini_day` 分组汇总（与后台 `/admin/d/mini/day` 的"分组数据"一致）。两者可能相差少量小程序，属预期现象。

### 3.3 示例

```bash
curl -s "https://video.fenfentuan.com/api/mini_monitor/overview?module=operation&tab=all&range=7d"
```

```json
{
  "context": {
    "module": "operation",
    "tab": "all",
    "group_ids": [1, 3],
    "group_names": ["公众号-小程序", "企微-小程序"]
  },
  "range": {
    "begin_date": "2026-11-15",
    "end_date": "2026-11-21",
    "days": 7,
    "code": "7d",
    "label": "近7天"
  },
  "data_date": "2026-11-21",
  "summary": {
    "app_count": 34,
    "complete_app_count": 34,
    "missing_app_count": 0,
    "totals": { "session_cnt": 718404, "visit_pv": 1470803, "visit_uv": 374205, "visit_uv_new": 133896 },
    "daily_average": { "session_cnt": 102629, "visit_pv": 210115, "visit_uv": 53458, "visit_uv_new": 19128 },
    "per_user_open": 1.92,
    "new_user_rate": 35.8,
    "comparison": null
  },
  "trend": {
    "range_code": "7d",
    "begin_date": "2026-11-15",
    "end_date": "2026-11-21",
    "rows": [
      { "date": "2026-11-15", "data_app_count": 34, "session_cnt": 116231, "visit_pv": 237070, "visit_uv": 60776, "visit_uv_new": 24232 }
    ]
  },
  "report": {
    "group_name": "全部",
    "daily_average_visit_uv": 53458,
    "daily_average_visit_uv_new": 19128,
    "rows": [
      { "date": "2026-11-15", "data_app_count": 37, "session_cnt": 116513, "visit_pv": 237795, "visit_uv": 60900, "visit_uv_new": 24237 }
    ]
  }
}
```

`range=yesterday` 的环比样例：

```json
"comparison": {
  "available": true,
  "previous_date": "2026-11-20",
  "current": { "session_cnt": 13988, "visit_pv": 24426, "visit_uv": 5409, "visit_uv_new": 141 },
  "previous": { "session_cnt": 13578, "visit_pv": 23821, "visit_uv": 5257, "visit_uv_new": 157 },
  "change_rate": { "session_cnt": 3, "visit_pv": 2.5, "visit_uv": 2.9, "visit_uv_new": -10.2 }
}
```

### 3.4 无数据时

分组内完全没有数据时仍返回 200：

- `data_date` 为 `null`
- `range.begin_date` / `range.end_date` 为 `null`
- `trend.rows` / `report.rows` 为空数组
- `summary` 各项为 0，`comparison` 为不可用结构

---

## 4. 我的小程序列表：`GET /api/mini_monitor/apps`

返回分组内所有小程序及其在当前周期内的指标，用于列表页。

### 4.1 请求参数

| 参数 | 必填 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `type` | 否 | string | 不传则按 `module`+`tab` | `all` / `operation` / `growth` / `subscription` / `qw` |
| `module` | 否 | string | `operation` | 仅 `type` 未传时生效 |
| `tab` | 否 | string | `all` | 仅 `type` 未传时生效 |
| `range` | 否 | string | `yesterday` | `yesterday` / `7d` / `30d` |
| `keyword` | 否 | string | — | 按 `mini_name` 做不区分大小写的子串匹配 |
| `cert` | 否 | string | `all` | `all`/`全部`、`certified`/`已认证`/`2`、`uncertified`/`未认证` |
| `sort` | 否 | string | `desc` | `asc` / `desc`，仅影响日均访问人数排序 |

`cert=uncertified`（未认证）的口径是 `beian_type != 2`，**包含已封禁（`beian_type=3`）**。

### 4.2 排序规则（固定）

1. **有数据的小程序永远排在无数据小程序之前**（`stats.complete`，不受 `sort` 影响）；
2. 同为有数据 / 同为无数据时，按 `stats.daily_average.visit_uv` 升序（`asc`）或降序（`desc`）；
3. 日均相同按 `mini_name` 字典序。

### 4.3 响应字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `context` | object | 同总览 |
| `range` | object | 同总览；无数据时日期为 `null` |
| `data_date` | string \| null | 数据锚点日 |
| `total` | int | 过滤后的行数（本接口**不分页**，一次返回全部） |
| `missing_count` | int | `stats.complete=false` 的行数，即窗口内完全无数据的小程序数 |
| `rows` | array | 小程序数组，见下表 |

`rows[]`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `mini_id` | int | 小程序 ID，调用详情 / 跳转接口时使用 |
| `mini_name` | string | 小程序名称 |
| `app_id` | string | 微信 AppID |
| `group_ids` | int[] | 所属分组 ID 列表 |
| `type` | string | `公众号` / `企微` / `企微+公众号` / `进粉` |
| `module` | string | `operation` 或 `growth` |
| `cert` | string | `已认证` / `未认证` |
| `status` | string | 固定 `正常`（仅统计启用中的小程序） |
| `stats` | object | 覆盖度 + 指标，结构见 2.6 与下表 |

`stats`：

```json
{
  "complete": true,
  "coverage_status": "complete",
  "monitor_start_date": null,
  "expected_days": 1,
  "not_monitored_days": 0,
  "data_days": 1,
  "missing_days": 0,
  "totals": { "session_cnt": 50825, "visit_pv": 98516, "visit_uv": 27444, "visit_uv_new": 13791 },
  "daily_average": { "session_cnt": 50825, "visit_pv": 98516, "visit_uv": 27444, "visit_uv_new": 13791 },
  "per_user_open": 1.85,
  "new_user_rate": 50.3
}
```

> `stats.daily_average` 的分母是 **`data_days`（有数据的天数）**，与 `overview.summary.daily_average`（分母为窗口天数）不同，做汇总核对时不要混用。

### 4.4 示例

```bash
curl -s "https://video.fenfentuan.com/api/mini_monitor/apps?type=all&range=yesterday&sort=desc"
curl -s "https://video.fenfentuan.com/api/mini_monitor/apps?type=subscription&range=30d&keyword=%E4%BC%9A%E5%91%98&cert=certified"
```

```json
{
  "context": { "module": "all", "tab": "all", "group_ids": [1, 3, 4], "group_names": ["公众号-小程序", "企微-小程序", "进粉"] },
  "range": { "begin_date": "2026-11-21", "end_date": "2026-11-21", "days": 1, "code": "yesterday", "label": "昨天" },
  "data_date": "2026-11-21",
  "total": 37,
  "missing_count": 0,
  "rows": [
    {
      "mini_id": 78,
      "mini_name": "纷纷会员权益卡",
      "app_id": "wxdd924cb408991dc6",
      "group_ids": [3],
      "type": "企微",
      "module": "operation",
      "cert": "已认证",
      "status": "正常",
      "stats": {
        "complete": true,
        "coverage_status": "complete",
        "monitor_start_date": null,
        "expected_days": 1,
        "not_monitored_days": 0,
        "data_days": 1,
        "missing_days": 0,
        "totals": { "session_cnt": 50825, "visit_pv": 98516, "visit_uv": 27444, "visit_uv_new": 13791 },
        "daily_average": { "session_cnt": 50825, "visit_pv": 98516, "visit_uv": 27444, "visit_uv_new": 13791 },
        "per_user_open": 1.85,
        "new_user_rate": 50.3
      }
    }
  ]
}
```

---

## 5. 小程序详情：`GET /api/mini_monitor/detail`

返回单个小程序的基础信息、周期指标、环比和逐日明细。

### 5.1 请求参数

| 参数 | 必填 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mini_id` | **是** | int | — | 小程序 ID，必须 > 0，否则 422 |
| `type` | 否 | string | 不传则按 `module`+`tab` | 同列表 |
| `module` | 否 | string | `operation` | 仅 `type` 未传时生效 |
| `tab` | 否 | string | `all` | 仅 `type` 未传时生效 |
| `range` | 否 | string | `yesterday` | `yesterday` / `7d` / `30d` |

小程序必须属于当前 `type` / `module`+`tab` 解析出的分组，否则返回 404 `未找到该分组下的小程序`。

### 5.2 响应字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `context` | object | 同总览 |
| `range` | object | 同总览 |
| `data_date` | string \| null | **当前分组**的统一数据日期（不是该小程序自己的最新日期） |
| `mini` | object | 小程序档案，见下表 |
| `stats` | object | 与列表 `rows[].stats` 完全一致 |
| `comparison` | object | 环比，结构与总览相同；不可算时 `available=false` 且其余字段为 `null` |
| `history` | array | 逐日明细，长度 = 统计窗口天数 |

`mini`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `mini_id` | int | 小程序 ID |
| `mini_name` | string | 当前名称 |
| `old_name` | string | 曾用名，无则为空字符串 |
| `app_id` | string | 微信 AppID |
| `launch` | object | 跳转配置，见下表 |
| `type` | string | `公众号` / `企微` / `企微+公众号` / `进粉` |
| `module` | string | `operation` / `growth` |
| `cert` | string | `已认证` / `未认证` |
| `record` | string | 形如 `已备案 / 无封禁`、`未备案 / 已封禁` |
| `status` | string | 固定 `正常` |
| `subject` | string | 主体名称，可能为空字符串 |
| `admin_name` | string | 负责人，可能为空字符串 |
| `expire_date` | string | 到期日 `YYYY-MM-DD`，无则为空字符串 |
| `groups` | string[] | 所属分组名称列表 |

`mini.launch`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | int | 跳转模式：`1` 统一 URL Scheme；`2` 微信内优先公众号开放标签、失败用 Scheme 兜底；`3` 微信内仅公众号。线上当前为 `1` |
| `scheme_available` | bool | 是否已配置 `app_secret`，即能否调用 `launch_scheme` |
| `open_tag_available` | bool | 是否具备公众号原始 ID（`gh_` 开头），即能否使用 `wx-open-launch-weapp` |
| `username` | string | 开放标签使用的公众号原始 ID；不可用时为空字符串 |
| `path` | string | 固定为空字符串，表示打开小程序首页 |

`comparison` 可用条件：`range=yesterday` 且该小程序在锚点日 `expected_days=1`、`missing_days=0`，并且前一日也满足同样条件；否则 `available=false`。

`history[]`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | string | `YYYY-MM-DD` |
| `data_app_count` | int | 该小程序当日是否有数据：`1` 有，`0` 无 |
| `session_cnt` / `visit_pv` / `visit_uv` / `visit_uv_new` | int | 当日指标，无数据为 0 |

> `detail.data_date` 由**整个分组**决定：若同组其他小程序已有更新数据，而本小程序未更新，则本小程序 `stats.missing_days` 会增加。这是预期的"统一日期"设计，不是查询错误。

### 5.3 示例

```bash
curl -s "https://video.fenfentuan.com/api/mini_monitor/detail?mini_id=78&type=all&range=7d"
```

```json
{
  "context": { "module": "all", "tab": "all", "group_ids": [1, 3, 4], "group_names": ["公众号-小程序", "企微-小程序", "进粉"] },
  "range": { "begin_date": "2026-11-15", "end_date": "2026-11-21", "days": 7, "code": "7d", "label": "近7天" },
  "data_date": "2026-11-21",
  "mini": {
    "mini_id": 78,
    "mini_name": "纷纷会员权益卡",
    "old_name": "外卖会员权益卡",
    "app_id": "wxdd924cb408991dc6",
    "launch": { "mode": 1, "scheme_available": true, "open_tag_available": false, "username": "", "path": "" },
    "type": "企微",
    "module": "operation",
    "cert": "已认证",
    "record": "已备案 / 无封禁",
    "status": "正常",
    "subject": "广州言成智慧运营中心（有限合伙）",
    "admin_name": "钟顺航",
    "expire_date": "2027-08-05",
    "groups": ["企微-小程序"]
  },
  "stats": {
    "complete": true,
    "coverage_status": "complete",
    "monitor_start_date": null,
    "expected_days": 7,
    "not_monitored_days": 0,
    "data_days": 7,
    "missing_days": 0,
    "totals": { "session_cnt": 316198, "visit_pv": 622701, "visit_uv": 169467, "visit_uv_new": 80899 },
    "daily_average": { "session_cnt": 45171, "visit_pv": 88957, "visit_uv": 24210, "visit_uv_new": 11557 },
    "per_user_open": 1.87,
    "new_user_rate": 47.7
  },
  "comparison": { "available": false, "previous_date": null, "current": null, "previous": null, "change_rate": null },
  "history": [
    { "date": "2026-11-15", "data_app_count": 1, "session_cnt": 52731, "visit_pv": 103420, "visit_uv": 28212, "visit_uv_new": 14596 }
  ]
}
```

---

## 6. 资产概况：`GET /api/mini_monitor/assets`

返回小程序资产数量统计，用于资产页。

### 6.1 请求参数

| 参数 | 必填 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `type` | 否 | string | `all` | 可选 `all` / `operation` / `growth` / `subscription` / `qw` |

### 6.2 响应字段

| 字段 | 类型 | 统计范围 | 说明 |
| --- | --- | --- | --- |
| `context` | object | — | 本次生效的分组 |
| `total` | int | 当前 context | 去重后的小程序数 |
| `operation_count` | int | **固定全局** | 公众号 + 企微两组去重数 |
| `subscription_count` | int | **固定全局** | 公众号组数量 |
| `qw_count` | int | **固定全局** | 企微组数量 |
| `growth_count` | int | **固定全局** | 进粉组数量 |
| `certified_count` | int | 当前 context | `beian_type=2`（已认证） |
| `uncertified_count` | int | 当前 context | `beian_type!=2`，**包含已封禁** |
| `blocked_count` | int | 当前 context | `beian_type=3`（已封禁） |

说明：

- 只统计 `mini_status=0` 且 `app_id` 非空的启用小程序；
- `total` / 认证类计数随 `type` 变化；四个分组计数始终按全部分组计算，便于横向展示；
- 同一个 `mini_id` 属于多个分组时只计一次。

### 6.3 示例

```bash
curl -s "https://video.fenfentuan.com/api/mini_monitor/assets"
```

```json
{
  "context": { "module": "all", "tab": "all", "group_ids": [1, 3, 4], "group_names": ["公众号-小程序", "企微-小程序", "进粉"] },
  "total": 37,
  "operation_count": 34,
  "subscription_count": 17,
  "qw_count": 17,
  "growth_count": 3,
  "certified_count": 32,
  "uncertified_count": 5,
  "blocked_count": 0
}
```

---

## 7. 微信 JS-SDK 签名：`GET /api/mini_monitor/wechat_config`

为公众号内 `wx-open-launch-weapp` 开放标签生成 `wx.config` 所需的签名参数。

### 7.1 请求参数

| 参数 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `url` | **是** | string | 当前 H5 页面完整地址，必须带 `http://` 或 `https://`，且**不含 `#` 及其后内容** |

`url` 的 host 必须命中配置 `MINI_MONITOR_JSSDK_ALLOWED_HOSTS`（逗号分隔）；未配置时只允许当前请求的 host。否则返回 422 `当前页面域名未配置为微信 JS-SDK 签名域名`。

### 7.2 前置条件

- 仅跳转模式 `2` / `3` 需要本接口；模式 `1` 直接返回 422 `当前跳转模式不使用公众号配置`。
- 服务端必须配置 `MINI_MONITOR_JSSDK_APP_ID` 与 `MINI_MONITOR_JSSDK_APP_SECRET`，否则 422 `未配置微信 JS-SDK 签名账号`。
- **线上当前 `MINI_MONITOR_LAUNCH_MODE=1`，因此该接口线上固定返回 422，属预期行为。**

### 7.3 响应字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `app_id` | string | 公众号 AppID |
| `timestamp` | int | 秒级时间戳 |
| `nonce_str` | string | 随机串（32 位十六进制） |
| `signature` | string | `sha1("jsapi_ticket=...&noncestr=...&timestamp=...&url=...")` |

`jsapi_ticket` 服务端缓存约 7000 秒，签名本身按微信规则 7200 秒内有效。

### 7.4 示例

```bash
curl -s "https://video.fenfentuan.com/api/mini_monitor/wechat_config?url=https%3A%2F%2Fvideo.fenfentuan.com%2Fmini-monitor%2Findex.html"

# 线上实际返回（HTTP 422）
{"error":{"code":"mini_monitor_error","message":"当前跳转模式不使用公众号配置"}}
```

成功时：

```json
{
  "app_id": "wx1dcc9173cf6868f6",
  "timestamp": 1795000000,
  "nonce_str": "9f2c1d7a5b3e4f6081a2b3c4d5e6f708",
  "signature": "3f0a…"
}
```

---

## 8. 直达小程序 URL Scheme：`GET /api/mini_monitor/launch_scheme`

生成可直接唤起小程序首页的 `weixin://` 链接。

### 8.1 请求参数

| 参数 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `mini_id` | **是** | int | 小程序 ID，必须 > 0 |

### 8.2 前置条件与行为

- 小程序必须：属于分组 `1` / `3` / `4` 之一、`mini_status=0`、`app_id` 非空，否则 404 `未找到可跳转的小程序`；
- 必须已配置 `app_secret`，否则 422 `该小程序未配置密钥，无法生成跳转链接`；
- 服务端调用微信 `wxa/generatescheme` 生成 **30 天有效**、仅打开**首页**的链接（不支持自定义 path / query）；
- 生成结果按 `app_id` 缓存 **28 天**，期间重复调用返回同一 `openlink`，不会重复消耗微信配额；
- 微信接口异常或返回为空时返回 500 `小程序跳转链接生成失败`。

### 8.3 响应字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `openlink` | string | 形如 `weixin://dl/business/?t=xxxx` 的链接 |

### 8.4 示例

```bash
curl -s "https://video.fenfentuan.com/api/mini_monitor/launch_scheme?mini_id=78"
```

```json
{ "openlink": "weixin://dl/business/?t=63CmtrrbNRa" }
```

> 该链接应在微信客户端内打开；在 PC 浏览器或普通浏览器中通常无法唤起，属微信侧限制。

---

## 9. AI Agent 调用建议

### 9.1 推荐调用顺序

1. `assets`：确认资产规模与分组数量；
2. `overview`：拿某个分组在指定周期的汇总 / 趋势 / 环比；
3. `apps`：拿小程序清单与 `mini_id`（可按 `keyword` 过滤）；
4. `detail`：按 `mini_id` 看单小程序详情与逐日明细；
5. `launch_scheme`：需要端内跳转时再调用（会消耗微信配额，勿批量预生成）。

### 9.2 解读注意事项

1. **先读 `data_date`**：它才是本次数据的截止日；不要用系统日期推断"昨天"。
2. `range=yesterday` 的窗口是 `data_date` 当天，不是严格日历昨天；周期为 1 天。
3. `overview.summary.daily_average` 的分母是窗口天数，`apps/detail` 的 `stats.daily_average` 分母是 `data_days`，两者不可直接对比。
4. `complete` / `missing_count` 表示"是否有数据"，不是"数据是否完整"；数据完整性看 `missing_days` / `coverage_status`。
5. `trend` 与 `report` 口径不同，出现少量差异时以 `report` 对齐后台页面，以 `trend` 对齐小程序明细合计。
6. 比率字段已是百分数：`new_user_rate=35.8` 即 35.8%，不要再乘 100；`change_rate=3` 即 +3%。
7. 无数据不等于 0：当 `data_date=null` 或 `stats.complete=false` 时，应表述为"暂无数据"，而不是"访问量为 0"。
8. `apps` 不分页，当前约 37 条；数据量增长后单次响应会变大，注意设置合理超时。

### 9.3 错误处理

| 情况 | 处理方式 |
| --- | --- |
| HTTP `422` | 读取 `error.message`，通常是枚举值拼错或前置条件不满足；按提示修正参数，不要盲目重试 |
| HTTP `404` | `mini_id` 不存在、不属于所查分组或不可跳转；先用 `apps` 重新取 ID |
| HTTP `500` | 可能是微信上游故障或数据库异常；可退避重试 1~2 次，仍失败则上报，不要高频重试 |
| 网络 / 超时 | 服务端脚本建议超时 15~30 秒；`launch_scheme` 涉及微信调用，可放宽到 30 秒 |

### 9.4 安全与使用边界

- 接口无鉴权、无频率限制，仅限内网 / 可信环境调用，禁止把地址暴露到公开页面或第三方服务。
- `wechat_config` 会返回签名，`launch_scheme` 会返回可唤起小程序的链接，均只在需要时调用。
- 文档与日志中不要记录 `.env` 中的 AppSecret、JS-SDK Secret 等凭据。

---

## 10. 维护信息（开发参考）

| 项目 | 说明 |
| --- | --- |
| 控制器 | `app/Http/Controllers/MiniMonitorController.php` |
| 路由 | `routes/web.php` 第 19~24 行，均为 `Route::any` |
| 配置 | `config/mini_monitor.php`；相关环境变量 `MINI_MONITOR_LAUNCH_MODE`、`MINI_MONITOR_JSSDK_APP_ID`、`MINI_MONITOR_JSSDK_APP_SECRET`、`MINI_MONITOR_JSSDK_ALLOWED_HOSTS` |
| 数据表 | `d_mini_mini`（小程序档案）、`d_mini_group` / `d_mini_group_mini`（分组关系）、`d_mini_data`（逐小程序逐日明细）、`d_mini_day`（分组逐日汇总） |
| H5 页面 | `public/mini-monitor/index.html` |
| 失败日志 | `小程序监控数据总览查询失败`、`小程序监控列表查询失败`、`小程序监控详情查询失败`、`小程序监控资产查询失败`、`小程序监控微信 JS-SDK 配置失败`、`小程序监控 URL Scheme 生成失败` |
