import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

// Initializing database
const appSettings = {databaseURL: "https://endorsement-app-db70c-default-rtdb.firebaseio.com/"}
const app = initializeApp(appSettings)
const database = getDatabase(app)
const endorsement = ref(database, "endorsement")

// Fetching main DOM elements
const inputField = document.getElementById("input-field")
const toField = document.getElementById("input-to")
const fromField = document.getElementById("input-from")
const publishBtn = document.getElementById("publish-btn")
const endorsementContainer = document.getElementById("endorsement-container")

// displayedCards holds a random ID created by the data base and has the number of likes of each card (post) as key. 
// That is how I have easy access to the like count from the database. localUserID and userLikes handles who 
// can delete posts and allows only one like per user, respectively.
let displayedCards = []
let localUserID = getUserID()
let userLikes = []

// Checks for likes from users on localStorage.
const likesFromLocalStorage = JSON.parse(localStorage.getItem("userLikes"))
getUserLikes()

// Creates an object and uploads it to the DB.
publishBtn.addEventListener("click", function(){
    if(inputField.value !== "" && toField.value !== "" && fromField.value !=="") {
        let inputValue = inputField.value
        let toInputValue = toField.value
        let fromInputValue = fromField.value
        let likeValue = 0
        let userID = localUserID
        let objectValue = {To: toInputValue, From: fromInputValue, Text: inputValue, Like: likeValue, UserID: userID}
        push(endorsement, objectValue)
        clearFields()
    } else {
        window.alert("Fill out all the fields first!")
    }
})
// BD function that updates the posts every time changes happen.
onValue(endorsement, function(snapshot) {
    if(snapshot.exists()) {
        let cardsArray = Object.entries(snapshot.val())
        clearEndorsement ()
        clearDisplayCards()
        for (let i = 0; i < cardsArray.length; i++) {
            let currentCard = cardsArray[i]
            appendCard(currentCard)
            appendToDisplayCards(currentCard)
        }
    } else {
        endorsementContainer.innerHTML= "No posts yet..."
    }
})

// Creates the post elements.
function appendCard(card) {
    let currentCardID = card[0]
    let currentCardFrom = card[1].From
    let currentCardTo = card[1].To
    let currentCardText = card[1].Text
    let currentCardLike = card[1].Like
    let currentCardUserID = card[1].UserID

    let endorsementCard = document.createElement("div")
    endorsementCard.setAttribute("class", "endorsement-card")

    let cardHeading = document.createElement("div")
    cardHeading.setAttribute("class", "card-heading")
    cardHeading.innerHTML = `<span>From <span class="orange">${currentCardFrom}</span></span>`

    let cardBody = document.createElement("div")
    cardBody.setAttribute("class", "card-body")
    cardBody.textContent = currentCardText

    let cardFooter = document.createElement("div")
    cardFooter.setAttribute("class", "card-footer")
    cardFooter.innerHTML = `<span>To <span class="orange">${currentCardTo}</span></span>`
    
    let cardFooterLike = document.createElement("div")
    cardFooterLike.setAttribute("class", "card-footer-like")
    cardFooterLike.innerHTML = `<span class="like-count" id="like${currentCardID}" >${currentCardLike}</span>`

    // Sets ID with the random ID from the DB to be used to hide/reveal delete button later on.
    let deleteBtn = document.createElement("button")
    deleteBtn.setAttribute("class", "delete-btn")
    deleteBtn.setAttribute("id", `${currentCardUserID}`)
    deleteBtn.textContent = "－"

    let likeBtn = document.createElement("button")
    likeBtn.setAttribute("class", "like-btn")
    likeBtn.textContent = "🧡"
    
    // Hides the delete button to users who did not create the post. 
    if (currentCardUserID == localUserID) {
        deleteBtn.style.display = "inline-block"; 
    } else {
        deleteBtn.style.display = "none"; 
    }
    // Builds the post and sends it to thr DOM.
    cardFooterLike.append(likeBtn)
    cardHeading.append(deleteBtn)
    cardFooter.append(cardFooterLike)
    endorsementCard.append(cardHeading)
    endorsementCard.append(cardBody)
    endorsementCard.append(cardFooter)

    endorsementContainer.prepend(endorsementCard)

    //Add delete and like functionalities.
    deleteBtn.addEventListener("click", function() {
        deleteCard(currentCardUserID, currentCardID)
    })

    likeBtn.addEventListener("click", function() {
        addLike(currentCardID)
    })
}
// Generates random ID for the user id.
function getRandomID() {
    let randomID = ""
    for(let i = 0; i < 10; i++) {
        randomID += Math.floor(Math.random() * 9 + 1)
    }
    return randomID
}
// Creates/retrieves a User ID.
function getUserID() {
    let _userID = ""
    let localUserID = localStorage.getItem("userID")
    if(localUserID){
        _userID = localUserID
    } else {
        _userID = localStorage.setItem("userID", getRandomID()) 
    }
    return _userID
}
// Retrieves likes from local storage.
function getUserLikes() {
    if (likesFromLocalStorage) {
    userLikes = likesFromLocalStorage
    }
}
// Clear inputs after posting them.
function clearFields(){
    inputField.value = ""
    toField.value = ""
    fromField.value = ""
}
// Clear posts everytime the DB updates the app, to avoid duplicates.
function clearEndorsement (){
    endorsementContainer.innerHTML = ""
}
// Deletes post only if user id on local storage is equals to the on on the object that originated the post. 
// Original way to allow only the OP to delete a post. Even though I use a hide/reveal button logic to achieve the same functionality,
// I still leave this piece of code as a safe guard.
function deleteCard(userLocalID, cardID) {
    if(localUserID == userLocalID) {
        let cardLocationByID = ref(database, `endorsement/${cardID}`)
        remove(cardLocationByID)
    }
    else {
        window.alert("You can only delete a post you made!")
    }
}
// Add Like function that allows users to like once or take the like back. Original piece of logic used to achieve this logic is commented out.  
function addLike(cardID) {
    if(!userLikes.includes(`${cardID}`)) {
        const likeInDB = ref(database, `endorsement/${cardID}`)
        let likeEl = document.getElementById(`like${cardID}`)
        let currentLikeCount = displayedCards[`${cardID}`]
        // onValue(likeInDB, function(snapshot) {
        //     if(snapshot.exists()) {
        //     let likeCountFromDB = snapshot.val().Like
        //     likeCountFromDB = currentLikeCount
        //     }
        // })
        currentLikeCount++
        likeEl.textContent = currentLikeCount
        update(likeInDB, {Like: currentLikeCount})
        userLikes.push(`${cardID}`)
        localStorage.setItem("userLikes", JSON.stringify(userLikes))


    } else {
        const _likeInDB = ref(database, `endorsement/${cardID}`)
        let _likeEl = document.getElementById(`like${cardID}`)
        let _currentLikeCount = displayedCards[`${cardID}`]
        // onValue(_likeInDB, function(snapshot) {
        //     if(snapshot.exists()) {
        //     let _likeCountFromDB = snapshot.val().Like
        //     _likeCountFromDB = _currentLikeCount
        //     }
        // })
        _currentLikeCount--
        _likeEl.textContent = _currentLikeCount
        update(_likeInDB, {Like: _currentLikeCount})
        let index = userLikes.indexOf(`${cardID}`)
        userLikes.splice(index, 1)
        localStorage.setItem("userLikes", JSON.stringify(userLikes))
    }
}
// Adds the random ID created by the DB to a local array that allows other functions to control like counts
function appendToDisplayCards(cardID) {
    let newID = cardID[0]
    let newLikeCount = cardID[1].Like
    displayedCards[`${newID}`] = newLikeCount
}
// Clear displayed posts array to avoid duplicates.
function clearDisplayCards() {
    displayedCards = []
}
