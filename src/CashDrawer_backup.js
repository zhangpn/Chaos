/*
Design a cash register drawer function that accepts purchase price as the first argument, payment as the second argument, and cash-in-drawer (cid) as the third argument.
Return the string "Insufficient Funds" if cash-in-drawer is less than the change due. Return the string "Closed" if cash-in-drawer is equal to the change due.

Otherwise, return change in coin and bills, sorted in highest to lowest order.
*/

function getChange(price, cash, cid) {
  var CHANGETYPES = [0.01, 0.05, 0.10, 0.25, 1, 5, 10, 20, 100];
  var change = cash - price; 
  var totalCash = cid.reduce(function(a,b) {
      return ['total', (a[1] + b[1]) * 100 / 100];
  });
  
  if (totalCash[1] < change) {
      return "Insufficient Funds";
  }
  
  if (totalCash[1] === change) {
      return "Closed";
  }
  
  var returnCash = [];
  for (var i = cid.length - 1; i >= 0; --i) {
      var currentChange = change >= cid[i][1] ? cid[i][1] : Math.floor((change / CHANGETYPES[i]).toFixed(2)) * CHANGETYPES[i]; 
      if (currentChange > 0) {
        returnCash.push([cid[i][0], currentChange]);
      }
      change -= currentChange;
      if (parseInt(change * 100) <= 0) {
          break;
      }
  }
  
  // Here is your change, ma'am.
  return returnCash;
}


exports.getChange = getChange;


// Example cash-in-drawer array:
// [['PENNY', 1.01],
// ['NICKEL', 2.05],
// ['DIME', 3.10],
// ['QUARTER', 4.25],
// ['ONE', 90.00],
// ['FIVE', 55.00],
// ['TEN', 20.00],
// ['TWENTY', 60.00],
// ['ONE HUNDRED', 100.00]]

//drawer(3.26, 100.00, [['PENNY', 1.01], ['NICKEL', 2.05], ['DIME', 3.10], ['QUARTER', 4.25], ['ONE', 90.00], ['FIVE', 55.00], ['TEN', 20.00], ['TWENTY', 60.00], ['ONE HUNDRED', 100.00]])