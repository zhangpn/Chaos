/**
 * Created by Dana Zhang on 10/12/15.
 */
var chai = require('chai');
var expect = chai.expect;
var perm = require('../src/Perm');

describe('getChange', function() {


    it ('handles the bad cases correctly', function() {

        var result = perm.permAlone('');
        expect(result).to.equal(0);

        result = perm.permAlone(null);
        expect(result).to.equal(0);

    })

    it ('returns number of correct non-repeated permutations', function() {

        var result = perm.permAlone('abc');
        expect(result).to.be.a('number');
        expect(result).to.equal(6);

        result = perm.permAlone('aab');
        expect(result).to.equal(2);

        result = perm.permAlone('aaa');
        expect(result).to.equal(0);

        result = perm.permAlone('aabb');
        expect(result).to.equal(8);

        result = perm.permAlone('abcdefa');
        expect(result).to.equal(3600);

        result = perm.permAlone('abfdefa');
        expect(result).to.equal(2640);

        result = perm.permAlone('zzzzzzz');
        expect(result).to.equal(0);
    })
})
