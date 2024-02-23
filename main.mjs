'use strict';

import fs from 'fs';
import puppeteer from 'puppeteer';

/** データベースを保存するファイル名 */
const ichoPath = './icho.json';

/**
 * データベースに URL を追加する。
 * URL が既知である場合は何もしない。
 *
 * @param {Object} db - データベース本体
 * @param {string[]} db.pages - 既知の URL 一覧
 * @param {{[string]: number}} db.index - 既知の URL 逆引き表
 * @param {string} url - 追加する URL
 * @returns {number} URL のインデクス番号
 */
function
insert(db, url)
{
    if (db.index[url] === undefined) {
        db.index[url] = db.pages.length;
        db.pages.push(url);
    }
    return db.index[url];
}

/**
 * データベースにリンケージを追加する。
 * リンケージが既にある場合は種別を更新する。
 *
 * @param {Object} db - データベース本体
 * @param {{[string]: string}} db.links - 既知のリンケージ一覧
 * @param {number} from - リンク元 URL のインデクス番号
 * @param {number} to - リンク先 URL のインデクス番号
 * @param {string} type - リンクの種別（人間向け）
 */
function
link(db, from, to, type)
{
    db.links[`${from}->${to}`] = type;
}

/**
 * データベースをファイルに書き出す。
 *
 * @param {Object} db - データベース本体
 * @param {string} path - ファイルパス
 */
function
commit(db, path)
{
    fs.writeFileSync(path, JSON.stringify(db));
}

/**
 * URL で指定されているページを訪れる。
 *
 * @param {Object} db - データベース本体
 * @param {string[]} db.pages - 既知の URL 一覧
 * @param {{[string]: number}} db.index - 既知の URL 逆引き表
 * @param {{[string]: string}} db.links - 既知のリンケージ一覧
 * @param {string} url - 訪問するする URL
 */
async function
visit(db, url)
{
    console.log(url);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const response = await page.goto(url);
    const chain = response.request().redirectChain();
    for (let i = 0; i < chain.length; i++) {
        const from = insert(db, chain[i].url());
        const to = insert(db, chain[i+1]?.url() || page.url());
        link(db, from, to, 'redirect');
    }
    const from = insert(db, page.url());
    const urls = await page.$$eval('a', v => v.map(a => a.href));
    for (let i = 0; i < urls.length; i++) {
        const to = insert(db, urls[i]);
        link(db, from, to, 'link');
    }
    await browser.close();

    if (urls.length > 0 && Math.random() > .25) {
        const next = Math.random() * urls.length | 0;
        setTimeout(() => visit(db, urls[next]), 1000);
    }
    commit(db, ichoPath);
}

function
main()
{
    const json = fs.readFileSync(ichoPath, 'utf-8');
    const db = JSON.parse(json);

    const first = Math.random() * db.pages.length | 0;
    console.debug(first, '/', db.pages.length);
    const url = db.pages[first];

    visit(db, url);
}
main();
/* ex: se et ts=4 : */
