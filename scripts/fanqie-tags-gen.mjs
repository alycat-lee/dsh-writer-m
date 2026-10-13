/**
 * fanqie-tags-gen.mjs — 把一次真实抓取的番茄标签清单生成 lib/core/fanqie-tagdata.js（纯数据模块）。
 *
 * 为什么要有生成器：番茄「创建作品」页的两个标签下拉**没有目录 API**（创建页只请求 account/info、
 * hot_word/word_list 等；两个主包 + 65 个懒加载 chunk 里都搜不到标签名），只能 DOM 抓。
 * 抓取脚本：O:\DeepSeek Plugin\fanqie_tags_extract.py（产物 fanqie-data/fanqie-tags.json）。
 * 站点改标签后重抓一次，再用本脚本重新生成数据模块，不要去手改 fanqie-tagdata.js。
 *
 * 用法：node scripts/fanqie-tags-gen.mjs [fanqie-tags.json 路径]
 *   缺省读 O:\DeepSeek Plugin\fanqie-data\fanqie-tags.json，可用环境变量 FANQIE_TAGS_JSON 覆盖。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '..', 'lib', 'core', 'fanqie-tagdata.js')
const SRC = process.argv[2] || process.env.FANQIE_TAGS_JSON || 'O:\\DeepSeek Plugin\\fanqie-data\\fanqie-tags.json'

// 每组选择上限来自站点规则文案（tip）：主分类必选且只能选一个，主题/角色/情节最多两个；
// 内容标签：情节、人设最多四个，情感最多两个，世界观最多一个。写死并校验，站点改规则时会在这里报错而不是静默错配。
const MAXES = {
  read: { 主分类: 1, 主题: 2, 角色: 2, 情节: 2 },
  content: { 情节: 4, 情感: 2, 人设: 4, 世界观: 1 },
}
const REQUIRED = { read: ['主分类'], content: [] }
// 书本名称 / 主角名 / 作品简介的站点限制（创建页实测：input maxlength 与 textarea 说明文案）。
const TITLE_MAX = 15
const ROLE_NAME_MAX = 5
const BRIEF_MIN = 50
const BRIEF_MAX = 500

const raw = JSON.parse(readFileSync(SRC, 'utf8'))
if (!Array.isArray(raw.selects) || raw.selects.length !== 2) {
  throw new Error('标签清单格式不对：selects 应有 read / content 两组，实际 ' + JSON.stringify(raw.selects?.length))
}
const pick = (key) => {
  const s = raw.selects.find((x) => x.key === key)
  if (s === undefined) throw new Error('标签清单缺少 ' + key + ' 组')
  return s
}
const q = (s) => JSON.stringify(String(s))

/** 一行放 8 个标签，长清单也能人读。 */
function emitItems(items, indent) {
  const lines = []
  for (let i = 0; i < items.length; i += 8) {
    lines.push(indent + items.slice(i, i + 8).map(q).join(', ') + ',')
  }
  return lines.join('\n')
}

function emitGroups(key) {
  const s = pick(key)
  const want = MAXES[key]
  const have = s.sections.map((x) => x.title)
  const miss = Object.keys(want).filter((t) => !have.includes(t))
  const extra = have.filter((t) => !(t in want))
  if (miss.length > 0 || extra.length > 0) {
    throw new Error(key + ' 组与脚本预期不一致：缺 ' + JSON.stringify(miss) + ' 多 ' + JSON.stringify(extra))
  }
  const blocks = s.sections.map((sec) => {
    const required = REQUIRED[key].includes(sec.title) || sec.required === true
    return [
      '  {',
      '    id: ' + q(sec.title) + ',',
      '    title: ' + q(sec.title) + ',',
      '    required: ' + (required ? 'true' : 'false') + ',',
      '    max: ' + want[sec.title] + ',',
      '    items: [',
      emitItems(sec.items, '      '),
      '    ],',
      '  },',
    ].join('\n')
  })
  return blocks.join('\n')
}

const read = pick('read')
const content = pick('content')
const out = [
  '/**',
  ' * fanqie-tagdata.js — 番茄小说「创建作品」页两个标签下拉的官方清单（**纯数据，勿手改**）。',
  ' *',
  ' * 生成：node scripts/fanqie-tags-gen.mjs [fanqie-tags.json]（默认读 ' + SRC + '）',
  ' * 来源：' + raw.source,
  ' * 采集时间：' + raw.capturedAt,
  ' * 站点没有标签目录 API，清单只能从页面 DOM 抓；站点改标签后重抓 + 重新生成，不要手改本文件。',
  ' */',
  '',
  '/** 采集来源页（创建作品页）。 */',
  'export const FANQIE_TAG_SOURCE = ' + q(raw.source),
  '/** 采集时间（YYYY-MM-DDTHH:mm:ss，本地时间）。 */',
  'export const FANQIE_TAG_CAPTURED_AT = ' + q(raw.capturedAt),
  '',
  '/** 阅读标签规则文案（站点原话）。 */',
  'export const FANQIE_READ_TIP = ' + q(read.tip),
  '/** 内容标签规则文案（站点原话）。 */',
  'export const FANQIE_CONTENT_TIP = ' + q(content.tip),
  '',
  '/** 书本名称上限（创建页 input maxlength）。 */',
  'export const FANQIE_TITLE_MAX = ' + TITLE_MAX,
  '/** 主角名上限（创建页 input maxlength）。 */',
  'export const FANQIE_ROLE_NAME_MAX = ' + ROLE_NAME_MAX,
  '/** 作品简介下限（创建页 textarea 说明）。 */',
  'export const FANQIE_BRIEF_MIN = ' + BRIEF_MIN,
  '/** 作品简介上限（创建页 textarea 说明）。 */',
  'export const FANQIE_BRIEF_MAX = ' + BRIEF_MAX,
  '',
  '/** 阅读标签四组（主分类必选 1、其余各最多 2）。 */',
  'export const FANQIE_READ_GROUPS = [',
  emitGroups('read'),
  ']',
  '',
  '/** 内容标签四组（情节/人设最多 4、情感最多 2、世界观最多 1）。 */',
  'export const FANQIE_CONTENT_GROUPS = [',
  emitGroups('content'),
  ']',
  '',
].join('\n')

writeFileSync(OUT, out, 'utf8')
const count = (gs) => gs.reduce((n, g) => n + g.items.length, 0)
console.log('已生成 ' + OUT)
console.log('阅读标签 ' + FANQIE_COUNT(read) + ' 项 / 内容标签 ' + FANQIE_COUNT(content) + ' 项')
function FANQIE_COUNT(s) { return s.sections.reduce((n, x) => n + x.items.length, 0) }
