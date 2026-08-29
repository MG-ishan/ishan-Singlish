/**
 * Singlish & English to Sinhala Converter Engine
 * Pure Offline JavaScript Module
 * Supports:
 *  - Singlish Popular Phonetic Mode (Helakuru style)
 *  - Singlish Official UCSC Scheme Mode
 *  - Offline English Dictionary Converter Mode
 *  - Mixed Sinhala & English Output Mode (Strips quotes so English words appear cleanly without quotation marks)
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.SinglishConverter = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    // Common Vowels Standalone
    const VOWELS_STANDALONE = {
        "aaw": "ඈ", "aae": "ඈ", "aah": "ආ", "a~": "ආ", "aa": "ආ", "A": "ආ",
        "aew": "ෑ", "ae": "ඇ", "aw": "ඇ",
        "ai": "ඓ", "au": "ඖ",
        "ee": "ඒ", "ea": "එ", "ei": "එ", "E": "ඒ",
        "oo": "ඕ", "O": "ඕ",
        "ii": "ඊ", "I": "ඊ",
        "uu": "ඌ", "U": "ඌ",
        "a": "අ", "i": "ඉ", "u": "උ", "e": "එ", "o": "ඔ",
        "ruu": "ඎ", "ru": "ඍ", "R": "ඍ"
    };

    // Vowel signs attached to consonants
    const VOWEL_SIGNS = {
        "aaw": "ෑ", "aae": "ෑ", "aah": "ා", "a~": "ා", "aa": "ා", "A": "ා",
        "aew": "ෑ", "ae": "ැ", "aw": "ැ",
        "ai": "ෛ", "au": "ෞ",
        "ee": "ේ", "ea": "ෙ", "ei": "ෙ", "E": "ේ",
        "oo": "ෝ", "O": "ෝ",
        "ii": "ී", "I": "ී",
        "uu": "ූ", "U": "ූ",
        "a": "", "i": "ි", "u": "ු", "e": "ෙ", "o": "ො",
        "ruu": "ෲ", "ru": "ෘ", "R": "ෘ"
    };

    // Popular Phonetic Consonants (Helakuru style)
    const CONSONANTS_POPULAR = {
        "n-g": "න්ග්", "n-d": "න්ද්", "n-b": "න්බ්", "n-j": "න්ජ්",
        "thh": "ථ", "dhh": "ධ", "chh": "ඡ", "khh": "ඛ", "ghh": "ඝ", "phh": "ඵ", "bhh": "භ",
        "th": "ත", "dh": "ද", "kh": "ඛ", "gh": "ඝ", "ch": "ච", "Ch": "ඡ",
        "jh": "ඣ", "ph": "ඵ", "bh": "භ", "sh": "ශ", "Sh": "ෂ", "SH": "ෂ",
        "ng": "ඟ", "nd": "ඳ", "mb": "ඹ", "nj": "ඤ", "ny": "ඤ", "kn": "ක්න",
        "Lu": "ළු",
        "k": "ක", "g": "ග", "t": "ත", "T": "ට", "d": "ද", "D": "ඩ", "n": "න", "N": "ණ",
        "p": "ප", "b": "බ", "m": "ම", "y": "ය", "r": "ර", "l": "ල", "v": "ව", "w": "ව",
        "s": "ස", "h": "හ", "L": "ළ", "f": "ෆ", "F": "ෆ",
        "K": "ඛ", "G": "ඝ", "C": "ඡ", "J": "ඣ", "P": "ඵ", "B": "භ", "S": "ෂ",
        "x": "ං", "X": "ං", "H": "ඃ"
    };

    // Official UCSC Scheme Consonants
    const CONSONANTS_UCSC = {
        "n-g": "න්ග්", "n-d": "න්ද්", "n-b": "න්බ්", "n-j": "න්ජ්",
        "thh": "ථ", "dhh": "ධ", "chh": "ඡ", "khh": "ඛ", "ghh": "ඝ", "phh": "ඵ", "bhh": "භ",
        "th": "ත", "dh": "ද", "kh": "ඛ", "gh": "ඝ", "ch": "ච", "Ch": "ඡ",
        "jh": "ඣ", "ph": "ඵ", "bh": "භ", "sh": "ශ", "Sh": "ෂ", "SH": "ෂ",
        "ng": "ඟ", "nd": "ඳ", "mb": "ඹ", "nj": "ඤ", "ny": "ඤ", "kn": "ක්න",
        "Lu": "ළු",
        "k": "ක", "g": "ග", "t": "ට", "T": "ට", "d": "ඩ", "D": "ඩ", "n": "න", "N": "ණ",
        "p": "ප", "b": "බ", "m": "ම", "y": "ය", "r": "ර", "l": "ල", "v": "ව", "w": "ව",
        "s": "ස", "h": "හ", "L": "ළ", "f": "ෆ", "F": "ෆ",
        "K": "ඛ", "G": "ඝ", "C": "ඡ", "J": "ඣ", "P": "ඵ", "B": "භ", "S": "ෂ",
        "x": "ං", "X": "ං", "H": "ඃ"
    };

    // Comprehensive Offline English-to-Sinhala Dictionary
    const ENGLISH_DICTIONARY = {
        "good morning": "සුබ උදෑසනක්",
        "good afternoon": "සුබ පස්වරුවක්",
        "good evening": "සුබ සැන්දෑවක්",
        "good night": "සුබ රාත්‍රියක්",
        "good day": "සුබ දවසක්",
        "thank you very much": "බොහොම ස්තුතියි",
        "thank you": "ස්තුතියි",
        "thanks": "ස්තුතියි",
        "you are welcome": "සාදරයෙන් පිළිගනිමු",
        "welcome": "සාදරයෙන් පිළිගනිමු",
        "how are you": "කොහොමද ඔයාට",
        "how are you doing": "කොහොමද විස්තර",
        "what is your name": "ඔයාගේ නම මොකක්ද",
        "my name is": "මගේ නම",
        "see you later": "පස්සේ හමුවෙමු",
        "see you": "හමුවෙමු",
        "take care": "පරිස්සමෙන් ඉන්න",
        "excuse me": "සමාවෙන්න",
        "no problem": "ප්‍රශ්නයක් නැහැ",
        "please": "කරුණාකරලා",
        "sorry": "කනගාටුයි",
        "hello": "ආයුබෝවන්",
        "hi": "හලෝ",
        "bye": "ගිහින් එන්නම්",
        "goodbye": "ආයුබෝවන්",
        "yes": "ඔව්",
        "no": "නැහැ",
        "okay": "හරි",
        "ok": "හරි",
        "good": "හොඳයි",
        "very good": "ගොඩක් හොඳයි",
        "bad": "නරකයි",
        "happy birthday": "සුබ උපන්දිනක්",
        "congratulations": "සුබ පැතුම්",
        "mother": "අම්මා", "mom": "අම්මා", "mum": "අම්මා",
        "father": "තාත්තා", "dad": "තාත්තා",
        "brother": "සහෝදරයා", "sister": "සහෝදරිය",
        "elder brother": "අයියා", "younger brother": "මල්ලී",
        "elder sister": "අක්කා", "younger sister": "නංගී",
        "son": "පුතා", "daughter": "දුව",
        "child": "ළමයා", "children": "ළමයි",
        "friend": "යාළුවා", "friends": "යාළුවෝ",
        "family": "පවුල", "baby": "බබා",
        "man": "මිනිසා", "woman": "කාන්තාව",
        "boy": "පිරිමි ළමයා", "girl": "ගෑනු ළමයා",
        "people": "මිනිස්සු", "person": "කෙනෙක්",
        "home": "ගෙදර", "house": "නිවස", "school": "පාසල",
        "water": "වතුර", "food": "කෑම", "rice": "බත්",
        "tea": "තේ", "coffee": "කෝපි", "milk": "කිරි",
        "money": "සල්ලි", "book": "පොත", "pen": "පෑන",
        "phone": "දුරකථනය", "mobile": "ෆෝන් එක",
        "car": "කාර් එක", "vehicle": "වාහනය", "bus": "බස් එක",
        "hospital": "රෝහල", "shop": "කඩේ", "store": "කඩේ",
        "work": "වැඩ", "job": "රක්ෂාව", "country": "රට",
        "village": "ගම", "city": "නගරය", "town": "නගරය",
        "sea": "මුහුද", "ocean": "මුහුද", "sun": "ඉර",
        "moon": "හඳ", "star": "තරුව", "flower": "මල",
        "tree": "ගහ", "rain": "වැස්ස",
        "today": "අද", "tomorrow": "හෙට", "yesterday": "ඊයේ",
        "now": "දැන්", "later": "පස්සේ", "morning": "උදෑසන",
        "night": "රාත්‍රිය", "day": "දවස", "time": "වේලාව",
        "monday": "සඳුදා", "tuesday": "අඟහරුවාදා", "wednesday": "බදාදා",
        "thursday": "බ්‍රහස්පතින්දා", "friday": "සිකුරාදා", "saturday": "සෙනසුරාදා", "sunday": "ඉරිදා",
        "love": "ආදරය", "happy": "සතුටුයි", "sad": "කනගාටුයි",
        "beautiful": "ලස්සනයි", "going": "යනවා", "go": "යන්න",
        "coming": "එනවා", "come": "එන්න", "eating": "කනවා", "eat": "කන්න",
        "drinking": "බොනවා", "drink": "බොන්න", "sleeping": "නිදාගන්නවා", "sleep": "නිදාගන්න",
        "watching": "බලනවා", "see": "බලන්න", "help": "උදව්", "learn": "ඉගෙන ගන්නවා",
        "one": "එක", "two": "දෙක", "three": "තුන", "four": "හතර", "five": "පහ",
        "six": "හය", "seven": "හත", "eight": "අට", "nine": "නමය", "ten": "දහය"
    };

    const SPECIAL_WORDS_SINGLISH = [
        ["sri lanka", "ශ්‍රී ලංකා"],
        ["srilanka", "ශ්‍රී ලංකා"],
        ["sinhala", "සිංහල"],
        ["sri", "ශ්‍රී"],
        ["shri", "ශ්‍රී"],
        ["lanka", "ලංකා"],
        ["lankawa", "ලංකාව"]
    ];

    function matchPrefix(text, dict) {
        const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (text.startsWith(key)) {
                return { key: key, val: dict[key] };
            }
        }
        return null;
    }

    /**
     * Converts English text to Sinhala
     */
    function convertEnglishToSinhala(text) {
        if (!text) return '';

        let result = text;
        const sortedKeys = Object.keys(ENGLISH_DICTIONARY).sort((a, b) => b.length - a.length);

        for (const engKey of sortedKeys) {
            const sinVal = ENGLISH_DICTIONARY[engKey];
            const regex = new RegExp(`\\b${engKey}\\b`, 'gi');
            result = result.replace(regex, sinVal);
        }

        return result;
    }

    /**
     * Pre-processes text to extract preserved English segments:
     * 1. Quoted text: "Hello" or 'World' -> preserved as-is, BUT quotes are removed from output!
     * 2. Escaped words: \Zoom or \WhatsApp -> preserved as Zoom, WhatsApp
     * 3. ALL-CAPS acronyms: PDF, API, USB, CEO -> preserved as-is
     */
    function extractPreservedBlocks(text) {
        const preserved = [];
        let cleanText = text;

        // 1. Quoted segments "..." or '...' -> strip surrounding quotes in output
        cleanText = cleanText.replace(/(["'])(.*?)\1/g, (match, quote, content) => {
            const placeholder = `__PRESERVED_${preserved.length}__`;
            preserved.push(content); // push inner content WITHOUT surrounding quotes!
            return placeholder;
        });

        // 2. Escaped words \Word
        cleanText = cleanText.replace(/\\([a-zA-Z0-9_-]+)/g, (match, word) => {
            const placeholder = `__PRESERVED_${preserved.length}__`;
            preserved.push(word); // preserve without backslash
            return placeholder;
        });

        // 3. All-Caps Acronyms (2+ letters like PDF, API, CEO, USB, IT, SMS)
        cleanText = cleanText.replace(/\b([A-Z]{2,})\b/g, (match, acronym) => {
            const placeholder = `__PRESERVED_${preserved.length}__`;
            preserved.push(acronym);
            return placeholder;
        });

        return { text: cleanText, preserved: preserved };
    }

    function restorePreservedBlocks(convertedText, preserved) {
        let restored = convertedText;
        for (let i = 0; i < preserved.length; i++) {
            const placeholder = `__PRESERVED_${i}__`;
            restored = restored.replace(new RegExp(placeholder, 'g'), preserved[i]);
        }
        return restored;
    }

    /**
     * Main converter supporting Singlish, English, and Mixed Output (quote-free)
     */
    function convertText(text, mode = 'popular') {
        if (!text) return '';

        // Extract preserved English blocks (quotes stripped, \escapes, acronyms)
        const { text: processedInput, preserved } = extractPreservedBlocks(text);

        let convertedOutput = '';

        if (mode === 'english') {
            convertedOutput = convertEnglishToSinhala(processedInput);
        } else {
            const consonants = (mode === 'ucsc') ? CONSONANTS_UCSC : CONSONANTS_POPULAR;

            let processedText = processedInput;
            for (const [eng, sin] of SPECIAL_WORDS_SINGLISH) {
                const regex = new RegExp(`\\b${eng}\\b`, 'gi');
                processedText = processedText.replace(regex, sin);
            }

            let result = [];
            let i = 0;
            const n = processedText.length;

            while (i < n) {
                const char = processedText[i];

                if (!/[a-zA-Z~-]/.test(char) || processedText.slice(i).startsWith('__PRESERVED_')) {
                    if (processedText.slice(i).startsWith('__PRESERVED_')) {
                        const matchPlaceholder = processedText.slice(i).match(/^__PRESERVED_\d+__/);
                        if (matchPlaceholder) {
                            result.push(matchPlaceholder[0]);
                            i += matchPlaceholder[0].length;
                            continue;
                        }
                    }
                    result.push(char);
                    i++;
                    continue;
                }

                const sub = processedText.slice(i);

                // 1. Try consonant match
                const cMatch = matchPrefix(sub, consonants);

                if (cMatch) {
                    const cKey = cMatch.key;
                    const cVal = cMatch.val;
                    const cLen = cKey.length;

                    if (cKey === "x" || cKey === "X" || cKey === "H") {
                        result.push(cVal);
                        i += cLen;
                        continue;
                    }

                    let rem = sub.slice(cLen);
                    let isRakaransaya = false;
                    let isYansaya = false;
                    let modifierLen = 0;

                    if (rem.startsWith('r') && !rem.startsWith('ru') && !rem.startsWith('ruu')) {
                        const afterR = rem.slice(1);
                        if (afterR.length > 0 && /[aeiouAEIOU~]/.test(afterR[0])) {
                            isRakaransaya = true;
                            modifierLen = 1;
                            rem = afterR;
                        }
                    } else if (rem.startsWith('y')) {
                        const afterY = rem.slice(1);
                        if (afterY.length > 0 && /[aeiouAEIOU~]/.test(afterY[0])) {
                            isYansaya = true;
                            modifierLen = 1;
                            rem = afterY;
                        }
                    }

                    // 2. Check Vowel sign following consonant
                    const vMatch = matchPrefix(rem, VOWEL_SIGNS);

                    if (vMatch) {
                        const vVal = vMatch.val;
                        const vLen = vMatch.key.length;

                        let base = cVal;
                        if (isRakaransaya) {
                            base = base + "්\u200Dර";
                        } else if (isYansaya) {
                            base = base + "්\u200Dය";
                        }

                        result.push(base + vVal);
                        i += cLen + modifierLen + vLen;
                    } else {
                        let base = cVal;
                        if (isRakaransaya) {
                            base = base + "්\u200Dර";
                        } else if (isYansaya) {
                            base = base + "්\u200Dය";
                        } else {
                            base = base + "්";
                        }

                        result.push(base);
                        i += cLen + modifierLen;
                    }
                } else {
                    // 3. Try standalone vowel match
                    const vMatch = matchPrefix(sub, VOWELS_STANDALONE);
                    if (vMatch) {
                        result.push(vMatch.val);
                        i += vMatch.key.length;
                    } else {
                        result.push(char);
                        i++;
                    }
                }
            }

            convertedOutput = result.join('');
        }

        // Restore preserved English text blocks (quotes removed)
        return restorePreservedBlocks(convertedOutput, preserved);
    }

    return {
        convert: convertText,
        convertEnglish: convertEnglishToSinhala,
        englishDictionary: ENGLISH_DICTIONARY,
        vowels: VOWELS_STANDALONE,
        consonantsPopular: CONSONANTS_POPULAR,
        consonantsUCSC: CONSONANTS_UCSC
    };
}));
