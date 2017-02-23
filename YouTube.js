/**
 * Created by Dima on 2/23/2017.
 */
import {sprintf} from 'sprintf';
import request from 'request';
export class YouTube {
    constructor() {
        this.baseUrl = 'https://www.youtube.com/';
        this.search = 'results?search_query=%s';
    }

    find(str, callback) {
        request(this.baseUrl + sprintf(this.search, str), function (error, response, body) {
            callback(body.match(/href="\/watch\?v=(.+?)"/));
        })
    }

    getVideoUrl(id) {
        return this.baseUrl + 'watch/?v=' + id;
    }
}