var chai = require('chai');
var expect = require('chai').expect;
var drawer = require('../src/CashDrawer');

describe('getChange', function() {

	var price = 3.26;
	var cash = 100.00;
	var cid = [['PENNY', 1.01], ['NICKEL', 2.05], ['DIME', 3.10], ['QUARTER', 4.25], 
	['ONE', 90.00], ['FIVE', 55.00], ['TEN', 20.00], ['TWENTY', 60.00], ['ONE HUNDRED', 100.00]];

	var change = drawer.getChange(price, cash, cid);

	it ('returns the right amount of change', function() {

		expect(change).to.be.a('Array');

		var totalChange = change.reduce(function(a,b) {
      		return ['total', (a[1] + b[1]) * 100 / 100];
  		});
		expect(totalChange[1]).to.deep.equal(96.74);

	})

	it ('returns change in the correct format', function() {

		for (var i = 0; i < change.length; ++i) {
			expect(change[i]).to.be.a('Array');
			expect(change[i]).to.have.length(2);
			expect(change[i][0]).to.be.a('string');
			expect(change[i][1]).to.be.a('number');
		}
		expect(change).to.deep.equal([['TWENTY', 60.00], ['TEN', 20.00], ['FIVE', 15], 
			['ONE', 1], ['QUARTER', 0.50], ['DIME', 0.20], ['PENNY', 0.04] ]);
	})

	it ('returns "Insufficient Funds" when not enough cash in drawer', function() {
		change = drawer.getChange(19.50, 20.00, [['PENNY', 0.01], ['NICKEL', 0], ['DIME', 0], ['QUARTER', 0], 
			['ONE', 0], ['FIVE', 0], ['TEN', 0], ['TWENTY', 0], ['ONE HUNDRED', 0]]);
		expect(change).to.deep.equal("Insufficient Funds");

	})

	it ('returns "Closed" when cash in draw equals change', function() {

		change = drawer.getChange(19.50, 20.00, [['PENNY', 0.50], ['NICKEL', 0], ['DIME', 0], ['QUARTER', 0], 
			['ONE', 0], ['FIVE', 0], ['TEN', 0], ['TWENTY', 0], ['ONE HUNDRED', 0]]);
		expect(change).to.deep.equal("Closed");
	}) 

	it ('handles exact change correctly', function () {
		
		change = drawer.getChange(19.50, 19.5, [['PENNY', 0.01], ['NICKEL', 0], ['DIME', 0], ['QUARTER', 0], 
			['ONE', 0], ['FIVE', 0], ['TEN', 0], ['TWENTY', 0], ['ONE HUNDRED', 0]]);
		expect(change).to.deep.equal([]);
	}) 
})