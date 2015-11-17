/**
 * Created by Dana Zhang on 10/20/15.
 */

'use strict';

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var Mocha = require('mocha');
var program = require('commander');

program
    .option('-r, --rootpath <path>', 'path to root directory')
    .option('-s, --srcdir <path>', 'path to src folder')
    .option('-t, --testfile <path>', 'path to test file')
    .parse(process.argv);


var rootdir = path.resolve(__dirname, program.rootpath);
var srcdir = path.resolve(__dirname, program.srcdir);
var testfile = path.resolve(__dirname, program.testfile);


var SIGNS = ['+', '*', '/', '-'];
var REGS = ['>=', '<=', /[^=](?==)==(?!=)/, /<(?!=)/, />(?!=)/];
var REPLS = ['>', '<', '===', '<=', '>='];


var mochaTests = [];

var counter = {counts: 0};


function runBackup () {

    // save original files
    fse.copySync(rootdir, rootdir + "_backup");
}

function createNewVersion(name, newName) {
    fse.copySync(name, newName);
}

function runChaos() {

    // first create a backup
    //runBackup();

    // do evil on the source file
    var afterCodeAcquired;

    afterCodeAcquired = function (err, results) {
        var i,
            fileName,
            original,
            content = {};

        if (err) {
            throw err;
        }

        for (i = 0; i < results.length; i += 1) {
            fileName = results[i];
            original = fs.readFileSync(fileName, {'encoding': 'utf-8'});

            doEvil(content, fileName, original);
        }

        generateEvilRepos(srcdir, content);

        mochaTests.forEach(function(test){
            runMocha(test);
        });
    };

    getCode(srcdir, afterCodeAcquired);
    // var data = fs.readFileSync(srcdir, 'utf8');

    //doEvil(data);
}

var getCode = function (srcdir, callback) {
    var isJsFile,
        walk;

    isJsFile = function (str) {
        var ext = '.js',
            lastIndex = str.lastIndexOf(ext),
            valid = str.indexOf('node_modules') === -1 && str.indexOf('.git') === -1
                && str.indexOf('test') === -1 && str.indexOf('coverage') === -1;
        return valid && (lastIndex !== -1) && (lastIndex + ext.length === str.length);
    };

    walk = function (dir, done) {
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err) {
                return done(err);
            }
            var i = 0;
            (function next() {
                var file = list[i];
                if (!file) {
                    return done(null, results);
                }
                i += 1;
                file = dir + '/' + file;
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        walk(file, function (err, res) {
                            results = results.concat(res);
                            next();
                        });
                    } else if (isJsFile(file)) {
                        results.push(file);
                        next();
                    } else {
                        next();
                    }
                });
            })();
        });
    };

    walk(srcdir, callback);
};

function generateEvilRepos(repoPath, dataContent) {
    var seed = Math.floor(Math.random() * counter.counts + 1),  // minimum total number of versions to be generated
        //rand1 = Math.floor(Math.random() * Object.keys(dataContent) + 1), // total number of js files
        newRepoPaths = [],
        key,
        i,
        v = 0;

    while (newRepoPaths.length < seed) {
        i = 0;
        for (key in dataContent) {
            if (dataContent.hasOwnProperty(key)) {
                var rand = Math.random();
                if (rand >= 0.5 && dataContent[key].evilVersions[i]) {
                    // if rand true add, else skip
                    newRepoPaths.push({
                        rootName: repoPath + v,
                        data: {
                            filename: key.replace(repoPath, repoPath + v),
                            data: dataContent[key].evilVersions[i]
                        }
                    });
                    dataContent[key].evilVersions.splice(i, 1);
                }
                ++i;
                ++v;
            }
        }
    }

    newRepoPaths.forEach(function(repo) {
        var newTestPath = testfile.replace(repoPath, repo.rootName);

        // create new root dir for the new version of code
        createNewVersion(repoPath, repo.rootName);
        fs.writeFileSync(repo.data.filename, repo.data.data.code);
        mochaTests.push({root: repo.rootName, testPath: newTestPath, msg: repo.data.data.type});
    });

}

function doEvil (dataContent, filename, data) {
    var evilVersions = [];
    // regex matching if and for statements
    var regs = [/(\s)?if(\s)?(.)+\)/g, /for.*?\(.*?=.*?;.*?<.*?;.*?\+.*?\)/, /for.*?\(.*?>.*?;.*?=.*?;.*?\-.*?\)/],
        ifs = data.match(regs[0]),
        fors = data.match(regs[1]),
        newIfs = [],
        newFors = [],
        i,
        j;

    if (ifs) {
        for (i = 0; i < ifs.length; ++i) {
            newIfs.push(alterIfCode(ifs[i]));
            for (j = 0; j < newIfs[i].length; ++j) {
                evilVersions.push({code: data.replace(ifs[i], newIfs[i][j].code), type: newIfs[i][j].type});
            }
        }
    }

    if (fors) {
        for (i = 0; i < fors.length; ++i) {
            newFors.push(alterForCode(fors[i]));
            for (j = 0; j < newFors[i].length; ++j) {
                evilVersions.push({code: data.replace(fors[i], newFors[i][j].code), type: newFors[i][j].type});
            }
        }
    }

    if (evilVersions.length === 0) {
        console.info("No evil versions recorded for file: ", filename);
        return;
    }

    counter.counts += evilVersions.length;

    if (!dataContent.hasOwnProperty(filename)) {
        dataContent[filename] = {
            evilVersions: evilVersions,
            original: data
        };
    }
}


function alterIfCode (line) {
    var newLines = [],
        i;
    for (i = 0; i < REGS.length; ++i) {
        var newLine = line.replace(REGS[i], REPLS[i]);
        if (newLines.indexOf(newLine) === -1 && newLine !== line) {
            newLines.push({code: newLine, type: 'Changing "' + line + '" to "' + newLine + '"'});
        }
    }
    return newLines;
}

function alterForCode (line) {
    var newlines = [],
        re1 = /.*?=.*?;.*?</,	// matching for (i = 0; i < length; ++i)
        re2 = /.*?>.*?;.*?=/,	// matching for (i < length; i = 0; --i)
        newline;

    if (line.match(re1)) {
        newline = line.substring(0, line.indexOf('=') + 1) + " 1+" + line.substring(line.indexOf('=') + 1);
        newlines.push({code: newline, type: 'Change "' + line + '" to "' + newline + '"'});
        newline = line.substring(0, line.indexOf('<') + 1) + " -1+" + line.substring(line.indexOf('<') + 1);
        newlines.push({code: newline, type: 'Change "' + line + '" to "' + newline + '"'});

    } else if (line.match(re2)) {
        newline = line.substring(0, line.indexOf('>') + 1) + " -1+" + line.substring(line.indexOf('>') + 1);
        newlines.push({code: newline, type: 'Change "' + line + '" to "' + newline + '"'});
        newline = line.substring(0, line.indexOf('=') + 1) + " 1+" + line.substring(line.indexOf('=') + 1);
        newlines.push({code: newline, type: 'Change "' + line + '" to "' + newline + '"'});
    }

    return newlines;
}

function runMocha(test) {
    var mocha = new Mocha();
    mocha.addFile(test.testPath);
    mocha.reporter('min').run(function(){
        console.log("Change made:", test.msg, '\n');
        console.log("===================================================================================");
        fse.removeSync(test.root);
    });
}


runChaos();
