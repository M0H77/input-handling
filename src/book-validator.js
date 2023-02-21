const sanitizeHTML = require('sanitize-html');


function sum(a, b) {
    return a + b;
}


module.exports = {
    sum,
    isTitle,
    countPages,
    cleanPageNum,
    isSameTitle,
    cleanForHTML,
};

/*
  Valid book titles in this situation can include:
    - Cannot be any form of "Boaty McBoatface", case insensitive
    - English alphabet characters
    - Arabic numerals
    - Spaces, but no other whitespace like tabs or newlines
    - Quotes, both single and double
    - Hyphens
    - No leading or trailing whitespace
    - No newlines or tabs
*/
const blocklist = ["Boaty McBoatface"];
const whitelist = [/[\d]+/, /^[\p{Letters}\w]+$/, /[\-]+/, /[\']/, /[\"]+/, /[ ]/, /[\u00F1-\u036f]+/g]


function isTitle(str) {
    if (typeof str === 'string' || str instanceof String) {
        return blocklist.some((x) => x.toLowerCase() != str.toLowerCase()) && whitelist.some((x) => x.test(str)) && str.trim() == str;
    }

    else {
        return false;
    }
}


function isSameTitle(strA, strB) {
    if ((typeof strA === 'string' || strA instanceof String) && (typeof strB === 'string' || strB instanceof String)) {
        if (strA.trim().normalize('NFD').replace(/([\u0300-\u036f])/g, '') === strB.trim().normalize('NFD').replace(/([\u0300-\u036f])/g, '')) {
            return true;
        } else if (strA.normalize('NFKD').replace(/([\u00E6])/g, 'ae') === strB.normalize('NFKD').replace(/([\u00E6])/g, 'ae')) {
            return true;
        } else if (strA.normalize('NFKD').replace(/([\u202E])/g, '') === strB.normalize('NFKD').replace(/([\u202E])/g, '')) {
            return true;
        } else {
            return false;
        }
    }
    else {
        return false;
    }
}


/*
  Perform a best-effort cleansing of the page number.
  Given: a raw string
  Returns: an integer, ignoring leading and trailing whitespace. And it can have p in front of it.
*/
function cleanPageNum(rawStr) {
    pageNum = rawStr.replace(/[\s]/g, '')
    if (!(pageNum.match(/^p\d+$/) || pageNum.match(/^\d+$/))) {
        return undefined;
    } else {
        return parseInt(pageNum.replace('p', ''))
    }
}


/*
  Page range string.

  Count, inclusively, the number of pages mentioned in the string.

  This is modeled after the string you can use to specify page ranges in
  books, or in a print dialog.

  Example page ranges, copied from our test cases:
    1          ===> 1 page
    p3         ===> 1 page
    1-2        ===> 2 pages
    10-100     ===> 91 pages
    1-3,5-6,9  ===> 6 pages
    1-3,5-6,p9 ===> 6 pages

  A range that goes DOWN still counts, but is never negative.

  Whitespace is allowed anywhere in the string with no effect.

  If the string is over 1000 characters, return undefined
  If the string returns in NaN, return undefined
  If the string does not properly fit the format, return 0

*/
function countPages(rawStr) {
    let count = 0
    for (const pageRange of rawStr.replace(/[p ]/g, '').split(",")) {
        if (!(pageRange.match(/^\d+-\d+$/) || pageRange.match(/^\d+$/)) || pageRange.length > 1000) {
            return 0;
        }
        if (pageRange.match('-')) {
            min = pageRange.split('-')[0]
            max = pageRange.split('-')[1]
            count += Math.abs(max - min) + 1
            if (count > Number.MAX_SAFE_INTEGER) {
                return undefined;
            }
        } else {
            count++
        }
    }
    return count
}


/*
  Given a string, return another string that is safe for embedding into HTML.
    * Use the sanitize-html library: https://www.npmjs.com/package/sanitize-html
    * Configure it to *only* allow <b> tags and <i> tags
      (Read the README to learn how to do this)
*/
function cleanForHTML(dirty) {
    return sanitizeHTML(dirty.replace(/"/g, '\\x22').replace(/'/g, '\\x27'), { allowedTags: ['b', 'i'], disallowedTagsMode: 'escape' });
}
