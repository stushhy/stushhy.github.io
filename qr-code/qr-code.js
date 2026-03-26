/**
 *  https://thonky.com/qr-code-tutorial
 *  https://www.reddit.com/r/programming/comments/9th8a7/creating_a_qr_code_step_by_step/
 *  https://www.nayuki.io/page/creating-a-qr-code-step-by-step
 * 
 *  1. 입력 받기
 *  2. 인코딩 방식 결정
 *  2-1. number? -> alphanumeric table? -> byte mode (사실 거의 다 byte mode로 직행할 것 같긴한데;;)
 *  3. Error Correction Level 결정. (7%를 디폴트로 두고, 사용자가 specify 하는 경우에만 다른 level 적용.)
 *  4. 인코딩 방식에 따라 인코딩.
 *  5. IMIndicator(4-bit) + CCIndicator(n-bit) + 인코딩 결과 의 총 비트 수 세기
 *  4. 캐릭터 수를 세고, 인코딩 방식 + EC level 에 따라 QR version 결정. (binary search?)
 *  4-1. 사실 byte mode + 최대 EC로 해도 1273 글자를 담기 때문에.... 인코딩 방식을 byte mode로 고정시켜도 될듯함// 근데 연습용으로 하나하나 해보자 ㅇㅇ.
 *  5. 인코딩 방식 indicator (QR version에 상관없이 4bit) + 캐릭터 수 indicator (인코딩 방식 + QR version에 따라 n-bit 정수)
 *  6. 인코딩 방식에 따라 인코딩. 
 */
import { ECP, ECCtable, makeECC } from "./ECC.js";

const IMIndicator = Object.freeze({
    numeric: '0001',
    alphanumeric: '0010',
    byte: '0100'
})

const CCIndicatorLength = Object.freeze({
    numeric: [10, 12, 14],
    alphanumeric: [9, 11, 13],
    byte: [8, 16, 16]
})

const alnumTable = Object.freeze({
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    'A': 10,
    'B': 11,
    'C': 12,
    'D': 13,
    'E': 14,
    'F': 15,
    'G': 16,
    'H': 17,
    'I': 18,
    'J': 19,
    'K': 20,
    'L': 21,
    'M': 22,
    'N': 23,
    'O': 24,
    'P': 25,
    'Q': 26,
    'R': 27,
    'S': 28,
    'T': 29,
    'U': 30,
    'V': 31,
    'W': 32,
    'X': 33,
    'Y': 34,
    'Z': 35,
    ' ': 36,
    '$': 37,
    '%': 38,
    '*': 39,
    '+': 40,
    '-': 41,
    '.': 42,
    '/': 43,
    ':': 44,
})

function num인코딩(string) {
    let result = '';
    for (let i = 0; i < Math.floor(string.length / 3); i++) {
        let temp = 0;
        for (let j = 0; j < 3; j++) {
            temp += Number(string[i * 3 + j]) * (10 ** (2 - j));
        }
        if (temp < 10) {
            // temp를 4자리 binary로 변환하고 result에 추가
            result += n비트로변환(temp, 4);
        } else if (temp < 100) {
            // temp를 7자리 binary로 변환하고 result에 추가
            result += n비트로변환(temp, 7);
        } else {
            // temp를 10자리 binary로 변환하고 result에 추가
            result += n비트로변환(temp, 10);
        }
    }
    let temp = 0;
    for (let i = 1; i <= string.length % 3; i++) {
        temp += Number(string[string.length - i]) * (10 ** (i - 1));
    }
    if (temp < 10) {
        // temp를 4자리 binary로 변환하고 result에 추가
        result += n비트로변환(temp, 4);
    } else {
        // temp를 7자리 binary로 변환하고 result에 추가
        result += n비트로변환(temp, 7);
    }

    return result;
}

function alnum인코딩(string) {
    let result = '';
    for (let i = 0; i < Math.floor(string.length / 2); i++) {
        let temp = alnumTable[string[i * 2]] * 45 + alnumTable[string[i * 2 + 1]]
        // temp를 11자리 binary로 변환하고 result에 추가
        result += n비트로변환(temp, 11);
    }
    if (string.length % 2 === 1) {
        let temp = alnumTable[string[string.length - 1]];
        // temp를 6자리 binary로 변환하고 result에 추가
        result += n비트로변환(temp, 6);
    }
    return result;
}

function byte인코딩(string) {
    let result = '';
    for (let i = 0; i < string.length; i++) {
        let code = string.codePointAt(i);
        if (code === undefined) { throw new Error(`지원하지 않는 문자가 존재합니다. Index: ${i}`); }
        else if (0 <= code && code <= 127) { result += n비트로변환(code, 8); }
        else if (128 <= code && code <= 2047) {
            let temp = n비트로변환(code, 11);
            result = result + '110' + temp.slice(0, 5) + '10' + temp.slice(5, 11);
        }
        else if (2048 <= code && code <= 65535) {
            let temp = n비트로변환(code, 16);
            result = result + '1110' + temp.slice(0, 4) + '10' + temp.slice(4, 10) + '10' + temp.slice(10, 16);
        }
        else if (65536 <= code && code <= 1114111) {
            let temp = n비트로변환(code, 21);
            result = result + '11110' + temp.slice(0, 3)
                + '10' + temp.slice(3, 9)
                + '10' + temp.slice(9, 15)
                + '10' + temp.slice(15, 21);
            i++; // surrogate pair를 건너뛰기 위한 처리 (이렇게 해도 되는건가? ㅋㅋㅋ)
        }
    }
    return result;
}

const 최대워드수 = Object.freeze({
    'L': {
        1: 19,
        2: 34,
        3: 55,
        4: 80,
        5: 108,
        6: 136,
        7: 156,
        8: 194,
        9: 232,
        10: 274,
        11: 324,
        12: 370,
        13: 428,
        14: 461,
        15: 523,
        16: 589,
        17: 647,
        18: 721,
        19: 795,
        20: 861,
        21: 932,
        22: 1006,
        23: 1094,
        24: 1174,
        25: 1276,
        26: 1370,
        27: 1468,
        28: 1531,
        29: 1631,
        30: 1735,
        31: 1843,
        32: 1955,
        33: 2071,
        34: 2191,
        35: 2306,
        36: 2434,
        37: 2566,
        38: 2702,
        39: 2812,
        40: 2956,
    },
    'M': {
        1: 16,
        2: 28,
        3: 44,
        4: 64,
        5: 86,
        6: 108,
        7: 124,
        8: 154,
        9: 182,
        10: 216,
        11: 254,
        12: 290,
        13: 334,
        14: 365,
        15: 415,
        16: 453,
        17: 507,
        18: 563,
        19: 627,
        20: 669,
        21: 714,
        22: 782,
        23: 860,
        24: 914,
        25: 1000,
        26: 1062,
        27: 1128,
        28: 1193,
        29: 1267,
        30: 1373,
        31: 1455,
        32: 1541,
        33: 1631,
        34: 1725,
        35: 1812,
        36: 1914,
        37: 1992,
        38: 2102,
        39: 2216,
        40: 2334,
    },
    'Q': {
        1: 13,
        2: 22,
        3: 34,
        4: 48,
        5: 62,
        6: 76,
        7: 88,
        8: 110,
        9: 132,
        10: 154,
        11: 180,
        12: 206,
        13: 244,
        14: 261,
        15: 295,
        16: 325,
        17: 367,
        18: 397,
        19: 445,
        20: 485,
        21: 512,
        22: 568,
        23: 614,
        24: 664,
        25: 718,
        26: 754,
        27: 808,
        28: 871,
        29: 911,
        30: 985,
        31: 1033,
        32: 1115,
        33: 1171,
        34: 1231,
        35: 1286,
        36: 1354,
        37: 1426,
        38: 1502,
        39: 1582,
        40: 1666,
    },
    'H': {
        1: 9,
        2: 16,
        3: 26,
        4: 36,
        5: 46,
        6: 60,
        7: 66,
        8: 86,
        9: 100,
        10: 122,
        11: 140,
        12: 158,
        13: 180,
        14: 197,
        15: 223,
        16: 253,
        17: 283,
        18: 313,
        19: 341,
        20: 385,
        21: 406,
        22: 442,
        23: 464,
        24: 514,
        25: 538,
        26: 596,
        27: 628,
        28: 661,
        29: 701,
        30: 745,
        31: 793,
        32: 845,
        33: 901,
        34: 961,
        35: 986,
        36: 1054,
        37: 1096,
        38: 1142,
        39: 1222,
        40: 1276,
    }
})

function n비트로변환(num, n) {
    let result = '';
    for (let i = 0; i < n; i++) {
        if (num % 2 === 1) {
            result = '1' + result;
        }
        else {
            result = '0' + result;
        }
        num = Math.floor(num / 2);
    }
    return result;
}

function 넘버표현가능(string) {
    for (let char of string) {
        if (char > '9' || '0' > char) {
            return false;
        }
    }
    return true;
}

function 알넘표현가능(string) {
    for (let char of string) {
        if (!alnumTable[char] && char !== '0') {
            return false;
        }
    }
    return true;
}

function 나머지비트(버전) {
    if (버전 === 1) { return ''; }
    else if (2 <= 버전 && 버전 <= 6) { return '0000000'; }
    else if (7 <= 버전 && 버전 <= 13) { return ''; }
    else if (14 <= 버전 && 버전 <= 20) { return '000'; }
    else if (21 <= 버전 && 버전 <= 27) { return '0000'; }
    else if (28 <= 버전 && 버전 <= 34) { return '000'; }
    else { return ''; }
}

const 정렬패턴위치 = Object.freeze({
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
    11: [6, 30, 54],
    12: [6, 32, 58],
    13: [6, 34, 62],
    14: [6, 26, 46, 66],
    15: [6, 26, 48, 70],
    16: [6, 26, 50, 74],
    17: [6, 30, 54, 78],
    18: [6, 30, 56, 82],
    19: [6, 30, 58, 86],
    20: [6, 34, 62, 90],
    21: [6, 28, 50, 72, 94],
    22: [6, 26, 50, 74, 98],
    23: [6, 30, 54, 78, 102],
    24: [6, 28, 54, 80, 106],
    25: [6, 32, 58, 84, 110],
    26: [6, 30, 58, 86, 114],
    27: [6, 34, 62, 90, 118],
    28: [6, 26, 50, 74, 98, 122],
    29: [6, 30, 54, 78, 102, 126],
    30: [6, 26, 52, 78, 104, 130],
    31: [6, 30, 56, 82, 108, 134],
    32: [6, 34, 60, 86, 112, 138],
    33: [6, 30, 58, 86, 114, 142],
    34: [6, 34, 62, 90, 118, 146],
    35: [6, 30, 54, 78, 102, 126, 150],
    36: [6, 24, 50, 76, 102, 128, 154],
    37: [6, 28, 54, 80, 106, 132, 158],
    38: [6, 32, 58, 84, 110, 136, 162],
    39: [6, 26, 54, 82, 110, 138, 166],
    40: [6, 30, 58, 86, 114, 142, 170],
});

const 탐색패턴 = [[1, 1, 1, 1, 1, 1, 1],
[1, 0, 0, 0, 0, 0, 1],
[1, 0, 1, 1, 1, 0, 1],
[1, 0, 1, 1, 1, 0, 1],
[1, 0, 1, 1, 1, 0, 1],
[1, 0, 0, 0, 0, 0, 1],
[1, 1, 1, 1, 1, 1, 1]]

const 정렬패턴 = [[1, 1, 1, 1, 1],
[1, 0, 0, 0, 1],
[1, 0, 1, 0, 1],
[1, 0, 0, 0, 1],
[1, 1, 1, 1, 1]]

const 버전정보스트링 = Object.freeze({
    7: [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    8: [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0],
    9: [0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1],
    10: [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1],
    11: [0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    12: [0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0],
    13: [0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1],
    14: [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    15: [0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
    16: [0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0],
    17: [0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
    18: [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1],
    19: [0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    20: [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0],
    21: [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1],
    22: [0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1],
    23: [0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0],
    24: [0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0],
    25: [0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
    26: [0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    27: [0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0],
    28: [0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0],
    29: [0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    30: [0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    31: [0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    32: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    33: [1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    34: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0],
    35: [1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
    36: [1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1],
    37: [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0],
    38: [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0],
    39: [1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    40: [1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1],
});

const 포맷스트링 = Object.freeze({
    L: {
        0: [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0],
        1: [1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1],
        2: [1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
        3: [1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1],
        4: [1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1],
        5: [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0],
        6: [1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        7: [1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    },
    M: {
        0: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
        1: [1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
        2: [1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0],
        3: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1],
        4: [1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1],
        5: [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0],
        6: [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1],
        7: [1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    },
    Q: {
        0: [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        1: [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0],
        2: [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
        3: [0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        4: [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
        5: [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1],
        6: [0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
        7: [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
    },
    H: {
        0: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        1: [0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
        2: [0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1],
        3: [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
        4: [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0],
        5: [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        6: [0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0],
        7: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1],
    }
});

function 고정패턴입력(mat, 버전) {
    let 사이즈 = mat.length;
    // 1. finder 패턴
    function 탐색패턴넣기(mat, row, col) {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                mat[row + i][col + j] = 탐색패턴[i][j];
            }
        }
    }
    탐색패턴넣기(mat, 0, 0);
    탐색패턴넣기(mat, 0, 사이즈 - 7);
    탐색패턴넣기(mat, 사이즈 - 7, 0);

    // 2. separators 넣기
    for (let i = 0; i < 8; i++) {
        mat[7][i] = 0;
        mat[7][사이즈 - 8 + i] = 0;
        mat[i][7] = 0;
        mat[사이즈 - 8 + i][7] = 0;
        mat[사이즈 - 8][i] = 0;
        mat[i][사이즈 - 8] = 0;
    }

    // 3. 정렬패턴
    if (버전 >= 2) {
        function 정렬패턴넣기(mat, row, col) {
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    mat[row + i][col + j] = 정렬패턴[i][j];
                }
            }
        }
        let 위치 = 정렬패턴위치[버전];
        for (let i = 0; i < 위치.length; i++) {
            for (let j = 0; j < 위치.length; j++) {
                if (i === 0 && (j === 0 || j === 위치.length - 1)) { continue; }  //젤 윗줄 탐색패턴 건너뛰기
                if (i === 위치.length - 1 && j === 0) { continue; }             //젤 밑줄 탐색패턴 건너뛰기
                정렬패턴넣기(mat, 위치[i] - 2, 위치[j] - 2)
            }
        }
    }

    // 마스킹선택() 함수에서 포맷 스트링을 넣은 이후에 데이터가 입력되기 때문에 여기서 reserve 해줄 필요가 없음.
    // // 4. 예약공간에 미리 '1' 넣어두기.
    // for(let i=0;i<8;i++){
    //     mat[8][i] = '1';
    //     mat[8][사이즈-8+i] = '1';
    //     mat[i][8] = '1';
    //     mat[사이즈-8+i][8] = '1';
    // }
    // mat[8][8] = '1';

    // 버전 정보 채워넣기
    if (버전 >= 7) {
        let 버전정보 = 버전정보스트링[버전];
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                mat[사이즈 - 9 - j][5 - i] = 버전정보[i * 3 + j];
                mat[5 - i][사이즈 - 9 - j] = 버전정보[i * 3 + j];
            }
        }
    }

    // 까만 점 찍기.
    mat[사이즈 - 8][8] = 1;

    // 5. timing 패턴
    for (let i = 6; i < 사이즈 - 8; i++) {
        if (i % 2 === 0) {
            mat[6][i] = 1;
            mat[i][6] = 1;
        } else {
            mat[6][i] = 0;
            mat[i][6] = 0;
        }
    }

    // 고정 패턴을 모두 입력함.
}

function 데이터입력(mat, 데이터) {
    let 사이즈 = mat.length;
    let k = 0;
    for (let 반복수 = 0; 반복수 < (사이즈 - 7) / 2; 반복수++) {
        if (반복수 % 2 === 0) {
            //위로 지그재그
            for (let row = 사이즈 - 1; row >= 0; row--) {
                for (let col = 사이즈 - 1 - 2 * 반복수; col > 사이즈 - 3 - 2 * 반복수; col--) {
                    if (mat[row][col] === 3) {
                        mat[row][col] = Number(데이터[k]);
                        k++;
                    } else if (mat[row][col] === 2) {
                        if (데이터[k] === '0') { mat[row][col] = 1; }
                        else { mat[row][col] = 0; }
                        k++;
                    }
                }
            }
        }
        else {
            //아래로 지그재그
            for (let row = 0; row <= 사이즈 - 1; row++) {
                for (let col = 사이즈 - 1 - 2 * 반복수; col > 사이즈 - 3 - 2 * 반복수; col--) {
                    if (mat[row][col] === 3) {
                        mat[row][col] = Number(데이터[k]);
                        k++;
                    } else if (mat[row][col] === 2) {
                        if (데이터[k] === '0') { mat[row][col] = 1; }
                        else { mat[row][col] = 0; }
                        k++;
                    }
                }
            }
        }
    }
    //timing pattern 건너뛰고, 다시 반복
    for (let 반복수 = 0; 반복수 < 3; 반복수++) {
        if (반복수 % 2 === 1) {
            //위로 지그재그
            for (let row = 사이즈 - 1; row >= 0; row--) {
                for (let col = 5 - 2 * 반복수; col > 3 - 2 * 반복수; col--) {
                    if (mat[row][col] === 3) {
                        mat[row][col] = Number(데이터[k]);
                        k++;
                    } else if (mat[row][col] === 2) {
                        if (데이터[k] === '0') { mat[row][col] = 1; }
                        else { mat[row][col] = 0; }
                        k++;
                    }
                }
            }
        }
        else {
            //아래로 지그재그
            for (let row = 0; row <= 사이즈 - 1; row++) {
                for (let col = 5 - 2 * 반복수; col > 3 - 2 * 반복수; col--) {
                    if (mat[row][col] === 3) {
                        mat[row][col] = Number(데이터[k]);
                        k++;
                    } else if (mat[row][col] === 2) {
                        if (데이터[k] === '0') { mat[row][col] = 1; }
                        else { mat[row][col] = 0; }
                        k++;
                    }
                }
            }
        }
    }
}

function 마스킹점수(mat) {
    //1. 5개연속 (+3) 이후 추가 연속마다 (+1) for each 행,열
    //2. 2x2 (+3) for all pixel
    //3. 10111010000 또는 00001011101 (+40) for each 행,열
    //4. (총 검은색 개수)/(총 픽셀 개수)*100 어쩌고. 모든 픽셀
    let 사이즈 = mat.length;
    let 패턴1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    let 패턴2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    let 연속 = 1;
    let 이전픽셀 = null;
    let 검은색 = 0;
    let 점수 = 0;
    for (let row = 0; row < 사이즈; row++) {
        for (let col = 0; col < 사이즈; col++) {
            let 현재픽셀 = mat[row][col];
            검은색 += 현재픽셀; //4번
            //2번
            if ((row < 사이즈 - 1) && (col < 사이즈 - 1)) {
                if ((현재픽셀 + mat[row + 1][col] + mat[row][col + 1] + mat[row + 1][col + 1] === 0) || (현재픽셀 + mat[row + 1][col] + mat[row][col + 1] + mat[row + 1][col + 1] === 4)) {
                    점수 += 3;
                }
            }
            //3번, 행
            if (col <= 사이즈 - 11) {
                if (mat[row].slice(col, col + 11).every((x, i) => x === 패턴1[i])) { 점수 += 40; }
                else if (mat[row].slice(col, col + 11).every((x, i) => x === 패턴2[i])) { 점수 += 40; }
            }
            //1번, 행
            if (이전픽셀 === 현재픽셀) { 연속++; }
            else {
                점수 += (연속 >= 5 ? 연속 - 2 : 0);
                연속 = 1;
            }
            이전픽셀 = 현재픽셀;
        }
        점수 += (연속 >= 5 ? 연속 - 2 : 0);
        연속 = 0;
    }
    let 검은색비율 = 검은색 / (사이즈 * 사이즈) * 100;
    if (검은색비율 % 5 === 0) {
        점수 += Math.min(Math.abs((검은색비율 / 5 - 1) - 10), Math.abs((검은색비율 / 5 + 1) - 10)) * 10;
    } else {
        점수 += Math.min(Math.abs(Math.floor(검은색비율 / 5) - 10), Math.abs(Math.ceil(검은색비율 / 5) - 10)) * 10;
    }

    이전픽셀 = null;
    연속 = 1;
    for (let col = 0; col < 사이즈; col++) {
        for (let row = 0; row < 사이즈; row++) {
            let 현재픽셀 = mat[row][col];
            //3번, 열
            if (row <= 사이즈 - 11) {
                let 영역 = [];
                for (let i = 0; i < 11; i++) { 영역.push(mat[row + i][col]); }
                if (영역.every((x, i) => x === 패턴1[i])) { 점수 += 40; }
                else if (영역.every((x, i) => x === 패턴2[i])) { 점수 += 40; }
            }
            //1번, 열
            if (이전픽셀 === 현재픽셀) { 연속++; }
            else {
                점수 += (연속 >= 5 ? 연속 - 2 : 0);
                연속 = 1;
            }
            이전픽셀 = 현재픽셀;
        }
        점수 += (연속 >= 5 ? 연속 - 2 : 0);
        연속 = 0;
    }
    return 점수;
}

/**
 * 필수패턴만 입력된 행렬에 마스킹을 적용하고, 데이터를 넣고, 점수를 계산한다. 
 * 이를 모든 마스킹 버전에 대해 수행하고 최적행렬을 결정, 반환한다.
 * @param mat 필수패턴만 입력된 상태의 행렬
 * @returns 최적행렬
 */
function 마스킹선택(mat, ECCL, 데이터) {
    let 사이즈 = mat.length;
    let 최적행렬;
    let 최적점수 = Infinity;
    for (let 마스킹버전 = 0; 마스킹버전 <= 7; 마스킹버전++) {
        let newMat = mat.map((x) => [...x]);
        // 포맷스트링 넣기
        for (let i = 0; i < 6; i++) {
            newMat[8][i] = 포맷스트링[ECCL][마스킹버전][i];
            newMat[i][8] = 포맷스트링[ECCL][마스킹버전][14 - i];
            newMat[8][사이즈 - 1 - i] = 포맷스트링[ECCL][마스킹버전][14 - i];
            newMat[사이즈 - 1 - i][8] = 포맷스트링[ECCL][마스킹버전][i];
        }
        newMat[8][7] = 포맷스트링[ECCL][마스킹버전][6];
        newMat[사이즈 - 7][8] = 포맷스트링[ECCL][마스킹버전][6];
        [newMat[8][8], newMat[7][8]] = [포맷스트링[ECCL][마스킹버전][7], 포맷스트링[ECCL][마스킹버전][8]];
        [newMat[8][사이즈 - 8], newMat[8][사이즈 - 7]] = [포맷스트링[ECCL][마스킹버전][7], 포맷스트링[ECCL][마스킹버전][8]];

        //마스킹적용
        switch (마스킹버전) {
            case 0: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if ((row + col) % 2 === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 1: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if ((row) % 2 === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 2: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if ((col) % 3 === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 3: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if ((row + col) % 3 === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 4: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if ((Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 5: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if (((row * col) % 2) + ((row * col) % 3) === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 6: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if ((((row * col) % 2) + ((row * col) % 3)) % 2 == 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
            case 7: {
                for (let row = 0; row < 사이즈; row++) {
                    for (let col = 0; col < 사이즈; col++) {
                        if (((row + col) % 2) + ((row * col) % 3) === 0 && newMat[row][col] === 3) {
                            newMat[row][col] = 2;
                        }
                    }
                }
                break;
            }
        }

        //데이터입력
        데이터입력(newMat, 데이터);
        //점수계산 및 최적행렬 업데이트
        let 현재점수 = 마스킹점수(newMat, 사이즈);
        if (최적점수 > 현재점수) {
            최적점수 = 현재점수;
            최적행렬 = newMat.map((x) => [...x]);
        }
    }
    return 최적행렬;
}

function 여유공간만들기(mat){
    let 사이즈 = mat.length;
    let newMat = Array(사이즈+8).fill().map(()=>Array(사이즈+8).fill(0));
    for(let r=4;r<사이즈+4;r++){
        for(let c=4;c<사이즈+4;c++){
            newMat[r][c] = mat[r-4][c-4];
        }
    }
    return newMat;
}

function QRcodeGenerate(ECCL) {
    //인풋 받기
    let 결과비트 = '';
    let 인풋 = document.getElementById('userText').value;
    let 버전 = 5;
    let 인코딩방식;
    let 인코딩결과;
    let 필수워드수;
    let 글자수;
    let 글자수비트;


    //인코딩 방식 결정
    if (넘버표현가능(인풋)) {
        인코딩방식 = 'numeric';
    } else if (알넘표현가능(인풋)) {
        인코딩방식 = 'alphanumeric';
    } else {
        인코딩방식 = 'byte';
    }

    //인코딩 방식에 따라 인코딩
    if (인코딩방식 === 'numeric') {
        인코딩결과 = num인코딩(인풋);
        글자수 = 인풋.length;
    } else if (인코딩방식 === 'alphanumeric') {
        인코딩결과 = alnum인코딩(인풋);
        글자수 = 인풋.length;
    } else if (인코딩방식 === 'byte') {
        인코딩결과 = byte인코딩(인풋);
        글자수 = Math.ceil(인코딩결과.length / 8);
    } else {
        throw new Error('인코딩 방식 설정 과정에서 에러');
    }

    //버전 결정
    필수워드수 = CCIndicatorLength[인코딩방식].map(x => Math.ceil((x + 인코딩결과.length + 4) / 8));
    for (버전 = 1; 버전 < 41; 버전++) {
        if (버전 <= 9 && 필수워드수[0] <= 최대워드수[ECCL][버전]) {
            글자수비트 = n비트로변환(글자수, CCIndicatorLength[인코딩방식][0]);
            break;
        } else if (10 <= 버전 && 버전 <= 26 && 필수워드수[1] <= 최대워드수[ECCL][버전]) {
            글자수비트 = n비트로변환(글자수, CCIndicatorLength[인코딩방식][1]);
            break;
        } else if (27 <= 버전 && 필수워드수[2] <= 최대워드수[ECCL][버전]) {
            글자수비트 = n비트로변환(글자수, CCIndicatorLength[인코딩방식][2]);
            break;
        }
    }

    //최대 4개의 terminator 추가.
    let 필수비트 = IMIndicator[인코딩방식] + 글자수비트 + 인코딩결과;
    let 더채울비트수 = 최대워드수[ECCL][버전] * 8 - 필수비트.length;
    if (더채울비트수 <= 4) {
        결과비트 = 필수비트;
        for (let i = 0; i < 더채울비트수; i++) {
            결과비트 += '0';
        }
    } else {
        결과비트 = 필수비트 + '0000';
    }

    //비트 수를 8의 배수로 맞추기
    for (let i = 0; i < 결과비트.length % 8; i++) {
        결과비트 += '0';
    }

    //pad bytes 넣기
    더채울비트수 = 최대워드수[ECCL][버전] * 8 - 결과비트.length;
    if (더채울비트수 % 8 !== 0) { throw new Error('비트 채워넣는 과정에서 에러?'); }
    for (let i = 0; i < 더채울비트수 / 8; i++) {
        if (i % 2 == 0) { 결과비트 += '11101100'; }
        else { 결과비트 += '00010001'; }
    }

    //워드 단위로 분할
    let 결과워드 = [];
    for (let i = 0; i < 최대워드수[ECCL][버전]; i++) {
        결과워드.push(결과비트.slice(i * 8, i * 8 + 8));
    }

    //ECC table 참고하여 적절한 분할
    //그룹 1의 블럭 수, 그 블럭 당 워드 수, 그룹 2의 블럭 수, 그 블럭 당 워드 수
    let [블럭당에러워드수, 그룹1블럭수, 그룹1블럭당워드수, 그룹2블럭수, 그룹2블럭당워드수] = ECCtable[버전][ECCL];
    let ECParr = ECP(블럭당에러워드수);
    let 분할된워드 = [];
    for (let i = 0; i < 그룹1블럭수; i++) {
        분할된워드.push([...결과워드.slice(i * 그룹1블럭당워드수, (i + 1) * 그룹1블럭당워드수)]);
    }
    for (let i = 0; i < 그룹2블럭수; i++) {
        분할된워드.push([...결과워드.slice(그룹1블럭수 * 그룹1블럭당워드수 + i * 그룹2블럭당워드수, 그룹1블럭수 * 그룹1블럭당워드수 + (i + 1) * 그룹2블럭당워드수)]);
    }

    //각 블럭당 에러워드 만들기
    let 에러워드 = [];
    for (let i = 0; i < 그룹1블럭수; i++) {
        에러워드.push(makeECC(분할된워드[i], 그룹1블럭당워드수, ECParr, 블럭당에러워드수));
    }
    for (let i = 0; i < 그룹2블럭수; i++) {
        에러워드.push(makeECC(분할된워드[그룹1블럭수 + i], 그룹2블럭당워드수, ECParr, 블럭당에러워드수));
    }

    //잘 배열해서 최종 데이터 비트 만들기
    let 최종내용비트 = '';
    for (let i = 0; i < Math.min(그룹1블럭당워드수, 그룹2블럭당워드수); i++) {
        for (let j = 0; j < 그룹1블럭수 + 그룹2블럭수; j++) {
            최종내용비트 += 분할된워드[j][i];
        }
    }
    if (그룹1블럭당워드수 > 그룹2블럭당워드수) {
        for (let i = 그룹2블럭당워드수; i < 그룹1블럭당워드수; i++) {
            for (let j = 0; j < 그룹1블럭수; j++) {
                최종내용비트 += 분할된워드[j][i];
            }
        }
    } else if (그룹1블럭당워드수 < 그룹2블럭당워드수) {
        for (let i = 그룹1블럭당워드수; i < 그룹2블럭당워드수; i++) {
            for (let j = 그룹1블럭수; j < 그룹1블럭수 + 그룹2블럭수; j++) {
                최종내용비트 += 분할된워드[j][i];
            }
        }
    }
    let 최종에러비트 = '';
    for (let i = 0; i < 블럭당에러워드수; i++) {
        for (let j = 0; j < 그룹1블럭수 + 그룹2블럭수; j++) {
            최종에러비트 += n비트로변환(에러워드[j][i], 8);
        }
    }

    let 최종비트 = 최종내용비트 + 최종에러비트 + 나머지비트(버전);
    
    // 행렬에 담기
    let 사이즈QR = (버전 - 1) * 4 + 21;
    let 초기행렬 = Array(사이즈QR).fill(3).map(() => Array(사이즈QR).fill(3))
    고정패턴입력(초기행렬, 버전);
    let 최종행렬 = 여유공간만들기(마스킹선택(초기행렬, ECCL, 최종비트));

    const scale = 10;
    const canvas = document.createElement('canvas');
    canvas.width = (사이즈QR+8) * scale;
    canvas.height = (사이즈QR+8) * scale;
    const ctx = canvas.getContext('2d');
    for(let r=0;r<(사이즈QR+8);r++){
        for(let c=0;c<(사이즈QR+8);c++){
            ctx.fillStyle = 최종행렬[r][c]===0 ? "#FFFFFF" : "#000000";
            ctx.fillRect(c*scale, r*scale, scale, scale);
        }
    }
    document.getElementById("qr-code").src = canvas.toDataURL('image/png');
    document.getElementById("QRprop").innerHTML = `버전: ${버전} ------- 에러 수정 정도: ${ECCL}`;
    console.log(최종비트);
}

export {QRcodeGenerate};