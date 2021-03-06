# How to run this script
### Installation
1. Clone the repo
2. Get the latest version of NodeJS
3. Install dependency modules using command: `npm install`
4. Change working directory to `/path/to/chaos/`
5. Run `node ChaoticGrader.js -r /specify/path/to/src/root -s /path/to/srcdir -t /path/to/test/file` (For instance, command to run the example in this repo: `node ChaoticGrader.js -r examples/cashdrawer/ -s examples/cashdrawer/src -t examples/cashdrawer/test/test.js`)

### Running Test Coverage Tool
1. Install Istanbul as root/admin with `npm install -g istanbul`
2. Change working directory to `/path/to/chaos/`
3. Run `istanbul cover node_modules/mocha/bin/_mocha -- -R spec`
4. Open `coverage/lcov-report/index.html`
