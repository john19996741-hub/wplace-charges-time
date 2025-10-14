// ==UserScript==
// @name         max charges time
// @namespace    https://github.com/mechanikate/wplace-charges-time
// @version      1.2.1
// @description  adds a timer counting down to when you will have max charges above the Paint button for wplace
// @license      MIT
// @author       mechanikate
// @updateURL    https://github.com/mechanikate/wplace-charges-time/releases/latest/download/wplace-charges-time.user.js
// @downloadURL  https://github.com/mechanikate/wplace-charges-time/releases/latest/download/wplace-charges-time.user.js
// @match        https://wplace.live/*
// @match        https://*.wplace.live/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_unregisterMenuCommand
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @noframes     true
// @grant unsafeWindow
// ==/UserScript==

// be warned, this code is really, really bad. whatever!
let charges = 0;
let maxCharges = 35;
let chargesFullColoring = GM_getValue("color", true); // default coloring to true
let showMax = GM_getValue("showmax", false); // don't show time until max charges by default
let coloringId, maxId;
let updateQueued = false; // stopper to make sure we don't run like 20 charge data fetch requests at once
const replaceNaN = (val, replacement) => isNaN(val) || val == null || val == undefined ? replacement : val;
const valueMissing = (val, isNodeList=false) => typeof(val) == "undefined" || val == null || (isNodeList && val.length == 0);
const rgbToHex = (r,g,b) => "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1); // from https://stackoverflow.com/a/5624139
const determineColor = fractionDone => rgbToHex(255*(1-fractionDone), 255*fractionDone, 0);
function updateToggles() {
    if(coloringId) GM_unregisterMenuCommand(coloringId);
    if(maxId) GM_unregisterMenuCommand(maxId);
    const coloringLabel = chargesFullColoring ? "Disable coloring" : "Enable coloring";
    const maxLabel = showMax ? "Hide time till max" : "Show time till max";
    coloringId = GM_registerMenuCommand(coloringLabel, () => { // on toggling
        chargesFullColoring = !chargesFullColoring;
        GM_setValue("color", chargesFullColoring);
        updateToggles();
    });
    maxId = GM_registerMenuCommand(maxLabel, () => { // on toggling
        showMax = !showMax;
        GM_setValue("showmax", showMax);
        updateToggles();
    });
}
unsafeWindow.updateChargeData=()=>{
    if(updateQueued) return console.log("(max charges time) Charge data update queued, not running again for now");
    updateQueued = true;
    console.log("(max charges time) Updating charge data...");
    window.fetch("https://backend.wplace.live/me", {credentials: 'include'}).then(response => {
        if (!response.ok) throw new Error("(max charges time) can't get charges and max charges");
        return response.json();
    }).then(json => {
        charges = Math.floor(json.charges.count);
        maxCharges = json.charges.max;
        updateQueued = false;
        console.log("(max charges time) Charge data successfully updated");
    });
};
window.setInterval(() => { // just an interval because I don't feel like making this more complex
    let plainChargeNode = document.querySelector(".btn.btn-primary.btn-lg.relative.z-30>.flex.items-center.gap-2>span>.w-7.text-xs");
    let dropletShopNodes = document.querySelectorAll(".btn.btn-xl.btn-primary.relative.mt-3.h-10");
    if(valueMissing(dropletShopNodes, true) && !updateQueued) {
        try { [0,1].forEach(i => dropletShopNodes[i].addEventListener("click", ()=>setTimeout(unsafeWindow.updateChargeData, 3500))); } catch {} // "+5 Max. Charges" and "+30 Charges" buttons;
    }
    if(valueMissing(plainChargeNode)) { // buttons missing/null? if so, add the event listeners in 3500ms:
        try { document.querySelector(".absolute.bottom-0 > .btn.btn-primary").addEventListener("click", ()=>setTimeout(unsafeWindow.updateChargeData, 3500)); } catch {} // the timeout is a really bad solution to waiting for loading. wtv
        return;
    }
    let plainChargeHTML = plainChargeNode.innerHTML;
    let secondsLeftForCharge = replaceNaN(parseInt(plainChargeHTML.match(/0:([0-9]+)/)[1]), 0); // get the # of seconds left (0-30) until we get 1 more charge
    let remainingSeconds = (maxCharges-charges)*30+secondsLeftForCharge;
    let maxSeconds = maxCharges*30;
    let existingEle = document.getElementById("timeTillMaxCharges");
    let toMaxStr = `(${new Date(remainingSeconds * 1000).toISOString().slice(11, 19)}${showMax ? "/"+new Date(maxSeconds * 1000).toISOString().slice(11, 19) : ""} to max)`;
    if(typeof(existingEle) != "undefined" && existingEle != null) {
        existingEle.innerHTML = toMaxStr; // handle if our element alr exists
        if(chargesFullColoring) existingEle.style.color = determineColor(remainingSeconds/maxCharges/30);
        return;
    }
    // if ele doesn't exist, set it up:
    let newSpan = document.createElement("p");
    newSpan.classList.add("w-7", "text-xs");
    newSpan.innerHTML = toMaxStr;
    newSpan.id = "timeTillMaxCharges";
    newSpan.style.width = "100%";
    newSpan.style.paddingBottom = "10px";
    newSpan.style.textAlign = "center";
    if(chargesFullColoring) newSpan.style.color = determineColor(remainingSeconds/maxCharges/30);
    const btnNode = document.querySelector(".btn.btn-primary.btn-lg.relative.z-30");
    document.querySelector(".btn.btn-primary.btn-lg.relative.z-30").parentElement.insertBefore(newSpan, btnNode);
    document.querySelector(".btn.btn-primary.btn-lg.relative.z-30").parentElement.addEventListener("click", unsafeWindow.updateChargeData); // "Paint" button
}, 750);
window.setInterval(unsafeWindow.updateChargeData, 600000); // just to be safe, update charge data every 10 mins too
unsafeWindow.updateChargeData();
updateToggles();
