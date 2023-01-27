import "../../utils/deleteAt";

interface WordList {
    [word: string]: {
        original: string;
        list: string[];
    }
}

export default class MarkovChains {
    public wordList: WordList;
    
    /**
     * @param wordList A custom dictionary.
     */
    constructor(wordList?: WordList) {
        this.wordList = wordList ?? {};
    }

    /**
     * Maps the words to generate sentences.
     * @param texts An array of texts.
     */
    generateDictionary(texts: string[]): void {
        this.wordList = {};
        texts.forEach(text => this.pickWords(text));
    }

    /**
     * Generates a sentence.
     * @param max Maximum words in the sentence.
     * @returns Generated sentence.
     */
    generateChain(max: number): string {
        let wordArray = Object.keys(this.wordList);
        if (wordArray.length < 1) return;

        let lastWord: string;
        let generatedWords: string[] = [];
        while (!lastWord) {
            lastWord = this.wordList[wordArray[Math.floor(Math.random() * wordArray.length)]].original;
        }
        
        generatedWords.push(lastWord);

        for (let i=0; i < max - 1; i++) {
            if (!lastWord) break;

            const nextWord = this.wordList[this.parseKey(lastWord)];
            if (!nextWord) break;
            lastWord = nextWord.list[Math.floor(Math.random() * nextWord.list.length)];

            generatedWords.push(lastWord);
        }

        return this.filterGeneratedText(generatedWords.join(" "));
    }

    /**
     * Extracts the words from the text and put them in the dictionary.
     * @param text Text to extract the words.
     */
    private pickWords(text: string) {
        let splittedWords: string[] = text.split(/ +/g);
        splittedWords.forEach((word, i) => {
            let wordKey = this.parseKey(word);
            if (!wordKey) return;

            let nextWord = splittedWords[i + 1];

            if (!this.wordList[wordKey]) {
                this.wordList[wordKey] = {
                    original: word,
                    list: []
                }
            }

            if (nextWord) this.wordList[wordKey].list.push(nextWord);
        });
    }

    /**
     * Filters the word to a key.
     * @param word The word to be filtered.
     * @returns Filtered word.
     */
    private parseKey(word: string): string {
        // Only replace if there are any letters
        if (/\w/.test(word))
            word = word.replace(/[<>()[\]{}:;\.,]/g, "");

        if (word == "constructor" || word == "__proto__")
            word += "_";

        return word;
    }

    /**
     * Filters the generated text by removing incomplete or nonsense punctuations.
     * @param text Text do be filtered.
     * @returns Filtered text.
     */
    private filterGeneratedText(text: string): string {
        text = text.trim();

        // Deletes unclosed parentheses, brackets and curly braces
        [["(", ")"], ["[", "]"], ["{", "}"]].forEach(v => {
            text = this.removeUnclosedPairs(text, v);
        });
        
        // Deletes unclosed quotes and markdown
        ["\"", "'", "`", "*"].forEach(v => {
            text = this.removeUnclosedQuotes(text, v);
        });

        // Deletes punctuations at beginning and end
        if (/\w/.test(text))
            text = text.replace(/^[\.,; ]+/g, "").replace(/[, ]+$/g, "");

        return text;
    }

    /**
     * Deletes unclosed quotes or markdown.
     * @param text Text to be filtered.
     * @param char Character to check.
     * @returns Filtered text.
     */
    private removeUnclosedQuotes(text: string, char: string): string {
        let count = 0;
        let lastIndex;
    
        for (let i=0; i < text.length; i++) {
            if (text[i] == char) {
                lastIndex = i;
    
                count++;
            }
        }
    
        if (count % 2 != 0) text = text.deleteAt(lastIndex);
    
        return text;
    }

    /**
     * Deletes unclosed characters, such as parentheses or brackets.
     * @param text Text to be filtered.
     * @param pair Pair to check.
     * @returns Filtered text.
     */
    private removeUnclosedPairs(text: string, pair: string[]): string {
        let count = 0;
    
        for (let i=0; i < text.length; i++) {
            if (text[i] == pair[0]) {
                count++;
            } else if (text[i] == pair[1]) {
                count--;
            }
    
            if (count < 0) {
                return this.removeUnclosedPairs(text.deleteAt(i), pair);
            }
        }
    
        if (count > 0) {
            for (let i=0; i < text.length; i++) {
                if (text[i] == pair[0]) {
                    return this.removeUnclosedPairs(text.deleteAt(i), pair);
                }
            }
        }
    
        return text;
    }
}