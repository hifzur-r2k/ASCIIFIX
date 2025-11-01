// ASCIIFIX/src/grammar_checker/utils/homophoneChecker.js
// Detects commonly confused words (their/there/they're, your/you're, etc.)

/**
 * Common homophone pairs and their context rules
 */
const HOMOPHONES = {
    // Their/There/They're
    'their': {
        alternatives: ['there', 'they\'re'],
        correctPattern: /\b(their)\s+(home|house|car|book|family|friend|parent|child|dog|cat|idea|plan|work|job|life|time|money|business|company|team|project)\b/i,
        description: 'possessive (their car, their home)'
    },
    'there': {
        alternatives: ['their', 'they\'re'],
        correctPattern: /\b(there)\s+(is|are|was|were|has|have|will|would|should|could|can)\b/i,
        description: 'location or existence (over there, there is)'
    },

    // Your/You're
    'your': {
        alternatives: ['you\'re'],
        correctPattern: /\b(your)\s+(home|house|car|book|family|friend|parent|child|dog|cat|idea|plan|work|job|life|time|money|business|name|email|phone)\b/i,
        description: 'possessive (your car, your home)'
    },
    'you\'re': {
        alternatives: ['your'],
        correctPattern: /\b(you\'re)\s+(going|coming|doing|being|having|making|getting|working|living|thinking|feeling|looking|sitting|standing|walking|running|eating|drinking|sleeping|talking|writing|reading)\b/i,
        description: 'contraction of you are (you\'re going)'
    },

    // Its/It's
    'its': {
        alternatives: ['it\'s'],
        correctPattern: /\b(its)\s+(own|color|size|shape|name|purpose|function|meaning|value|price|weight|height|width|length|depth)\b/i,
        description: 'possessive (its color, its own)'
    },
    'it\'s': {
        alternatives: ['its'],
        correctPattern: /\b(it\'s)\s+(a|an|the|not|never|always|very|really|quite|so|too|going|coming|being|time|important|necessary|possible|impossible)\b/i,
        description: 'contraction of it is (it\'s time)'
    },

    // To/Too/Two
    'to': {
        alternatives: ['too', 'two'],
        correctPattern: /\b(to)\s+(the|a|an|my|your|his|her|their|our|be|do|go|make|get|see|know|think|feel|look|work|play|eat|drink)\b/i,
        description: 'direction or infinitive (to go, to the)'
    },
    'too': {
        alternatives: ['to', 'two'],
        correctPattern: /\b(too)\s+(much|many|big|small|good|bad|easy|hard|fast|slow|high|low|hot|cold|old|young|early|late|soon|expensive|cheap)\b/i,
        description: 'also or excessive (too much, me too)'
    },
    'two': {
        alternatives: ['to', 'too'],
        correctPattern: /\b(two)\s+(days|weeks|months|years|hours|minutes|seconds|times|people|cars|houses|books|dogs|cats|children|men|women)\b/i,
        description: 'number 2 (two days, two cars)'
    },

    // Than/Then
    'than': {
        alternatives: ['then'],
        correctPattern: /\b(better|worse|more|less|greater|smaller|bigger|higher|lower|faster|slower|easier|harder|older|younger|stronger|weaker)\s+(than)\b/i,
        description: 'comparison (better than, more than)'
    },
    'then': {
        alternatives: ['than'],
        correctPattern: /\b(and|but|if|when|since|until|before|after|first|next|now|back)\s+(then)\b/i,
        description: 'time or sequence (and then, if then)'
    },

    // Accept/Except
    'accept': {
        alternatives: ['except'],
        correctPattern: /\b(accept)\s+(the|this|that|your|my|his|her|their|our|it|an|a|responsibility|offer|invitation|challenge|defeat|victory)\b/i,
        description: 'to receive or agree (accept the offer)'
    },
    'except': {
        alternatives: ['accept'],
        correctPattern: /\b(except)\s+(for|that|when|where|if|the|this|that|him|her|them|us|me|you)\b/i,
        description: 'excluding (except for, everyone except)'
    },

    // Affect/Effect
    'affect': {
        alternatives: ['effect'],
        correctPattern: /\b(will|can|could|should|would|may|might|must|not|doesn\'t|don\'t|won\'t|can\'t|shouldn\'t|wouldn\'t)\s+(affect)\b/i,
        description: 'to influence (will affect, can affect)'
    },
    'effect': {
        alternatives: ['affect'],
        correctPattern: /\b(the|an|a|this|that|its|his|her|their|our|my|your|side|positive|negative|direct|indirect)\s+(effect)\b/i,
        description: 'result or outcome (the effect, side effect)'

    },
    
    'break': {
        alternatives: ['brake'],
        correctPattern: /\b(break)\s+(the|a|down|free|in|out|up|bad|good|even|your|my)\b/i,
        description: 'to stop or rest (take a break) OR to damage (break glass)'
    },

    'brake': {
        alternatives: ['break'],
        correctPattern: /\b(brake)\s+(pedal|fluid|pad|line|pads|system|lights)\b/i,
        description: 'to stop (brake the car) OR part of car'
    },

    // Which/Witch
    'which': {
        alternatives: ['witch'],
        correctPattern: /\b(which)\s+(is|are|was|were|one|do|did|way|time|color)\b/i,
        description: 'question word or relative clause (which one?)'
    },

    'witch': {
        alternatives: ['which'],
        correctPattern: /\b(witch)\s+(is|cast|doctor|hunt|craft)\b/i,
        description: 'a person who practices magic'
    },

    // Weak/Week
    'weak': {
        alternatives: ['week'],
        correctPattern: /\b(weak)\s+(point|moment|link|signal|stomach|heart|tea|sauce)\b/i,
        description: 'not strong'
    },

    'week': {
        alternatives: ['weak'],
        correctPattern: /\b(week)\s+(ago|ends|day|days|later|before|after)\b/i,
        description: 'seven days'
    },

    // Aloud/Allowed
    'aloud': {
        alternatives: ['allowed'],
        correctPattern: /\b(aloud)\s+(to|in|at|by|for|voice|reading|reading)\b/i,
        description: 'out loud, audibly'
    },

    'allowed': {
        alternatives: ['aloud'],
        correctPattern: /\b(allowed)\s+(to|in|on|at|by|for|here|there)\b/i,
        description: 'permitted'
    },

    // Flour/Flower
    'flour': {
        alternatives: ['flower'],
        correctPattern: /\b(flour)\s+(mix|bag|sack|paste|dust|type|for)\b/i,
        description: 'powder made from grain'
    },

    'flower': {
        alternatives: ['flour'],
        correctPattern: /\b(flower)\s+(pot|bed|shop|garden|arrangement|bloomed|wilted|colors|petals)\b/i,
        description: 'a plant that blooms'
    },

    // Loose/Lose
    'loose': {
        alternatives: ['lose'],
        correctPattern: /\b(loose)\s+(fit|tooth|change|cannon|interpretation|end|thread|screw)\b/i,
        description: 'not tight or not fastened'
    },

    'lose': {
        alternatives: ['loose'],
        correctPattern: /\b(lose)\s+(weight|money|game|match|battle|temper|focus|time)\b/i,
        description: 'to misplace or to be defeated'
    },

    // Passed/Past
    'passed': {
        alternatives: ['past'],
        correctPattern: /\b(passed)\s+(away|by|through|out|down|on|test|exam|grade)\b/i,
        description: 'moved beyond (past tense of pass)'
    },

    'past': {
        alternatives: ['passed'],
        correctPattern: /\b(past)\s+(years|months|weeks|time|decade|century|midnight|noon)\b/i,
        description: 'gone by in time OR beyond something'
    },

    // Principal/Principle
    'principal': {
        alternatives: ['principle'],
        correctPattern: /\b(principal)\s+(of|at|school|officer|investigator|reason|focus)\b/i,
        description: 'school leader OR main/most important'
    },

    'principle': {
        alternatives: ['principal'],
        correctPattern: /\b(principle)\s+(of|behind|moral|ethical|scientific|for|reason)\b/i,
        description: 'a fundamental rule or belief'
    },

    // Stationary/Stationery
    'stationary': {
        alternatives: ['stationery'],
        correctPattern: /\b(stationary)\s+(bike|car|position|object|state|target)\b/i,
        description: 'not moving'
    },

    'stationery': {
        alternatives: ['stationary'],
        correctPattern: /\b(stationery)\s+(store|shop|supplies|paper|set|items|design)\b/i,
        description: 'writing paper and supplies'
    },

    // Sight/Site/Cite
    'sight': {
        alternatives: ['site', 'cite'],
        correctPattern: /\b(sight)\s+(for|sore|eyes|seeing|lost|gained|long)\b/i,
        description: 'the ability to see OR something you see'
    },

    'site': {
        alternatives: ['sight', 'cite'],
        correctPattern: /\b(site)\s+(of|at|for|visit|construction|web|website|link|visit)\b/i,
        description: 'a location OR a website'
    },

    'cite': {
        alternatives: ['sight', 'site'],
        correctPattern: /\b(cite)\s+(evidence|source|example|reason|study|paper|reference|author)\b/i,
        description: 'to quote or reference'
    },

    // Board/Bored
    'board': {
        alternatives: ['bored'],
        correctPattern: /\b(board)\s+(game|room|meeting|walk|members|directors|plane|ship|train)\b/i,
        description: 'a wooden plank OR to get on transport'
    },

    'bored': {
        alternatives: ['board'],
        correctPattern: /\b(bored)\s+(with|stiff|to|tears|out|silly|of)\b/i,
        description: 'not interested'
    },

    // Complement/Compliment
    'complement': {
        alternatives: ['compliment'],
        correctPattern: /\b(complement)\s+(each|other|well|colors|the|flavors|this|your|my)\b/i,
        description: 'goes well with something'
    },

    'compliment': {
        alternatives: ['complement'],
        correctPattern: /\b(compliment)\s+(her|him|you|me|your|their|that|the|someone|person)\b/i,
        description: 'praise or praise someone'
    }
};

/**
 * Check text for homophone errors
 * @param {string} text - Text to check
 * @returns {array} Array of potential homophone errors
 */
function checkHomophones(text) {
    const errors = [];
    const words = text.toLowerCase().split(/\b/);

    // Check each word
    words.forEach((word, index) => {
        const cleanWord = word.trim();

        if (HOMOPHONES[cleanWord]) {
            const homophone = HOMOPHONES[cleanWord];

            // Get context (3 words before and after)
            const contextStart = Math.max(0, index - 6);
            const contextEnd = Math.min(words.length, index + 7);
            const context = words.slice(contextStart, contextEnd).join('');

            // Check if word matches its correct usage pattern
            const isCorrectUsage = homophone.correctPattern.test(context);

            // If pattern doesn't match, might be wrong word
            if (!isCorrectUsage) {
                // Get the position in original text
                const beforeText = words.slice(0, index).join('');
                const offset = beforeText.length;

                errors.push({
                    word: cleanWord,
                    offset: offset,
                    length: cleanWord.length,
                    message: `Possible confusion: "${cleanWord}" might be incorrect. Did you mean "${homophone.alternatives.join('" or "')}"?`,
                    suggestions: homophone.alternatives,
                    context: context.trim(),
                    rule: {
                        id: 'HOMOPHONE_' + cleanWord.toUpperCase(),
                        description: homophone.description,
                        category: 'CONFUSED_WORDS'
                    }
                });
            }
        }
    });

    return errors;
}

/**
 * Get common homophone pairs for reference
 */
function getHomophonePairs() {
    return Object.keys(HOMOPHONES).map(word => ({
        word: word,
        alternatives: HOMOPHONES[word].alternatives,
        usage: HOMOPHONES[word].description
    }));
}

module.exports = {
    checkHomophones,
    getHomophonePairs
};
