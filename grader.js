#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtml = function(html) {
    return cheerio.load(html);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(html, checksfile) {
    $ = cheerioHtml(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
    var html = fs.readFileSync(htmlfile);
    return checkHtml(html, checksfile);
}

var checkHtmlUrl = function(htmlurl, checksfile, callback) {
    rest.get(htmlurl).on('complete', function (html) {
        if (html instanceof Error) {
            console.log('Failed to retrieve the URL.');
            process.exit(1);
        }
        callback(checkHtml(html, checksfile));
    });
}

var outJson = function (obj) {
    var outJson = JSON.stringify(obj, null, 4);
    console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks [cmd]', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file [file]', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
        .option('-u, --url [url]', 'URL to check')
        .parse(process.argv);
    var checkJson = null;
    if (program.url) {
        if (program.file !== HTMLFILE_DEFAULT) {
            console.log('Cannot specify both file and URL.');
            process.exit(1);
        }
        checkHtmlUrl(program.url, program.checks, outJson);
    }
    else {
        outJson(checkHtmlFile(program.file, program.checks));
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
