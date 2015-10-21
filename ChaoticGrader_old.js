var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var Mocha = require('mocha');
var program = require('commander');
 
program
	.option('-r, --rootpath <path>', 'path to root dir')
    .option('-s, --srcdir <path>', 'path to src dir')
    .option('-t, --testdir <path>', 'path to test dir')
    .parse(process.argv);


var rootdir = path.resolve(__dirname, program.rootpath);
var srcdir = path.resolve(__dirname, program.srcdir);
var testdir = path.resolve(__dirname, program.testdir);


var evilfiles = [];
var version = 0;

var SIGNS = ['+', '*', '/', '-'];
var REGS = ['>=', '<=', /[^=](?==)==(?!=)/, /<(?!=)/, />(?!=)/];
var REPLS = ['>', '<', '===', '<=', '>='];


var newRootName = rootdir + version;
fs.renameSync(rootdir, newRootName);

var newSrcName;
var newTestName;

var srcfiles = [];
var testfiles = [];

var filePath;

var mochaTests = [];

function updateTestFilesNames () {
    newTestName = testdir.replace(rootdir, newRootName);
    testfiles = fs.readdirSync(newTestName);
    if (!testfiles || testfiles.length === 0) {
        console.log("No test file found. Exiting...");
        return;
    }

    for (var i = 0; i < testfiles.length; ++i) {
        testfiles[i] = path.resolve(newTestName, testfiles[i]);
    }
    mochaTests.push(testfiles);
}

function updateSrcFilesNames () {
    newRootName = rootdir + version;
    newSrcName = srcdir.replace(rootdir, newRootName);
    srcfiles = fs.readdirSync(newSrcName);
    if (!srcfiles || srcfiles.length === 0) {
        console.log("No source file found. Exiting...");
    }
}

function runBackup () {

    // save original files
    fse.copySync(rootdir, rootdir + "_backup");
}

function runChaos() {

    // first create a backup
    runBackup();

    // for

    for (var i = 0; i < srcfiles.length; ++i) {

        filePath = path.resolve(newSrcName, srcfiles[i]);
        var data = fs.readFileSync(filePath, 'utf8');

        doEvil(data);
    }

    mochaTests.forEach(function(tests){
        runMocha("cannot tell", tests);
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
        fs.writeFileSync(filePath, evilVersion.code);
        version = i + 1;
        fse.copySync(rootdir + "_backup", rootdir + version);
        updateSrcFilesNames();
        updateTestFilesNames();
        filePath = filePath.replace(i, version);
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

function runMocha(msg, testfiles) {
	var mocha = new Mocha();
    for (var i = 0; i < testfiles.length; ++i) {
        mocha.addFile(testfiles[i]);
    }
	mocha.reporter('min').run(function(){

            console.log("Change made:", msg, '\n');
            console.log("===================================================================================");

	});
}

function cleanup(dirname) {
    var evilfiles = [];
    for (var i = 0; i <= version; ++i) {
        evilfiles.push(rootdir + i);
    }
	evilfiles.forEach(function(f){
		fs.unlink(f.file);
	});

	console.log("-----------------------------------------------------\n" +
		"-----------------------------------------------------\n" +
		"Script finished running. See console log messages for results.")
}

runChaos();
