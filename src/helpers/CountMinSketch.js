const processEmail = (currentEmailText, sketch, phrasesWithCount) => {
  // Create an array of all the snippets with n words
  const ngrams = (words, n) => {
    let snippetArray = [];
    for (let i = 0; i < words.length - n + 1; i += 1) {
      snippetArray.push(words.slice(i, i + n));
    }
    return snippetArray;
  }

  let words = currentEmailText.split(/[ ]+/);
  const minWords = parseInt(process.env.REACT_APP_MIN_WORDS_TO_FLAG_REPETITIVE);
  const maxWords = parseInt(process.env.REACT_APP_MAX_WORDS_TO_FLAG_REPETITIVE);
  if (words < minWords) return;

  for (let i = maxWords; i >= minWords; i -= 1) {
    const grams = ngrams(words, i);

    for (let j = 0; j < grams.length; j += 1) {
      let gram = grams[j];
      gram = gram.join(' ');
      //Increase current number of occurrences of gram in the sketch by 1
      const count = sketch.query(gram) + 1;
      sketch.update(gram, count);
      // Sketch works with approximations, we will filter by more than 2 repetitions to avoid false positives
      if (count >= process.env.REACT_APP_MIN_WORDS_TO_FLAG_REPETITIVE) {
        phrasesWithCount[gram] = count;
      }
    }
  }
}

export default processEmail;
