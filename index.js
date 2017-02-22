import TelegramBot from 'node-telegram-bot-api';
import {LastFmNode} from 'lastfm';
import sqlite3 from 'sqlite3';
import config from './config';

let sqlite = sqlite3.verbose();

const bot = new TelegramBot(config.telegram_token, {polling: true});

var db = new sqlite.Database(config.db);

db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER, name TEXT, fm_username TEXT, PRIMARY KEY (id)) ");
});

var lastfm = new LastFmNode({
    api_key: config.lastfm.api_key,
    secret: config.lastfm.secret,
});

bot.onText(/\/reg_fm (.*)/, (msg, match) => {
    const chat_id = msg.chat.id;
    let fm_username = match[1];
    console.log(fm_username);
    db.serialize(() => {
        db.run('INSERT OR REPLACE INTO users VALUES (' + msg.from.id + ',"' + msg.from.first_name + ' ' + msg.from.last_name + '","' + fm_username + '" )')
        db.all('SELECT * FROM users', (err, rows) => {
            console.log(rows);
            let users = '';
            for (let row of rows) {
                users += row.name + ' ';
            }
            bot.sendMessage(chat_id, 'slushaem pocanov: ' + users);
        });
    })
});

bot.onText(/\/cs/, (msg, match) => {
    console.log(msg);
    db.all('SELECT * FROM users WHERE id = ' + msg.from.id, (err, rows) => {
        if (rows.length == 1) {
            lastfm.request('user.getRecentTracks', {
                limit: 1,
                user: rows[0].fm_username,
                handlers: {
                    success: data => {
                        console.log(data);
                        bot.sendMessage(msg.chat.id, JSON.stringify(data));
                        db.each(`SELECT * FROM users WHERE fm_username = "${data.recenttracks['@attr'].user}"`, (err, row) => {
                            bot.sendMessage(msg.chat.id, `Poc ${row.name}
                         slushaet melodiyu ${data.recenttracks.track[0].name} ot ${data.recenttracks.track[0].artist['#text']}`);
                        })
                    },
                    error: err => {
                        console.log(err);
                        bot.sendMessage(msg.chat.id, JSON.stringify(err));
                        bot.sendMessage(msg.chat.id, 'last fm ne znaet kto ti poprobuy po drugomu /kogo_slushat fm_username');
                    }
                }
            })
        } else {
            bot.sendMessage(msg.chat.id, 'tebya net v bd delay /kogo_slushat last_fm_username');
        }
    });
});