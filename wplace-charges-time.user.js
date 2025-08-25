// ==UserScript==
// @name         max charges time
// @namespace    https://github.com/mechanikate/wplace-charges-time
// @version      1.0.0
// @description  adds a timer counting down to when you will have max charges above the Paint button for wplace
// @license      MIT
// @author       mechanikate
// @updateURL    https://github.com/mechanikate/wplace-charges-time/releases/latest/download/wplace-charges-time.user.js
// @downloadURL  https://github.com/mechanikate/wplace-charges-time/releases/latest/download/wplace-charges-time.user.js
// @match        https://wplace.live/*
// @match        https://*.wplace.live/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @noframes     true
// @grant unsafeWindow
// ==/UserScript==

// be warned, this code is really, really bad. whatever!
let charges = 0;
let maxCharges = 0;
const replaceNaN = (val, replacement) => isNaN(val) || val == null || val == undefined ? replacement : val;
unsafeWindow.updateChargeData=()=>{
    console.log("(max charges time) Updating charge data...");
    window.fetch("https://backend.wplace.live/me", {credentials: 'include'}).then(response => {
        if (!response.ok) throw new Error("(max charges time) can't get charges and max charges");
        return response.json();
    }).then(json => {
        charges = Math.floor(json.charges.count);
        maxCharges = json.charges.max;
    });
}
window.setInterval(() => { // just a setInterval because I don't feel like making this more complex
    let plainChargeNode = document.querySelector(".btn.btn-primary.btn-lg.relative.z-30>.flex.items-center.gap-2>span>.w-7.text-xs");
    if(typeof(plainChargeNode) == "undefined" || plainChargeNode == null) {
        try { document.querySelector(".absolute.bottom-0 > .btn.btn-primary").addEventListener("click", setTimeout(unsafeWindow.updateChargeData, 3500)); } catch {} // the timeout is a really bad solution to waiting for loading. wtv
        return;
    }
    let plainChargeHTML = plainChargeNode.innerHTML;
    let secondsLeftForCharge = replaceNaN(parseInt(plainChargeHTML.match(/0:([0-9]+)/)[1]), 0); // get the # of seconds left (0-30) until we get 1 more charge
    let remainingSeconds = (maxCharges-charges)*30+secondsLeftForCharge;
    let existingEle = document.getElementById("timeTillMaxCharges");
    if(typeof(existingEle) != "undefined" && existingEle != null) {
        existingEle.innerHTML = `(${new Date(remainingSeconds * 1000).toISOString().slice(11, 19)} to max)`; // handle if our element alr exists
        return;
    }
    // if ele doesn't exist, set it up:
    let newSpan = document.createElement("p");
    newSpan.classList.add("w-7", "text-xs");
    newSpan.innerHTML = `(${new Date(remainingSeconds * 1000).toISOString().slice(11, 19)} to max)`;
    newSpan.id = "timeTillMaxCharges";
    newSpan.style.width = "100%";
    newSpan.style.paddingBottom = "10px";
    newSpan.style.textAlign = "center";
    const btnNode = document.querySelector(".btn.btn-primary.btn-lg.relative.z-30");
    document.querySelector(".btn.btn-primary.btn-lg.relative.z-30").parentElement.insertBefore(newSpan, btnNode);
    document.querySelector(".btn.btn-primary.btn-lg.relative.z-30").parentElement.addEventListener("click", unsafeWindow.updateChargeData);
}, 750);
window.setInterval(unsafeWindow.updateChargeData, 600000); // just to be safe, update charge data every 10 mins too
unsafeWindow.updateChargeData();
