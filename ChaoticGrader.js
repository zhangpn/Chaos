/**
 * Created by Dana Zhang on 10/20/15.
 */
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var Mocha = require('mocha');
var program = require('commander');

program
    .option('-r, --rootpath <path>', 'path to root dir')
    .option('-s, --srcfile <path>', 'path to src file')
    .option('-t, --testfile <path>', 'path to test file')
    .parse(process.argv);


var rootdir = path.resolve(__dirname, program.rootpath);
var srcfile = path.resolve(__dirname, program.srcfile);
var testfile = path.resolve(__dirname, program.testfile);


var SIGNS = ['+', '*', '/', '-'];
var REGS = ['>=', '<=', /[^=](?==)==(?!=)/, /<(?!=)/, />(?!=)/];
var REPLS = ['>', '<', '===', '<=', '>='];


var mochaTests = [];


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

    var data = fs.readFileSync(srcfile, 'utf8');

    doEvil(data);

    mochaTests.forEach(function(test){
        runMocha(test);
    });
}

function doEvil (data) {
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

    evilVersions.forEach(function(evilVersion, i){
        var newdirPath = rootdir + i,
            newSrcPath = srcfile.replace(rootdir, newdirPath),
            newTestPath = testfile.replace(rootdir, newdirPath);

        // create new root dir for the new version of code
        createNewVersion(rootdir, newdirPath);
        fs.writeFileSync(newSrcPath, evilVersion.code);
        mochaTests.push({root: newdirPath, testPath: newTestPath, msg: evilVersion.type});
    });
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
    mocha.reporter('json').run(function(){
        console.log("Change made:", test.msg, '\n');
        console.log("===================================================================================");
        fse.removeSync(test.root);
    });
}


runChaos();
