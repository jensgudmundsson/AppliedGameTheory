"use strict";

// VARIABLES AND CONSTANTS

var exercise, exNum, payoffs = [], extPayoffs = {}, signProb, inst, rows = 2, cols = 2, demand = {}, costs = [], costType = 'linear', firms = 2, chance = 'No', unlock, progress, streak = 0, armed = true, players = 3, worth = {};
const eps = 1e-6;

const unlockLimit = 1; // 3
const unlockInit = 99; // 0 

// INTRO PAGE

var coll = document.getElementsByClassName("collapsible");

for (let i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function() {
		for (let j = 0; j < coll.length; j++) {
			if (j === i) continue;
			coll[j].classList.remove("active");
			coll[j].nextElementSibling.style.maxHeight = null;
		}
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight) content.style.maxHeight = null;
		else content.style.maxHeight = content.scrollHeight + "px";
	});
}

// HELPER FUNCTIONS

const $ = id => document.getElementById(id);

const textInput = id => {
	var arr = $(id).value.split('/');
	return arr.length === 1 ? +arr[0] : +arr[0] / +arr[1];
}
const fracToDec = frac => {
    var arr = frac.split('/');
    return arr.length === 1 ? +arr[0] : +arr[0] / +arr[1];
}
const letter = j => String.fromCharCode(65 + j);
const number = j => 1 + j;
const isClose = (a, b, diff = eps) => Math.abs(a - b) < diff;
const isLarger = (a, b, diff = eps) => a > b + diff;
const sum = arr => arr.reduce((a, b) => a + b);
const toText = x => {
    if (x === 2) return 'two';
    if (x === 3) return 'three';
}

function options (x) {
    var n, f, str = '';
    if (x === 'r') {
        n = rows;
        f = number;
    }
    else {
        n = cols;
        f = letter;
    }
    for (let i = 0; i < n; i++) {
        str += '<option value="' + i + '">' + f(i) + '</option>';
    }
    return str;
}

function inputs (x) {
    var n, f, t, str = '';
    if (x === 'r') {
        n = rows;
        f = number;
        t = 'pr';
    }
    else {
        n = cols;
        f = letter;
        t = 'pc';
    }
    for (let i = 0; i < n; i++) { 
        str += ' <input size=5 id="' + t + i + '" placeholder="' + f(i) + '">';
        if (i === n-2 && n === 2) str += ' and ';
        else if (i === n-2 && n > 2) str += ', and ';
        else if (i < n-2) str += ', ';
    }
    return str;
}

const powerset = () => {
	let arr = Array.from(Array(players),(e,i) => i+1).reverse();
	let ps = arr.reduce((a, v) => a.concat(a.map(r => [v].concat(r))), [[]]);
	ps.sort((a,b) => a.length - b.length || a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);
	return ps.filter(val => val[0] != undefined);
}

// PROGESS TRACKING 

function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";" + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

function fetchCookies() {
    unlock = +getCookie('unlock');
    if (!unlock) {
        unlock = unlockInit;
        setCookie('unlock', unlock);
    }
    
    progress = getCookie('progress');
    if (!progress) {
        progress = '000000000000';
        setCookie('progress', progress);
    }
}

function setIcons () {
    ['navWDA', 'navNE', 'navCou', 'navMix', 'navSPNE', 'navStack', 'navImperf', 'navBNE', 'navPBE', 'navSign', 'navCore', 'navShap'].forEach((x,c) => {
        if (c <= unlock) {
            $(x).classList.remove('lock');
            $(x).innerText = '';
        }
		else {
            $(x).classList.add('lock');
            $(x).innerText = 'lock';
        }
        if (progress[c] === 'A') {
            $(x).classList.add('star');
            $(x).innerText = 'star';
        }
    });
}

window.onload = () => {
    fetchCookies();
    setIcons();
}

// FEEDBACK FUNCTIONS

function feedback () {
	$('feedbackFormDiv').classList.remove('hide');
	$('main').classList.add('hide');
	document.addEventListener('click', feedbackClick);
}

function feedbackClick () {
	var isClickInside = $('feedbackForm').contains(event.target) || $('feedback').contains(event.target);
	
	if (!isClickInside) {
		$('feedbackFormDiv').classList.add('hide');
		$('main').classList.remove('hide');
		document.removeEventListener('click', feedbackClick);
	}

	if ($('title').contains(event.target)) {
		$('main').classList.add('hide');
		document.removeEventListener('click', feedbackClick);
	}
}

// DISPLAY FUNCTIONS

function home () {
    exercise = undefined;
	updateTexts();
}

function updateTexts () {
    if (exercise === undefined) {
		$('intro').classList.remove('hide');
		$('main').classList.add('hide');
		$('paramList').innerHTML = '';
		return;
	}
    $('intro').classList.add('hide');
    $('main').classList.remove('hide');

    $('paramList').innerHTML = params[exercise]();
    $('header').innerHTML = headers[exercise];
    $('description').innerHTML = descriptions[exercise];
    $('answer').innerHTML = answers[exercise]();
    $('more').innerHTML = more[exercise];

    if (exercise != 'SPNE' && exercise != 'Imperf' &&  exercise != 'PBE' && exercise != 'Signal') $('instance').innerHTML = inst;
    
    MathJax.typeset();
}

function updateParams() {
    if ($('rowActions')) {
        rows = +$('rowActions').value;
        cols = +$('colActions').value;
    }
    if ($('costType')) costType = $('costType').value;
    if ($('firms')) firms = +$('firms').value;
    if ($('chance')) chance = $('chance').value;
    if ($('players')) players = +$('players').value;
    init(exercise);
}

function init(ex) {
    var temp;
    switch (ex) {
        case 'WDA':		temp = 0; break;
        case 'NE':		temp = 1; break;
        case 'Cou': 	temp = 2; break;
        case 'Mix': 	temp = 3; break;
        case 'SPNE': 	temp = 4; break;
        case 'Stack': 	temp = 5; break;
        case 'Imperf': 	temp = 6; break;
        case 'BNE': 	temp = 7; break;
        case 'PBE': 	temp = 8; break;
        case 'Signal':	temp = 9; break;
        case 'Core': 	temp = 10; break;
        case 'Shap': 	temp = 11; break;
        default: return;
    }

    if (temp > unlock) return;

    armed = true;
    exNum = temp;
    exercise = ex;

    switch (exercise) {
        case 'WDA':
        case 'NE':
        case 'Mix':
            payoffs = generatePayoffs();
            generatePayoffMatrix();
            break;
        case 'Cou':
            generateCournot();
            break;
		case 'SPNE':
			generateSPNE();
			break;
        case 'Stack':
            generateStack();
            break;  
        case 'Imperf':
            generateImperf();
			break;
        case 'BNE':
            generateBNE();
			break;
        case 'PBE':
            generatePBE();
			break;
        case 'Signal':
            generateSignal();
			break;
		case 'Core':
		case 'Shap':
			generateCoalitional();
			break;
    }
    updateTexts();
}

function evaluateAnswer() {
    if (exercise === undefined) return;
    var res;
    switch (exercise) {
        case 'WDA':
            res = evalWDA();
            break;
        case 'NE':
            res = evalNE();
            break;
        case 'Cou':
            res = evalCou();
            break;
        case 'Mix':
            res = evalMix();
            break;
        case 'SPNE':
            res = evalSPNE();
            break;
        case 'Stack':
            res = evalStack();
            break;
        case 'Imperf':
            res = evalImperf();
            break;
        case 'BNE':
            res = evalBNE();
            break;
        case 'PBE':
            res = evalPBE();
            break;
        case 'Signal':
            res = evalSignal();
            break;
		case 'Core':
			res = evalCore();
			break;
		case 'Shap':
			res = evalShapley();
			break;
        case undefined:
            return;
    }
    
    if (armed & res) {
        var t = progress[exNum];
		if (t != 'A') {
        	if (t == '9') t = 'A';
			else t = +t + 1;
		}

        progress = progress.substring(0, exNum) + t + progress.substring(exNum + 1, progress.length);
        setCookie('progress', progress);
    }
    if (armed && exNum == unlock) {
        if (res) streak += 1;
        else streak = 0;
    }
    if (armed && streak >= unlockLimit) {
        unlock += 1;
        setCookie('unlock', unlock);
        streak = 0;
    }
    armed = false;

    res = res ? 'output_right' : 'output_wrong';

	$('output').classList.remove('hide');
    $(res).classList.remove('hide');
    setTimeout( () => $('output').classList.add('vis'), 0);
    setTimeout( () => $('output').classList.remove('vis'), 1500);
    setTimeout( () => $(res).classList.add('hide'), 1700);
    setIcons();
}

// DESCRIPTIONS 

const params = {
    'WDA': () => {
        var str = "<a><span class='text'>Players have <select id='rowActions' onchange='updateParams()'><optgroup label='Row'>";
        [2,3,4,5].forEach(x => {
            if (x === rows) str += "<option selected>" + x + "</option>";
            else str += "<option>" + x + "</option>";
        });
        str +=  "</optgroup></select> and <select id='colActions' onchange='updateParams()'><optgroup label='Column'>";
        [2,3,4,5].forEach(x => {
            if (x === cols) str += "<option selected>" + x + "</option>";
            else str += "<option>" + x + "</option>";
        });
        str += "</optgroup></select> actions</span></a>";
        return str;
    },
    
    'Cou': () => {
        var str = "<a><span class='text'>There are <select id='firms' onchange='updateParams()'>";
        [2,3].forEach(f => {
            str += '<option ';
            if (f === firms) str += 'selected';
            str += '>' + f + '</option>'
        });
        str += '</select> firms with <select id="costType" onchange="updateParams()">';
        ['linear', 'quadratic'].forEach(x => {
            str += '<option ';
            if (x === costType) str += 'selected';
            str += '>' + x + '</option>';
        });
        str += '</select> cost functions</span></a>';
        return str;
    },

	'SPNE': () => '',
    
    'Stack': () => {
        var str = "<a><span class='text'>There are <select id='firms' onchange='updateParams()'>";
        [2,3].forEach(f => {
            str += '<option ';
            if (f === firms) str += 'selected';
            str += '>' + f + '</option>'
        });
        str += '</select> firms</span></a>';
        return str;
    },

	'PBE': () => {
		var str = "<a><span class='text'>Initial chance move? <select id='chance' onchange='updateParams()'>";
        ['Yes','No'].forEach(x => {
            str += '<option ';
            if (x === chance) str += 'selected';
            str += '>' + x + '</option>'
        });
        str += '</select></span></a>';
		return str;
	},

	'Core': () => {
        var str = "<a><span class='text'>There are <select id='players' onchange='updateParams()'>";
        [3,4].forEach(x => {
            str += '<option ';
            if (x === players) str += 'selected';
            str += '>' + x + '</option>'
        });
        str += '</select> players</span></a>';
		return str;
	}
};
params['NE'] = params['WDA'];
params['Mix'] = params['WDA'];
params['Imperf'] = params['SPNE'];
params['BNE'] = params['SPNE'];
params['Signal'] = params['SPNE'];
params['Shap'] = params['Core'];

const headers = {
    'WDA': "Weakly dominated actions",
    'NE': "Nash equilibrium",
    'Cou': "Cournot competition",
    'Mix': "Mixed-strategy Nash equilibrium",
	'SPNE': "Subgame-perfect Nash equilibrium",
    'Stack': "Stackelberg competition",
    'Imperf': "Imperfect information",
	'BNE': 'Bayesian Nash equilibrium',
    'PBE': "Perfect Bayesian equilibrium",
    'Signal': "Signaling games",
	'Core': "The core",
	'Shap': "The Shapley value",
};

const descriptions = {
    'WDA': "Find weakly dominated actions in the game below (if such exist). If you're sure there isn't one, move on to a new problem.",
    'NE': "Find a pure-strategy Nash equilibrium in the game below below (if one exists). If you're sure there isn't one, move on to a new problem.",
    'Cou': "Find the Cournot equilibrium in the game below. Use fractions to avoid rounding errors (e.g., 1/3 instead of 0.33).",
    'Mix': "Find a mixed-strategy Nash equilibrium in the game below. Remember that pure strategies are a special case of mixed strategies. Set the probability to 0 for unused actions (or leave empty). Use fractions to avoid rounding errors (e.g., 1/3 instead of 0.33).",
	'SPNE': "Find a pure-strategy subgame-perfect Nash equilibrium in the game below. Remember: a strategy specifies an action at every decision node for the player.",
    'Stack': "Find the Stackelberg equilibrium in the game below. Use fractions to avoid rounding errors (e.g., 1/3 instead of 0.33).",
	'Imperf': "Find a pure-strategy subgame-perfect Nash equilibrium in the game below (if one exists). If you're sure there isn't one, move on to a new problem. Remember: a strategy specifies an action at every information set for the player.",
    'BNE': 'Find a mixed-strategy Bayesian Nash equilibrium in the game below. Nature "draws the matrix" with the given probability. Use fractions to avoid rounding errors (e.g., 1/3 instead of 0.33).',
    'PBE': "Find a mixed-strategy perfect Bayesian equilibrium in the game below. Remember that pure strategies are a special case of mixed strategies. Set the probability to 0 for unused actions (or leave empty). Use fractions to avoid rounding errors (e.g., 1/3 instead of 0.33).",
    'Signal': "Find a pure-strategy perfect Bayesian equilibrium in the signaling game below.",
	'Core': "Find a core allocation in the cost-sharing game below (if one exists). If you're sure there isn't one, move on to a new problem.",
	'Shap': "Find the Shapley value of the cost-sharing game below.",
};

const answers = {
    'WDA': () => "The action <select id='WDA_1'><option selected disabled></option><optgroup label='Row'>" + options('r') + "</optgroup><optgroup label='Column'>" + options('c') + "</optgroup></select> weakly dominates <select id='WDA_2'><option selected disabled></option><optgroup label='Row'>" + options('r') + "</optgroup><optgroup label='Column'>" + options('c') + "</optgroup></select>.",

    'NE': () => "Row plays <select id='NE_row'><option selected disabled></option>" + options('r') + "</select> and column plays <select id='NE_col'><option selected disabled></option>" + options('c') + "</select>.",

    'Cou': () => {
        var str = 'The equilibrium quantities and price are ';
        for (let f = 0; f < firms; f++) {
            str += '<input size=6 id="qty' + f + '" placeholder="Firm ' + (f+1) + '">, ';
        }
        str += 'and <input size=6 id="price" placeholder="Price">.';
        return str;
    },

    'Mix': () => "Row mixes with probabilities " + inputs('r') + ". Column mixes with probabilities " + inputs('c') + ".",

	'SPNE': () => 'Player 1 plays <select id="SPNE_IO"><option disabled selected></option><option>In</option><option>Out</option></select>, <select id="SPNE_A"><option disabled selected></option><option>1</option><option>2</option></select> after A, and <select id="SPNE_B"><option disabled selected></option><option>3</option><option>4</option></select> after B. Player 2 plays <select id="SPNE_IN"><option disabled selected></option><option>A</option><option>B</option></select>.',

	'Imperf': () => 'Player 1 plays <select id="Imp_IO"><option disabled selected></option><option>In</option><option>Out</option></select> and <select id="Imp_1"><option disabled selected></option><option>1</option><option>2</option></select>. Player 2 plays <select id="Imp_2"><option disabled selected></option><option>A</option><option>B</option></select>.',

	'BNE': () => "Row mixes with probabilities <input size=5 id='BNE_1' placeholder='1'> and <input size=5 id='BNE_2' placeholder='2'>, and <input size=5 id='BNE_3' placeholder='3'> and <input size=5 id='BNE_4' placeholder='4'>, respectively. Column mixes with probabilities <input size=5 id='BNE_A' placeholder='A'> and <input size=5 id='BNE_B' placeholder='B'>.",

    'PBE': () => {
		switch (chance) {
			case 'No': 
				return "Player 1 mixes with probabilities <input size=5 id='PBE_1' placeholder='1'>, <input size=5 id='PBE_2' placeholder='2'>, and <input size=5 id='PBE_OUT' placeholder='Out'>. Player 2 mixes with probabilities <input size=5 id='PBE_A' placeholder='A'> and <input size=5 id='PBE_B' placeholder='B'>. The belief probability is <input size=5 id='PBE_p' placeholder='p'>.";
			case 'Yes':
				return "Player 1 mixes with probabilities <input size=5 id='PBE_IN' placeholder='In'> and <input size=5 id='PBE_OUT' placeholder='Out'>. Player 2 mixes with probabilities <input size=5 id='PBE_A' placeholder='A'> and <input size=5 id='PBE_B' placeholder='B'>. The belief probability is <input size=5 id='PBE_p' placeholder='p'>.";
		}
	},

    'Signal': () => {
        function optList (arr) {
            var str = '<option selected disabled></option>';
            arr.forEach(x => str += '<option>' + x + '</option>');
            return str;
        }
        return 'Player 1 plays <select id="SIG_1">' + optList([1,2]) + '</select> at U and <select id="SIG_2">' + optList([3,4]) + '</select> at D. Player 2 plays <select id="SIG_3">' + optList(['A','B']) + '</select> at L and <select id="SIG_4">' + optList(['C','D']) + '</select> at R. Beliefs are <input id="SIG_p" size=5 placeholder="p"> and <input id="SIG_q" size=5 placeholder="q">.';
    },

	'Core': () => {
        var str = 'A core allocation assigns costs ';
        for (let i = 0; i < players; i++) {
			if (i == players - 1) {
            	str += 'and <input size=6 id="x' + i + '" placeholder="' + (i+1) + '">.';
			}
			else {
				str += '<input size=6 id="x' + i + '" placeholder="' + (i+1) + '">, ';
			}
        }
        return str;
	},

	'Shap': () => {
        var str = 'The Shapley value assigns costs ';
        for (let i = 0; i < players; i++) {
			if (i == players - 1) {
            	str += 'and <input size=6 id="x' + i + '" placeholder="' + (i+1) + '">.';
			}
			else {
				str += '<input size=6 id="x' + i + '" placeholder="' + (i+1) + '">, ';
			}
        }
        return str;
	},
};

answers['Stack'] = answers['Cou'];

const more = {
    'WDA': "Are there more than one dominated action? What about strictly dominated actions? What about iterated elimination of dominated actions?",
    'NE': "Are there more than one equilibrium? Is the equilibrium strict or weak? If there are several, does one of them stand out?",
    'Cou': "What about profits? What if the firms chose to collude? (What would you use as cost function?) What's the consumer surplus?",
    'Mix': "What's the interpretation of this equilibrium?",
	'SPNE': "How many subgames are there? Can you find a Nash equilibrium that isn't subgame perfect? Warning: This exercise is limited to a particular structure on the game tree, make sure you understand the underlying ideas so you can solve other ones as well.",
    'Stack': "What about profits? Compare to the Cournot model: how much would firm 1 be willing to pay (in the Cournot setting) to get a first-mover advantage?",
	'BNE': "TBA",
	'PBE': "How many subgames are there? Can you find an equilibrium that isn't perfect Bayesian? What about subgame perfection? Is there one in which both players mix over all (or at least some) actions? Warning: This exercise is limited to a particular structure on the game tree, make sure you understand the underlying ideas so you can solve other ones as well.",
    'Signal': "Is the equilibrium pooling or separating? Does it work for a larger set of beliefs? Can you find an equilibrium that involves mixed strategies?",
	'Core': "It's rare that there's a unique core allocation. If there are several here, can you find an expression for the core as a whole? What properties does the game satisfy? What difference would it make when looking at surplus-sharing games instead?",
	'Shap': "Here, is the Shapley value in the game's core? What difference would it make when looking at surplus-sharing games instead?",
};

more['Imperf'] = more['SPNE'];

// EXERCISE FUNCTIONS

// Payoffs

function generatePayoffs () {
    return Array.from({ length: rows }, () =>
        Array.from( { length: cols }, () => 
            Array.from({ length: 2}, () =>
                Math.floor(Math.random() * 10)
                )
            )
        );
}

function generatePayoffMatrix() {
    inst = '<table class="payoffmatrix"><tr><td></td>';
    for (let j = 0; j < cols; j++) {
        inst += '<td class="heading">' + letter(j) + '</td>';
    }
    for (let i = 0; i < rows; i++) {
        inst += '</tr><tr><td class="heading">' + number(i) + '</td>';
        for (let j = 0; j < cols; j++) {
            inst += '<td>' + payoffs[i][j].join(', ') + '</td>';
        }
    }
    inst += '</tr></table>';
}

// Cournot

function generateCournot () {
    demand = {
        'a': 80 + Math.floor(Math.random() * 200),
        'b': Math.ceil(Math.random() * 4)
    };

    costs = [];
    for (let f = 0; f < firms; f++) {
        let c = {
            'a': 5 + Math.floor(Math.random() * 20),
            'b': (costType === 'quadratic') * Math.floor(Math.random() * 5)
        }
        costs.push(c);
    }

    inst = "There are " + toText(firms) + " firms with cost functions ";
    for (let f = 0; f < firms; f++) {
        inst += '\\(c_' + (f+1) + '(q_' + (f+1) + ') = ';
        if (costs[f]['a'] > 1) inst += costs[f]['a'];
        inst += 'q_' + (f+1);
        if (costs[f]['b'] > 0) inst += ' + ';
        if (costs[f]['b'] > 1) inst += costs[f]['b'];
        if (costs[f]['b'] > 0) inst += 'q^2_' + (f+1);
        inst += '\\)';

        if (f < firms - 2 || (firms > 2 && f === firms - 2)) inst += ',';
        if (f < firms - 1) inst += ' ';
        if (f === firms - 2) inst += 'and ';
    }
    inst += '. The inverse demand function is \\(p(q) = ' + demand['a'] + ' - ';
    if (demand['b'] > 1) inst += demand['b'];
    inst += 'q\\).';
}

// SPNE games

function generateSPNE () {

	function genPair () {
		return Array.from({ length: 2}, () =>
			Math.floor(Math.random() * 10)
			)
	}

    extPayoffs = {
		'Out': genPair(),
		'In': { 
			'A': { '1': genPair(), '2': genPair() },
			'B': { '3': genPair(), '4': genPair() },
		}
	}

    var w = 320;
    var h = 290;
    var d = 100;

    var canv = document.createElement('canvas');
    canv.width = w;
    canv.height = h;
    
    var ctx = canv.getContext('2d');
    ctx.font = '18px Arial, Helvetica, sans-serif';
    
    var radius = 3;
	var top = 30;
    var sep = 8; // Text shift
    var sep2 = 24; // Extra shift
    var angle = Math.PI / 3;
    var angle2 = Math.PI / 6;
    var xleaf = Math.sin(angle);
    var yleaf = Math.cos(angle);
    var xleaf2 = Math.sin(angle2);
    var yleaf2 = Math.cos(angle2);

    ctx.arc(w/2, top, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.arc(w/2, top + d, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.arc(w/2 - xleaf * d, top + d + yleaf * d, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.arc(w/2 + xleaf * d, top + d + yleaf * d, radius, 0, 2 * Math.PI);
    ctx.closePath();
	ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w/2, top);
    ctx.lineTo(w/2 + d, top);
    ctx.moveTo(w/2, top);
    ctx.lineTo(w/2, top + d);
    ctx.lineTo(w/2 + xleaf * d, top + d + yleaf * d);
    ctx.moveTo(w/2, top + d);
    ctx.lineTo(w/2 - xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 - xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.moveTo(w/2 - xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 - xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.moveTo(w/2 + xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 + xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.moveTo(w/2 + xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 + xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.stroke();

    ctx.textAlign = 'end';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Player 1', w/2 - sep, top);
    ctx.fillText('Player 2', w/2 - sep, top + d);
    ctx.fillText('Player 1', w/2 - xleaf * d - sep, top + d + yleaf * d);
    ctx.textAlign = 'start';
    ctx.fillText('Player 1', w/2 + xleaf * d + sep, top + d + yleaf * d);
	ctx.textAlign = 'end';
	ctx.fillText('In', w/2 - sep, top + d/2);
	ctx.textAlign = 'center';
	ctx.fillText('Out', w/2 + d/2, top);
	ctx.textBaseline = 'middle';
	ctx.fillText('A', w/2 - xleaf * d/2 - sep, top + d + yleaf * d / 2 - sep);
	ctx.fillText('B', w/2 + xleaf * d/2 + sep, top + d + yleaf * d / 2 - sep);
	ctx.fillText('1', w/2 - xleaf * d - xleaf2 * d / 2 - sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);
	ctx.fillText('2', w/2 - xleaf * d + xleaf2 * d / 2 + sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);
	ctx.fillText('3', w/2 + xleaf * d - xleaf2 * d / 2 - sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);
	ctx.fillText('4', w/2 + xleaf * d + xleaf2 * d / 2 + sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);

    const sp = (i,j) => extPayoffs['In'][i][j].join(', ');

	ctx.textAlign = 'start';
	ctx.fillText(extPayoffs['Out'].join(', '), w/2 + d + sep, top);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillText(sp('A',1), w/2 - xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
	ctx.fillText(sp('A',2), w/2 - xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
	ctx.fillText(sp('B',3), w/2 + xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
	ctx.fillText(sp('B',4), w/2 + xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);

    $('instance').removeChild($('instance').lastChild);
    $('instance').innerHTML = '';
    $('instance').appendChild(canv);
}

// Stackelberg

function generateStack () {

    costType = 'linear';
    generateCournot();
    inst += " Firm 1 chooses quantity first.";
    inst += " Firm 2 observes firm 1's choice before making its own choice.";
    if (firms === 3) inst += " Finally, firm 3 observes both other quantities before making its choice.";
}

// Imperfect information games

function generateImperf () {

	function genPair () {
		return Array.from({ length: 2}, () =>
			Math.floor(Math.random() * 10)
			)
	}

    extPayoffs = {
		'Out': genPair(),
		'In': { 
			'A': { '1': genPair(), '2': genPair() },
			'B': { '1': genPair(), '2': genPair() },
		}
	}

    var w = 320;
    var h = 290;
    var d = 100;

    var canv = document.createElement('canvas');
    canv.width = w;
    canv.height = h;
    
    var ctx = canv.getContext('2d');
    ctx.font = '18px Arial, Helvetica, sans-serif';
    
    var radius = 3;
	var top = 30;
    var sep = 8; // Text shift
    var sep2 = 16; // Extra shift
    var angle = Math.PI / 3;
    var angle2 = Math.PI / 6;
    var xleaf = Math.sin(angle);
    var yleaf = Math.cos(angle);
    var xleaf2 = Math.sin(angle2);
    var yleaf2 = Math.cos(angle2);

    ctx.arc(w/2, top, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.arc(w/2, top + d, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.arc(w/2 - xleaf * d, top + d + yleaf * d, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.arc(w/2 + xleaf * d, top + d + yleaf * d, radius, 0, 2 * Math.PI);
    ctx.closePath();
	ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w/2, top);
    ctx.lineTo(w/2 + d, top);
    ctx.moveTo(w/2, top);
    ctx.lineTo(w/2, top + d);
    ctx.lineTo(w/2 + xleaf * d, top + d + yleaf * d);
    ctx.moveTo(w/2, top + d);
    ctx.lineTo(w/2 - xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 - xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.moveTo(w/2 - xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 - xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.moveTo(w/2 + xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 + xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.moveTo(w/2 + xleaf * d, top + d + yleaf * d);
    ctx.lineTo(w/2 + xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
    ctx.stroke();

    ctx.textAlign = 'end';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Player 1', w/2 - sep, top);
    ctx.fillText('Player 2', w/2 - sep, top + d);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
	ctx.fillText('Player 1', w/2, top + d + yleaf * d);
	ctx.textAlign = 'end';
    ctx.textBaseline = 'bottom';
	ctx.fillText('In', w/2 - sep, top + d/2);
	ctx.textAlign = 'center';
	ctx.fillText('Out', w/2 + d/2, top);
	ctx.textBaseline = 'middle';
	ctx.fillText('A', w/2 - xleaf * d/2 - sep, top + d + yleaf * d / 2 - sep);
	ctx.fillText('B', w/2 + xleaf * d/2 + sep, top + d + yleaf * d / 2 - sep);
	ctx.fillText('1', w/2 - xleaf * d - xleaf2 * d / 2 - sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);
	ctx.fillText('2', w/2 - xleaf * d + xleaf2 * d / 2 + sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);
	ctx.fillText('1', w/2 + xleaf * d - xleaf2 * d / 2 - sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);
	ctx.fillText('2', w/2 + xleaf * d + xleaf2 * d / 2 + sep, top + d + yleaf * d + yleaf2 * d / 2 - sep);

    [-d,d].forEach(x => {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
		ctx.moveTo(w/2 - xleaf * d, top + d + yleaf * d + sep2);
		ctx.arc(w/2 - xleaf * d, top + d + yleaf * d, sep2, Math.PI/2, -Math.PI/2);
		ctx.lineTo(w/2 + xleaf * d, top + d + yleaf * d - sep2);
		ctx.arc(w/2 + xleaf * d, top + d + yleaf * d, sep2, -Math.PI/2, Math.PI/2);
        ctx.closePath();
        ctx.stroke();
    });

    const sp = (i,j) => extPayoffs['In'][i][j].join(', ');

	ctx.textAlign = 'start';
	ctx.fillText(extPayoffs['Out'].join(', '), w/2 + d + sep, top);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillText(sp('A',1), w/2 - xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
	ctx.fillText(sp('A',2), w/2 - xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
	ctx.fillText(sp('B',1), w/2 + xleaf * d - xleaf2 * d, top + d + yleaf * d + yleaf2 * d);
	ctx.fillText(sp('B',2), w/2 + xleaf * d + xleaf2 * d, top + d + yleaf * d + yleaf2 * d);

    $('instance').removeChild($('instance').lastChild);
    $('instance').innerHTML = '';
    $('instance').appendChild(canv);
}

// BNE

function generateBNE () {

	function genPair () {
		return Array.from({ length: 2}, () => 
			Math.floor(Math.random() * 10)
			)
	}

	payoffs = {
		'1': { 'A': genPair(), 'B': genPair() },
		'2': { 'A': genPair(), 'B': genPair() },
		'3': { 'A': genPair(), 'B': genPair() },
		'4': { 'A': genPair(), 'B': genPair() },
	}

	var poss = ['1/2', '1/3', '1/4', '1/5', '2/3', '2/5', '3/5', '4/5'];
	var opp = ['1/2', '2/3', '3/4', '4/5', '1/3', '3/5', '2/5', '1/5'];
	var indx = Math.floor(Math.random() * poss.length);
	signProb = poss[indx]; // First game, actions 1 and 2
	var signOpp = opp[indx];

	// test case

	payoffs = {
		'1': { 'A': [0,0], 'B': [7,8] },
		'2': { 'A': [4,6], 'B': [0,5] },
		'3': { 'A': [4,8], 'B': [3,4] },
		'4': { 'A': [1,5], 'B': [4,7] },
	}

	signProb = '2/3';
	signOpp = '1/3';

	//

	const sp = (i,j) => payoffs[i][j].join(', ');

	inst = '<table class="payoffmatrix"><tr><td></td><td colspan="2">Prob. ' + signProb + '</td><td></td><td></td><td colspan="2">Prob. ' + signOpp + '</td></tr>';
    inst += '<tr><td></td><td class="heading">A</td><td class="heading">B</td><td width="18px"></td><td></td><td class="heading">A</td><td class="heading">B</td></tr>';
	inst += '<tr><td class="heading">1</td><td>' + sp(1,'A') + '</td><td>' + sp(1,'B') + '</td><td></td><td class="heading">3</td><td>' + sp(3,'A') + '</td><td>' + sp(3,'B') + '</td></tr>';
	inst += '<tr><td class="heading">2</td><td>' + sp(2,'A') + '</td><td>' + sp(2,'B') + '</td><td></td><td class="heading">4</td><td>' + sp(4,'A') + '</td><td>' + sp(4,'B') + '</td></tr>';
	inst += '</table>';
}

// PBE

function generatePBE () {

	function genPair () {
		return Array.from({ length: 2}, () =>
			Math.floor(Math.random() * 10)
			)
	}

    extPayoffs = {
		'Out': genPair(),
		'1': {'A': genPair(), 'B': genPair() },
		'2': {'A': genPair(), 'B': genPair() },
	}

    var radius = 3;
	var top = 30;
    var sep = 8; // Text shift
    var sep2 = 16; // Extra shift
    var angle = Math.PI / 4;
    var angle2 = Math.PI / 6;
    var xleaf = 1.1 * Math.sin(angle);
    var yleaf = 1.1 * Math.cos(angle);
    var xleaf2 = Math.sin(angle2);
    var yleaf2 = Math.cos(angle2);

	if (chance === 'No') {
		var w = 320;
		var h = 220;
		var d = 100;
	
		var canv = document.createElement('canvas');
		canv.width = w;
		canv.height = h;
		
		var ctx = canv.getContext('2d');
		ctx.font = '18px Arial, Helvetica, sans-serif';
    
		ctx.arc(w/2, top, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.arc(w/2 - xleaf * d, top + yleaf * d, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.arc(w/2 + xleaf * d, top + yleaf * d, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	
		ctx.beginPath();
		ctx.moveTo(w/2, top);
		ctx.lineTo(w/2 + d, top);
		ctx.moveTo(w/2, top);
		ctx.lineTo(w/2 + xleaf * d, top + yleaf * d);
		ctx.moveTo(w/2, top);
		ctx.lineTo(w/2 - xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 - xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.moveTo(w/2 - xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 - xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.moveTo(w/2 + xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 + xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.moveTo(w/2 + xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 + xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.stroke();
	
		ctx.textAlign = 'end';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Player 1', w/2 - sep, top);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('[p]  Player 2  [1-p]', w/2, top + yleaf * d);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Out', w/2 + d/2, top);
		ctx.textBaseline = 'middle';
		ctx.fillText('1', w/2 - xleaf * d/2 - sep, top + yleaf * d / 2 - sep);
		ctx.fillText('2', w/2 + xleaf * d/2 + sep, top + yleaf * d / 2 - sep);
		ctx.fillText('A', w/2 - xleaf * d - xleaf2 * d / 2 - sep, top + yleaf * d + yleaf2 * d / 2 - sep);
		ctx.fillText('B', w/2 - xleaf * d + xleaf2 * d / 2 + sep, top + yleaf * d + yleaf2 * d / 2 - sep);
		ctx.fillText('A', w/2 + xleaf * d - xleaf2 * d / 2 - sep, top + yleaf * d + yleaf2 * d / 2 - sep);
		ctx.fillText('B', w/2 + xleaf * d + xleaf2 * d / 2 + sep, top + yleaf * d + yleaf2 * d / 2 - sep);
	
		[-d,d].forEach(x => {
			ctx.beginPath();
			ctx.setLineDash([5, 5]);
			ctx.moveTo(w/2 - xleaf * d, top + yleaf * d + sep2);
			ctx.arc(w/2 - xleaf * d, top + yleaf * d, sep2, Math.PI/2, -Math.PI/2);
			ctx.lineTo(w/2 + xleaf * d, top + yleaf * d - sep2);
			ctx.arc(w/2 + xleaf * d, top + yleaf * d, sep2, -Math.PI/2, Math.PI/2);
			ctx.closePath();
			ctx.stroke();
		});
	
		const sp = (i,j) => extPayoffs[i][j].join(', ');
	
		ctx.textAlign = 'start';
		ctx.fillText(extPayoffs['Out'].join(', '), w/2 + d + sep, top);
	
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(sp(1,'A'), w/2 - xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.fillText(sp(1,'B'), w/2 - xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.fillText(sp(2,'A'), w/2 + xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.fillText(sp(2,'B'), w/2 + xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
	}

	else {
		var poss = ['1/2', '1/3', '1/4', '1/5', '2/3', '2/5', '3/5', '4/5'];
		var opp = ['1/2', '2/3', '3/4', '4/5', '1/3', '3/5', '2/5', '1/5'];
		var indx = Math.floor(Math.random() * poss.length);
		signProb = poss[indx];
		var signOpp = opp[indx];

		var w = 440;
		var h = 220;
		var d = 100;
	
		var canv = document.createElement('canvas');
		canv.width = w;
		canv.height = h;
		
		var ctx = canv.getContext('2d');
		ctx.font = '18px Arial, Helvetica, sans-serif';
		ctx.arc(w/2 - xleaf * d, top, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.arc(w/2 + xleaf * d, top, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.arc(w/2 - xleaf * d, top + yleaf * d, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.arc(w/2 + xleaf * d, top + yleaf * d, radius, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	
		ctx.beginPath();
		ctx.moveTo(w/2 - xleaf * d, top);
		ctx.lineTo(w/2 + xleaf * d + d, top);
		ctx.moveTo(w/2 - xleaf * d, top);
		ctx.lineTo(w/2 - xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 - xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.moveTo(w/2 + xleaf * d, top);
		ctx.lineTo(w/2 + xleaf * d, top + yleaf * d);
		ctx.moveTo(w/2 - xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 - xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.moveTo(w/2 + xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 + xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.moveTo(w/2 + xleaf * d, top + yleaf * d);
		ctx.lineTo(w/2 + xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.stroke();
	
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Nature', w/2 - xleaf * d, top - sep);
		ctx.fillText(signProb, w/2, top - sep);
		ctx.textAlign = 'end';
		ctx.textBaseline = 'bottom';
		ctx.fillText(signOpp, w/2 - xleaf * d - sep, top + d/2);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('[p]  Player 2  [1-p]', w/2, top + yleaf * d);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText('Player 1', w/2 + xleaf * d, top - sep);
		ctx.textBaseline = 'top';
		ctx.fillText('Out', w/2 + xleaf * d + d/2, top + sep/2);
		ctx.textAlign = 'start';
		ctx.textBaseline = 'bottom';
		ctx.fillText('In', w/2 + xleaf * d + sep, top + d/2);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('A', w/2 - xleaf * d - xleaf2 * d / 2 - sep, top + yleaf * d + yleaf2 * d / 2 - sep);
		ctx.fillText('B', w/2 - xleaf * d + xleaf2 * d / 2 + sep, top + yleaf * d + yleaf2 * d / 2 - sep);
		ctx.fillText('A', w/2 + xleaf * d - xleaf2 * d / 2 - sep, top + yleaf * d + yleaf2 * d / 2 - sep);
		ctx.fillText('B', w/2 + xleaf * d + xleaf2 * d / 2 + sep, top + yleaf * d + yleaf2 * d / 2 - sep);
	
		[-d,d].forEach(x => {
			ctx.beginPath();
			ctx.setLineDash([5, 5]);
			ctx.moveTo(w/2 - xleaf * d, top + yleaf * d + sep2);
			ctx.arc(w/2 - xleaf * d, top + yleaf * d, sep2, Math.PI/2, -Math.PI/2);
			ctx.lineTo(w/2 + xleaf * d, top + yleaf * d - sep2);
			ctx.arc(w/2 + xleaf * d, top + yleaf * d, sep2, -Math.PI/2, Math.PI/2);
			ctx.closePath();
			ctx.stroke();
		});
	
		const sp = (i,j) => extPayoffs[i][j].join(', ');
	
		ctx.textAlign = 'start';
		ctx.fillText(extPayoffs['Out'].join(', '), w/2 + xleaf * d + d + sep, top);
	
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(sp(1,'A'), w/2 - xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.fillText(sp(1,'B'), w/2 - xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.fillText(sp(2,'A'), w/2 + xleaf * d - xleaf2 * d, top + yleaf * d + yleaf2 * d);
		ctx.fillText(sp(2,'B'), w/2 + xleaf * d + xleaf2 * d, top + yleaf * d + yleaf2 * d);
	}

    $('instance').removeChild($('instance').lastChild);
    $('instance').innerHTML = '';
    $('instance').appendChild(canv);
}

// Signaling games

function generateSignal () {

	function genPair () {
		return Array.from({ length: 2}, () =>
			Math.floor(10 + Math.random() * 40)
			)
	}

    extPayoffs = {
        '1': { 'A': genPair(), 'B': genPair() },
        '2': { 'C': genPair(), 'D': genPair() },
        '3': { 'A': genPair(), 'B': genPair() },
        '4': { 'C': genPair(), 'D': genPair() }
    }

    var poss = ['1/2', '1/3', '1/4', '1/5', '2/3', '2/5', '3/5', '4/5'];
    var opp = ['1/2', '2/3', '3/4', '4/5', '1/3', '3/5', '2/5', '1/5'];
    var indx = Math.floor(Math.random() * poss.length);
    signProb = poss[indx];
    var signOpp = opp[indx];

    // Basic structure <---

    var w = 500;
    var h = 320;
    var d = 100;

    var canv = document.createElement('canvas');
    canv.width = w;
    canv.height = h;
    
    var ctx = canv.getContext('2d');
    ctx.font = '18px Arial, Helvetica, sans-serif';
    
    var radius = 3;
    var sep = 6; // Text shift
    var sep2 = 24; // Extra shift
    var angle = Math.PI / 3;
    var xleaf = Math.sin(angle);
    var yleaf = Math.cos(angle);
    
    ctx.arc(w/2, h/2, radius, 0, 2 * Math.PI);
    ctx.closePath();
    [-d,0,d].forEach(x => {
        [-d,d].forEach(y => {
            ctx.arc(w/2 + x, h/2 + y, radius, 0, 2 * Math.PI);
            ctx.closePath();
        });
    });
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(w/2 - d, h/2 - d);
    ctx.lineTo(w/2 + d, h/2 - d);
    ctx.moveTo(w/2, h/2 - d);
    ctx.lineTo(w/2, h/2 + d);
    ctx.moveTo(w/2 - d, h/2 + d);
    ctx.lineTo(w/2 + d, h/2 + d);
    ctx.stroke();
    
    [-d, d].forEach(x => {
        [-d, d].forEach(y => {
            ctx.beginPath();
            ctx.moveTo(w/2 + x * (1 + xleaf), h/2 + y * (1 + yleaf));
            ctx.lineTo(w/2 + x, h/2 + y);
            ctx.lineTo(w/2 + x * (1 + xleaf), h/2 + y * (1 - yleaf));
            ctx.stroke();
        });
    });
    
    ctx.textAlign = 'start';
    ctx.textBaseline = 'middle';
    ctx.fillText('Nature', w/2 + sep, h/2);

    // <---
    ctx.fillText(signProb, w/2 + sep, h/2 - d/2);
    ctx.fillText(signOpp, w/2 + sep, h/2 + d/2);
    // --->
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('U', w/2, h/2 - d - sep);
    ctx.fillText('Player 1', w/2, h/2 - d - sep - sep2);
    ctx.fillText('1', w/2 - d/2, h/2 - d - sep);
    ctx.fillText('2', w/2 + d/2, h/2 - d - sep);
    
    ctx.textBaseline = 'top';
    ctx.fillText('D', w/2, h/2 + d + sep);
    ctx.fillText('Player 1', w/2, h/2 + d + sep + sep2);
    ctx.fillText('3', w/2 - d/2, h/2 + d + sep);
    ctx.fillText('4', w/2 + d/2, h/2 + d + sep);
    
    [-d,d].forEach(x => {
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(w/2 + x - sep2, h/2 - d);
        ctx.arc(w/2 + x, h/2 - d, sep2, Math.PI, 0);
        ctx.lineTo(w/2 + x + sep2, h/2 + d);
        ctx.arc(w/2 + x, h/2 + d, sep2, 0, Math.PI);
        ctx.closePath();
        ctx.stroke();
    });
    
    ctx.save();
    ctx.translate(w/2 - d, h/2);
    ctx.rotate(-Math.PI/2);
    ctx.textBaseline = "middle";
    ctx.fillText("Player 2, L", 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.translate(w/2 + d, h/2);
    ctx.rotate(Math.PI/2);
    ctx.textBaseline = "middle";
    ctx.fillText("Player 2, R", 0, 0);
    ctx.restore();
    
    ctx.textBaseline = 'top';
    ctx.fillText('[p]', w/2 - d, h/2 - d + sep);
    ctx.fillText('[q]', w/2 + d, h/2 - d + sep);
    ctx.textBaseline = 'bottom';
    ctx.fillText('[1-p]', w/2 - d, h/2 + d - sep);
    ctx.fillText('[1-q]', w/2 + d, h/2 + d - sep);
    
    [-d, d].forEach(y => {
        ctx.textBaseline = "bottom";
        ctx.fillText('A', w/2 - d * (1 + xleaf / 2), h/2 + y - d * yleaf/2 - sep);
        ctx.fillText('C', w/2 + d * (1 + xleaf / 2), h/2 + y - d * yleaf/2 - sep);
        ctx.textBaseline = "top";
        ctx.fillText('B', w/2 - d * (1 + xleaf / 2), h/2 + y + d * yleaf/2 + sep);
        ctx.fillText('D', w/2 + d * (1 + xleaf / 2), h/2 + y + d * yleaf/2 + sep);
    });
    
    // <---

    const sp = (i,j) => extPayoffs[i][j].join(', ');
    ctx.textAlign = 'end';
    ctx.textBaseline = 'middle';
    ctx.fillText(sp(1,'A'), w/2 - (1 + xleaf) * d - sep, h/2 - (1 + yleaf) * d);
    ctx.fillText(sp(1,'B'), w/2 - (1 + xleaf) * d - sep, h/2 - (1 - yleaf) * d);
    ctx.fillText(sp(3,'A'), w/2 - (1 + xleaf) * d - sep, h/2 + (1 - yleaf) * d);
    ctx.fillText(sp(3,'B'), w/2 - (1 + xleaf) * d - sep, h/2 + (1 + yleaf) * d);
    ctx.textAlign = 'start';
    ctx.fillText(sp(2,'C'), w/2 + (1 + xleaf) * d + sep, h/2 - (1 + yleaf) * d);
    ctx.fillText(sp(2,'D'), w/2 + (1 + xleaf) * d + sep, h/2 - (1 - yleaf) * d);
    ctx.fillText(sp(4,'C'), w/2 + (1 + xleaf) * d + sep, h/2 + (1 - yleaf) * d);
    ctx.fillText(sp(4,'D'), w/2 + (1 + xleaf) * d + sep, h/2 + (1 + yleaf) * d);

    $('instance').removeChild($('instance').lastChild);
    $('instance').innerHTML = '';
    $('instance').appendChild(canv);
}

// Coalitional games

function generateCoalitional () {
	inst = 'The characteristic function \\(c\\) is as follows: ';
	powerset().forEach(x => {
		worth[x] = x.length * (10 + Math.floor(Math.random() * 10));
		if (x.length === players) inst += 'and \\(c(' + x + ') = ' + worth[x] + '\\).';
		else inst += '\\(c(' + x + ') = ' + worth[x] + '\\), ';
	});
}

// GRADING FUNCTIONS

function evalWDA () {
    var sel1 = $('WDA_1');
    var sel2 = $('WDA_2');
    if (!sel1 || !sel2) {
		console.log('Incomplete answer');
        return false;
    }
    const group = (sel) => sel.options[sel.options.selectedIndex].parentNode.label;
    if (group(sel1) != group(sel2)) {
		console.log('Inconsistent answer');
        return false;
    }
    var a = $('WDA_1').value;
    var b = $('WDA_2').value;
    if (a == b) return false;
	var diff = false;
    if (group(sel1) == 'Row') {
        for (let j = 0; j < cols; j++) {
            if (payoffs[a][j][0] < payoffs[b][j][0]) return false;
            if (payoffs[a][j][0] > payoffs[b][j][0]) diff = true;
        }
    }
    else {
        for (let i = 0; i < rows; i++) {
            if (payoffs[i][a][1] < payoffs[i][b][1]) return false;
            if (payoffs[i][a][0] > payoffs[i][b][0]) diff = true;
        }
    }
    return diff;
}

function evalNE() {
    var a = $('NE_row').value;
    var b = $('NE_col').value;
    if (!a || !b) {
		console.log('Incomplete answer');
        return false;
    }
    var outcome = payoffs[a][b];
    for (let i = 0; i < rows; i++) {
        if (outcome[0] < payoffs[i][b][0]) {
			console.log('Deviation by column');
			return false;
		}
    }
    for (let j = 0; j < cols; j++) {
        if (outcome[1] < payoffs[a][j][1]) {
			console.log('Deviation by row');
			return false;
		}
    }
    return true;
}

function evalCou() {
    var q = [];

    for (let f = 0; f < firms; f++) {
        q.push(textInput('qty' + f));
    }
    var totQ = sum(q);

    for (let f = 0; f < firms; f++) {
		let br = (demand['a'] - demand['b'] * (totQ - q[f]) - costs[f]['a']) / (2 * (demand['b'] + costs[f]['b']));
        if (!isClose(q[f], br, .1)) {
			console.log((f+1) + "isn't playing a best reponse to the others");
			return false;
		}
    }

    var price = demand['a'] - demand['b'] * totQ;
    if (!isClose(textInput('price'), price)) {
		console.log('Price is inconsistent with quantities');
		return false;
	}
    return true;
}

function evalMix() {
    var pr = [], pc = [];
    var probtotal = [0,0];
    for (let i = 0; i < rows; i++) {
        pr[i] = textInput('pr' + i);
        probtotal[0] += pr[i];
    }
    for (let j = 0; j < cols; j++) {
        pc[j] = textInput('pc' + j);
        probtotal[1] += pc[j];
    }
    if (!isClose(probtotal[0], 1) || !isClose(probtotal[1], 1)) {
		console.log("Probabilities don't add to one");
        return false;
    }
    // Expected payoffs under reported strategies
    var uRow = 0;
    var uCol = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            uRow += pr[i] * pc[j] * payoffs[i][j][0];
            uCol += pr[i] * pc[j] * payoffs[i][j][1];
        }
    }
    // Deviations by row
    for (let i = 0; i < rows; i++) {
        var v = 0;
        for (let j = 0; j < cols; j++) {
            v += pc[j] * payoffs[i][j][0];
        }
        if (isLarger(v, uRow)) {
			console.log('Deviation by row');
			return false;
		}
    }
    // Deviations by col
    for (let j = 0; j < cols; j++) {
        var v = 0;
        for (let i = 0; i < rows; i++) {
            v += pr[i] * payoffs[i][j][1];
        }
        if (isLarger(v, uCol)) {
			console.log('Deviation by column');
			return false;
		}
    }
    return true;
}

function evalSPNE() {
	var io = $('SPNE_IO').value;
	var s2 = $('SPNE_IN').value;
	var sA = $('SPNE_A').value;
	var sB = $('SPNE_B').value;

	if (!io || !s2 || !sA || !sB) {
		console.log('Incomplete answer');
		return false;
	}
	var dev, dev2, dev3;

	// Check from the end, deviation by 1 after A

	dev = (sA === '1') ? '2' : '1';
	if (extPayoffs['In']['A'][dev][0] > extPayoffs['In']['A'][sA][0]) {
		console.log('Deviation by 1 after A');
		return false;
	}

	// Deviation by 1 after B
	dev = (sB === '3') ? '4' : '3';
	if (extPayoffs['In']['B'][dev][0] > extPayoffs['In']['B'][sB][0]) {
		console.log('Deviation by 1 after B');
		return false;
	}

	// Deviation by 2 after In
	dev = (s2 === 'A') ? 'B' : 'A';
	dev2 = (dev === 'A') ? sA : sB;
	dev3 = (s2 === 'A') ? sA : sB;

	if (extPayoffs['In'][dev][dev2][1] > extPayoffs['In'][s2][dev3][1]) {
		console.log('Deviation by 2 after In');
		return false;
	}

	// Deviation by 1 at the start
	dev = (s2 === 'A') ? sA : sB;
	if (io === 'Out') {
		if (extPayoffs['In'][s2][dev][0] > extPayoffs['Out'][0]) {
			console.log('Deviation by 1 to In');
			return false;
		}
	}
	else {
		if (extPayoffs['Out'][0] > extPayoffs['In'][s2][dev][0]) {
			console.log('Deviation by 1 to Out');
			return false;
		}
	}
	return true;
}

function evalStack() {
    var q = [];

    for (let f = 0; f < firms; f++) {
        q.push(textInput('qty' + f));
    }
    var totQ = sum(q);

    let br = [];
    if (firms === 2) {
        br[0] = (demand['a'] - 2 * costs[0]['a'] + costs[1]['a']) / (2 * demand['b']);
        br[1] = (demand['a'] - costs[1]['a']) / (2 * demand['b']) - br[0] / 2;
    }
    if (firms === 3) {
        br[0] = (demand['a'] - 4 * costs[0]['a'] + 2 * costs[1]['a'] + costs[2]['a']) / (2 * demand['b']);
        br[1] = (demand['a'] - 2 * costs[1]['a'] + costs[2]['a']) / (2 * demand['b']) - br[0] / 2;
        br[2] = (demand['a'] - costs[2]['a']) / (2 * demand['b']) - br[0] / 2 - br[1] / 2;
    }

    for (let f = 0; f < firms; f++) {
        if (!isClose(q[f], br[f], .1)) {
			console.log((f+1) + "isn't playing a best respons to the others");
			return false;
		}
    }

    var price = demand['a'] - demand['b'] * totQ;
    if (!isClose(textInput('price'), price)) {
		console.log('Price is inconsistent with quantities');
		return false;
	}
    return true;
}

function evalImperf() {
	var io = $('Imp_IO').value;
	var s1 = $('Imp_1').value;
	var s2 = $('Imp_2').value;

	if (!io || !s1 || !s2) return false;
	var dev;

	// Check from the end, deviation by 1 in simultaneous moves
	dev = (s1 === '1') ? '2' : '1';
	if (extPayoffs['In'][s2][dev][0] > extPayoffs['In'][s2][s1][0]) {
		console.log('Deviation by 1 in simultaneous moves');
		return false;
	}

	// Deviation by 2 in simultaneous moves
	dev = (s2 === 'A') ? 'B' : 'A';
	if (extPayoffs['In'][dev][s1][1] > extPayoffs['In'][s2][s1][1]) {
		console.log(s1,s2,dev);
		console.log('Deviation by 2 in simultaneous moves')
		return false;
	}

	// Deviation by 1 at the start
	if (io === 'Out') {
		if (extPayoffs['In'][s2]['1'][0] > extPayoffs['Out'][0]) {
			console.log('Deviation by 1 to In, 1');
			return false;
		}
		if (extPayoffs['In'][s2]['2'][0] > extPayoffs['Out'][0]) {
			console.log('Deviation by 1 to In, 2');
			return false;
		}
	}
	else {
		if (extPayoffs['Out'][0] > extPayoffs['In'][s2][s1][0]) {
			console.log('Deviation by 1 to Out');
			return false;
		}
	}
	return true;
}

function evalBNE () {
	var p1 = textInput('BNE_1');
	var p2 = textInput('BNE_2');
	var p3 = textInput('BNE_3');
	var p4 = textInput('BNE_4');
	var pA = textInput('BNE_A');
	var pB = textInput('BNE_B');
	var pi = fracToDec(signProb);
	var u1, u2, dev;

	if (!isClose(p1 + p2, 1)) {
		console.log("Row's left-matrix probabilities don't add up to one");
		return false;
	}
	if (!isClose(p3 + p4, 1)) {
		console.log("Row's right-matrix probabilities don't add up to one");
		return false;
	}
	if (!isClose(pA + pB, 1)) {
		console.log("Column's probabilities don't add up to one");
		return false;
	}

	// Row left-matrix deviations
	u1  = p1 * pA * payoffs[1]['A'][0]; 
	u1 += p1 * pB * payoffs[1]['B'][0]; 
	u1 += p2 * pA * payoffs[2]['A'][0]; 
	u1 += p2 * pB * payoffs[2]['B'][0]; 

	dev  = pA * payoffs[1]['A'][0];
	dev += pB * payoffs[1]['B'][0];
	if (isLarger(dev, u1)) {
		console.log('Row deviates to 1');
		return false;
	}

	dev  = pA * payoffs[2]['A'][0];
	dev += pB * payoffs[2]['B'][0];
	if (isLarger(dev, u1)) {
		console.log('Row deviates to 2');
		return false;
	}

	// Row right-matrix deviations
	u1  = p3 * pA * payoffs[3]['A'][0]; 
	u1 += p3 * pB * payoffs[3]['B'][0]; 
	u1 += p4 * pA * payoffs[4]['A'][0]; 
	u1 += p4 * pB * payoffs[4]['B'][0]; 

	dev  = pA * payoffs[3]['A'][0];
	dev += pB * payoffs[3]['B'][0];
	if (isLarger(dev, u1)) {
		console.log('Row deviates to 3');
		return false;
	}

	dev  = pA * payoffs[4]['A'][0];
	dev += pB * payoffs[4]['B'][0];
	if (isLarger(dev, u1)) {
		console.log('Row deviates to 4');
		return false;
	}

	// Column deviations
	u2  = pi * p1 * pA * payoffs[1]['A'][1]; 
	u2 += pi * p1 * pB * payoffs[1]['B'][1]; 
	u2 += pi * p2 * pA * payoffs[2]['A'][1]; 
	u2 += pi * p2 * pB * payoffs[2]['B'][1]; 
	u2 += (1-pi) * p3 * pA * payoffs[3]['A'][1]; 
	u2 += (1-pi) * p3 * pB * payoffs[3]['B'][1]; 
	u2 += (1-pi) * p4 * pA * payoffs[4]['A'][1]; 
	u2 += (1-pi) * p4 * pB * payoffs[4]['B'][1]; 

	dev  = pi * p1 * payoffs[1]['A'][1];
	dev += pi * p2 * payoffs[2]['A'][1];
	dev += (1-pi) * p3 * payoffs[3]['A'][1];
	dev += (1-pi) * p4 * payoffs[4]['A'][1];

	if (isLarger(dev, u2)) {
		console.log('Column deviates to A');
		return false;
	}

	dev  = pi * p1 * payoffs[1]['B'][1];
	dev += pi * p2 * payoffs[2]['B'][1];
	dev += (1-pi) * p3 * payoffs[3]['B'][1];
	dev += (1-pi) * p4 * payoffs[4]['B'][1];

	if (isLarger(dev, u2)) {
		console.log('Column deviates to B');
		return false;
	}

	return true;
}

function evalPBE() {
	if (chance === 'No') {
		var p1 = textInput('PBE_1');
		var p2 = textInput('PBE_2');
	}
	else {
		var pIn = textInput('PBE_IN');
		var pi = fracToDec(signProb); // P1 gets to move
	}
	var pOut = textInput('PBE_OUT');
	var pA = textInput('PBE_A');
	var pB = textInput('PBE_B');
	var p = textInput('PBE_p');
	var dev;

	if (!isClose(pA + pB, 1)) {
		console.log("Player 2's probabilities don't add to one");
		return false;
	}

	if (chance === 'No') {
		if (!isClose(p1 + p2 + pOut, 1)) {
			console.log("Player 1's probabilities don't add to one");
			return false;
		}
	
		// Expected payoffs under reported strategies
	
		var u1 = p1 * pA * extPayoffs['1']['A'][0] + p1 * pB * extPayoffs['1']['B'][0] + p2 * pA * extPayoffs['2']['A'][0] + p2 * pB * extPayoffs['2']['B'][0] + pOut * extPayoffs['Out'][0];
		var u2 = p1 * pA * extPayoffs['1']['A'][1] + p1 * pB * extPayoffs['1']['B'][1] + p2 * pA * extPayoffs['2']['A'][1] + p2 * pB * extPayoffs['2']['B'][1] + pOut * extPayoffs['Out'][1];
	
		// Deviations by player 1
	
		dev = pA * extPayoffs['1']['A'][0] + pB * extPayoffs['1']['B'][0];
		if (isLarger(dev, u1)) {
			console.log('Deviation by player 1 to 1');
			return false;
		}
	
		dev = pA * extPayoffs['2']['A'][0] + pB * extPayoffs['2']['B'][0];
		if (isLarger(dev, u1)) {
			console.log('Deviation by player 1 to 2');
			return false;
		}
	
		dev = extPayoffs['Out'][0];
		if (isLarger(dev, u1)) {
			console.log('Deviation by player 1 to Out');
			return false;
		}
	
		// "Global" deviations by player 2
	
		dev = p1 * extPayoffs['1']['A'][1] + p2 * extPayoffs['2']['A'][1] + pOut * extPayoffs['Out'][1];
		if (isLarger(dev, u2)) {
			console.log('Deviation by player 2 to A');
			return false;
		}
	
		dev = p1 * extPayoffs['1']['B'][1] + p2 * extPayoffs['2']['B'][1] + pOut * extPayoffs['Out'][1];
		if (isLarger(dev, u2)) {
			console.log('Deviation by player 2 to B');
			return false;
		}
	
		// "Inner" deviations by player 2
	
		u2 = p * pA * extPayoffs['1']['A'][1] + p * pB * extPayoffs['1']['B'][1] + (1-p) * pA * extPayoffs['2']['A'][1] + (1-p) * pB * extPayoffs['2']['B'][1];
		
		dev = p * extPayoffs['1']['A'][1] + (1-p) * extPayoffs['2']['A'][1];
		if (isLarger(dev, u2)) {
			console.log('Inner deviation by player 2 to A');
			return false;
		}
	
		dev = p * extPayoffs['1']['B'][1] + (1-p) * extPayoffs['2']['B'][1];
		if (isLarger(dev, u2)) {
			console.log('Inner deviation by player 2 to B');
			return false;
		}
	
		// Consistent beliefs
	
		if (p1 + p2 > 0 && !isClose(p, p1 / (p1 + p2))) {
			console.log('Inconsistent beliefs');
			return false;
		}
	}
	else {
		if (!isClose(pIn + pOut, 1)) {
			console.log("Player 1's probabilities don't add to one");
			return false;
		}
	
		// Expected payoffs under reported strategies
	
		var u1 = pOut * extPayoffs['Out'][0] + pIn * pA * extPayoffs[2]['A'][0] + pIn * pB * extPayoffs[2]['B'][0];
		var u2 = pi * pOut * extPayoffs['Out'][1] + pi * pIn * pA * extPayoffs[2]['A'][1] + pi * pIn * pB * extPayoffs[2]['B'][1] + (1-pi) * pA * extPayoffs[1]['A'][1] + (1-pi) * pB * extPayoffs[1]['B'][1];
	
		// Deviations by player 1

		dev = pA * extPayoffs[2]['A'][0] + pB * extPayoffs[2]['B'][0];
		if (isLarger(dev, u1)) {
			console.log('Deviation by player 1 to In');
			return false;
		}
	
		dev = extPayoffs['Out'][0];
		if (isLarger(dev, u1)) {
			console.log('Deviation by player 1 to Out');
			return false;
		}
	
		// Deviations by player 2
	
		dev = (1-pi) * extPayoffs[1]['A'][1] + pi * pIn * extPayoffs[2]['A'][1] + pi * pOut * extPayoffs['Out'][1];
		if (isLarger(dev, u2)) {
			console.log('Deviation by player 2 to A');
			return false;
		}
	
		dev = (1-pi) * extPayoffs[1]['B'][1] + pi * pIn * extPayoffs[2]['B'][1] + pi * pOut * extPayoffs['Out'][1];
		if (isLarger(dev, u2)) {
			console.log('Deviation by player 2 to B');
			return false;
		}
	
		// Consistent beliefs
	
		if (pOut < 1 && !isClose(p, (1-pi)/(1 - pi * pOut))) {
			console.log('Inconsistent beliefs');
			return false;
		}
		if (pOut == 1 && !isClose(p, 1)) {
			console.log('Inconsistent beliefs');
			return false;
		}
	}
	return true;
}

function evalSignal () {
    var p1, p2, p1dev, p2dev, outcome, dev;
    var p = $('SIG_p').value;
    var q = $('SIG_q').value;

    var actions = {
        'U': $('SIG_1').value, 
        'D': $('SIG_2').value,
        'L': $('SIG_3').value,
        'R': $('SIG_4').value
    }

    if (!p || !q || !actions['U'] || !actions['D'] || !actions['L'] || !actions['R']) {
		console.log('Incomplete answer');
        return false;
    }

    // U
    p1 = actions['U'];
    p2 = (p1 === '1') ? $('SIG_3').value : $('SIG_4').value;
    outcome = extPayoffs[p1][p2];

    // Player 1 deviation at U
    p1dev = (p1 === '1') ? '2' : '1';
    p2dev = (p1dev === '1') ? actions['L'] : actions['R'];
    dev = extPayoffs[p1dev][p2dev];
    if (outcome[0] < dev[0]) {
		console.log('Deviation by 1 at U');
		return false;
	}

    // D
    p1 = actions['D'];
    p2 = (p1 === '3') ? actions['L'] : actions['R'];
    outcome = extPayoffs[p1][p2];

    // Player 1 deviation at D
    p1dev = (p1 === '3') ? '4' : '3';
    p2dev = (p1dev === '3') ? actions['L'] : actions['R'];
    dev = extPayoffs[p1dev][p2dev];
    if (outcome[0] < dev[0]) {
		console.log('Deviation by 1 at D');
		return false;
	}

    // Player 2 deviation at L
    p = textInput('SIG_p');
    p2 = actions['L'];
    p2dev = (p2 === 'A') ? 'B' : 'A';
    outcome = p * extPayoffs[1][p2][1] + (1-p) * extPayoffs[3][p2][1];
    dev = p * extPayoffs[1][p2dev][1] + (1-p) * extPayoffs[3][p2dev][1];
    if (isLarger(dev, outcome)) {
		console.log('Deviation by 2 at L');
		return false;
	}

    // Player 2 deviation at R
	q = textInput('SIG_q');
    p2 = actions['R'];
    p2dev = (p2 === 'C') ? 'D' : 'C';
    outcome = q * extPayoffs[2][p2][1] + (1-q) * extPayoffs[4][p2][1];
    dev = q * extPayoffs[2][p2dev][1] + (1-q) * extPayoffs[4][p2dev][1];
    if (isLarger(dev, outcome)) {
		console.log('Deviation by 2 at R');
		return false;
	}

    // Beliefs

    // Separating

    if (actions['U'] == '1' && actions['D'] == '4') {
        if (!isClose(p, 1) || !isClose(q, 0)) {
			console.log('Incorrect beliefs');
			return false;
		}
    }
    if (actions['U'] == '2' && actions['D'] == '3') {
        if (!isClose(p, 0) || !isClose(q, 1)) {
			console.log('Incorrect beliefs');
			return false;
		}
    }

    // Pooling

    if (actions['U'] == '1' && actions['D'] == '3') {
        if (!isClose(p, fracToDec(signProb))) {
			console.log('Incorrect beliefs');
			return false;
		}
    }   
    if (actions['U'] == '2' && actions['D'] == '4') {
        if (!isClose(q, fracToDec(signProb))) {
			console.log('Incorrect beliefs');
			return false;
		}
    }   
    
    return true;
}

function evalCore () {
	var resp = [];
	for (let i = 0; i < players; i++) {
		resp[i] = textInput('x' + i);
	}

	var isCore = true;

	powerset().forEach(x => {
		let tot = 0;
		x.forEach(i => tot += resp[i-1]);
		if (x.length === players) {
			if (!isClose(tot, worth[x])) {
				console.log("Doesn't add up c(N)");
				isCore = false;
			}
		}
		else {
			if (isLarger(tot, worth[x])) {
				console.log(x + 'blocks');
				isCore = false;
			}
		}
	});
	return isCore;
}

function evalShapley () {
	const permutations = arr => {
		if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr;
		return arr.reduce(
			(acc, item, i) =>
			acc.concat(
				permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(val => [
				item,
				...val,
				])
			),
			[]
		);
	};

	var resp = [];
	let tot = []; // Used for later computations
	for (let i = 0; i < players; i++) {
		tot[i] = 0;
		resp[i] = textInput('x' + i);
	}
	let arr = Array.from(Array(players),(e,i) => i+1);
	let orders = permutations(arr);

	orders.forEach(ord => {
		let acc = 0;
		let x = [];
		ord.forEach(i => {
			x.push(i);
			x.sort();
			tot[i-1] += worth[x] - acc;
			acc = worth[x];
		})
	});
	
	var norm = players === 3 ? 6 : 24;
	tot = tot.map(val => val / norm);

	for (let i = 0; i < players; i++) {
		if (!isClose(resp[i], tot[i])) {
			console.log((i+1) + "isn't correct");
			return false;
		}
	}
	return true;
}