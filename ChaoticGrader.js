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
	// regex matching if statements
	var reg = /(\s)?if(\s)?(.)+\)/g,
		ifs = data.match(reg),
		newIfs = [],
		i,
		j;

	for (i = 0; i < ifs.length; ++i) {
		newIfs.push(alterCode(ifs[i]));
		for (j = 0; j < newIfs[i].length; ++j) {
			evilVersions.push({code: data.replace(ifs[i], newIfs[i][j].code), type: newIfs[i][j].type});
		}
	}

	evilVersions.forEach(function(f, i) {
		var filename = srcfilename + i;
		var outputpath = srcfile.replace(srcfilename, filename);
		fs.writeFileSync(outputpath, f.code);
		evilfiles.push({file: outputpath, type: f.type});
		generateTest(srcfilename + i);
		runMocha(i);
	});

}


function alterCode (line) {
	var newLines = [],
		i;
	for (i = 0; i < REGS.length; ++i) {
		var newLine = line.replace(REGS[i], REPLS[i]);
		if (newLines.indexOf(newLine) === -1 && newLine !== line) {
			newLines.push({code: newLine, type: 'Changing "' + line + '" to ' + '"' + newLine + '"'});
		}
	}
	return newLines;
}

function generateTest(srcname) {
	var data = fs.readFileSync(path.join(testfilebackup), 'utf8'),
		re = new RegExp('require.*?' + srcfilename),
		match = data.match(re)[0],
		newdata = data.replace(match, match.replace(srcfilename, srcname)),
		newtestpath = testfile.replace(testfilename, srcname + 'test' + '.js');

	fs.writeFileSync(newtestpath, newdata);
	testfiles.push(newtestpath);

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
		"Tests finished. See console log messages for results.")
}

runChaos();
