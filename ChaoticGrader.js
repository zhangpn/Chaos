var fs = require('fs');
var path = require('path');
var Mocha = require('mocha');
var program = require('commander');
 
program
  .option('-s, --srcfile <path>', 'path to src file')
  .option('-t, --testfile <path>', 'path to test file')
  .parse(process.argv);


var srcfile = path.join(__dirname, program.srcfile);
var testfile = path.join(__dirname, program.testfile);
var srcfilename = path.basename(srcfile.replace('.js', ''));
var testfilename = path.basename(testfile);
var testfiles = [];
var evilfiles = [];


var SIGNS = ['+', '*', '/', '-'];
var REGS = ['>=', '<=', /[^=](?==)==(?!=)/, /<(?!=)/, />(?!=)/];
var REPLS = ['>', '<', '===', '<=', '>='];
var srcbackup = srcfile + '.bak';
var testfilebackup = testfile + '.bak';

function runChaos() {

	// save original files
	if (!fs.existsSync(srcbackup)) {
		fs.renameSync(srcfile, srcbackup);
	}
	if (!fs.existsSync(testfilebackup)){
			fs.renameSync(testfile, testfilebackup);
	}
	// read src file and change its code	
	var data = fs.readFileSync(srcbackup, 'utf8');

	doEvil(data);
	cleanup();
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

	// match this pattern: for (i = 0; i < length; ++i)
	var str ="for (i > 0; i = 1; -i)";

	console.log(str.match(regs[2]));

	for (i = 0; i < ifs.length; ++i) {
		newIfs.push(alterIfCode(ifs[i]));
		for (j = 0; j < newIfs[i].length; ++j) {
			evilVersions.push({code: data.replace(ifs[i], newIfs[i][j].code), type: newIfs[i][j].type});
		}
	}
	
	for (i = 0; i < fors.length; ++i) {
		newFors.push(alterForCode(fors[i]));
		for (j = 0; j < newFors[i].length; ++j) {
			evilVersions.push({code: data.replace(fors[i], newFors[i][j].code), type: newFors[i][j].type});
		}
	}

	evilVersions.forEach(function(f, i) {
		var filename = srcfilename + i;
		var outputpath = srcfile.replace(srcfilename, filename);
		fs.writeFileSync(outputpath, f.code);
		evilfiles.push({file: outputpath, type: f.type});
		var success = generateTest(srcfilename + i);
		if (success) {
			runMocha(i);
		}
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

function generateTest(srcname) {
	var data = fs.readFileSync(path.join(testfilebackup), 'utf8'),
		re = new RegExp('require.*?' + srcfilename),
		match = data.match(re) ? data.match(re)[0] : null,
		newdata,
		newtestpath;

	if (!match) {
		return false;
	}

	newdata = data.replace(match, match.replace(srcfilename, srcname)),
	newtestpath = testfile.replace(testfilename, srcname + 'test' + '.js');

	fs.writeFileSync(newtestpath, newdata);
	testfiles.push(newtestpath);
	return true;
}

function runMocha(ind) {
	var mocha = new Mocha();
	mocha.addFile(testfiles[ind]);
	mocha.reporter('min').run(function(){
		console.log("Change made:", evilfiles[ind].type, '\n');
		console.log("===================================================================================")
	});
}

function cleanup() {
	evilfiles.forEach(function(f){
		fs.unlink(f.file);
	});
	testfiles.forEach(function(f){
		fs.unlink(f);
	});
	console.log("-----------------------------------------------------\n" +
		"-----------------------------------------------------\n" +
		"Script finished running. See console log messages for results.")
}

runChaos();
