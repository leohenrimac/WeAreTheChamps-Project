import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://endorsement-app-db70c-default-rtdb.firebaseio.com/"
}
const app = initializeApp(appSettings)

const database = getDatabase(app)

const endorsement = ref(database, "endorsement")

const inputField = document.getElementById("input-field")
const toField = document.getElementById("input-to")
const fromField = document.getElementById("input-from")
const publishBtn = document.getElementById("publish-btn")
const endorsementContainer = document.getElementById("endorsement-container")



let displayedCards = []
let localUserID = getUserID()
let myLikes = []


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
        // window.alert("Fill out all the fields first!")
    }
})

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

    let deleteBtn = document.createElement("button")
    deleteBtn.setAttribute("class", "delete-btn")
    deleteBtn.textContent = "－"

    let likeBtn = document.createElement("button")
    likeBtn.setAttribute("class", "like-btn")
    likeBtn.textContent = "🧡"
    

    cardFooterLike.append(likeBtn)
    cardHeading.append(deleteBtn)
    cardFooter.append(cardFooterLike)
    endorsementCard.append(cardHeading)
    endorsementCard.append(cardBody)
    endorsementCard.append(cardFooter)

    endorsementContainer.append(endorsementCard)

    deleteBtn.addEventListener("click", function() {
        deleteCard(currentCardUserID, currentCardID)
    })

    likeBtn.addEventListener("click", function() {
        addLike(currentCardID)
    })


}

function getRandomID() {
    let randomID = ""
    for(let i = 0; i < 10; i++) {
        randomID += Math.floor(Math.random() * 9 + 1)
    }
    return randomID
}

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

function clearFields(){
    inputField.value = ""
    toField.value = ""
    fromField.value = ""
}

function clearEndorsement (){
    endorsementContainer.innerHTML = ""
}

function deleteCard(userLocalID, cardID) {
    if(localUserID == userLocalID) {
        let cardLocationByID = ref(database, `endorsement/${cardID}`)
        remove(cardLocationByID)
        
      
    }
    else {
        window.alert("You can only delete a post you made!")
    }
}

function addLike(cardID) {
    const likeInDB = ref(database, `endorsement/${cardID}`)
    let likeEl = document.getElementById(`like${cardID}`)
    let currentLikeCount = displayedCards[`${cardID}`]
    onValue(likeInDB, function(snapshot) {
        if(snapshot.exists()) {
        let likeCountFromDB = snapshot.val().Like
        likeCountFromDB = currentLikeCount
        }
    })
    
    currentLikeCount++
    likeEl.textContent = currentLikeCount
    update(likeInDB, {Like: currentLikeCount})
}

function appendToDisplayCards(cardID) {
    let newID = cardID[0]
    let newLikeCount = cardID[1].Like
    displayedCards[`${newID}`] = newLikeCount
}

function clearDisplayCards() {
    displayedCards = []
}