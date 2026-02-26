//Fall back on this if the DataMuse API is not working
wordBank = ["JUMBO", "SPARK", "COLOR", "GREEN", "SLATE",
            "POINT", "WHITE", "BLACK", "SWORD", "RIGHT",
            "WRITE", "AISLE", "ZEBRA", "QUEEN", "MAGIC",
            "XENON", "FUNKY", "FREED", "DAIRY", "ERASE",
            "HONEY", "KNEAD", "IONIC", "LEMON", "NEVER",
            "ONION", "TRUST", "UNION", "VEXED", "YOUTH"];

letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i",
            "j", "k", "l", "m", "n", "o", "p", "q", "r",
            "s", "t", "u", "v", "w", "x", "y", "z"];

//Pick a random word to be the puzzle
setAnswer = () => {return wordBank[Math.floor(Math.random() * 30)]};

// * This will run in the window.onload and newGame
function setup() {
    //Pick the letter and store it so you don't keep getting random letters
    randomLetter = () => {return letters[Math.floor(Math.random() * 26)]};
    pickLetter = randomLetter();

    //Generate the DataMuse API Get Request
    var randomWord = "https://api.datamuse.com/words?sp=" + pickLetter + "????";
    var apiReq = new XMLHttpRequest();
    //Set to false because the word must be chosen first
    apiReq.open("GET", randomWord, false);

    apiReq.onreadystatechange = function() {
        if (apiReq.readyState == 4 && apiReq.status == 200) {
            //Get the list of words
            jsonData = JSON.parse(this.responseText);

            //Pick a random word from the array
            pickWord = () => {return jsonData[Math.floor(Math.random() * jsonData.length)]};
            //Overwrite the default words
            answer = pickWord().word.toUpperCase();
        }
        else {
            // * Fallback if the DataMuse API doesn't work
            answer = setAnswer();
        }
    }

    apiReq.send();

    //In the event the random word generated has a "-" or " ", ignore it
    //In the event the random word is actually a name, ignore it
    //Pick from the default words
    if (!checkWord(answer)) {
        answer = setAnswer();
    }
    
    console.log("Answer: " + answer);
    return answer;
}

function checkWord(word) {
    // * The input is already maxed out at 5 letters
    // Check that exactly 5 letters was inputed
    if (word.length != 5) {
        return false;
    }

    //If the word has "-" or " ", then ignore it
    //Check this now because there are valid words that have - or space
    if (word.includes("-") || word.includes(" ")) {
        return false;
    }

    //Generate the DataMuse API Get Request
    var wordApi = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word;
    var apiReq = new XMLHttpRequest();
    //Set to false because it has to confirm the word is in the dictionary
    //Can't have it find out that the word is not in the dictionary after
    //it has been put it in the grid and highlight the letters
    apiReq.open("GET", wordApi, false);

    var result = true;
    apiReq.onreadystatechange = function() {
        //If it returns 404, then the word was not found
        if (apiReq.status == 404) {
            result = false;
        }
    }

    apiReq.send();

    return result;
}

function newGame() {
    //Clear away all of the styling from the grid
    gridBoxes = document.getElementsByClassName("gridBox");
    for (i = 0; i < gridBoxes.length; i++) {
        gridBoxes[i].classList.remove("correct");
        gridBoxes[i].classList.remove("present");
        gridBoxes[i].classList.remove("wrong");
        gridBoxes[i].innerText = "";
    }

    //Clear away all of the styling from the keyboard
    kbBoxes = document.getElementsByClassName("kbBox");
    for (i = 0; i < kbBoxes.length; i++) {
        kbBoxes[i].classList.remove("correct");
        kbBoxes[i].classList.remove("present");
        kbBoxes[i].classList.remove("wrong");
    }

    //Choose a new word
    answer = setup();
    //Enable the guess button
    document.getElementById("guess").removeAttribute("hidden");
    //Hide the new game button
    document.getElementById("newGame").setAttribute("hidden", "");
    //Clear away the text field
    document.getElementById("wordInput").removeAttribute("disabled");
    document.getElementById("wordInput").value = "";
    //Set the curRow back to the top
    curRow = 0;
}

// TODO: Figure out how to do cookies for extra credit
function averageGuess(loss) {
    // For the first time around, it will be empty
    var cookieObj = {};
    alert("Before Cookie: " + document.cookie);
    if (document.cookie == "") {
        failCount = 0;
        if (loss) {
            failCount = 1;
        }
        //Start the cookie off as a JSON string
        cookieObj = {
                        "attempt": 1,
                        "average": curRow,
                        "failure": failCount
                    }
        document.cookie = JSON.stringify(cookieObj);
        alert(JSON.stringify(cookieObj));
    }
    else {
        editCookie = JSON.parse(document.cookie);
        //First calculate the total score before incrementing the attempt count
        total = 0 + editCookie['attempt'] * editCookie['average'];
        //Increment the attempt count
        editCookie['attempt']++;
        //Add the new score to the total
        total += curRow;
        //Calculate the new average
        editCookie['average'] = total / editCookie['attempt'];
        if (loss) {
            readCookie['failure']++;
        }
        document.cookie = JSON.stringify(editCookie);
        alert(JSON.stringify(editCookie));
    }
    
    //Read the cookie to display the results
    // readCookie = cookieObj;
    readCookie = JSON.parse(document.cookie);
    statStr = "Attempt: " + readCookie['attempt'] + "\nAverage: "
                + readCookie['average'] + "\nFailure: " + readCookie['failure'];
    alert(statStr);
}

//This is the word class that will hold the word information
function Word(wordStr) {
    //This will be used an array
    this.letters = wordStr;
    //Start everything as wrong
    this.letterClass = ["wrong", "wrong", "wrong", "wrong", "wrong"];

    guessLtr = (i) => this.letters[i];

    //Highlight everything accordingly
    highlightLetters = (curRow) => {
        //Need the index for the boxId
        for (i = 0; i < 5; i++) {
            boxId = "r" + curRow + "c" + i;
            document.getElementById(boxId).classList.add(this.letterClass[i]);
            //For the keyboard, need to highlight the wrong
            //But for double letter guesses, if there is one copy correct, keep it green
            if (this.letterClass[i] == "wrong" &&
                !document.getElementById("key" + this.letters[i]).classList.contains("correct") &&
                !document.getElementById("key" + this.letters[i]).classList.contains("present")) {
                document.getElementById("key" + this.letters[i]).classList.add("wrong");
            }
        }
    }
    
    //Check if the guess is correct
    correctGuess = () => {
        result = true;
        this.letterClass.forEach((checkClass) => {
            //If any letter in the guess is present or wrong, then it is not the word
            if (checkClass != "correct") {
                result = false;
            }
        });
        return result;
    }
}

// * This is the main function of the Wordle app
function wordGuess() {
    //Get the provided word
    wordInput = document.getElementById("wordInput").value.toUpperCase();

    // Check to see if the word is valid
    if (!checkWord(wordInput)) {
        alert("Invalid Word: " + wordInput);
        return;
    }

    //Capitalize every character (for printing into the grid)
    wordInput = wordInput.toUpperCase();

    //Implement the guess into the Word class
    guess = new Word(wordInput);

    //Check each letter to see if it matches
    for (i = 0; i < 5; i++) {
        boxId = "r" + curRow + "c" + i;
        document.getElementById(boxId).innerText = guessLtr(i);
        //Check to see if the letter is correct
        if (guessLtr(i) == answer[i]) {
            //Highlight it green
            guess.letterClass[i] = "correct";
            //Color the keyboard letter green
            document.getElementById("key" + answer[i]).classList.remove("present");
            document.getElementById("key" + answer[i]).classList.add("correct");
        }
    }

    //With all of the correct letters highlighted
    //Find the letters that are present in the word
    for (i = 0; i < 5; i++) {
        //First loop is for the answer word
        boxId = "r" + curRow + "c" + i;
        //If the guess correctly matched the letter, then move on
        if (guess.letterClass[i] == "correct") {
            //See if this goes to the next one
            continue;
        }

        for (j = 0; j < 5; j++) {
            boxId = "r" + curRow + "c" + j;
            //Only color it yellow if the box is not correct
            //The check for 'present' is to handle duplicate letters
            if ((answer[i] == guessLtr(j)) &&
                !(guess.letterClass[j] == "correct") &&
                !(guess.letterClass[j] == "present")) {
                    guess.letterClass[j] = "present";
                    //If not green, then color the keyboard letter yellow
                    if (!document.getElementById("key" + answer[i]).classList.contains("correct")) {
                        document.getElementById("key" + answer[i]).classList.add("present");
                    }
                    break;
            }
        } //End of the j for loop
    } //End of the i for loop

    highlightLetters(curRow);

    //After printing the letters in the grid, increment the row count
    //Increment it now for the cookie stats
    curRow++;

    //Clear away the text field
    document.getElementById("wordInput").value = "";

    if (correctGuess()) {
        //Disable the button
        alert("You Win!");
        document.getElementById("guess").setAttribute("hidden", "");
        document.getElementById("newGame").removeAttribute("hidden");
        document.getElementById("wordInput").setAttribute("disabled", "");
        averageGuess(false);
    }
    else {
        //After 6 guesses, the game ends
        if (curRow == 6) {
            alert("You Lose!\nAnswer: " + answer);
            document.getElementById("guess").setAttribute("hidden", "");
            document.getElementById("newGame").removeAttribute("hidden");
            document.getElementById("wordInput").setAttribute("disabled", "");
            averageGuess(true);
        }
    }
}
