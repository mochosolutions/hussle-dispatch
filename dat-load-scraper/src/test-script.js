// data
// node
// all_message_threads
// edges


// xjp7ctv span 
// document.querySelectorAll(".xjp7ctv span.x1lliihq.x1iyjqo2")
// const container = document.querySelectorAll("div[role*='main'] .xjp7ctv span.x1lliihq.x1iyjqo2")
// const h = container[0]
// h.querySelectorAll(".xzueoph")
// const testItems = h.querySelectorAll(".xzueoph")


// const testItems = wrapper.querySelectorAll(".xzueoph")
// testItems[0].querySelector("div[role='button']")

const exclude = [
    "mousemove",
    "pointerrawupdate",
    "pointerout",
    "pointerover",
    "mouseover",
    "pointermove",
    "mouseout",
    "animationiteration",
    "blur",
    "transitionrun",
    "transitionend",
    "focus",
    "pointerup",
    "mouseup",
    "pointerdown",
    "transitionstart",
    "message"
]

addEventListenerAll(
    window,
    (evt) => { 
        if(!exclude.includes(evt.type)){
            console.log("type", evt.type); 
            console.log("target", evt.target)
        }
    
    },
    true
);


function addEventListenerAll(target, listener, ...otherArguments) {

    // install listeners for all natively triggered events
    for (const key in target) {
        if (/^on/.test(key)) {
            const eventType = key.substr(2);
            target.addEventListener(eventType, listener, ...otherArguments);
        }
    }

    // dynamically install listeners for all manually triggered events, just-in-time before they're dispatched ;D
    const dispatchEvent_original = EventTarget.prototype.dispatchEvent;
    function dispatchEvent(event) {
        target.addEventListener(event.type, listener, ...otherArguments);  // multiple identical listeners are automatically discarded
        dispatchEvent_original.apply(this, arguments);
    }
    EventTarget.prototype.dispatchEvent = dispatchEvent;
    if (EventTarget.prototype.dispatchEvent !== dispatchEvent) throw new Error(`Browser is smarter than you think!`);

}



const { testData} =  require("./test.js");
const { get } = require("lodash");

const messageData = get(testData, ['data', 'node', 'all_message_threads', 'edges'])

xw7yly9
console.log("messageData", messageData)
// const getMessageData = (testJson) => {
//     console.log("TestJson", testJson)
// }


// getMessageData(testJson)


