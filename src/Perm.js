/**
 * Created by Dana Zhang on 10/11/15.
 */

function permAlone(str) {
    var perms = [];

    if (!str) {
        return 0;
    }
    getPerm('', str);

    function swap (s, i, j) {
        var temp = s[i];
        s[i] = s[j];
        s[j] = temp;
    }

    function getPerm (permed, remaindar) {
        if (!remaindar){
            perms.push(permed);
        }
        for (var i = 0; i < remaindar.length; ++i) {
            swap(remaindar, 0, i);
            getPerm(permed + remaindar[i], remaindar.substring(0, i) + remaindar.substring(i + 1));
        }
    }

    var reg = /(.)\1+/g;
    function filter(a) {
        return !a.match(reg);
    }

    perms = perms.filter(filter);

    return perms.length;
}

//permAlone('abcdddefg');
exports.permAlone = permAlone;