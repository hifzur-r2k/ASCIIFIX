// ASCIIFIX/src/grammar_checker/utils/customRules.js
// Custom grammar rules for patterns LanguageTool might miss

/**
 * Apply custom post-processing rules to text
 * @param {string} text - Text to check
 * @returns {array} Array of custom rule violations
 */
function applyCustomRules(text) {
    const errors = [];

    // Rule 1: Multiple punctuation (,,, or !!!)
    errors.push(...checkMultiplePunctuation(text));

    // Rule 2: Spacing issues
    errors.push(...checkSpacingIssues(text));

    // Rule 3: Article usage (a/an)
    errors.push(...checkArticleUsage(text));

    // Rule 4: Double words (the the)
    errors.push(...checkDoubleWords(text));

    // Rule 5: Sentence fragments
    errors.push(...checkSentenceFragments(text));

    // Rule 6: Subject-Verb Agreement (basic patterns)
    errors.push(...checkSubjectVerbAgreement(text));

    // Rule 7: Common ESL mistakes (article usage)
    errors.push(...checkArticleErrors(text));

    // Rule 8: Tense consistency
    errors.push(...checkTenseConsistency(text));

    // Rule 9: Capitalization issues
    errors.push(...checkCapitalization(text));

    // Rule 10: Comma splices (two independent clauses joined by comma)
    errors.push(...checkCommaSplices(text));

    // Rule 11: Run-on sentences
    errors.push(...checkRunOnSentences(text));

    // Rule 12: Quotation mark mismatches
    errors.push(...checkQuotationMarks(text));

    // Rule 13: Apostrophe misuse (its/it's)
    errors.push(...checkApostrophes(text));

    // Rule 14: Repeated words in same paragraph
    errors.push(...checkRepeatedWords(text));

    // Rule 15: Numbers written inconsistently
    errors.push(...checkNumberFormatting(text));


    return errors;
}

/**
 * Check for multiple consecutive punctuation marks
 */
function checkMultiplePunctuation(text) {
    const errors = [];
    const patterns = [
        { regex: /[,]{2,}/g, name: 'commas', correct: ',' },
        { regex: /[.]{2,}(?!\.)/g, name: 'periods', correct: '.' },
        { regex: /[!]{2,}/g, name: 'exclamation marks', correct: '!' },
        { regex: /[?]{2,}/g, name: 'question marks', correct: '?' },
        { regex: /[;]{2,}/g, name: 'semicolons', correct: ';' }
    ];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            errors.push({
                offset: match.index,
                length: match[0].length,
                message: `Multiple ${pattern.name} detected. Use only one.`,
                replacements: [{ value: pattern.correct }],
                rule: {
                    id: 'MULTIPLE_PUNCTUATION',
                    issueType: 'punctuation',
                    category: { id: 'PUNCTUATION' }
                }
            });
        }
    });

    return errors;
}

/**
 * Check for spacing issues
 */
function checkSpacingIssues(text) {
    const errors = [];

    // Multiple spaces
    const multiSpaceRegex = /\s{2,}/g;
    let match;
    while ((match = multiSpaceRegex.exec(text)) !== null) {
        errors.push({
            offset: match.index,
            length: match[0].length,
            message: 'Multiple spaces detected. Use only one space.',
            replacements: [{ value: ' ' }],
            rule: {
                id: 'MULTIPLE_SPACES',
                issueType: 'whitespace',
                category: { id: 'TYPOGRAPHY' }
            }
        });
    }

    // Space before punctuation
    const spaceBeforePunctRegex = /\s+([,.!?;:])/g;
    while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
        errors.push({
            offset: match.index,
            length: match[0].length,
            message: 'Remove space before punctuation.',
            replacements: [{ value: match[1] }],
            rule: {
                id: 'SPACE_BEFORE_PUNCTUATION',
                issueType: 'whitespace',
                category: { id: 'TYPOGRAPHY' }
            }
        });
    }

    return errors;
}

/**
 * Check article usage (a/an)
 */
function checkArticleUsage(text) {
    const errors = [];

    // "a" before vowel sound
    const aBeforeVowelRegex = /\ba\s+([aeiou])/gi;
    let match;
    while ((match = aBeforeVowelRegex.exec(text)) !== null) {
        // Skip exceptions like "a university" (starts with 'y' sound)
        const nextWord = text.substring(match.index + 2, text.indexOf(' ', match.index + 2));
        if (!['university', 'european', 'one', 'once', 'united'].some(exc => nextWord.toLowerCase().startsWith(exc))) {
            errors.push({
                offset: match.index,
                length: 1,
                message: `Use "an" instead of "a" before vowel sounds.`,
                replacements: [{ value: 'an' }],
                rule: {
                    id: 'A_VS_AN',
                    issueType: 'grammar',
                    category: { id: 'GRAMMAR' }
                }
            });
        }
    }

    // "an" before consonant sound
    const anBeforeConsonantRegex = /\ban\s+([bcdfghjklmnpqrstvwxyz])/gi;
    while ((match = anBeforeConsonantRegex.exec(text)) !== null) {
        // Skip exceptions like "an hour" (silent 'h')
        const nextWord = text.substring(match.index + 3, text.indexOf(' ', match.index + 3));
        if (!['hour', 'honest', 'honor'].some(exc => nextWord.toLowerCase().startsWith(exc))) {
            errors.push({
                offset: match.index,
                length: 2,
                message: `Use "a" instead of "an" before consonant sounds.`,
                replacements: [{ value: 'a' }],
                rule: {
                    id: 'AN_VS_A',
                    issueType: 'grammar',
                    category: { id: 'GRAMMAR' }
                }
            });
        }
    }

    return errors;
}

/**
 * Check for double words (accidental repetition)
 */
function checkDoubleWords(text) {
    const errors = [];
    const doubleWordRegex = /\b(\w+)\s+\1\b/gi;
    let match;

    while ((match = doubleWordRegex.exec(text)) !== null) {
        errors.push({
            offset: match.index,
            length: match[0].length,
            message: `The word "${match[1]}" is repeated.`,
            replacements: [{ value: match[1] }],
            rule: {
                id: 'DOUBLE_WORD',
                issueType: 'duplication',
                category: { id: 'REDUNDANCY' }
            }
        });
    }

    return errors;
}

/**
 * Check for common sentence fragments
 */
function checkSentenceFragments(text) {
    const errors = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0 && trimmed.length < 15) {
            // Check if sentence starts with conjunction
            const fragmentWords = ['and', 'but', 'or', 'because', 'although', 'though', 'unless', 'since', 'while'];
            const firstWord = trimmed.toLowerCase().split(/\s+/)[0];

            if (fragmentWords.includes(firstWord)) {
                const offset = text.indexOf(trimmed);
                errors.push({
                    offset: offset,
                    length: trimmed.length,
                    message: `Possible sentence fragment. Sentences shouldn't start with "${firstWord}".`,
                    replacements: [],
                    rule: {
                        id: 'SENTENCE_FRAGMENT',
                        issueType: 'grammar',
                        category: { id: 'GRAMMAR' }
                    }
                });
            }
        }
    });

    return errors;
}

/**
 * NEW RULE 6: Subject-Verb Agreement
 * Example: "The team are" should be "The team is"
 */
function checkSubjectVerbAgreement(text) {
    const errors = [];

    // Pattern: Singular subject + plural verb
    const singularPluralPatterns = [
        { pattern: /\b(team|group|committee|family|company|government|class)\s+(are|have|don't|haven't)\b/gi, correct: 'is/has/doesn\'t/hasn\'t' },
        { pattern: /\b(data|criteria|media)\s+(is|has)\b/gi, correct: 'are/have' },
        { pattern: /\b(each|every|everyone|everybody|anyone|anybody)\s+(are|have)\b/gi, correct: 'is/has' }
    ];

    singularPluralPatterns.forEach(({ pattern, correct }) => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
            errors.push({
                offset: match.index,
                length: match[0].length,
                message: `Subject-verb agreement error. Expected: "${correct}"`,
                replacements: [{ value: correct }],
                ruleId: 'SUBJECT_VERB_AGREEMENT',
                category: { id: 'GRAMMAR' },
                type: 'Other'
            });
        });
    });

    return errors;
}

/**
 * NEW RULE 7: Common ESL Article Errors
 * Example: "I want job" should be "I want a job"
 */
function checkArticleErrors(text) {
    const errors = [];

    // Pattern: Missing article before noun
    const missingArticlePatterns = [
        { pattern: /\b(I have|I want|I need|I see|I found|I took)\s+([aeiou][a-z]+)\b/gi, suggestion: 'add "a" or "an"' },
        { pattern: /\b(is|are)\s+([aeiou][a-z]{5,})\b/gi, suggestion: 'add "a" or "an"' }
    ];

    missingArticlePatterns.forEach(({ pattern, suggestion }) => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
            errors.push({
                offset: match.index,
                length: match[0].length,
                message: `Missing article (a/an/the). ${suggestion}`,
                ruleId: 'MISSING_ARTICLE',
                category: { id: 'GRAMMAR' },
                type: 'Other'
            });
        });
    });

    return errors;
}

/**
 * NEW RULE 8: Tense Consistency
 * Example: "I walked and I am going" - mix of past and present
 */
function checkTenseConsistency(text) {
    const errors = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach(sentence => {
        const pastTenseWords = (sentence.match(/\b(was|were|had|did|went|came|saw|took|made)\b/gi) || []).length;
        const presentTenseWords = (sentence.match(/\b(is|are|have|has|do|does|go|come|see|take|make)\b/gi) || []).length;

        // If both past and present tense in same sentence (except certain patterns)
        if (pastTenseWords > 0 && presentTenseWords > 0) {
            const isMixed = !/(because|before|after|while|when|if|although)/.test(sentence);

            if (isMixed) {
                errors.push({
                    offset: text.indexOf(sentence),
                    length: sentence.length,
                    message: 'Mixed verb tenses detected. Try to use consistent tense.',
                    ruleId: 'TENSE_CONSISTENCY',
                    category: { id: 'STYLE' },
                    type: 'Other'
                });
            }
        }
    });

    return errors;
}

/**
 * NEW RULE 9: Capitalization Issues
 * Example: "i am happy" should be "I am happy"
 */
function checkCapitalization(text) {
    const errors = [];

    // Pattern: First person "i" should be "I"
    const iCapitalPattern = /\b(i)\s+(am|was|have|had|will|would|can|could|should|must|do|did|don't|didn't)\b/g;
    const matches = [...text.matchAll(iCapitalPattern)];

    matches.forEach(match => {
        errors.push({
            offset: match.index,
            length: 1,
            message: 'The pronoun "I" should be capitalized.',
            replacements: [{ value: 'I' }],
            ruleId: 'CAPITALIZATION_I',
            category: { id: 'GRAMMAR' },
            type: 'Other'
        });
    });

    // Pattern: Sentence start not capitalized
    const sentenceStartPattern = /([.!?]\s+)([a-z])/g;
    const startMatches = [...text.matchAll(sentenceStartPattern)];

    startMatches.forEach(match => {
        errors.push({
            offset: match.index + match[1].length,
            length: 1,
            message: 'Sentence should start with capital letter.',
            replacements: [{ value: match[2].toUpperCase() }],
            ruleId: 'SENTENCE_START_CAPITALIZATION',
            category: { id: 'GRAMMAR' },
            type: 'Other'
        });
    });

    return errors;
}

/**
 * NEW RULE 10: Comma Splice Detection
 * Example: "She went home, she was tired" - should be separate sentences or use semicolon
 */
function checkCommaSplices(text) {
    const errors = [];

    // Pattern: Independent clause, conjunction + independent clause
    const commaSplicePattern = /\b([A-Z][^.!?]*?[a-z]),\s+([a-z][^.!?]*?)(\.|\?|!)/g;
    const matches = [...text.matchAll(commaSplicePattern)];

    matches.forEach(match => {
        // Check if the second part is an independent clause (has subject + verb)
        if (/\b(I|you|he|she|it|we|they|[A-Z][a-z]+)\s+(am|is|are|was|were|be|been|have|has|had|do|does|did|will|would|should|could|can|may|might|must)\b/.test(match[2])) {
            errors.push({
                offset: match.index + match[1].length,
                length: 1,
                message: 'Comma splice detected. Use semicolon or separate into two sentences.',
                ruleId: 'COMMA_SPLICE',
                category: { id: 'GRAMMAR' },
                type: 'Other'
            });
        }
    });

    return errors;
}

/**
 * NEW RULE 11: Run-on Sentences
 * Example: "I went to the store and I bought milk and I came home" - too long
 */
function checkRunOnSentences(text) {
    const errors = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach(sentence => {
        const conjunctions = (sentence.match(/\b(and|but|or|yet|because|so)\b/gi) || []).length;
        const words = sentence.trim().split(/\s+/).length;

        // If many conjunctions and very long sentence = run-on
        if (conjunctions > 4 && words > 30) {
            errors.push({
                offset: text.indexOf(sentence),
                length: sentence.length,
                message: 'Run-on sentence detected. Break into shorter sentences.',
                ruleId: 'RUN_ON_SENTENCE',
                category: { id: 'STYLE' },
                type: 'Other'
            });
        }
    });

    return errors;
}

/**
 * NEW RULE 12: Quotation Mark Matching
 * Example: "This is a quote (should match pairs)
 */
function checkQuotationMarks(text) {
    const errors = [];

    // Count opening and closing quotes
    const doubleQuotes = text.split('"').length - 1;
    const singleQuotes = text.split("'").length - 1;

    // Quotes should be even number (pairs)
    if (doubleQuotes % 2 !== 0) {
        errors.push({
            offset: text.lastIndexOf('"'),
            length: 1,
            message: 'Mismatched quotation marks. Check for opening/closing quotes.',
            ruleId: 'MISMATCHED_QUOTES',
            category: { id: 'PUNCTUATION' },
            type: 'Other'
        });
    }

    // Check for smart quotes mixed with straight quotes
    const hasSmartQuotes = /[""''«»]/.test(text);
    const hasStraightQuotes = /["']/.test(text);

    if (hasSmartQuotes && hasStraightQuotes) {
        errors.push({
            offset: 0,
            length: text.length,
            message: 'Mixed quote styles detected. Use either smart quotes or straight quotes consistently.',
            ruleId: 'MIXED_QUOTE_STYLES',
            category: { id: 'STYLE' },
            type: 'Other'
        });
    }

    return errors;
}

/**
 * NEW RULE 13: Apostrophe Misuse
 * Example: "Its beautiful" should be "It's beautiful"
 */
function checkApostrophes(text) {
    const errors = [];

    // Pattern: its (possessive) used instead of it's (contraction)
    const itsItIsPattern = /\b(its)\s+(is|was|has|have|been|being|are|were|be)\b/g;
    const itsMatches = [...text.matchAll(itsItIsPattern)];

    itsMatches.forEach(match => {
        errors.push({
            offset: match.index,
            length: 3,
            message: 'Use "it\'s" (contraction of "it is"), not "its" (possessive).',
            replacements: [{ value: 'it\'s' }],
            ruleId: 'ITS_IT_IS',
            category: { id: 'GRAMMAR' },
            type: 'Other'
        });
    });

    // Pattern: Plural possessive with wrong apostrophe
    const wrongPluralPossessive = /\b([a-z]+)\'s\s+([a-z]+s)\b/g;

    return errors;
}

/**
 * NEW RULE 14: Repeated Words in Paragraph
 * Example: "I think this is important. This is very important."
 */
function checkRepeatedWords(text) {
    const errors = [];
    const paragraphs = text.split(/\n\n+/);

    paragraphs.forEach((para, paraIndex) => {
        const sentences = para.split(/[.!?]+/);
        const usedWords = new Set();

        sentences.forEach((sentence, sentenceIndex) => {
            const words = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];

            words.forEach(word => {
                // If this significant word (4+ letters) appeared before in paragraph
                if (usedWords.has(word) && sentenceIndex > 0) {
                    const offset = text.indexOf(sentence);

                    errors.push({
                        offset: offset + sentence.indexOf(word),
                        length: word.length,
                        message: `Word "${word}" was already used recently. Consider using a synonym.`,
                        ruleId: 'REPEATED_WORDS',
                        category: { id: 'STYLE' },
                        type: 'Other'
                    });
                }

                usedWords.add(word);
            });
        });
    });

    return errors.slice(0, 5); // Return max 5 to avoid overwhelming user
}

/**
 * NEW RULE 15: Number Formatting Consistency
 * Example: "I have 5 apples and ten oranges" - mix of digit and word forms
 */
function checkNumberFormatting(text) {
    const errors = [];

    // Count digit numbers (5, 10, 100)
    const digitNumbers = text.match(/\b\d+\b/g) || [];
    // Count word numbers (five, ten, hundred)
    const wordNumbers = text.match(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi) || [];

    // If both styles used in same text (except for specific numbers like addresses)
    if (digitNumbers.length > 0 && wordNumbers.length > 0) {
        // Only flag if they're close together (same paragraph context)
        const paragraphs = text.split(/\n\n+/);

        paragraphs.forEach(para => {
            const hasDigits = /\b\d+\b/.test(para);
            const hasWords = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(para);

            if (hasDigits && hasWords) {
                errors.push({
                    offset: text.indexOf(para),
                    length: para.length,
                    message: 'Mixed number formats. Use either digits (5) or words (five) consistently.',
                    ruleId: 'NUMBER_FORMAT_CONSISTENCY',
                    category: { id: 'STYLE' },
                    type: 'Other'
                });
            }
        });
    }

    return errors;
}


module.exports = {
    applyCustomRules
};
